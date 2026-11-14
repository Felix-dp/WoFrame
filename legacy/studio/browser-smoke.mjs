import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {modelSettings} from './ai.mjs';

const browser = process.argv[2];
if (!browser) throw new Error('Pass the path to Chrome or Edge.');
const liveAi = process.argv.includes('--live-ai');
const mockAi = process.argv.includes('--ai');
if (liveAi && mockAi) throw new Error('Choose either --ai or --live-ai.');
const settings = modelSettings(process.env);
if (liveAi && (!settings.url || !settings.key || !settings.model)) {
  throw new Error('Live AI requires DEEPSEEK_API_KEY or the three STUDIO_AI variables.');
}
const aiMode = liveAi || mockAi;
const sample = process.argv.includes('--sample');
const calls = [];
const fixture = mockAi ? createServer(async (request, response) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  const input = JSON.parse(JSON.parse(body).messages[1].content);
  calls.push(input);
  const output = input.action ? {narration: '把一小段时间里的路程除以时间。'}
    : input.direction ? {narrations: ['想象你在骑车。', '将路程变化除以时间变化。', '时间间隔越短，越接近瞬时速度。'], diagram: ['记录位置', '计算平均速度']}
      : {directions: ['车速表为什么有用', '计时工具怎样演变', '用路程和时间理解速度'].map(name => ({name, detail: '从零基础讲起'}))};
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({choices: [{message: {content: JSON.stringify(output)}}]}));
}) : null;
if (fixture) {
  fixture.listen(0, '127.0.0.1');
  await once(fixture, 'listening');
}
const profile = await mkdtemp(join(tmpdir(), 'studio-browser-'));
const server = spawn(process.execPath, [fileURLToPath(new URL('./server.mjs', import.meta.url))], {
  env: {...process.env, STUDIO_PORT: '0',
    DEEPSEEK_API_KEY: '',
    STUDIO_AI_URL: fixture ? `http://127.0.0.1:${fixture.address().port}/chat/completions` : liveAi ? settings.url : '',
    STUDIO_AI_KEY: fixture ? 'local-fixture' : liveAi ? settings.key : '',
    STUDIO_AI_MODEL: fixture ? 'local-fixture' : liveAi ? settings.model : '',
  },
});
let chrome;
let socket;
try {
  const [output] = await once(server.stdout, 'data');
  chrome = spawn(browser, ['--headless', '--remote-debugging-port=0', '--no-first-run',
    '--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream', `--user-data-dir=${profile}`, String(output).trim()], {stdio: 'ignore'});
  let port;
  for (let retry = 0; retry < 100 && !port; retry++) {
    await delay(100);
    port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '')).split('\n')[0];
  }
  assert.ok(port, 'Chrome debugging port');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find(entry => entry.url.startsWith(String(output).trim()));
  assert.ok(target, 'Studio tab');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await once(socket, 'open');
  await delay(1000);
  const mobile = process.argv.includes('--mobile');
  if (mobile) {
    socket.send(JSON.stringify({id: 2, method: 'Emulation.setDeviceMetricsOverride', params: {
      width: 360, height: 740, deviceScaleFactor: 2, mobile: true,
    }}));
  }
  const result = new Promise((resolve, reject) => {
    socket.addEventListener('message', ({data}) => {
      const message = JSON.parse(data);
      if (message.id !== 1) return;
      if (message.result?.exceptionDetails || message.error) reject(new Error(JSON.stringify(message)));
      else resolve(message.result.result.value);
    });
  });
  socket.send(JSON.stringify({id: 1, method: 'Runtime.evaluate', params: {
    expression: `(${aiMode ? exerciseAi : exercise})(${aiMode ? liveAi : process.argv.includes('--live-voice')}, ${aiMode ? mobile : process.argv.includes('--mp4')}, ${sample})`, awaitPromise: true, returnByValue: true,
  }}));
  const verified = await result;
  if (sample && !aiMode) {
    const outputFile = new URL(`./导数入门.${verified.extension}`, import.meta.url);
    await writeFile(outputFile, Buffer.from(verified.video, 'base64'));
    console.log(verified.summary, fileURLToPath(outputFile));
  } else {
    console.log(verified);
  }
  if (fixture) {
    assert.equal(calls[0].topic, '自行车速度');
    assert.equal(calls[1].chosenTitle, '用路程和时间理解速度');
    assert.equal(calls[1].keywords, '速度表');
    assert.equal(calls[2].action, '讲简单一点');
    assert.equal(calls[2].text, '将路程变化除以时间变化。');
  }
} finally {
  socket?.close();
  if (chrome && chrome.exitCode === null) {
    const closed = once(chrome, 'exit');
    chrome.kill();
    await closed;
  }
  server.kill();
  fixture?.close();
  await rm(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 200}).catch(() => {});
}

async function exerciseAi(live, mobile) {
  const get = id => document.getElementById(id);
  async function waitFor(check) {
    const deadline = Date.now() + (live ? 50000 : 8000);
    while (!check()) {
      if (Date.now() > deadline) throw new Error('AI workflow timed out');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }
  await waitFor(() => get('suggestions')?.childElementCount);
  await waitFor(() => get('modelStatus').textContent === '已配置 AI 写稿');
  function checkLayout() {
    if (!mobile) return;
    if (innerWidth !== 360 || document.documentElement.scrollWidth > innerWidth) {
      throw new Error('Mobile layout is wider than its 360 px viewport.');
    }
    const buttons = [...document.querySelectorAll('button')].filter(item => item.getClientRects().length);
    if (buttons.some(button => button.getBoundingClientRect().height < 44)) {
      throw new Error('A visible mobile button is shorter than 44 px.');
    }
  }
  checkLayout();
  get('topic').value = '自行车速度';
  get('topicForm').dispatchEvent(new Event('submit', {cancelable: true}));
  const initialDirections = get('angles').textContent;
  await waitFor(() => get('topicStatus').hidden);
  if (get('angles').children.length !== 3 || get('angles').textContent === initialDirections) {
    throw new Error('The provider did not supply topic-specific directions.');
  }
  get('angles').lastElementChild.click();
  checkLayout();
  get('keywords').value = '速度表';
  get('generate').click();
  await waitFor(() => get('draftNote').textContent.includes('AI 初稿'));
  checkLayout();
  const scene = get('scenes').children[1];
  const narration = scene.querySelector('[data-field=narration]');
  const original = narration.value;
  if (!live && !scene.querySelector('[data-field=steps]').value.includes('计算平均速度')) throw new Error('Missing AI diagram');
  const button = (parent, label) => [...parent.querySelectorAll('button')].find(item => item.textContent === label);
  button(scene, '讲简单一点').click();
  await waitFor(() => button(scene, '采用建议'));
  checkLayout();
  if (narration.value !== original) throw new Error('Draft changed before approval');
  button(scene, '采用建议').click();
  if (narration.value === original || !narration.value.trim()) throw new Error('Revision not applied');
  get('save').click();
  get('undo').click();
  if (get('scenes').children[1].querySelector('[data-field=narration]').value !== original) {
    throw new Error('Revision rollback failed');
  }
  return `AI suggestions, draft, revision approval and rollback passed (${live ? 'live provider' : 'local provider fixture'})`;
}

async function exercise(liveVoice, mp4, sample) {
  const get = id => document.getElementById(id);
  async function waitFor(check, label, timeout = 12000) {
    const deadline = Date.now() + timeout;
    while (!check()) {
      if (Date.now() > deadline) throw new Error(label + ': ' + get('productionStatus')?.textContent);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
  }
  await waitFor(() => get('suggestions')?.childElementCount, 'Studio initialization');
  if (mp4) await waitFor(() => !get('mp4Option').hidden, 'MP4 encoder detection');
  else get('preferMp4').checked = false;
  const artifacts = [];
  const originals = {fetch: window.fetch.bind(window)};
  const urls = new Map();
  const makeUrl = URL.createObjectURL.bind(URL);
  URL.createObjectURL = blob => {
    const url = makeUrl(blob);
    urls.set(url, blob);
    return url;
  };
  HTMLAnchorElement.prototype.click = function () {
    artifacts.push({name: this.download, blob: urls.get(this.href)});
  };
  async function checkVideo({name, blob}, audible = false) {
    if (!blob?.size || !blob.type.startsWith('video/')) throw new Error('Missing video: ' + name);
    if (mp4 && (!name.endsWith('.mp4') || blob.type !== 'video/mp4')) throw new Error('Expected MP4, got ' + name);
    const video = document.createElement('video');
    const url = makeUrl(blob);
    video.src = url;
    await waitFor(() => video.readyState >= 2 || video.error, 'Decode ' + name);
    if (!video.videoWidth || video.error) throw new Error('Invalid video: ' + name);
    if (audible) {
      const context = new AudioContext();
      try {
        const analyser = context.createAnalyser();
        context.createMediaElementSource(video).connect(analyser);
        await context.resume();
        await video.play();
        const samples = new Float32Array(analyser.fftSize);
        await waitFor(() => {
          analyser.getFloatTimeDomainData(samples);
          return samples.some(sample => Math.abs(sample) > 0.01);
        }, 'Decode audible samples in ' + name, 8000);
      } finally {
        video.pause();
        await context.close();
      }
    }
    URL.revokeObjectURL(url);
    return name + ' (' + blob.size + ' bytes)';
  }
  const topic = get('topic');
  topic.value = '微';
  topic.dispatchEvent(new Event('input', {bubbles: true}));
  if (![...get('suggestions').children].some(button => button.textContent === '微商')) throw new Error('Missing autocomplete');
  [...get('suggestions').children].find(button => button.textContent === '微积分').click();
  get('angles').lastElementChild.click();
  get('generate').click();
  await waitFor(() => get('draftTitle').textContent === '微积分' && !get('generate').disabled, 'Draft');
  if (sample) {
    get('voiceDownload').click();
    await waitFor(() => artifacts.length === 1, 'Sample export', 120000);
    const artifact = artifacts[0];
    const summary = await checkVideo(artifact, true);
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(artifact.blob);
    });
    return {summary, extension: artifact.name.endsWith('.mp4') ? 'mp4' : 'webm', video: data};
  }
  for (const field of get('scenes').querySelectorAll('[data-field=narration]')) field.value = '示例。';
  const diagram = get('scenes').children[1].querySelector('[data-field=steps]');
  if (!diagram.value.includes('求差商')) throw new Error('Missing draft diagram');
  diagram.value = '取两点\n求差商\n取极限';
  get('save').click();
  if (get('scenes').children[1].querySelector('[data-field=steps]').value !== diagram.value) throw new Error('Diagram edit not saved');
  get('animationDownload').click();
  await waitFor(() => artifacts.length === 1, 'Animation download', 28000);
  const animation = await checkVideo(artifacts[0]);
  get('scenes').children[1].querySelector('[data-field=steps]').value = '取两点\n计算斜率\n取极限';
  get('animationDownload').click();
  await waitFor(() => artifacts.length === 2, 'Animation revision', 24000);
  if (!get('productionStatus').textContent.includes('新渲染 1 镜，复用 2 镜')) throw new Error('Unexpected cache reuse');
  const revision = await checkVideo(artifacts[1]);
  const offline = new OfflineAudioContext(1, 48000 / 3, 48000);
  const tone = offline.createOscillator();
  tone.connect(offline.destination);
  tone.start();
  const sound = (await offline.startRendering()).getChannelData(0);
  const wav = new ArrayBuffer(44 + sound.length * 2);
  const header = new DataView(wav);
  for (const [offset, marker] of [[0, 'RIFF'], [8, 'WAVE'], [12, 'fmt '], [36, 'data']]) {
    [...marker].forEach((letter, index) => header.setUint8(offset + index, letter.charCodeAt(0)));
  }
  for (const [offset, value] of [[4, wav.byteLength - 8], [16, 16], [24, 48000], [28, 96000], [40, sound.length * 2]]) {
    header.setUint32(offset, value, true);
  }
  for (const [offset, value] of [[20, 1], [22, 1], [32, 2], [34, 16]]) header.setUint16(offset, value, true);
  sound.forEach((sample, index) => header.setInt16(44 + index * 2, sample * 12000, true));
  if (!liveVoice) window.fetch = (path, options) => path === '/api/voice'
    ? Promise.resolve(new Response(wav, {headers: {'Content-Type': 'audio/wav'}}))
    : originals.fetch(path, options);
  if (liveVoice) {
    const lines = ['猜猜速度怎样变化。', '把路程除以时间，就得到平均速度。', '时间越短，越接近瞬时速度。'];
    [...get('scenes').querySelectorAll('[data-field=narration]')].forEach((field, index) => { field.value = lines[index]; });
  }
  get('voiceDownload').click();
  await waitFor(() => artifacts.length === 3, 'Narrated animation download', liveVoice ? 55000 : 12000);
  const narrated = await checkVideo(artifacts[2], true);
  navigator.mediaDevices.getUserMedia = async () => {
    const fixture = document.createElement('canvas');
    fixture.width = 320;
    fixture.height = 180;
    const paint = fixture.getContext('2d');
    const stream = fixture.captureStream(24);
    const context = new AudioContext();
    const source = context.createOscillator();
    const output = context.createMediaStreamDestination();
    source.connect(output);
    source.start();
    const track = output.stream.getAudioTracks()[0];
    stream.addTrack(track);
    await context.resume();
    let counter = 0;
    function draw() {
      if (stream.getVideoTracks()[0].readyState === 'ended') {
        context.close();
        return;
      }
      paint.fillStyle = counter++ % 2 ? '#1a5' : '#135';
      paint.fillRect(0, 0, 320, 180);
      requestAnimationFrame(draw);
    }
    draw();
    return stream;
  };
  get('format').value = 'presenter';
  get('generate').click();
  await waitFor(() => !get('presenterTools').hidden, 'Presenter mode');
  const selector = get('takeScene');
  for (const item of selector.options) {
    selector.value = item.value;
    selector.dispatchEvent(new Event('change'));
    get('record').click();
    await waitFor(() => !get('stopRecord').disabled, 'Start camera');
    await new Promise(resolve => setTimeout(resolve, 700));
    get('stopRecord').click();
    await waitFor(() => !get('record').disabled && !get('presenterDownload').disabled, 'Save take');
  }
  const inputFile = new File([artifacts[2].blob], artifacts[2].name, {type: artifacts[2].blob.type});
  const transfer = new DataTransfer();
  transfer.items.add(inputFile);
  selector.value = 'explain';
  selector.dispatchEvent(new Event('change'));
  get('upload').files = transfer.files;
  get('upload').dispatchEvent(new Event('change', {bubbles: true}));
  await waitFor(() => get('productionStatus').textContent.includes('保存视频'), 'Save uploaded replacement');
  get('presenterDownload').click();
  if (artifacts.at(-1).name !== inputFile.name) throw new Error('Upload did not replace the selected take');
  artifacts.pop();
  if (get('presenterExport').disabled) throw new Error('Presenter export unavailable');
  get('presenterExport').click();
  await waitFor(() => artifacts.length === 4, 'Presenter download', 55000);
  const presenter = await checkVideo(artifacts[3], true);
  const first = () => get('scenes').querySelector('[data-field=narration]');
  first().value = '比如，你出门前遇到一个生活中的问题。';
  get('learnOpening').checked = true;
  get('save').click();
  if (!get('preferenceText').textContent.includes('日常情境')) throw new Error('Opening preference not inferred');
  const frame = document.createElement('iframe');
  frame.src = location.href;
  document.body.append(frame);
  const fresh = id => frame.contentDocument.getElementById(id);
  await waitFor(() => fresh('applyPreference')?.checked && fresh('preferenceText').textContent.includes('日常情境'), 'Reload preference');
  await waitFor(() => fresh('takeCount')?.textContent.includes('2/3'), 'Restore saved presenter takes');
  fresh('takeScene').value = 'explain';
  fresh('takeScene').dispatchEvent(new Event('change'));
  if (fresh('presenterDownload').disabled) throw new Error('Restored take cannot be downloaded');
  fresh('deleteTake').click();
  await waitFor(() => fresh('takeCount').textContent.includes('1/3') && fresh('presenterDownload').disabled, 'Delete saved take');
  async function newProbabilityDraft() {
    fresh('topic').value = '概率';
    fresh('topicForm').dispatchEvent(new Event('submit', {cancelable: true}));
    fresh('angles').lastElementChild.click();
    fresh('generate').click();
    await waitFor(() => !fresh('generate').disabled && fresh('draftTitle').textContent === '概率', 'New probability draft');
    return [...fresh('scenes').querySelectorAll('[data-field=narration]')].map(field => field.value);
  }
  const withPreference = await newProbabilityDraft();
  if (!withPreference[0].startsWith('想象你出门前')) throw new Error('Preference did not transfer');
  fresh('applyPreference').checked = false;
  fresh('applyPreference').dispatchEvent(new Event('change'));
  const withoutPreference = await newProbabilityDraft();
  if (!withoutPreference[0].startsWith('抛一枚') || withPreference.slice(1).join() !== withoutPreference.slice(1).join()) {
    throw new Error('Unexpected effect of disabling preference');
  }
  return [animation, revision, narrated, presenter, 'Both voiced exports contain audible samples', 'Presenter takes restored and deleted', 'Opening preference persists and affects only a new opening'];
}
