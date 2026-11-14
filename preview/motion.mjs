export const transitions = ['cut', 'fade', 'slide'];
export const layouts = ['title', 'compare', 'steps'];
export const pipShapes = ['rounded', 'circle'];
export const palettes = {
  ink: {background: '#101923', surface: '#192734', border: '#3a504f', text: '#f6f3e9', muted: '#c0d0cb', accent: '#8fe1ba'},
  paper: {background: '#ede8dc', surface: '#f9f6ef', border: '#d5cbb8', text: '#242d2c', muted: '#495a54', accent: '#245c49'},
  renew: {background: '#f5f2e9', surface: '#fffaf0', border: '#ded7cb', text: '#26231f', muted: '#665f55', accent: '#bd4826'},
};

export function validateMotion(scene) {
  if (scene.motion == null) return;
  const motion = scene.motion;
  if (typeof motion !== 'object' || Array.isArray(motion)) throw new Error('motion 须为对象');
  const {layout, transition, speaker, beats = [], focus, relation, pipCrop} = motion;
  if (layout != null && !layouts.includes(layout)) throw new Error('motion.layout 须为 ' + layouts.join(' / '));
  if (transition != null && !transitions.includes(transition)) throw new Error('motion.transition 须为 ' + transitions.join(' / '));
  if (speaker != null && (speaker !== 'pip' || !scene.video)) throw new Error('motion.speaker 只支持带视频素材的 pip');
  if (pipCrop != null && (speaker !== 'pip' || typeof pipCrop !== 'object' || Array.isArray(pipCrop) ||
      ![pipCrop.x ?? 50, pipCrop.y ?? 50].every(value => Number.isFinite(value) && value >= 0 && value <= 100) ||
      !Number.isFinite(pipCrop.zoom ?? 1) || (pipCrop.zoom ?? 1) < 1 || (pipCrop.zoom ?? 1) > 4)) {
    throw new Error('motion.pipCrop 仅用于小窗，x/y 须为 0–100，zoom 须为 1–4');
  }
  if (!Array.isArray(beats) || beats.length > 4) throw new Error('motion.beats 须为列表，每镜最多四项');
  if (relation != null && (beats.length !== 2 || (layout != null && layout !== 'compare') ||
      !['+', '=', '≠', '→', '或'].includes(relation))) {
    throw new Error('motion.relation 仅用于两项比较，可用 +、=、≠、→ 或「或」');
  }
  if (scene.video && speaker !== 'pip' && (layout != null || beats.length || focus != null)) {
    throw new Error('视频分镜使用讲解板时请设置 motion.speaker 为 pip');
  }
  let previous = -1;
  beats.forEach((beat, index) => {
    const {label, detail, type = 'card', at, value, unit} = beat ?? {};
    if (typeof label !== 'string' || !label.trim() || label.length > 28 ||
        (detail != null && (typeof detail !== 'string' || detail.length > 55))) {
      throw new Error(`第 ${index + 1} 项须提供短标签（最多 28 字）和简短说明（最多 55 字）`);
    }
    if (!['card', 'button', 'metric'].includes(type)) throw new Error('元素类型须为 card、button 或 metric');
    if (type === 'metric' && (!Number.isFinite(value) || (unit != null && (typeof unit !== 'string' || unit.length > 8)))) {
      throw new Error('metric 须提供数字 value，unit 最多 8 字');
    }
    const time = at ?? defaultBeatTime(index, beats.length);
    if (!Number.isFinite(time) || time < 0 || time > 0.9 || time < previous) {
      throw new Error('元素 at 须按出现顺序递增，取值为镜内进度 0–0.9');
    }
    previous = time;
  });
  if (focus != null) {
    const {beat, at} = focus;
    if (!Number.isInteger(beat) || !beats[beat] || !Number.isFinite(at) ||
        at < (beats[beat].at ?? defaultBeatTime(beat, beats.length)) || at > 0.9) {
      throw new Error('focus 须指定有效的元素索引及不早于该元素出现的镜内进度（至多 0.9）');
    }
  }
}

export function defaultBeatTime(index, count) {
  return 0.18 + 0.54 * index / Math.max(1, count - 1);
}

export function isBoard(scene) {
  return !scene.video || scene.motion?.speaker === 'pip';
}

export function speakerLayout(width, height, sizeMode) {
  const portrait = height > width * 1.2;
  const size = width * (sizeMode === 'small' ? (portrait ? 0.23 : 0.14) : (portrait ? 0.29 : 0.2));
  const right = width * 0.08;
  const bottom = height * (portrait ? 0.14 : 0.22);
  const gap = Math.min(width, height) * 0.04;
  return {
    size, right, bottom,
    panelRight: portrait ? width * 0.07 : right + size + gap,
    panelBottom: portrait ? bottom + size + gap : height * 0.22,
  };
}

export function resizesSpeaker(previous, scene) {
  return Boolean(previous?.video && scene.video &&
    (previous.motion?.speaker === 'pip') !== (scene.motion?.speaker === 'pip') &&
    scene.motion?.transition !== 'cut');
}

export function sceneTransition(previous, scene, fps) {
  if (!previous || !isBoard(previous) || !isBoard(scene)) return {type: 'cut', frames: 0};
  const type = scene.motion?.transition ?? 'fade';
  const frames = Math.min(Math.round(fps * (type === 'slide' ? 0.32 : 0.26)),
    Math.floor(previous.frames / 3), Math.floor(scene.frames / 3));
  return type === 'cut' || frames < 2 ? {type: 'cut', frames: 0} : {type, frames};
}

export function ease(frame, start, duration) {
  const progress = Math.min(1, Math.max(0, (frame - start) / Math.max(1, duration)));
  return 1 - (1 - progress) ** 3;
}

export function reveal(frame, frames, fps, at = 0, seconds = 0.32) {
  if (frames <= 2) return 1;
  const start = Math.min(Math.round(at * (frames - 1)), frames - 3);
  return ease(frame, start, Math.min(fps * seconds, frames - 2 - start));
}

// Keep one media element across adjacent slices of the same take.
export function videoTimeline(scenes) {
  const runs = [];
  let from = 0;
  const shots = scenes.map((scene, index) => {
    const shot = {scene, previous: scenes[index - 1], from, index};
    if (scene.video) {
      const trimBefore = scene.videoStartFrame ?? 0;
      const muted = Boolean(scene.audio);
      const last = runs.at(-1);
      if (last && last.video === scene.video && last.muted === muted &&
          last.from + last.frames === from && last.trimBefore + last.frames === trimBefore) {
        last.frames += scene.frames;
      } else {
        runs.push({video: scene.video, from, frames: scene.frames, trimBefore, muted});
      }
    }
    from += scene.frames;
    return shot;
  });
  return {shots, runs};
}
