import {access, copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, unlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {dirname, extname, join, relative, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateEpisode} from '../preview/episode.mjs';
import {publishingPlan} from '../preview/publishing.mjs';
import {hasLocalQwen, installQwenNarration, narrateEpisode, narrationVoices, qwenReady} from './narration.mjs';
import {checkAssets, projectAssets, sceneTiming} from './project-media.mjs';
import {evaluateRequirements, findHypit, hypitReadiness, installMissing} from './env.mjs';

const read = async file => JSON.parse(await readFile(file, 'utf8'));
const print = value => console.log(JSON.stringify(value, null, 2));
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const handbooksRoot = join(repoRoot, 'handbooks');
const outputRoot = join(repoRoot, 'output');
const trackIds = ['traffic', 'vertical', 'persona'];
const keys = ['track', 'series', 'audience', 'targetSeconds', 'pace', 'platform', 'ratio', 'style',
  'visualStyle', 'coverStyle', 'hostRole', 'staging', 'speech', 'takeRule',
  'voice', 'narrationVoice', 'bgmStyle', 'captionStyle', 'materialSource', 'pipShape'];
const preferences = value => Object.fromEntries(keys.filter(key =>
  ['string', 'number', 'boolean'].includes(typeof value?.[key])).map(key => [key, value[key]]));
const installed = (name, args) => spawnSync(name, args, {stdio: 'ignore', timeout: 3000}).status === 0;
const require = createRequire(import.meta.url);
const exists = file => access(file).then(() => true, () => false);
const clean = value => String(value ?? '').trim()
  .replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-').replace(/-{2,}/g, '-').replace(/^[-.]+|[-.]+$/g, '');
const flag = name => {
  const hit = process.argv.find(arg => arg.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const has = name => process.argv.includes('--' + name);

function artifactName({title, ep, ratio, cover, ext}) {
  return 'EP' + String(ep).padStart(2, '0') + '-' + clean(title) + '-' + String(ratio).replace(':', 'x') +
    (cover ? '-cover' : '') + (ext || '.mp4');
}

function defaultSeries(track, title) {
  return track === 'traffic' ? '泛流量' : clean(title);
}

function seriesName(prefs, fallback) {
  const value = clean(prefs.series) || clean(fallback);
  if (!value) throw new Error('需要一个系列名或项目标题来命名，先给这一集起个名');
  return value;
}

function hasRemotion() {
  try {
    require.resolve('@remotion/player');
    return true;
  } catch {
    return false;
  }
}

function handbookTarget(prefs, fallback) {
  const track = prefs.track;
  if (!trackIds.includes(track)) {
    throw new Error('Handbook 需要 track（' + trackIds.join('、') + '），先确认用户赛道');
  }
  const series = seriesName(prefs, fallback);
  return {track, series, file: join(handbooksRoot, track, series + '.json')};
}

async function listHandbooks() {
  const rows = [];
  const skipped = [];
  for (const track of trackIds) {
    const names = (await readdir(join(handbooksRoot, track)).catch(() => []))
      .filter(name => name.endsWith('.json')).sort();
    for (const name of names) {
      const file = join(handbooksRoot, track, name);
      let data;
      try {
        data = await read(file);
        if (data?.version !== 1 || !data.preferences || data.preferences.track !== track) {
          skipped.push({file: relative(repoRoot, file), reason: 'Handbook 格式或赛道不匹配'});
          continue;
        }
      } catch {
        skipped.push({file: relative(repoRoot, file), reason: 'JSON 读取失败'});
        continue;
      }
      rows.push({track, series: data.preferences?.series ?? name.slice(0, -5),
        updatedAt: data.updatedAt ?? null, preferences: data.preferences ?? {},
        file: relative(repoRoot, file)});
    }
  }
  return {rows, skipped};
}

async function main([command, first, second]) {
  switch (command) {
    case 'doctor': {
      const track = flag('track');
      if (track && !trackIds.includes(track)) throw new Error('赛道须为 ' + trackIds.join('、'));
      const traffic = track === 'traffic' ? hypitReadiness() : undefined;
      print({node: process.version, ffmpeg: installed('ffmpeg', ['-version']),
        ffprobe: installed('ffprobe', ['-version']), hypitCli: Boolean(findHypit()),
        remotion: hasRemotion(), traffic});
      if (traffic && !traffic.ready) process.exitCode = 1;
      return;
    }
    case 'setup': {
      const track = flag('track');
      if (track && !trackIds.includes(track)) throw new Error('赛道须为 ' + trackIds.join('、'));
      const local = track === 'vertical' && hasLocalQwen;
      const report = evaluateRequirements({needsUv: local});
      const withNarration = (status, cached) => ({
        ...status,
        ready: status.ready && (!local || cached),
        narration: local ? {provider: 'qwen', ready: cached}
          : track === 'vertical' ? {provider: 'qwen', supported: false} : undefined,
      });
      const cached = local && qwenReady();
      print(withNarration(report, cached));
      if (!has('install')) return;
      if (!report.missing.length && !local) return;
      const installed = installMissing(report);
      const after = evaluateRequirements({needsUv: local});
      let prepared = cached;
      if (after.ready && local && !cached) {
        await installQwenNarration();
        installed.push('Qwen3-TTS');
        prepared = qwenReady();
      }
      const finalReport = withNarration(after, prepared);
      print({installed, after: finalReport});
      if (!finalReport.ready) process.exitCode = 1;
      return;
    }
    case 'voices': {
      print({voices: narrationVoices(flag('language'))});
      return;
    }
    case 'narrate': {
      if (!first) throw new Error('用法：narrate <项目.json> [--voice=声线ID] [--sample]');
      const voiceId = flag('voice');
      const sample = has('sample');
      const requested = voiceId?.split(',').map(id => id.trim());
      if (requested?.some(id => !id)) throw new Error('--voice 需要声线 ID');
      if (requested?.length > 1) {
        if (!sample) throw new Error('只有 --sample 可以同时选择多个声线');
        const candidates = [...new Set(requested)];
        const project = await read(first);
        const options = narrationVoices(project.language ?? 'zh-CN');
        for (const id of candidates) {
          if (!options.some(voice => voice.id === id && voice.availableOnPlatform)) {
            throw new Error('当前语言或系统不支持声线 ' + id);
          }
        }
        const samples = [];
        for (const id of candidates) samples.push(await narrateEpisode(first, {voiceId: id, sample}));
        print({ok: true, samples});
      } else {
        print(await narrateEpisode(first, {voiceId: requested?.[0], sample}));
      }
      return;
    }
    case 'check': {
      if (!await exists(first)) throw new Error('找不到项目文件：' + first);
      const episode = validateEpisode(await read(first));
      publishingPlan(episode.publishingTargets ?? []);
      if (has('strict') && !episode.preferences?.track) {
        throw new Error('项目缺少 preferences.track，请先确认赛道');
      }
      const projectDir = dirname(resolve(first));
      await checkAssets(episode, projectDir);
      const {warnings} = sceneTiming(episode, projectDir);
      const ok = !has('strict') || !warnings.length;
      print({ok, scenes: episode.scenes.length, seconds: episode.duration / episode.fps, warnings});
      if (!ok) throw new Error('分镜时长不匹配，请运行 fit --write 或换用足够长的素材');
      return;
    }
    case 'fit': {
      const episode = await read(first);
      const validated = validateEpisode(episode);
      const {fps} = validated;
      const {changes, warnings} = sceneTiming(validated, dirname(resolve(first)), {fit: true});
      validateEpisode(episode);
      const written = has('write') && changes.length > 0 && !warnings.length;
      if (written) {
        await writeFile(first, JSON.stringify(episode, null, 2) + '\n');
      }
      const total = episode.scenes.reduce((sum, scene) => sum + scene.frames, 0);
      print({ok: !warnings.length, fps, seconds: total / fps, written, changes, warnings});
      if (warnings.length) process.exitCode = 1;
      return;
    }
    case 'handbooks': {
      const {rows, skipped} = await listHandbooks();
      print({handbooks: rows, skipped});
      return;
    }
    case 'find-handbook': {
      const query = String(first ?? '').trim();
      if (!query) throw new Error('用法：find-handbook <系列名或赛道>');
      const {rows} = await listHandbooks();
      if (!rows.length) throw new Error('handbooks 目录还是空的，从第一集开始沉淀');
      const exact = rows.filter(row => row.series === query || row.track === query);
      const hits = exact.length ? exact : rows.filter(row => (row.track + row.series).includes(query));
      if (!hits.length) throw new Error('没有匹配的 Handbook：' + query);
      print({match: hits.length === 1 ? 'exact' : 'multiple', handbooks: hits});
      return;
    }
    case 'save-handbook': {
      if (second) throw new Error('save-handbook 按赛道和系列名自动落盘，不再接收路径参数');
      const episode = await read(first);
      const primary = publishingPlan(episode.publishingTargets ?? []).destinations[0];
      const ratio = primary?.videoRatio ?? episode.ratio ?? episode.preferences?.ratio;
      const incoming = preferences({...episode.preferences, ratio});
      const {track, series, file} = handbookTarget(incoming, defaultSeries(incoming.track, episode.title));
      const previous = await exists(file) ? ((await read(file)).preferences ?? {}) : {};
      const prefs = preferences({...previous, ...incoming, track, series});
      await mkdir(dirname(file), {recursive: true});
      const handbook = {version: 1, updatedAt: new Date().toISOString().slice(0, 10), preferences: prefs};
      await writeFile(file, JSON.stringify(handbook, null, 2) + '\n');
      print({ok: true, file: relative(repoRoot, file), track, series, merged: Object.keys(previous).length > 0, handbook});
      return;
    }
    case 'apply-handbook': {
      const handbook = await read(first);
      if (handbook?.version !== 1 || !trackIds.includes(handbook.preferences?.track)) {
        throw new Error('Handbook 格式或赛道无效');
      }
      const episode = await read(second);
      if (episode.preferences?.track && episode.preferences.track !== handbook.preferences.track) {
        throw new Error('Handbook 与本集赛道不同，请选择同赛道的系列设置');
      }
      print({...episode, preferences: {...preferences(handbook.preferences), ...episode.preferences}});
      return;
    }
    case 'render': {
      if (!first) throw new Error('用法：render <episode.json> [--ep=01] [--title=] [--ratio=] [--resolution=] [--out=]');
      const config = await read(first);
      const episode = validateEpisode({...config, resolution: flag('resolution') ?? config.resolution});
      const prefs = episode.preferences ?? {};
      if (!trackIds.includes(prefs.track)) throw new Error('render 需要 project.preferences.track，先确认用户赛道');
      const series = seriesName(prefs, defaultSeries(prefs.track, episode.title));
      const projectDir = dirname(resolve(first));
      await checkAssets(episode, projectDir);
      if (sceneTiming(episode, projectDir).warnings.length) {
        throw new Error('分镜时长不匹配，请运行 check --strict 查看详情');
      }
      const plan = publishingPlan(episode.publishingTargets ?? []);
      const ratios = plan.videos.length ? plan.videos.map(video => video.ratio) : [episode.ratio];
      const selectedRatio = flag('ratio')?.replace('x', ':');
      if (selectedRatio && !ratios.includes(selectedRatio)) throw new Error('可用画幅：' + ratios.join('、'));
      const selectedRatios = selectedRatio ? [selectedRatio] : ratios;
      const destination = flag('out');
      if (destination && selectedRatios.length !== 1) throw new Error('输出多个画幅时请省略 --out，或通过 --ratio 选一个画幅');
      const ep = flag('ep') ?? '01';
      if (!/^\d+$/.test(ep)) throw new Error('集数须为数字');
      const ext = episode.resolution && episode.resolution !== '1080p' ? `-${episode.resolution}.mp4` : '.mp4';
      const outputs = selectedRatios.map(ratio => ({
        ratio, target: destination ? resolve(destination) : join(outputRoot, prefs.track, series,
          artifactName({title: flag('title') ?? episode.title, ep, ratio, ext})),
      }));
      const workDir = await mkdtemp(join(tmpdir(), 'woframe-render-'));
      try {
        const [{bundle}, {selectComposition, renderMedia}] = await Promise.all([
          import('@remotion/bundler'), import('@remotion/renderer')]);
        const entryPoint = fileURLToPath(new URL('../preview/render-root.jsx', import.meta.url));
        const assetsDir = join(workDir, 'assets');
        await mkdir(assetsDir);
        for (const name of projectAssets(episode)) {
          const target = join(assetsDir, name);
          await mkdir(dirname(target), {recursive: true});
          await copyFile(join(projectDir, name), target);
        }
        const serveUrl = await bundle({entryPoint, publicDir: assetsDir, outDir: join(workDir, 'bundle')});
        const browserExecutable = process.env.WOFRAME_CHROME || undefined;
        for (const output of outputs) {
          const inputProps = {project: {...episode, ratio: output.ratio}};
          const composition = await selectComposition({serveUrl, id: 'WoFrameEpisode', inputProps, browserExecutable});
          output.rendered = join(workDir, output.ratio.replace(':', 'x') + '.mp4');
          await renderMedia({serveUrl, composition, inputProps, browserExecutable, codec: 'h264',
            outputLocation: output.rendered, concurrency: 2, pixelFormat: 'yuv420p'});
        }
        for (const {target, rendered} of outputs) {
          await mkdir(dirname(target), {recursive: true});
          await copyFile(rendered, target);
        }
      } finally {
        await rm(workDir, {recursive: true, force: true});
      }
      const files = outputs.map(({ratio, target}) => ({ratio, file: relative(repoRoot, target)}));
      print({ok: true, ...(files.length === 1 && {file: files[0].file}), files});
      return;
    }
    case 'deliver': {
      if (!first) throw new Error('用法：deliver <成品文件> --track=vertical --series=零基础经济学 --ep=01 --title=机会成本 --ratio=9x16 [--cover]');
      const track = flag('track');
      if (!trackIds.includes(track)) throw new Error('deliver 需要 --track=' + trackIds.join('|'));
      const series = clean(flag('series')) || (track === 'traffic' ? '泛流量' : '');
      const title = clean(flag('title'));
      const ep = flag('ep') ?? '';
      const ratio = (flag('ratio') ?? '9x16').replace(':', 'x');
      if (!series || !title || !/^\d+$/.test(ep)) throw new Error('deliver 需要 --series（泛流量可省略）、--title 和 --ep');
      if (!/^[1-9]\d*x[1-9]\d*$/.test(ratio)) throw new Error('画幅须为 9x16 或 9:16 格式');
      if (!await exists(first)) throw new Error('找不到成品文件：' + first);
      const target = join(outputRoot, track, series,
        artifactName({title, ep, ratio, cover: has('cover'), ext: extname(first) || '.mp4'}));
      if (!(await stat(first)).isFile()) throw new Error('交付素材须为文件：' + first);
      if (resolve(first) === target) {
        print({ok: true, file: relative(repoRoot, target), moved: false});
        return;
      }
      await mkdir(dirname(target), {recursive: true});
      try {
        await rename(resolve(first), target);
      } catch (error) {
        if (error.code !== 'EXDEV') throw error;
        await copyFile(first, target);
        await unlink(first);
      }
      print({ok: true, file: relative(repoRoot, target), moved: true});
      return;
    }
    default:
      throw new Error('用法：woframe.mjs doctor [--track=] | setup [--track=] [--install] | voices [--language=] | narrate <episode.json> [--voice=] [--sample] | check <episode.json> [--strict] | fit <episode.json> [--write] | handbooks | find-handbook <系列名> | save-handbook <episode.json> | apply-handbook <handbook.json> <episode.json> | render <episode.json> [--ep=] [--title=] [--ratio=] [--resolution=] [--out=] | deliver <文件> --track= --series= --ep= --title= [--ratio=] [--cover]');
  }
}

const positional = process.argv.slice(2).filter(arg => !arg.startsWith('--'));

main(positional).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
