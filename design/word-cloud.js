(() => {
  const seed = [
    ['微积分', '数学', '用导数描述变化率，用积分描述累积量。', '背景｜切线与面积问题'],
    ['唐朝', '历史', '中国古代王朝，618 年建立，907 年结束。', '背景｜都城长安'],
    ['敦煌', '历史', '河西走廊西端的城市，以莫高窟和藏经洞闻名。', '背景｜丝绸之路'],
    ['概率', '数学', '用 0 到 1 之间的数表示事件发生的可能性。', '领域｜数学'],
    ['光合作用', '科学', '植物等生物利用光能合成有机物的过程。', '领域｜生物学'],
    ['相对论', '科学', '研究时空、运动与引力关系的理论。', '背景｜爱因斯坦'],
    ['熵', '科学', '热力学中用来描述系统状态的物理量。', '领域｜热力学'],
    ['二次函数', '数学', '最高次数为二的多项式函数，图像是一条抛物线。', '领域｜代数'],
    ['丝绸之路', '历史', '连接不同地区、促进贸易和文化交流的古代交通网络。', '背景｜陆路与海路'],
    ['科举', '历史', '中国古代通过考试选拔官员的制度。', '背景｜隋唐以来'],
    ['大运河', '历史', '连接中国多个流域的人工水运网络。', '背景｜漕运与城市发展'],
    ['甲骨文', '历史', '刻写在龟甲和兽骨上的早期汉字。', '背景｜商代占卜记录'],
    ['长安', '历史', '中国古代都城之一，城址位于今天的西安一带。', '背景｜汉唐都城'],
    ['活字印刷', '历史', '用可重复排列的单字字模印刷。', '背景｜北宋毕昇'],
    ['对称', '数学', '图形在某种变换后保持原样。', '领域｜几何'],
    ['斐波那契数列', '数学', '从第三项起，每一项等于前两项之和。', '领域｜数列'],
    ['勾股定理', '数学', '直角三角形两条直角边的平方和等于斜边的平方。', '领域｜几何'],
    ['潮汐', '科学', '海水在月球和太阳引力等因素作用下发生周期性涨落。', '领域｜海洋'],
    ['地震波', '科学', '由地震产生并在地球内部或地表传播的振动。', '领域｜地球科学'],
    ['电磁感应', '科学', '穿过回路的磁通量变化时，回路中产生感应电动势。', '领域｜物理'],
    ['秦朝', '历史', '中国历史上第一个大一统王朝，前 221 年建立。', '背景｜郡县制与统一度量衡'],
    ['宋朝', '历史', '商品经济与城市生活高度发达的王朝。', '背景｜活字印刷与指南针'],
    ['明清', '历史', '1368–1912 年的两个王朝。', '背景｜海禁与白银流通'],
    ['罗马帝国', '历史', '地中海世界的古代帝国。', '背景｜道路、法律与公民权'],
    ['文艺复兴', '历史', '14–17 世纪的思想文化运动。', '背景｜从佛罗伦萨扩散到全欧'],
    ['工业革命', '历史', '机器生产取代手工劳动。', '背景｜18 世纪中叶始于英国'],
    ['长城', '历史', '横跨北方的防御工事体系。', '背景｜战国起修，明代成型'],
    ['郑和下西洋', '历史', '明代七次远航。', '背景｜1405–1433'],
    ['欧拉公式', '数学', 'e^{iπ}+1=0，连接五个基本常数。', '领域｜复分析'],
    ['素数', '数学', '只能被 1 和自身整除的大于 1 的整数。', '领域｜数论'],
    ['极限', '数学', '数列或函数趋近的某个值。', '领域｜微积分基础'],
    ['矩阵', '数学', '按行列排列的数表。', '领域｜线性代数'],
    ['排列组合', '数学', '计数问题的基本方法。', '领域｜组合数学'],
    ['椭圆', '数学', '到两定点距离之和为常数的点的轨迹。', '领域｜解析几何'],
    ['量子纠缠', '科学', '两个粒子的状态无法独立描述。', '领域｜量子力学'],
    ['黑洞', '科学', '引力强到光也无法逃逸的天体。', '背景｜2019 年首次拍到照片'],
    ['板块运动', '科学', '岩石圈板块的相对移动。', '领域｜地质学'],
    ['神经网络', '科学', '由大量节点连接而成的计算模型。', '背景｜反向传播训练'],
    ['电磁波', '科学', '电场与磁场交替变化并在空间传播。', '领域｜物理学'],
    ['免疫系统', '科学', '识别并清除外来病原体的防御网络。', '领域｜生物学'],
    ['冰川', '科学', '长期积累并缓慢流动的冰体。', '领域｜地理学'],
    ['DNA', '科学', '携带遗传信息的双螺旋分子。', '领域｜分子生物学'],
    ['海洋酸化', '科学', '海水吸收二氧化碳后 pH 下降。', '领域｜海洋化学'],
    ['天文望远镜', '科学', '收集天体辐射的观测装置。', '背景｜伽利略 1609'],
    ['大模型', '科学', '参数量巨大的神经网络。', '背景｜Transformer 架构'],
    ['芯片', '科学', '集成电路的载体。', '领域｜半导体'],
    ['核聚变', '科学', '轻核结合释放能量的过程。', '领域｜等离子体物理'],
    ['汉朝', '历史', '前 202–220 年的统一王朝。', '背景｜丝绸之路开通'],
    ['雅典', '历史', '古希腊城邦。', '背景｜民主政治的试验场'],
    ['哥白尼', '科学', '提出日心说的天文学家。', '背景｜《天体运行论》1543'],
    ['拓扑', '数学', '研究连续变形下不变的性质。', '领域｜几何拓扑'],
    ['费马大定理', '数学', 'n>2 时 xⁿ+yⁿ=zⁿ 无正整数解。', '背景｜怀尔斯 1995 证明'],
    ['印刷术', '历史', '把文字批量复制的技术。', '背景｜雕版与活字'],
    ['光合色素', '科学', '吸收光能的色素分子。', '领域｜植物生理'],
    ['素数定理', '数学', '描述素数分布密度。', '领域｜数论'],
    ['敦煌壁画', '历史', '莫高窟内的佛教绘画。', '背景｜十六国至元代'],
  ];
  const DEPTH = location.hash.includes('depth');   // #depth 开启纵深版
  const cloud = document.querySelector('.wc');
  const tip = document.querySelector('#word-tip');
  let history = [];
  try { history = JSON.parse(localStorage.getItem('woframe-topic-history') || '[]'); } catch {}
  if (!Array.isArray(history)) history = [];
  const categories = [['历史', /历史|唐朝|敦煌|丝绸|王朝|科举|甲骨|运河|秦汉|宋代|明清|三国/u],
    ['数学', /微积分|导数|数学|概率|函数|几何/u], ['科学', /科学|光合|物理|相对论|热力/u]];
  const recent = history.slice(-30).filter(name => typeof name === 'string');
  const frequency = match => recent.filter(match).length;
  let timer;
  let active;
  let leaveTimer;
  function hide() {
    clearTimeout(timer);
    clearTimeout(leaveTimer);
    active?.removeAttribute('aria-describedby');
    active = undefined;
    tip.hidden = true;
  }
  const DWELL = 3000;   // 停留 3 秒才弹词条
  function schedule(button, word, point, force) {
    clearTimeout(timer);
    clearTimeout(leaveTimer);
    if (active !== button && !tip.hidden) leaveTimer = setTimeout(() => {
      active?.removeAttribute('aria-describedby');
      active = undefined;
      tip.hidden = true;
    }, 200);
    const show = () => {
      const heading = document.createElement('strong');
      const intro = document.createElement('div');
      const context = document.createElement('small');
      active?.removeAttribute('aria-describedby');
      active = button;
      [heading.textContent, intro.textContent, context.textContent] = word;
      tip.replaceChildren(heading, intro, context);
      tip.hidden = false;
      const box = button.getBoundingClientRect();
      const {x, y} = point ?? {x: box.left + box.width / 2, y: box.top};
      tip.style.left = Math.max(12, Math.min(innerWidth - tip.offsetWidth - 12, x - tip.offsetWidth / 2)) + 'px';
      tip.style.top = (y >= tip.offsetHeight + 20 ? y - tip.offsetHeight - 12 : box.bottom + 10) + 'px';
      button.setAttribute('aria-describedby', tip.id);
    };
    if (force) show();
    else timer = setTimeout(show, DWELL);
  }
  function leave() {
    clearTimeout(timer);
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(hide, 200);
  }
  function render(hot = []) {
    hide();
    cloud.replaceChildren();
    const items = new Map(seed.map(([term, category, summary, context]) =>
      [term, {term, category, summary, context}]));
    for (const item of hot) items.set(item.term, {...item, hot: true});
    const all = [...items.values()];
    const weights = Object.fromEntries(categories.map(([category, match]) => [category,
      frequency(name => match.test(name) || all.some(item => item.category === category && name.includes(item.term)))]));
    const BOOST = {'微积分': 9, '唐朝': 8, '概率': 7, '敦煌': 6, '丝绸之路': 5.5,
      '光合作用': 5, '相对论': 4.2, '熵': 3.4, '大模型': 3, '科举': 2.6};
    const sorted = all.map(item => {
      const count = weights[item.category] ?? 0;
      const hits = frequency(name => name.includes(item.term));
      return {...item, count, hits,
        score: count * 10 + hits * 4 + (BOOST[item.term] ?? 0) + (item.hot ? 2.5 : 0)};
    }).sort((a, b) => b.score - a.score);
    const SIZES = [50, 42, 35, 29, 24, 20, 16, 13];
    const OPAC = [0.92, 0.84, 0.74, 0.64, 0.54, 0.46, 0.38, 0.3];
    sorted.slice(0, 60).forEach((item, index) => {
    const tier = Math.min(SIZES.length - 1, Math.floor(index / 6));
    const button = document.createElement('button');
    button.type = 'button';
    const word = [item.term, item.summary, item.context ?? ''];
    const label = document.createElement('span');
    label.textContent = item.term;
    button.append(label);
    button.style.setProperty('--phase', `-${((index * 3.71 + 1.2) % 9).toFixed(2)}s`);
    const h = [...item.term].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    button.style.fontSize = (SIZES[tier] + (h % 3) - 1) + 'px';
    button.style.opacity = DEPTH ? Math.min(0.92, OPAC[tier] + 0.04) : OPAC[tier];
    if (DEPTH && tier >= 5) {
      button.style.filter = `blur(${((tier - 4) * 0.36).toFixed(2)}px)`;
    } else if (tier === 7) {
      button.style.filter = 'blur(0.3px)';   // 只给最小一档一点空气感
    }
    button.className = item.count ? 'familiar' : item.hot ? 'trending' : '';
    button.onpointerenter = event => schedule(button, word, {x: event.clientX, y: event.clientY});
    button.onpointerleave = leave;
    button.onclick = event => { event.preventDefault(); schedule(button, word, null, true); };
    button.onfocus = () => schedule(button, word);
    button.onblur = hide;
    cloud.append(button);
    });
    layoutCloud();
  }

  /* 螺旋布局：按字号从大到小摆放，碰撞则换位置，摆不下就隐藏 */
  function layoutCloud() {
    const boxW = cloud.clientWidth, boxH = cloud.clientHeight;
    if (!boxW) return;
    const placed = [];
    const cx = boxW / 2, cy = boxH / 2;
    const els = [...cloud.querySelectorAll('button')];
    els.forEach((el, idx) => {
      el.style.display = '';
      el.style.left = '0px';
      el.style.top = '0px';
      const w = el.offsetWidth, h = el.offsetHeight;
      // 起始角度由词本身哈希决定：刷新稳定，分布又不规则
      let seed = 0;
      for (const ch of el.textContent) seed = (seed * 31 + ch.charCodeAt(0)) % 6283;
      let angle = seed / 1000, radius = 0, ok = false, x = 0, y = 0;
      for (let i = 0; i < 2600; i++) {
        angle += 0.34;
        radius += 1.0;
        x = cx + Math.cos(angle) * radius * 1.75 - w / 2;
        y = cy + Math.sin(angle) * radius * 0.82 - h / 2;
        if (x < 2 || y < 2 || x + w > boxW - 2 || y + h > boxH - 2) continue;
        ok = placed.every(p =>
          x > p.x + p.w + 11 || x + w + 11 < p.x || y > p.y + p.h + 8 || y + h + 8 < p.y);
        if (ok) break;
      }
      if (!ok) { el.style.display = 'none'; return; }
      el.style.left = x.toFixed(1) + 'px';
      el.style.top = y.toFixed(1) + 'px';
      placed.push({x, y, w, h});
    });
  }
  let layoutTimer;
  addEventListener('resize', () => {
    clearTimeout(layoutTimer);
    layoutTimer = setTimeout(layoutCloud, 160);
  });
  if (document.fonts?.ready) document.fonts.ready.then(() => layoutCloud());
  render();
  fetch('./trending-topics.json', {cache: 'no-cache', signal: AbortSignal.timeout(2500)})
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!Array.isArray(data?.items)) return;
      const valid = data.items.filter(item => typeof item?.term === 'string' && item.term.trim()
        && typeof item.summary === 'string' && item.summary.trim() && typeof item.category === 'string'
        && (data.demo || (item.sourceUrl && Number.isFinite(Date.parse(item.observedAt))
          && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now()))));
      render(valid.map(item => ({...item, term: item.term.trim(),
        context: data.demo ? `演示热点 · ${item.context ?? ''}` : [item.context, item.sourceName].filter(Boolean).join(' · ')})));
    })
    .catch(() => {});
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, {passive: true});
  const glass = document.querySelector('.ask');
  function positionGlassHighlight(event) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = glass.getBoundingClientRect();
    glass.style.setProperty('--glass-x', event.clientX - box.left + 'px');
    glass.style.setProperty('--glass-y', event.clientY - box.top + 'px');
  }
  glass.addEventListener('pointermove', positionGlassHighlight);
  glass.addEventListener('pointerdown', positionGlassHighlight);
  glass.addEventListener('pointerleave', () => {
    glass.style.removeProperty('--glass-x');
    glass.style.removeProperty('--glass-y');
  });
})();
