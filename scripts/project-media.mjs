import {stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

function mediaDuration(path, kind) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', kind === 'video' ? 'v:0' : 'a:0',
    '-show_entries', 'stream=duration:format=duration', '-of', 'json', path],
  {encoding: 'utf8', timeout: 20000});
  if (probe.error?.code === 'ENOENT') throw new Error('找不到 ffprobe，请先运行 setup --install');
  if (probe.status === 0) {
    const {streams, format} = JSON.parse(probe.stdout);
    if (streams?.length) {
      const seconds = Number(streams[0].duration);
      if (Number.isFinite(seconds) && seconds > 0) return seconds;
      const containerSeconds = Number(format?.duration);
      if (Number.isFinite(containerSeconds) && containerSeconds > 0) return containerSeconds;
    }
  }
  throw new Error('无法读取' + (kind === 'video' ? '视频' : '音频') + '时长：' + path);
}

export function sceneTiming(episode, projectDir, {fit = false} = {}) {
  const durations = new Map();
  const changes = [];
  const warnings = [];
  const duration = (name, kind) => {
    const key = kind + ':' + name;
    if (!durations.has(key)) durations.set(key, mediaDuration(resolve(projectDir, name), kind));
    return durations.get(key);
  };
  episode.scenes.forEach((scene, index) => {
    const audio = scene.audio ? duration(scene.audio, 'audio') : null;
    const video = scene.video ? duration(scene.video, 'video') : null;
    const reference = audio ?? (episode.route === 'talking-head' ? video : null);
    const frames = reference === null ? scene.frames : Math.max(1, Math.round(reference * episode.fps));
    const playable = (fit ? frames : scene.frames) / episode.fps;
    if (frames !== scene.frames) {
      changes.push({scene: index + 1, source: scene.audio ?? scene.video, seconds: +reference.toFixed(2),
        from: scene.frames, to: frames});
      if (fit) scene.frames = frames;
    }
    if (audio !== null && Math.abs(audio - playable) > 0.2) {
      warnings.push({scene: index + 1, audio: scene.audio, audioSeconds: +audio.toFixed(2),
        playableSeconds: +playable.toFixed(2), suggestedFrames: frames});
    }
    const videoDifference = playable - video;
    if (video !== null && (videoDifference > 0.2 ||
        (episode.route === 'talking-head' && audio === null && Math.abs(videoDifference) > 0.2))) {
      warnings.push({scene: index + 1, video: scene.video, videoSeconds: +video.toFixed(2),
        playableSeconds: +playable.toFixed(2), suggestedFrames: Math.max(1, Math.round(video * episode.fps))});
    }
  });
  return {warnings, changes};
}

export function projectAssets(episode) {
  return new Set([episode.bgm, ...episode.scenes.flatMap(scene => [scene.video, scene.audio])].filter(Boolean));
}

export async function checkAssets(episode, projectDir) {
  for (const name of projectAssets(episode)) {
    const file = await stat(resolve(projectDir, name)).catch(() => null);
    if (!file?.isFile()) throw new Error('项目素材不可用：' + name);
  }
  if (episode.bgm) mediaDuration(resolve(projectDir, episode.bgm), 'audio');
}
