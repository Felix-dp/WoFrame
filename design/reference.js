const get = id => document.getElementById(id);
const idea = get('idea');
const preview = get('local-preview');
const status = get('reference-status');
const bubbles = [...document.querySelectorAll('.bubble')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const glass = get('topic-box');
function positionGlassHighlight(event) {
  if (reducedMotion.matches) return;
  const bounds = glass.getBoundingClientRect();
  glass.style.setProperty('--glass-x', `${event.clientX - bounds.left}px`);
  glass.style.setProperty('--glass-y', `${event.clientY - bounds.top}px`);
}
glass.addEventListener('pointermove', positionGlassHighlight);
glass.addEventListener('pointerdown', positionGlassHighlight);
glass.addEventListener('pointerleave', () => {
  glass.style.removeProperty('--glass-x');
  glass.style.removeProperty('--glass-y');
});
let reference;
let previewUrl;
idea.value = new URLSearchParams(location.search).get('topic') ?? '';
for (const link of document.querySelectorAll('.home-link')) {
  link.addEventListener('click', () => { link.search = new URLSearchParams({topic: idea.value}); });
}

function clearReference() {
  reference = undefined;
  preview.removeAttribute('src');
  preview.load();
  preview.hidden = true;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  get('remove').hidden = true;
  get('video-file').value = '';
}

get('video-file').onchange = event => {
  const file = event.currentTarget.files[0];
  if (!file) return;
  clearReference();
  get('video-link').value = '';
  reference = {kind: 'file', name: file.name};
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  preview.hidden = false;
  get('remove').hidden = false;
  status.textContent = '正在读取视频…';
};
preview.onloadeddata = () => {
  if (reference?.kind === 'file') status.textContent = `已读取 ${reference.name}。`;
};
preview.onerror = () => {
  clearReference();
  status.textContent = '浏览器无法读取这段视频，请试试 MP4 或 WebM。';
};

get('link-form').onsubmit = event => {
  event.preventDefault();
  const raw = get('video-link').value.match(/https?:\/\/[^\s<>，。；）]+/u)?.[0];
  let url;
  try { url = raw && new URL(raw); } catch {}
  const hosts = ['douyin.com', 'bilibili.com', 'b23.tv', 'youtube.com', 'youtu.be', 'channels.weixin.qq.com', 'weixin.qq.com'];
  if (!url || url.username || url.password || !hosts.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
    status.textContent = '请粘贴支持的平台视频链接，或使用本地视频文件。';
    return;
  }
  clearReference();
  reference = {kind: 'link', url: url.href};
  status.textContent = '链接已添加。';
  get('remove').hidden = false;
};
get('remove').onclick = () => {
  clearReference();
  get('video-link').value = '';
  status.textContent = '已移除参考。';
};
for (const bubble of bubbles) {
  bubble.onclick = () => bubble.setAttribute('aria-pressed', String(bubble.getAttribute('aria-pressed') !== 'true'));
}
const field = document.querySelector('.bubble-field');
field.onpointermove = event => {
  if (reducedMotion.matches) return;
  for (const bubble of bubbles) {
    const box = bubble.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - box.left - box.width / 2, event.clientY - box.top - box.height / 2);
    const strength = Math.max(0, 1 - distance / 95);
    bubble.style.setProperty('--near', strength);
    bubble.classList.toggle('near', strength > .35);
  }
};
field.onpointerleave = () => {
  for (const bubble of bubbles) {
    bubble.style.removeProperty('--near');
    bubble.classList.remove('near');
  }
};
function selectedStyles() {
  return bubbles.filter(bubble => bubble.getAttribute('aria-pressed') === 'true').map(bubble => bubble.textContent);
}
function changeStep(topic) {
  const box = get('topic-box');
  const before = box.getBoundingClientRect();
  get('reference-step').hidden = topic;
  get('topic-step').hidden = !topic;
  document.body.classList.toggle('topic-active', topic);
  document.documentElement.scrollTop = 0;
  const after = box.getBoundingClientRect();
  if (!reducedMotion.matches) box.animate([
    {transform: `translate(${before.left - after.left}px,${before.top - after.top}px)`},
    {transform: 'none'},
  ], {duration: 500, easing: 'cubic-bezier(.22,.8,.24,1)'});
  if (topic) {
    const chosen = selectedStyles();
    get('selection-summary').textContent = [reference?.name ?? (reference?.kind === 'link' ? '已添加参考链接' : ''),
      chosen.join('、')].filter(Boolean).join(' · ') || '使用默认讲法。';
    idea.focus({preventScroll: true});
  }
}
get('next').onclick = () => changeStep(true);
get('back').onclick = () => changeStep(false);
get('show-inspiration').onclick = async () => {
  const list = get('inspiration');
  let topics = ['微积分', '敦煌', '光合作用'];
  try {
    const response = await fetch('trending-topics.json', {signal: AbortSignal.timeout(2000)});
    if (response.ok) {
      const data = await response.json();
      const candidates = data.items.filter(item => typeof item.term === 'string'
        && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now()));
      if (candidates.length) topics = candidates.slice(0, 3).map(item => item.term);
    }
  } catch {}
  list.replaceChildren(...topics.map(topic => {
    const button = document.createElement('button');
    button.className = 'btn';
    button.textContent = topic;
    button.onclick = () => { idea.value = topic; idea.focus(); };
    return button;
  }));
  list.hidden = false;
};
for (const example of document.querySelectorAll('.example')) {
  example.onclick = () => {
    const choices = example.dataset.style.split(',');
    for (const bubble of bubbles) bubble.setAttribute('aria-pressed', String(choices.includes(bubble.textContent)));
    if (!reference || reference.kind === 'example') reference = {kind: 'example', name: example.parentElement.querySelector('h3').textContent};
    changeStep(true);
  };
}
get('open-studio').onclick = () => {
  if (!idea.value.trim()) {
    idea.focus();
    return;
  }
  const query = new URLSearchParams({topic: idea.value.trim(), cues: selectedStyles().join('、')});
  sessionStorage.setItem('woframe-reference', JSON.stringify(reference ?? null));
  location.href = '/?' + query;
};
