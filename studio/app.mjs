import {buildDraft, directionsFor, inferOpening, localOpening, openingRules, revisionActions, suggest, visualFor} from './draft.mjs';
import {languages} from './languages.mjs';
import {download, frame, setupMedia} from './media.mjs';

const get = id => document.getElementById(id);
const input = get('topic');
const stateKey = 'kaijiang-studio-v1';
const state = JSON.parse(localStorage.getItem(stateKey) ?? '{}');
let topic = '';
let angle = '';
let chosenTitle = '';
let topicRequest;
let draftRequest;
const languageSelect = get('contentLanguage');
for (const [id, {label}] of Object.entries(languages)) languageSelect.add(new Option(label, id));
let draft = state.draft;
if (draft?.language && Object.hasOwn(languages, draft.language)) languageSelect.value = draft.language;
let previous = state.previous;
const renderMedia = setupMedia(get, editedDraft);

function renderStyle() {
  frame(get('stylePreview'), topic || '知识讲解', {
    title: '讲解示例',
    narration: '先从一个生活中的例子讲起。',
  }, get('style').value, 0.35);
}

function persist() {
  localStorage.setItem(stateKey, JSON.stringify({...state, draft, previous}));
}

function choice(label, action, detail) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (detail) {
    const caption = document.createElement('small');
    caption.textContent = detail;
    button.append(caption);
  }
  button.addEventListener('click', action);
  return button;
}

function renderSuggestions() {
  const query = input.value.trim();
  const options = suggest(query);
  if (query && !options.includes(query)) options.push(query);
  get('suggestions').replaceChildren(...options.map(name =>
    choice(name === query ? `用「${name}」找方向` : name, () => selectTopic(name))));
}

async function ask(path, data, signal) {
  const response = await fetch(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({modelId: get('writingModel').value || undefined, language: languageSelect.value, ...data}),
    signal,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'AI 暂时无法生成，可以稍后重试。');
  return payload.data;
}

function renderAngles(options) {
  const cards = options.map(option => choice(option.name, event => {
    draftRequest?.abort();
    angle = option.id;
    chosenTitle = option.name;
    for (const card of cards) card.setAttribute('aria-pressed', String(card === event.currentTarget));
    get('setup').hidden = false;
  }, option.detail));
  for (const card of cards) card.setAttribute('aria-pressed', 'false');
  get('angles').replaceChildren(...cards);
}

async function selectTopic(name) {
  if (!name) return;
  topicRequest?.abort();
  draftRequest?.abort();
  const request = new AbortController();
  topicRequest = request;
  topic = name;
  renderStyle();
  angle = '';
  input.value = name;
  get('suggestions').replaceChildren();
  get('setup').hidden = true;
  get('angles').hidden = false;
  renderAngles(directionsFor(name, languageSelect.value));
  const status = get('topicStatus');
  status.hidden = false;
  status.textContent = '正在找适合这个主题的讲法…';
  try {
    const options = await ask('/api/angles', {topic: name}, request.signal);
    if (!request.signal.aborted && options && !angle) renderAngles(options);
    if (!request.signal.aborted) status.hidden = true;
  } catch (error) {
    if (!request.signal.aborted) status.textContent = `${error.message} 可以先选上面的方向。`;
  }
}

function revisionControls(area, wrapper, draftTopic, language) {
  const controls = document.createElement('div');
  controls.className = 'row';
  const result = document.createElement('div');
  result.setAttribute('aria-live', 'polite');
  for (const [action, label] of Object.entries(revisionActions)) {
    controls.append(choice(label, async () => {
      const original = area.value;
      if (!original.trim()) {
        result.textContent = '请先写下这一段的内容。';
        return;
      }
      for (const button of controls.children) button.disabled = true;
      result.textContent = '正在生成改写建议…';
      try {
        const proposed = await ask('/api/revise', {topic: draftTopic, action, text: original, language: language ?? 'zh-CN'});
        if (!wrapper.isConnected) return;
        if (!proposed) {
          result.textContent = 'AI 改稿尚未配置，可以直接修改这段文字。';
          return;
        }
        const before = document.createElement('p');
        const after = document.createElement('p');
        before.textContent = `原稿 · ${original}`;
        after.textContent = `建议 · ${proposed}`;
        result.replaceChildren(before, after, choice('采用建议', () => {
          if (area.value !== original) {
            result.textContent = '这一段已修改，请基于当前文字重新生成建议。';
            return;
          }
          area.value = proposed;
          area.dispatchEvent(new Event('input'));
          result.textContent = '已应用到当前分镜。保存后可以回退。';
        }), choice('保留原稿', () => result.replaceChildren()));
      } catch (error) {
        result.textContent = error.message;
      } finally {
        for (const button of controls.children) button.disabled = false;
      }
    }));
  }
  wrapper.append(controls, result);
}

function renderDraft() {
  get('editor').hidden = !draft;
  renderMedia(draft);
  if (!draft) return;
  get('draftTitle').textContent = draft.topic;
  get('draftNote').textContent = [
    draft.isGenerated ? 'AI 初稿，请校对事实和术语。'
      : draft.isExample ? '示例讲稿，可直接改写。' : '分镜提纲，请补充具体内容。',
    draft.format === 'presenter' ? '真人口播' : '动画讲解',
    languages[draft.language ?? 'zh-CN']?.label,
    {paper: '白板图解', chalk: '课堂黑板', cards: '简洁卡片'}[draft.style],
  ].join(' · ');
  get('undo').disabled = !previous;
  get('learnOpening').checked = false;
  get('preference').hidden = !state.opening;
  get('applyPreference').checked = state.openingEnabled !== false;
  get('preferenceText').textContent = state.opening ? `${openingRules[state.opening]}。` : '';
  get('scenes').replaceChildren(...draft.scenes.map(scene => {
    const wrapper = document.createElement('div');
    wrapper.className = 'scene';
    wrapper.dataset.scene = scene.id;
    const label = document.createElement('label');
    const area = document.createElement('textarea');
    area.value = scene.narration;
    area.rows = 3;
    area.dataset.field = 'narration';
    area.addEventListener('input', () => renderMedia(editedDraft()));
    label.append(scene.title, area);
    wrapper.append(label);
    revisionControls(area, wrapper, draft.topic, draft.language);
    if (draft.format === 'animation') {
      const diagram = document.createElement('label');
      const steps = document.createElement('textarea');
      steps.rows = 3;
      steps.dataset.field = 'steps';
      steps.placeholder = '每行一个步骤，最多三步。留空显示旁白。';
      steps.value = scene.visual?.steps?.join('\n') ?? '';
      steps.addEventListener('input', () => renderMedia(editedDraft()));
      diagram.append('画面步骤', steps);
      wrapper.append(diagram, choice('预览这一镜', () => renderMedia(editedDraft(), scene.id)));
    }
    return wrapper;
  }));
}

function editedDraft() {
  const cards = get('scenes').children;
  return {...draft, scenes: draft.scenes.map((scene, index) => {
    const card = cards[index];
    const steps = card.querySelector('[data-field=steps]');
    return {
      ...scene,
      narration: card.querySelector('[data-field=narration]').value,
      visual: steps ? visualFor(steps.value.split('\n')) : scene.visual,
    };
  })};
}

input.addEventListener('input', event => {
  if (event.isComposing) return;
  topicRequest?.abort();
  draftRequest?.abort();
  get('topicStatus').hidden = true;
  get('angles').hidden = true;
  get('setup').hidden = true;
  renderSuggestions();
});
input.addEventListener('compositionend', renderSuggestions);
languageSelect.addEventListener('change', () => { if (topic) selectTopic(topic); });
get('topicForm').addEventListener('submit', event => {
  event.preventDefault();
  selectTopic(input.value.trim());
});
get('generate').addEventListener('click', async () => {
  const request = new AbortController();
  draftRequest = request;
  const button = get('generate');
  const status = get('generationStatus');
  const settings = {topic, angle, language: languageSelect.value, format: get('format').value, style: get('style').value, keywords: get('keywords').value.trim()};
  const opening = state.openingEnabled === false ? undefined : state.opening;
  button.disabled = true;
  status.textContent = '正在写讲稿…';
  let result;
  try {
    result = await ask('/api/draft', {...settings, chosenTitle, opening}, request.signal);
    status.textContent = result ? '' : '当前使用本地示例或提纲。';
  } catch (error) {
    if (request.signal.aborted) return;
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
  if (request.signal.aborted) return;
  previous = draft;
  draft = result ?? buildDraft(settings, settings.language === 'zh-CN' ? localOpening(settings.topic, opening) : undefined);
  draft.projectId = crypto.randomUUID();
  try {
    const key = 'woframe-topic-history';
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const history = Array.isArray(stored) ? stored : [];
    localStorage.setItem(key, JSON.stringify([...history.slice(-29), settings.topic]));
  } catch {
    // Topic suggestions are optional when browser storage is unavailable.
  }
  persist();
  renderDraft();
  get('status').textContent = '';
  get('editor').scrollIntoView({behavior: 'smooth'});
});
get('save').addEventListener('click', () => {
  const edited = editedDraft();
  const opening = edited.scenes[0].narration.trim();
  const learn = get('learnOpening').checked;
  if (learn) {
    const rule = opening !== draft.scenes[0].narration.trim() && inferOpening(opening);
    if (!rule) {
      get('status').textContent = '试着加一个请观众猜测的问题，或用「想象」引入一个生活例子。';
      return;
    }
    state.opening = rule;
    state.openingEnabled = true;
  }
  previous = draft;
  draft = edited;
  persist();
  renderDraft();
  get('status').textContent = '已保存到这台设备。';
});
get('applyPreference').addEventListener('change', event => {
  state.openingEnabled = event.currentTarget.checked;
  persist();
});
get('forget').addEventListener('click', () => {
  delete state.opening;
  persist();
  renderDraft();
  get('status').textContent = '已清除开场偏好。';
});
get('undo').addEventListener('click', () => {
  if (!previous) return;
  [draft, previous] = [previous, draft];
  persist();
  renderDraft();
  get('status').textContent = '已切换版本。';
});
get('export').addEventListener('click', () => {
  const content = editedDraft().scenes.map(scene => `${scene.title}\n${scene.narration}`).join('\n\n');
  download(new Blob([content], {type: 'text/plain;charset=utf-8'}), `${draft.topic}-讲稿.txt`);
});

get('style').addEventListener('change', renderStyle);
renderStyle();
renderSuggestions();
renderDraft();

const entry = new URLSearchParams(location.search);
const initialTopic = entry.get('topic')?.trim().slice(0, 120);
if (initialTopic) {
  get('keywords').value = entry.get('cues')?.slice(0, 100) ?? '';
  void selectTopic(initialTopic);
}

fetch('/api/status')
  .then(response => {
    if (!response.ok) throw new Error('Status unavailable');
    return response.json();
  })
  .then(({aiConfigured, mp4Available, models = []}) => {
    const select = get('writingModel');
    for (const {id, label} of models) select.add(new Option(label, id));
    select.disabled = !models.length;
    get('modelStatus').textContent = aiConfigured ? '已配置 AI 写稿' : '本地示例模式';
    get('mp4Option').hidden = !mp4Available;
  })
  .catch(() => {
    get('modelStatus').textContent = '服务状态暂不可用';
  });
