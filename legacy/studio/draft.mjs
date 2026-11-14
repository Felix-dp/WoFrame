const topics = [
  ['微信', '即时通信', '朋友圈', '微信支付'],
  ['微商', '社交电商', '朋友圈卖货'],
  ['微积分', '导数', '积分', '瞬时速度', '速度怎么变', '斜率'],
  ['微生物', '细菌', '发酵', '酵母'],
  ['概率', '随机', '抛硬币', '骰子', '降雨概率'],
  ['光合作用', '叶绿素', '植物怎么长'],
  ['二次函数', '抛物线', '顶点', '函数平移'],
];

export const angles = [
  {id: 'background', name: '为什么需要它', detail: '从背景和它解决的问题讲起'},
  {id: 'history', name: '它怎么发展', detail: '沿时间轴串起关键变化'},
  {id: 'derivation', name: '一步步讲明白', detail: '拆开原理、过程或推导'},
];

const topicTitles = {
  '微信': ['微信解决了什么沟通问题', '微信怎样从聊天走向多种服务', '一条微信消息是怎样送达的'],
  '微商': ['为什么有人在社交平台卖货', '社交电商的销售方式怎样演变', '从发商品到完成一笔交易'],
  '微积分': ['为什么需要描述瞬时速度', '微积分怎样从切线与面积问题发展起来', '用斜率一步步推导导数'],
  '微生物': ['为什么做面包要放酵母', '人们怎样认识到微生物的存在', '面团发酵时发生了什么'],
  '概率': ['我们为什么需要用概率描述不确定性', '概率论怎样从机会游戏问题发展起来', '一步步算出硬币正面的概率'],
  '光合作用': ['植物生长所需的物质从哪里来', '人们怎样发现光对植物生长的作用', '叶片怎样把光能转成化学能'],
  '二次函数': ['为什么一些变化可以用抛物线描述', '人们怎样认识与研究抛物线', '一步步找出抛物线的顶点'],
};

export function directionsFor(topic) {
  const titles = Object.hasOwn(topicTitles, topic) ? topicTitles[topic] : null;
  return angles.map((angle, index) => ({
    ...angle,
    name: titles?.[index] ?? angle.name,
  }));
}

const examples = {
  '微积分': {
    background: ['汽车里程除以时间可以得到平均速度。那速度表显示的瞬时速度又是怎么算的？', '把测量时间窗口缩短，从一分钟缩到一秒，平均速度可以更接近那个时刻的速度。', '当差商的极限存在时，它就是导数。导数让我们用数学描述某一瞬间的变化率。'],
    history: ['想象你要计算曲线下面积，或者找到曲线上的切线。这两类问题推动了微积分的发展。', '十七世纪，牛顿和莱布尼茨分别提出了系统的微积分方法。', '后来，极限概念被更严格地表述。今天我们用极限定义导数，也用极限理解积分。'],
    derivation: ['骑车时，十秒内走过的距离除以十秒，就是这十秒的平均速度。把十秒逐渐缩短，会发生什么？', '拿 y 等于 x 的平方举例。在 x 等于一时，向右取一个小步长 h。函数值的变化量是二 h 加 h 的平方。', '除以 h，得到平均变化率二加 h。让 h 趋近于零，就得到 x 等于一时的瞬时变化率二。'],
  },
  '概率': {
    derivation: ['抛一枚公平的硬币。你觉得接下来一定是正面吗？', '一次抛掷有两个等可能的结果。我们关心的正面只占其中一种。', '用有利结果数一除以总结果数二，得到正面朝上的概率二分之一。'],
  },
};

const diagrams = {
  '微积分': {
    history: ['17 世纪 · 切线与面积问题', '牛顿与莱布尼茨 · 建立方法', '19 世纪 · 极限理论严密化'],
    derivation: ['取两点 · x = 1 与 x = 1 + h', '求差商 · ((1 + h)² − 1) / h = 2 + h', '取极限 · h → 0，得到 2'],
    background: ['计算一段时间内的平均速度', '把时间窗口逐步缩短', '用极限描述瞬时速度'],
  },
  '概率': {derivation: ['抛一枚公平硬币', '两种等可能结果 · 正面 / 反面', '有利结果 / 全部结果 = 1 / 2']},
};

export function visualFor(labels) {
  const steps = labels.map(label => label.trim()).filter(Boolean).slice(0, 3);
  return steps.length ? {type: 'steps', steps} : {type: 'text'};
}

export function inferOpening(text) {
  if (/(?:猜|预测|你觉得|你认为).*[？?]/u.test(text)) return 'prediction-question';
  if (/想象|比如|举个例子|生活中/u.test(text)) return 'everyday-example';
  return '';
}

export const openingRules = {
  'prediction-question': '先用贴合主题的问题请观众预测，再在后续解释',
  'everyday-example': '先给观众一个贴合主题的日常情境或具体例子，再介绍概念',
};

export const revisionActions = {
  simplify: '讲简单一点',
  shorten: '缩短这一段',
  example: '换个例子',
};

export function localOpening(topic, rule) {
  if (rule === 'prediction-question') return `先猜一猜，你觉得「${topic}」会怎么解释这个问题？`;
  if (rule === 'everyday-example') {
    if (topic === '概率') return '想象你出门前看到天气预报写着降雨概率 50%。这句话该怎么理解？';
    if (topic === '微积分') return '想象你骑车下坡，速度表的数字不断变大。我们怎么描述这种变化？';
    return `先回想一个你在生活中遇到「${topic}」的场景。`;
  }
  return '';
}

export function suggest(input) {
  const query = input.normalize('NFKC').trim().toLowerCase();
  if (!query) return topics.slice(0, 3).map(([topic]) => topic);
  const ranked = [
    topic => topic === query,
    topic => topic.startsWith(query),
    topic => topic.includes(query),
    (topic, terms) => query.includes(topic) || terms.some(term => query.includes(term)),
    (_topic, terms) => query.length > 1 && terms.some(term => term.includes(query)),
  ];
  const matches = ranked.flatMap(match => topics.filter(([topic, ...terms]) => match(topic, terms)).map(([topic]) => topic));
  return [...new Set(matches)].slice(0, 5);
}

export function buildDraft({topic, angle, format, style, keywords}, opening) {
  const example = examples[topic]?.[angle];
  const middle = {
    background: '用三句话讲清楚它出现之前，人们遇到了什么问题，以及它解决了哪一部分。',
    history: '选三个关键节点。分别写下发生的时间、改变了什么，以及它和上一阶段的联系。',
    derivation: '从一个具体例子出发，写下每一步的条件和结果，再说明下一步为什么成立。',
  };
  const text = example ?? [
    `想想你上一次在哪儿遇到过「${topic}」。当时你最想弄明白什么？`,
    middle[angle] ?? middle.background,
    keywords ? `用一个包含「${keywords}」的例子检验理解。` : '用一个具体例子检验理解，再用一句话收尾。',
  ];
  return {
    topic, angle, format, style, keywords,
    isExample: Boolean(example),
    scenes: text.map((narration, index) => ({
      id: ['opening', 'explain', 'ending'][index],
      title: ['开场', '讲解', '收尾'][index],
      narration: index === 0 && opening ? `${opening} \n${narration}` : narration,
      visual: visualFor(index === 1 ? diagrams[topic]?.[angle] ?? [] : []),
    })),
  };
}
