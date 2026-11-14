import {palettes, pipShapes, validateMotion} from './motion.mjs';

export const tracks = ['traffic', 'vertical', 'persona'];

export const episodeSizes = {
  '9:16': {width: 1080, height: 1920},
  '16:9': {width: 1920, height: 1080},
  '3:4': {width: 1080, height: 1440},
  '4:3': {width: 1440, height: 1080},
  '1:1': {width: 1080, height: 1080},
};

export const resolutions = ['480p', '720p', '1080p'];

export function resolutionScale(resolution = '1080p') {
  if (!resolutions.includes(resolution)) throw new Error('画质须为 480p、720p 或 1080p');
  return Number.parseInt(resolution, 10) / 1080;
}

function localAsset(value) {
  if (!value) return;
  if (typeof value !== 'string' || !value.split('/').every(part =>
    part !== '.' && part !== '..' && /^[\p{L}\p{N} _.-]+$/u.test(part))) {
    throw new Error(`素材必须是项目目录内的相对路径：${value}`);
  }
}

function validateCues(cues, frames, steady) {
  if (cues === undefined) return;
  if (!Array.isArray(cues) || cues.length === 0) throw new Error('cues 须为非空数组');
  let previous = -1;
  for (const cue of cues) {
    if (!Number.isInteger(cue?.frame) || cue.frame <= previous || cue.frame >= frames ||
        typeof cue.text !== 'string' || !cue.text.trim()) {
      throw new Error('标注须有文字和镜内帧号，且按从零开始的帧号递增');
    }
    if (cue.emphasis !== undefined && (typeof cue.emphasis !== 'string' ||
        !cue.emphasis.trim() || !cue.text.includes(cue.emphasis))) {
      throw new Error('标注的 emphasis 须是 text 中的一段文字');
    }
    if (cue.screenText !== undefined && (typeof cue.screenText !== 'string' || !cue.screenText.trim())) {
      throw new Error('标注的 screenText 须为非空文字');
    }
    if (cue.cards !== undefined && (!Array.isArray(cue.cards) || cue.cards.length < 1 || cue.cards.length > 4 ||
        cue.cards.some(card => !(steady && card === null) &&
          (typeof card !== 'string' || !card.trim() || card.length > 64)))) {
      throw new Error('标注的 cards 须为 1–4 项短文字');
    }
    previous = cue.frame;
  }
}

function validateCollage(scene) {
  const {collage} = scene;
  if (collage == null) return;
  if (typeof collage !== 'object' || Array.isArray(collage)) throw new Error('collage 须为对象');
  if (scene.video || scene.caption || Object.keys(scene.motion ?? {}).some(key => key !== 'transition')) {
    throw new Error('纸页拼贴使用独立版式，可配旁白及 motion.transition；画面文字请写入 text 或 collage.note');
  }
  if (scene.cues?.some(cue => cue.cards || cue.screenText)) {
    throw new Error('纸页拼贴的 cues 支持字幕，画面文字请写入 text 或 collage.note');
  }
  const lines = scene.text?.split('\n') ?? [];
  if (!lines.length || lines.length > 3 || lines.some(line => !line.trim() || [...line].length > 16)) {
    throw new Error('纸页拼贴 text 须为一至三行，每行最多 16 字');
  }
  if (Boolean(collage.portrait) === Boolean(collage.illustration)) {
    throw new Error('纸页拼贴须选择一张主图，填写 collage.portrait 或 collage.illustration');
  }
  for (const field of ['cover', collage.illustration ? 'illustration' : 'portrait']) {
    const name = collage[field];
    if (typeof name !== 'string' || !/\.(?:png|webp|jpe?g)$/i.test(name)) {
      throw new Error(`collage.${field} 须填写 PNG、WebP 或 JPEG 图片`);
    }
    localAsset(name);
  }
  for (const [field, max] of Object.entries({
    book: 24, author: 24, originalTitle: 46, note: 42, credit: 56, eyebrow: 12, folio: 22,
  })) {
    const value = collage[field];
    if (value == null && field !== 'book' && field !== 'author') continue;
    if (typeof value !== 'string' || !value.trim() || /[\r\n]/.test(value) || [...value].length > max) {
      throw new Error(`collage.${field} 须为非空单行文字，最多 ${max} 字`);
    }
  }
}

export function validateEpisode(project) {
  const {title, route, scenes, bgm, fps = 30} = project;
  const ratio = project.ratio ?? project.preferences?.ratio ?? '9:16';
  if (typeof title !== 'string' || !title.trim() || !['talking-head', 'faceless'].includes(route)) {
    throw new Error('请填写标题，选择 talking-head 或 faceless');
  }
  resolutionScale(project.resolution);
  if (project.language != null && !['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(project.language)) throw new Error('项目语言须为 zh-CN、en-US、ja-JP 或 ko-KR');
  const track = project.preferences?.track;
  if (track != null && !tracks.includes(track)) throw new Error(`赛道须为 ${tracks.join('、')}`);
  if (project.preferences?.pipShape != null && !pipShapes.includes(project.preferences.pipShape)) {
    throw new Error('preferences.pipShape 须为 rounded 或 circle');
  }
  if (project.preferences?.pipSize != null && project.preferences.pipSize !== 'small') {
    throw new Error('preferences.pipSize 可用 small');
  }
  if (typeof ratio !== 'string' || !Object.hasOwn(episodeSizes, ratio)) {
    throw new Error(`画幅须为 ${Object.keys(episodeSizes).join('、')}`);
  }
  if (!Number.isInteger(fps) || fps < 1 || fps > 60) {
    throw new Error('请使用 1–60 的整数 FPS');
  }
  if (!Array.isArray(scenes) || !scenes.length) throw new Error('请添加分镜');
  if (project.theme != null && (typeof project.theme !== 'string' || !Object.hasOwn(palettes, project.theme))) {
    throw new Error('theme 须为 ' + Object.keys(palettes).join('、'));
  }
  localAsset(bgm);
  let duration = 0;
  scenes.forEach((scene, index) => {
    try {
      if (!Number.isInteger(scene?.frames) || scene.frames < 1) throw new Error('帧数必须是正整数');
      if (scene.cueStyle !== undefined && scene.cueStyle !== 'steady') throw new Error('未知标注样式');
      validateCues(scene.cues, scene.frames, scene.cueStyle === 'steady');
      if (route === 'talking-head' && !scene.video) throw new Error('缺少口播视频');
      if (scene.videoStartFrame != null &&
          (!scene.video || !Number.isSafeInteger(scene.videoStartFrame) || scene.videoStartFrame < 0 ||
            !Number.isSafeInteger(scene.videoStartFrame + scene.frames))) {
        throw new Error('videoStartFrame 须配合视频填写，使用非负整数帧');
      }
      if ([scene.text, scene.caption].some(value => value != null && typeof value !== 'string')) {
        throw new Error('画面文字和字幕须为字符串');
      }
      validateMotion(scene);
      validateCollage(scene);
      if (scene.illustration != null) {
        if (scene.collage || scene.motion?.speaker !== 'pip' || !scene.text?.trim() ||
            typeof scene.illustration !== 'string' || !/\.(?:jpe?g|png|webp)$/i.test(scene.illustration)) {
          throw new Error('illustration 须配合小窗和标题，使用 JPEG、PNG 或 WebP');
        }
        if (scene.cues?.some(cue => cue.cards)) throw new Error('插图分镜的 cues 支持字幕和标题');
        localAsset(scene.illustration);
      }
      localAsset(scene.video);
      localAsset(scene.audio);
      duration += scene.frames;
    } catch (error) {
      throw new Error(`分镜 ${index + 1}：${error.message}`);
    }
  });
  if (!Number.isSafeInteger(duration)) throw new Error('总帧数超出范围');
  return {...project, ratio, fps, duration};
}

export function episodeComposition(project) {
  const {width, height} = episodeSizes[project.ratio];
  const scale = resolutionScale(project.resolution);
  return {
    width: Math.ceil(width * scale / 2) * 2,
    height: Math.ceil(height * scale / 2) * 2,
    durationInFrames: project.duration,
    fps: project.fps,
  };
}

export function isEpisodePath(pathname) {
  return /^\/(work|examples)\/.+\.json$/.test(pathname);
}
