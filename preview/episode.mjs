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
  if (!['9:16', '16:9'].includes(ratio) || !Number.isInteger(fps) || fps < 1 || fps > 60) {
    throw new Error('请使用 9:16 或 16:9 画幅，以及 1–60 的整数 FPS');
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
