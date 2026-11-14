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

export function validateEpisode(project) {
  const {title, route, scenes, bgm, fps = 30} = project;
  const ratio = project.ratio ?? project.preferences?.ratio ?? '9:16';
  if (typeof title !== 'string' || !title.trim() || !['talking-head', 'faceless'].includes(route)) {
    throw new Error('请填写标题，选择 talking-head 或 faceless');
  }
  resolutionScale(project.resolution);
  if (project.language != null && !['zh-CN', 'en-US', 'ja-JP'].includes(project.language)) throw new Error('项目语言须为 zh-CN、en-US 或 ja-JP');
  const track = project.preferences?.track;
  if (track != null && !tracks.includes(track)) throw new Error(`赛道须为 ${tracks.join('、')}`);
  if (typeof ratio !== 'string' || !Object.hasOwn(episodeSizes, ratio)) {
    throw new Error(`画幅须为 ${Object.keys(episodeSizes).join('、')}`);
  }
  if (!Number.isInteger(fps) || fps < 1 || fps > 60) {
    throw new Error('请使用 1–60 的整数 FPS');
  }
  if (!Array.isArray(scenes) || !scenes.length) throw new Error('请添加分镜');
  localAsset(bgm);
  let duration = 0;
  scenes.forEach((scene, index) => {
    try {
      if (!Number.isInteger(scene?.frames) || scene.frames < 1) throw new Error('帧数必须是正整数');
      if (route === 'talking-head' && !scene.video) throw new Error('缺少口播视频');
      if ([scene.text, scene.caption].some(value => value != null && typeof value !== 'string')) {
        throw new Error('画面文字和字幕须为字符串');
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
