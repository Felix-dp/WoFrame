import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateEpisode} from '../preview/episode.mjs';
import {sceneTiming} from './project-media.mjs';

const hasLocalQwen = process.platform === 'darwin' && process.arch === 'arm64';
const qwenRunner = fileURLToPath(new URL('./qwen-narration.py', import.meta.url));
const voices = [
  {id: 'qwen-vivian', provider: 'qwen', speaker: 'Vivian', label: 'Vivian · 清亮女声', language: 'zh-CN'},
  {id: 'qwen-serena', provider: 'qwen', speaker: 'Serena', label: 'Serena · 温和女声', language: 'zh-CN'},
  {id: 'qwen-uncle-fu', provider: 'qwen', speaker: 'Uncle_Fu', label: 'Uncle Fu · 沉稳男声', language: 'zh-CN'},
  {id: 'edge-xiaoxiao', provider: 'edge', speaker: 'zh-CN-XiaoxiaoNeural', label: '晓晓 · 温和女声', language: 'zh-CN'},
  {id: 'edge-yunxi', provider: 'edge', speaker: 'zh-CN-YunxiNeural', label: '云希 · 活泼男声', language: 'zh-CN'},
  {id: 'edge-jenny', provider: 'edge', speaker: 'en-US-JennyNeural', label: 'Jenny · 英语女声', language: 'en-US'},
  {id: 'edge-nanami', provider: 'edge', speaker: 'ja-JP-NanamiNeural', label: 'Nanami · 日语女声', language: 'ja-JP'},
];

export function narrationVoices(language) {
  const options = voices.filter(voice => !language || voice.language === language);
  if (!options.length) throw new Error('配音语言须为 zh-CN、en-US 或 ja-JP');
  return options.map(voice => ({...voice, availableOnPlatform: voice.provider !== 'qwen' || hasLocalQwen}));
}

function run(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {stdio: ['pipe', 'ignore', 'inherit'],
      env: {...process.env, HF_HUB_DISABLE_XET: process.env.HF_HUB_DISABLE_XET ?? '1'}});
    child.once('error', error => reject(error.code === 'ENOENT' ? new Error('找不到 uv，请先运行 setup --install') : error));
    child.once('close', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`配音工具未完成（${signal ?? code}），请检查上方工具输出`));
    });
    child.stdin.on('error', error => { if (error.code !== 'EPIPE') reject(error); });
    child.stdin.end(input);
  });
}

async function synthesize(voice, jobs) {
  if (voice.provider === 'qwen') {
    if (!hasLocalQwen) {
      throw new Error('本地 Qwen 声线需要 Apple Silicon Mac。其他系统可选对应语言的 Edge 声线。');
    }
    await run('uv', ['run', '--no-project', '--python', '3.12', '--with', 'mlx-audio==0.6.5',
      'python', qwenRunner], JSON.stringify({speaker: voice.speaker, language: 'Chinese', jobs}));
    return;
  }
  for (const {text, file} of jobs) {
    const script = file + '.txt';
    await writeFile(script, text, {flag: 'wx', mode: 0o600});
    try {
      await run('uv', ['tool', 'run', '--from', 'edge-tts==7.3.1', 'edge-tts', '--voice', voice.speaker,
        '--file', script, '--write-media', file]);
    } finally {
      await rm(script, {force: true});
    }
  }
}

export async function narrateEpisode(file, {voiceId, sample = false, generate = synthesize} = {}) {
  if (!file) throw new Error('用法：narrate <项目.json> [--voice=声线ID] [--sample]');
  const path = resolve(file);
  const directory = dirname(path);
  const original = await readFile(path, 'utf8');
  const project = JSON.parse(original);
  const episode = validateEpisode(project);
  if (episode.route !== 'faceless' || episode.preferences?.track !== 'vertical') {
    throw new Error('AI 配音命令用于Ⅱ不露脸垂直项目（faceless + vertical）');
  }
  const language = episode.language ?? 'zh-CN';
  const options = narrationVoices(language);
  const chosen = voiceId ?? project.preferences?.narrationVoice;
  const voice = options.find(item => item.id === chosen);
  if (!voice) throw new Error(`请用 voices --language=${language} 查看声线，再通过 --voice 指定一个可用 ID`);

  const selected = episode.scenes.flatMap((scene, index) => {
    const text = scene.narrationText;
    if (text === undefined || (!sample && scene.audio && scene.audio !== scene.generatedNarration)) return [];
    if (typeof text !== 'string' || !text.trim()) throw new Error(`分镜 ${index + 1} 的 narrationText 须为非空文稿`);
    return [{index, text: text.trim()}];
  });
  const jobs = sample ? selected.slice(0, 1).map(job => ({
    ...job, text: Array.from(job.text).slice(0, 140).join(''),
  })) : selected;
  if (!jobs.length) return {ok: true, generated: [], message: '没有待配音分镜，请给需要配音的分镜填写 narrationText'};
  for (const {index} of jobs) {
    if (!sample && episode.scenes[index].cues?.length) {
      throw new Error(`分镜 ${index + 1} 已有按旧音轨对齐的 cues。备份后移除这些标注，换声后按新音轨重标。`);
    }
  }

  const runDir = await mkdtemp(join(directory, sample ? 'voice-sample-' : 'voice-'));
  const extension = voice.provider === 'qwen' ? 'wav' : 'mp3';
  const files = jobs.map(({index, text}) => {
    const name = `scene-${String(index + 1).padStart(3, '0')}.${extension}`;
    return {index, text, file: join(runDir, name), audio: basename(runDir) + '/' + name};
  });
  try {
    await generate(voice, files);
    if (sample) {
      sceneTiming({fps: episode.fps, scenes: [{audio: files[0].audio, frames: 1}]}, directory, {fit: true});
      return {ok: true, voice: voice.id, file: files[0].file};
    }
    for (const {index, audio} of files) {
      Object.assign(project.scenes[index], {audio, generatedNarration: audio});
    }
    project.preferences.narrationVoice = voice.id;
    const {changes, warnings} = sceneTiming(episode, directory, {fit: true});
    if (warnings.length) throw new Error('新旁白与现有视频时长不匹配，请延长相关镜头：' + JSON.stringify(warnings));
    validateEpisode(project);
    const draft = join(runDir, 'episode.tmp');
    await writeFile(draft, JSON.stringify(project, null, 2) + '\n', {flag: 'wx'});
    if (await readFile(path, 'utf8') !== original) throw new Error('配音期间项目已更改，请重试');
    await rename(draft, path);
    return {ok: true, voice: voice.id, generated: files.map(({index, audio}) => ({scene: index + 1, audio})), changes};
  } catch (error) {
    await rm(runDir, {recursive: true, force: true});
    throw error;
  }
}
