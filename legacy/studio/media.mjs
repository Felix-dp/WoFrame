import {deleteTake, readTake, writeTake} from './takes.mjs';

const palettes = {
  paper: ['#f5f3e8', '#163e32', '#dbe9ca'],
  chalk: ['#173b35', '#fff0ce', '#286054'],
  cards: ['#edeaff', '#2e245e', '#d6cdfb'],
};

export function frame(canvas, topic, scene, style, progress) {
  const context = canvas.getContext('2d');
  const [background, ink, accent] = palettes[style] ?? palettes.paper;
  context.fillStyle = background;
  context.fillRect(0, 0, 960, 540);
  context.fillStyle = accent;
  context.fillRect(52, 146, 856, 330);
  context.fillRect(52, 501, 856, 6);
  context.fillStyle = ink;
  context.fillRect(52, 501, 856 * progress, 6);
  context.font = 'bold 38px Microsoft YaHei, sans-serif';
  context.fillText(topic, 52, 102, 856);
  context.font = 'bold 27px Microsoft YaHei, sans-serif';
  context.fillText(scene.title, 84, 204);
  if (scene.visual?.type === 'steps' && scene.visual.steps.length) {
    const shown = Math.min(scene.visual.steps.length, 1 + Math.floor(progress * scene.visual.steps.length));
    for (const [index, step] of scene.visual.steps.entries()) {
      const y = 232 + index * 72;
      context.globalAlpha = index < shown ? 1 : 0.24;
      context.fillStyle = background;
      context.fillRect(84, y, 792, 56);
      context.fillStyle = ink;
      context.font = 'bold 24px Microsoft YaHei, sans-serif';
      context.fillText(String(index + 1), 108, y + 36);
      context.font = '27px Microsoft YaHei, sans-serif';
      context.fillText(step, 157, y + 36, 690);
    }
    context.globalAlpha = 1;
    return;
  }
  context.font = '32px Microsoft YaHei, sans-serif';
  const characters = [...scene.narration];
  const pageCount = Math.max(1, Math.ceil(characters.length / 115));
  const page = Math.min(pageCount - 1, Math.floor(progress * pageCount));
  const pageText = characters.slice(page * 115, (page + 1) * 115);
  let line = '';
  let y = 266;
  for (const character of pageText) {
    if (character === '\n' || context.measureText(line + character).width > 790) {
      context.fillText(line, 84, y);
      y += 44;
      line = '';
    }
    if (y > 446) break;
    if (character !== '\n') line += character;
  }
  if (y <= 446) context.fillText(line, 84, y);
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function recordStream(stream) {
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  const result = new Promise((resolve, reject) => {
    recorder.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = event => reject(event.error);
    recorder.onstop = () => resolve(new Blob(chunks, {type: recorder.mimeType || chunks[0]?.type}));
  });
  return {recorder, result};
}

export function captionPages(text) {
  const chunks = text.match(/[^。！？；\n]+[。！？；]?/gu) ?? [];
  return chunks.flatMap(chunk => {
    const characters = [...chunk.trim()];
    const pages = [];
    for (let offset = 0; offset < characters.length; offset += 32) {
      pages.push(characters.slice(offset, offset + 32).join(''));
    }
    return pages;
  });
}

async function combineTakes(takes, captions, report) {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const paint = canvas.getContext('2d');
  const context = new AudioContext();
  const output = context.createMediaStreamDestination();
  const stream = canvas.captureStream(30);
  stream.addTrack(output.stream.getAudioTracks()[0]);
  const video = document.createElement('video');
  video.playsInline = true;
  const source = context.createMediaElementSource(video);
  source.connect(output);
  let recording;
  let objectUrl;
  try {
    await context.resume();
    for (const [index, take] of takes.entries()) {
      report(index + 1);
      const pages = captions ? captionPages(take.narration) : [];
      objectUrl = URL.createObjectURL(take.blob);
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => finish(new Error('读取视频超时。')), 15000);
        function finish(error) {
          clearTimeout(timeout);
          video.onloadeddata = null;
          video.onerror = null;
          if (error) reject(error);
          else resolve();
        }
        video.onloadeddata = () => finish();
        video.onerror = () => finish(new Error('浏览器无法读取这一段视频。'));
        video.src = objectUrl;
      });
      const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
      const width = video.videoWidth * scale;
      const height = video.videoHeight * scale;
      function draw() {
        paint.fillStyle = '#111';
        paint.fillRect(0, 0, canvas.width, canvas.height);
        paint.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        if (pages.length) {
          const fraction = Number.isFinite(video.duration) && video.duration > 0 ? video.currentTime / video.duration : 0;
          const page = pages[Math.max(0, Math.min(pages.length - 1, Math.floor(fraction * pages.length)))];
          paint.fillStyle = 'rgba(0,0,0,.78)';
          paint.fillRect(34, 463, 892, 56);
          paint.fillStyle = 'white';
          paint.font = '28px Microsoft YaHei, sans-serif';
          paint.textAlign = 'center';
          paint.fillText(page, 480, 500, 860);
        }
      }
      draw();
      if (!recording) {
        recording = recordStream(stream);
        recording.recorder.start();
        recording.result.catch(() => {});
      }
      await video.play();
      await new Promise((resolve, reject) => {
        let next;
        function finish(error) {
          cancelAnimationFrame(next);
          video.onended = null;
          video.onerror = null;
          if (error) reject(error);
          else resolve();
        }
        function tick() {
          try {
            draw();
            next = requestAnimationFrame(tick);
          } catch (error) {
            finish(error);
          }
        }
        video.onended = () => finish();
        video.onerror = () => finish(new Error('视频播放中断。'));
        if (video.ended) finish();
        else tick();
      });
      URL.revokeObjectURL(objectUrl);
      objectUrl = undefined;
    }
    recording.recorder.stop();
    return await recording.result;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (recording?.recorder.state === 'recording') recording.recorder.stop();
    stream.getTracks().forEach(track => track.stop());
    await context.close();
  }
}

async function animate(canvas, draft, voice) {
  const timeline = draft.scenes.map((scene, index) => ({
    scene,
    duration: voice ? voice.clips[index].duration * 1000 + 250 : Math.max(2600, [...scene.narration].length * 155),
  }));
  let start = performance.now();
  if (voice) {
    const startTime = voice.context.currentTime + 0.12;
    let offset = 0;
    for (const [index, clip] of voice.clips.entries()) {
      const source = voice.context.createBufferSource();
      source.buffer = clip;
      source.connect(voice.output);
      source.start(startTime + offset);
      offset += timeline[index].duration / 1000;
    }
    start = startTime * 1000;
  }
  await new Promise(resolve => {
    function tick(now) {
      let elapsed = (voice ? voice.context.currentTime * 1000 : now) - start;
      for (const {scene, duration} of timeline) {
        if (elapsed < duration) {
          frame(canvas, draft.topic, scene, draft.style, Math.max(0, elapsed / duration));
          requestAnimationFrame(tick);
          return;
        }
        elapsed -= duration;
      }
      frame(canvas, draft.topic, timeline.at(-1).scene, draft.style, 1);
      resolve();
    }
    requestAnimationFrame(tick);
  });
}

export function setupMedia(get, currentDraft) {
  const stage = get('stage');
  const camera = get('camera');
  const status = get('productionStatus');
  async function exportVideo(blob, title) {
    if (blob.type.includes('mp4')) {
      download(blob, title + '.mp4');
      return '';
    }
    if (!get('mp4Option').hidden && get('preferMp4').checked) {
      status.textContent = '正在转换为 MP4…';
      try {
        const response = await fetch('/api/mp4', {method: 'POST', body: blob, signal: AbortSignal.timeout(130000)});
        if (!response.ok) throw new Error('MP4 unavailable');
        download(await response.blob(), title + '.mp4');
        return '';
      } catch {
        download(blob, title + '.webm');
        return ' MP4 转换失败，已下载 WebM。';
      }
    }
    download(blob, title + '.webm');
    return '';
  }
  let cameraRecorder;
  let previewUrl;
  let activeDraft;
  let exportingPresenter = false;
  const takes = new Map();
  const selection = get('takeScene');
  const voiceCache = new Map();
  const animationCache = new Map();

  async function voiceFor(context, text) {
    if (voiceCache.has(text)) return voiceCache.get(text);
    let clip;
    if (!text.trim()) {
      clip = context.createBuffer(1, context.sampleRate, context.sampleRate);
    } else {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text}),
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error('配音暂不可用，可以导出无声动画。');
      clip = await context.decodeAudioData(await response.arrayBuffer());
    }
    voiceCache.set(text, clip);
    if (voiceCache.size > 30) voiceCache.delete(voiceCache.keys().next().value);
    return clip;
  }

  function takeKey(draft, sceneId) {
    return JSON.stringify([draft.projectId ?? draft.topic, draft.angle, sceneId]);
  }

  function currentTake() {
    return activeDraft && takes.get(takeKey(activeDraft, selection.value));
  }

  function showTake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const take = currentTake();
    previewUrl = take ? URL.createObjectURL(take.blob) : undefined;
    camera.srcObject = null;
    if (previewUrl) camera.src = previewUrl;
    else camera.removeAttribute('src');
    camera.controls = true;
    camera.muted = false;
    camera.hidden = !take;
    get('presenterDownload').disabled = !take || get('record').disabled;
    get('deleteTake').disabled = !take || get('record').disabled;
  }

  function renderPresenter(draft, updatePreview = false) {
    const scene = draft.scenes.find(item => item.id === selection.value);
    get('teleprompter').textContent = scene?.narration ?? '';
    const ready = draft.scenes.filter(item => takes.get(takeKey(draft, item.id))?.narration === item.narration).length;
    get('presenterExport').disabled = exportingPresenter || get('record').disabled || ready !== draft.scenes.length;
    const take = currentTake();
    const stale = take && take.narration !== scene?.narration;
    get('takeCount').textContent = `已有 ${ready}/${draft.scenes.length} 段与当前讲稿匹配。${stale ? ' 这一段的讲稿已修改，可以重录。' : ''}`;
    if (updatePreview) showTake();
  }

  async function saveTake(draft, scene, blob, name) {
    const key = takeKey(draft, scene.id);
    const take = {blob, name, narration: scene.narration};
    takes.set(key, take);
    if (takes.size > 30) takes.delete(takes.keys().next().value);
    if (activeDraft?.format === 'presenter') renderPresenter(activeDraft, true);
    try {
      await writeTake(key, take);
      return true;
    } catch {
      return false;
    }
  }

  async function restoreTakes(draft) {
    try {
      await Promise.all(draft.scenes.map(async scene => {
        const key = takeKey(draft, scene.id);
        if (takes.has(key)) return;
        const saved = await readTake(key);
        if (saved && !takes.has(key)) takes.set(key, saved);
      }));
      if (activeDraft?.format === 'presenter' && takeKey(activeDraft, '') === takeKey(draft, '') && !get('record').disabled) {
        renderPresenter(activeDraft, true);
      }
    } catch {
      // The browser may disallow storage. Recording is still available.
    }
  }

  async function renderSegment(draft, scene, audioContext, clip) {
    const stream = stage.captureStream(30);
    try {
      let voice;
      if (clip) {
        const output = audioContext.createMediaStreamDestination();
        stream.addTrack(output.stream.getAudioTracks()[0]);
        voice = {context: audioContext, output, clips: [clip]};
      }
      frame(stage, draft.topic, scene, draft.style, 0);
      const recording = recordStream(stream);
      recording.result.catch(() => {});
      recording.recorder.start();
      try {
        await animate(stage, {...draft, scenes: [scene]}, voice);
      } finally {
        if (recording.recorder.state === 'recording') recording.recorder.stop();
      }
      const blob = await recording.result;
      if (!blob.size) throw new Error('浏览器没有生成分镜视频。');
      return blob;
    } finally {
      stream.getTracks().forEach(track => track.stop());
    }
  }

  async function play(exporting, narrated = false) {
    const draft = currentDraft();
    const buttons = [get('play'), get('animationDownload'), get('voiceDownload')];
    buttons.forEach(button => { button.disabled = true; });
    let audioContext;
    try {
      let clips;
      if (narrated) {
        audioContext = new AudioContext();
        await audioContext.resume();
        status.textContent = '正在按分镜生成旁白…';
        clips = await Promise.all(draft.scenes.map(scene => voiceFor(audioContext, scene.narration)));
      }
      if (exporting) {
        const segments = [];
        let rendered = 0;
        for (const [index, scene] of draft.scenes.entries()) {
          const key = JSON.stringify([draft.topic, draft.style, narrated, scene]);
          let blob = animationCache.get(key);
          if (!blob) {
            status.textContent = `正在渲染第 ${index + 1} 镜，请保持页面开启。`;
            blob = await renderSegment(draft, scene, audioContext, clips?.[index]);
            animationCache.set(key, blob);
            if (animationCache.size > 18) animationCache.delete(animationCache.keys().next().value);
            rendered++;
          }
          segments.push({blob});
        }
        const blob = segments.length === 1 ? segments[0].blob : await combineTakes(segments, false, segment => {
          status.textContent = `正在合成动画 ${segment}/${segments.length}，请保持页面开启。`;
        });
        if (!blob.size) throw new Error('浏览器没有生成视频数据。');
        const note = await exportVideo(blob, `${draft.topic}-动画`);
        status.textContent = `动画已导出。新渲染 ${rendered} 镜，复用 ${segments.length - rendered} 镜。${note}`;
      } else {
        status.textContent = '正在播放。';
        await animate(stage, draft);
        status.textContent = '播放结束。';
      }
    } catch (error) {
      status.textContent = `无法生成动画：${error.message}`;
    } finally {
      if (audioContext) await audioContext.close();
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  get('play').onclick = () => play(false);
  get('animationDownload').onclick = () => play(true);
  get('voiceDownload').onclick = () => play(true, true);
  selection.onchange = () => renderPresenter(activeDraft, true);
  get('record').onclick = async () => {
    const draft = currentDraft();
    const scene = draft.scenes.find(item => item.id === selection.value);
    get('record').disabled = true;
    get('upload').disabled = true;
    get('presenterDownload').disabled = true;
    get('deleteTake').disabled = true;
    get('presenterExport').disabled = true;
    selection.disabled = true;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
      camera.srcObject = stream;
      camera.controls = false;
      camera.muted = true;
      camera.hidden = false;
      await camera.play();
      const {recorder, result} = recordStream(stream);
      cameraRecorder = recorder;
      recorder.start();
      status.textContent = `正在录制「${scene.title}」。`;
      get('stopRecord').disabled = false;
      const blob = await result;
      if (!blob.size) throw new Error('没有录到视频。');
      const stored = await saveTake(draft, scene, blob, `${draft.topic}-${scene.title}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
      status.textContent = stored ? '这一段已录好并保存在当前浏览器。' : '这一段已录好。浏览器存储不可用，请及时下载。';
    } catch (error) {
      camera.srcObject = null;
      status.textContent = `无法录制：${error.message}。可以上传手机拍摄的视频。`;
    } finally {
      stream?.getTracks().forEach(track => track.stop());
      cameraRecorder = null;
      get('stopRecord').disabled = true;
      get('record').disabled = false;
      get('upload').disabled = false;
      selection.disabled = false;
      if (activeDraft?.format === 'presenter') renderPresenter(activeDraft, true);
    }
  };
  get('stopRecord').onclick = () => {
    get('stopRecord').disabled = true;
    if (cameraRecorder?.state === 'recording') cameraRecorder.stop();
  };
  get('upload').onchange = async event => {
    const file = event.currentTarget.files[0];
    if (!file) return;
    const draft = currentDraft();
    const scene = draft.scenes.find(item => item.id === selection.value);
    event.currentTarget.value = '';
    const stored = await saveTake(draft, scene, file, file.name);
    status.textContent = stored ? `已为「${scene.title}」保存视频。` : '已添加视频。浏览器存储不可用，请及时下载。';
  };
  get('presenterDownload').onclick = () => {
    const take = currentTake();
    if (take) download(take.blob, take.name);
  };
  get('deleteTake').onclick = async () => {
    const draft = activeDraft;
    const key = takeKey(draft, selection.value);
    get('deleteTake').disabled = true;
    try {
      await deleteTake(key);
      takes.delete(key);
      status.textContent = '已删除这一段视频。';
    } catch {
      status.textContent = '删除失败，请重试。';
    } finally {
      if (activeDraft?.format === 'presenter' && !get('record').disabled) renderPresenter(activeDraft, true);
    }
  };
  get('presenterExport').onclick = async () => {
    const draft = currentDraft();
    const selectedTakes = draft.scenes.map(scene => takes.get(takeKey(draft, scene.id)));
    if (selectedTakes.some((take, index) => take?.narration !== draft.scenes[index].narration)) return;
    exportingPresenter = true;
    get('presenterExport').disabled = true;
    try {
      const blob = await combineTakes(selectedTakes, get('includeCaptions').checked, segment => {
        status.textContent = `正在合成第 ${segment}/${selectedTakes.length} 段，请保持页面开启。`;
      });
      if (!blob.size) throw new Error('浏览器没有生成视频数据。');
      const note = await exportVideo(blob, `${draft.topic}-真人口播`);
      status.textContent = '完整口播已导出。' + note;
    } catch (error) {
      status.textContent = `口播合成失败：${error.message}`;
    } finally {
      exportingPresenter = false;
      if (activeDraft?.format === 'presenter') renderPresenter(activeDraft);
    }
  };

  let previewSceneId;
  return (draft, sceneId) => {
    const changedProject = (draft?.projectId ?? draft?.topic) !== (activeDraft?.projectId ?? activeDraft?.topic);
    const previousFormat = activeDraft?.format;
    activeDraft = draft;
    get('production').hidden = !draft;
    if (!draft) return;
    const presenter = draft.format === 'presenter';
    get('presenterTools').hidden = !presenter;
    get('animationTools').hidden = presenter;
    if (presenter) {
      if (changedProject || previousFormat !== 'presenter') {
        selection.replaceChildren(...draft.scenes.map(scene => new Option(scene.title, scene.id)));
        void restoreTakes(draft);
      }
      renderPresenter(draft, !cameraRecorder && (changedProject || previousFormat !== 'presenter'));
    }
    if (changedProject) previewSceneId = undefined;
    if (sceneId) previewSceneId = sceneId;
    if (!presenter && !get('play').disabled) {
      const preview = draft.scenes.find(scene => scene.id === previewSceneId) ?? draft.scenes[0];
      frame(stage, draft.topic, preview, draft.style, 1);
      if (sceneId) stage.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
  };
}
