import {access, copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, unlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {dirname, extname, join, relative, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateEpisode} from '../preview/episode.mjs';
import {evaluateRequirements, installMissing} from './env.mjs';
import {publishingPlan} from '../preview/publishing.mjs';

const read = async file => JSON.parse(await readFile(file, 'utf8'));
const print = value => console.log(JSON.stringify(value, null, 2));
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const handbooksRoot = join(repoRoot, 'handbooks');
const outputRoot = join(repoRoot, 'output');
const trackIds = ['traffic', 'vertical', 'persona'];
const keys = ['track', 'series', 'audience', 'targetSeconds', 'pace', 'platform', 'ratio', 'style',
  'visualStyle', 'coverStyle', 'hostRole', 'staging', 'speech', 'takeRule',
  'voice', 'bgmStyle', 'captionStyle', 'materialSource'];
const preferences = value => Object.fromEntries(keys.filter(key =>
  ['string', 'number', 'boolean'].includes(typeof value?.[key])).map(key => [key, value[key]]));
const installed = (name, args) => spawnSync(name, args, {stdio: 'ignore', timeout: 3000}).status === 0;
const require = createRequire(import.meta.url);
const exists = file => access(file).then(() => true, () => false);
const clean = value => String(value ?? '').trim()
  .replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
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

function mediaDuration(file) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file],
    {encoding: 'utf8'});
  const seconds = Number.parseFloat(String(probe.stdout ?? '').trim());
  return Number.isFinite(seconds) ? seconds : null;
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
    case 'doctor':
      print({node: process.version, ffmpeg: installed('ffmpeg', ['-version']),
        hypitCli: installed('hypit', ['--version']), uv: installed('uv', ['--version']),
        elevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY),
        hypitKey: Boolean(process.env.HYPIT_API_KEY),
        remotion: hasRemotion()});
      return;
    case 'setup': {
      const report = evaluateRequirements();
      print(report);
      if (!has('install')) return;
      if (!report.missing.length) return;
      const installed = installMissing(report);
      print({installed, after: evaluateRequirements()});
      return;
    }
    case 'check': {
      if (!await exists(first)) throw new Error('找不到项目文件：' + first);
      const episode = validateEpisode(await read(first));
      publishingPlan(episode.publishingTargets ?? []);
      const files = new Set([episode.bgm, ...episode.scenes.flatMap(scene => [scene.video, scene.audio])]);
      for (const file of files) if (file) await access(resolve(dirname(first), file));
      const warnings = [];
      episode.scenes.forEach((scene, index) => {
        if (!scene.audio) return;
        const seconds = mediaDuration(resolve(dirname(first), scene.audio));
        if (seconds === null) return;
        const playable = scene.frames / episode.fps;
        if (Math.abs(seconds - playable) > 0.2) {
          warnings.push({scene: index + 1, audio: scene.audio, audioSeconds: +seconds.toFixed(2),
            frames: scene.frames, playableSeconds: +playable.toFixed(2),
            suggestedFrames: Math.max(1, Math.round(seconds * episode.fps))});
        }
      });
      print({ok: true, scenes: episode.scenes.length, seconds: episode.duration / episode.fps, warnings});
      if (warnings.length && has('strict')) {
        throw new Error('音画时长对不上，先跑 fit --write 对齐');
      }
      return;
    }
    case 'fit': {
      const episode = await read(first);
      const fps = episode.fps ?? 30;
      const changes = [];
      (episode.scenes ?? []).forEach((scene, index) => {
        if (!scene.audio) return;
        const seconds = mediaDuration(resolve(dirname(first), scene.audio));
        if (seconds === null) return;
        const frames = Math.max(1, Math.round(seconds * fps));
        if (frames !== scene.frames) {
          changes.push({scene: index + 1, audio: scene.audio, seconds: +seconds.toFixed(2),
            from: scene.frames, to: frames});
          scene.frames = frames;
        }
      });
      if (has('write') && changes.length) {
        await writeFile(first, JSON.stringify(episode, null, 2) + '\n');
      }
      const total = (episode.scenes ?? []).reduce((sum, scene) => sum + (scene.frames ?? 0), 0);
      print({ok: true, fps, seconds: total / fps, written: has('write') && changes.length > 0, changes});
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
      const incoming = preferences({...episode.preferences, ...(episode.ratio && {ratio: episode.ratio})});
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
      if (handbook.version !== 1 || !handbook.preferences) throw new Error('Handbook 格式无效');
      const episode = await read(second);
      print({...episode, preferences: {...preferences(handbook.preferences), ...episode.preferences}});
      return;
    }
    case 'render': {
      if (!first) throw new Error('用法：render <episode.json> [--resolution=720p] [--ep=01] [--title=] [--out=]');
      const config = await read(first);
      const episode = validateEpisode({...config, resolution: flag('resolution') ?? config.resolution});
      const prefs = episode.preferences ?? {};
      if (!trackIds.includes(prefs.track)) throw new Error('render 需要 project.preferences.track，先确认用户赛道');
      const series = seriesName(prefs, defaultSeries(prefs.track, episode.title));
      const target = flag('out') ? resolve(flag('out')) : join(outputRoot, prefs.track, series,
        artifactName({title: flag('title') ?? episode.title, ep: flag('ep') ?? '01', ratio: episode.ratio,
          ext: episode.resolution && episode.resolution !== '1080p' ? '-' + episode.resolution + '.mp4' : '.mp4'}));
      await mkdir(dirname(target), {recursive: true});
      const workDir = await mkdtemp(join(tmpdir(), 'woframe-render-'));
      try {
        const [{bundle}, {selectComposition, renderMedia}] = await Promise.all([
          import('@remotion/bundler'), import('@remotion/renderer')]);
        const entryPoint = fileURLToPath(new URL('../preview/render-root.jsx', import.meta.url));
        const assetsDir = join(workDir, 'assets');
        const projectDir = dirname(resolve(first));
        const media = new Set([episode.bgm,
          ...episode.scenes.flatMap(scene => [scene.video, scene.audio])].filter(Boolean));
        for (const name of media) {
          const target = join(assetsDir, name);
          await mkdir(dirname(target), {recursive: true});
          await copyFile(join(projectDir, name), target);
        }
        const serveUrl = await bundle({entryPoint, publicDir: assetsDir, outDir: join(workDir, 'bundle')});
        const inputProps = {project: episode};
        const browserExecutable = process.env.WOFRAME_CHROME || undefined;
        const composition = await selectComposition({serveUrl, id: 'WoFrameEpisode', inputProps, browserExecutable});
        await renderMedia({serveUrl, composition, inputProps, browserExecutable, codec: 'h264',
          outputLocation: target, concurrency: 2, pixelFormat: 'yuv420p'});
      } finally {
        await rm(workDir, {recursive: true, force: true});
      }
      print({ok: true, file: relative(repoRoot, target)});
      return;
    }
    case 'deliver': {
      if (!first) throw new Error('用法：deliver <成品文件> --track=vertical --series=零基础经济学 --ep=01 --title=机会成本 --ratio=9x16 [--cover]');
      const track = flag('track');
      if (!trackIds.includes(track)) throw new Error('deliver 需要 --track=' + trackIds.join('|'));
      const series = clean(flag('series'));
      const title = clean(flag('title'));
      const ep = String(flag('ep') ?? '').padStart(2, '0');
      const ratio = flag('ratio') ?? '9x16';
      if (!series || !title || !/^\d{2,}$/.test(ep)) throw new Error('deliver 需要 --series、--title 和 --ep');
      if (!await exists(first)) throw new Error('找不到成品文件：' + first);
      const target = join(outputRoot, track, series,
        artifactName({title, ep, ratio, cover: has('cover'), ext: extname(first) || '.mp4'}));
      await mkdir(dirname(target), {recursive: true});
      try {
        await rename(resolve(first), target);
      } catch {
        await copyFile(first, target);
        await unlink(first);
      }
      print({ok: true, file: relative(repoRoot, target), moved: true});
      return;
    }
    default:
      throw new Error('用法：woframe.mjs doctor | setup [--install] | check <episode.json> [--strict] | fit <episode.json> [--write] | handbooks | find-handbook <系列名> | save-handbook <episode.json> | apply-handbook <handbook.json> <episode.json> | render <episode.json> [--resolution=] [--ep=] [--title=] [--out=] | deliver <文件> --track= --series= --ep= --title= [--ratio=] [--cover]');
  }
}

const positional = process.argv.slice(2).filter(arg => !arg.startsWith('--'));

main(positional).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
