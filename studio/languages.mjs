export const languages = {
  'zh-CN': {label: '简体中文', prompt: 'Simplified Chinese', voice: 'zh-CN-XiaoxiaoNeural'},
  'en-US': {
    label: 'English', prompt: 'English', voice: 'en-US-JennyNeural',
    titles: ['Opening', 'Explanation', 'Closing'],
    outline: ['Open with a concrete question about the topic.', 'Explain the idea with a worked example.', 'Summarize the idea in one sentence.'],
    directions: ['Why it matters', 'How it developed', 'How it works'],
    details: ['Introduce the problem it addresses.', 'Trace the main developments.', 'Walk through a concrete example.'],
  },
  'ja-JP': {
    label: '日本語', prompt: 'Japanese', voice: 'ja-JP-NanamiNeural',
    titles: ['導入', '解説', 'まとめ'],
    outline: ['テーマに関する具体的な問いから始める。', '具体例を使って考え方を説明する。', '学んだことを一文でまとめる。'],
    directions: ['背景と意義', '発展の歴史', '仕組みと手順'],
    details: ['どんな問題を解決するのかを説明する。', '主な発展を時系列でたどる。', '具体例を使って順番に説明する。'],
  },
};

export function contentLanguage(language = 'zh-CN') {
  if (!Object.hasOwn(languages, language)) throw new Error('请选择支持的内容语言。');
  return language;
}
