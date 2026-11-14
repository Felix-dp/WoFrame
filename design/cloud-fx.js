/* 词云增强：靠近变形+变色、定时闪烁、背景点阵力场 */
(() => {
  const cloud = document.querySelector('.wc');
  if (!cloud) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 指针（缓动跟随） ---------- */
  const target = { x: innerWidth * 0.96, y: innerHeight * 0.94 };
  const mouse = { x: target.x, y: target.y };
  let moved = false;
  addEventListener('pointermove', e => {
    target.x = e.clientX; target.y = e.clientY; moved = true;
  }, { passive: true });

  /* ---------- 词的位置（用 offset* 避开 transform 反馈） ---------- */
  let items = [];
  function measure() {
    const base = cloud.getBoundingClientRect();
    items = [...cloud.querySelectorAll('button')].map(el => ({
      el,
      cx: base.left + el.offsetLeft + el.offsetWidth / 2,
      cy: base.top + el.offsetTop + el.offsetHeight / 2
    }));
  }
  measure();
  setInterval(measure, 500);
  addEventListener('resize', measure);

  /* ---------- 颜色 ---------- */
  const C1 = [140, 151, 141];  // 静默灰绿
  const C2 = [47, 107, 79];    // 靠近品牌绿
  const C3 = [190, 100, 64];   // 极近赭石
  const lerp = (a, b, t) => a + (b - a) * t;
  function tone(f) {
    const a = f < 0.72 ? C1 : C2, b = f < 0.72 ? C2 : C3;
    const t = f < 0.72 ? f / 0.72 : (f - 0.72) / 0.28;
    return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  }

  /* ---------- 背景点阵 ---------- */
  const cv = document.getElementById('dots');
  const ctx = cv && cv.getContext('2d');
  const DPR = Math.min(devicePixelRatio || 1, 2);
  let W = 0, H = 0, dots = [];
  function buildDots() {
    if (!ctx) return;
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dots = [];
    for (let y = 16; y < H; y += 34)
      for (let x = 16; x < W; x += 34)
        dots.push({ x, y, ph: Math.random() * 6.283 });
  }
  buildDots();
  addEventListener('resize', buildDots);

  function drawDots(t) {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    const R2 = 200, P2 = 15;
    for (const d of dots) {
      const dx = d.x - mouse.x, dy = d.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      let px = 0, py = Math.sin(d.x * 0.01 + t * 0.45 + d.ph) * 1.3, f = 0;
      if (dist < R2) {
        f = 1 - dist / R2;
        const wave = Math.sin(Math.PI * (dist / R2)) * f;
        px = (dx / (dist || 1)) * wave * P2;
        py += (dy / (dist || 1)) * wave * P2;
      }
      ctx.beginPath();
      ctx.arc(d.x + px, d.y + py, 1.25 + f * 1.1, 0, 6.283);
      ctx.fillStyle = `rgba(150,158,150,${0.16 + f * 0.22})`;
      ctx.fill();
    }
  }

  /* ---------- 主循环：靠近变形 + 变色 ---------- */
  const RADIUS = 230, PUSH = 22;
  function frame(now) {
    const t = now / 1000;
    mouse.x += (target.x - mouse.x) * 0.14;
    mouse.y += (target.y - mouse.y) * 0.14;

    for (const it of items) {
      const dx = it.cx - mouse.x, dy = it.cy - mouse.y;
      const dist = Math.hypot(dx, dy) || 1;
      const f = dist < RADIUS ? Math.pow(1 - dist / RADIUS, 1.6) : 0;
      if (f > 0.015) {
        const s = 1 + f * 0.14;
        it.el.style.transform =
          `translate(${((dx / dist) * f * PUSH).toFixed(2)}px,${((dy / dist) * f * PUSH).toFixed(2)}px) scale(${s.toFixed(3)})`;
        it.el.style.color = tone(f);
      } else {
        it.el.style.transform = '';
        it.el.style.color = '';
      }
    }
    drawDots(t);
    requestAnimationFrame(frame);
  }

  /* ---------- 定时闪烁：随机挑一个离指针远的词 ---------- */
  if (!reduced) {
    setInterval(() => {
      const idle = items.filter(it => Math.hypot(it.cx - mouse.x, it.cy - mouse.y) > RADIUS * 1.15);
      if (!idle.length) return;
      const pick = idle[Math.floor(Math.random() * idle.length)];
      pick.el.classList.add('blink');
      setTimeout(() => pick.el.classList.remove('blink'), 1200);
    }, 2500);
  }

  /* ---------- 演示模式：#demo 自动弹一个词条 ---------- */
  if (location.hash === '#demo') {
    setTimeout(() => document.querySelector('.wc button')?.click(), 1500);
  }

  requestAnimationFrame(frame);
})();
