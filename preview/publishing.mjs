import {episodeSizes} from './episode.mjs';

export const publishingProfiles = {
  douyin: {label: '抖音 · 竖屏短视频', videoRatio: '9:16', coverRatios: ['3:4']},
  'wechat-channels': {label: '微信视频号 · 竖屏短视频', videoRatio: '9:16', coverRatios: ['3:4']},
  xiaohongshu: {label: '小红书 · 竖屏视频笔记', videoRatio: '9:16', coverRatios: ['3:4']},
  bilibili: {label: 'B 站 · 横屏视频', videoRatio: '16:9', coverRatios: ['4:3', '16:9']},
  'bilibili-vertical': {label: 'B 站 · 竖屏视频', videoRatio: '9:16', coverRatios: ['4:3', '16:9']},
  youtube: {label: 'YouTube · 常规横屏视频', videoRatio: '16:9', coverRatios: ['16:9']},
  'youtube-shorts': {label: 'YouTube Shorts', videoRatio: '9:16', coverRatios: ['9:16']},
};

export function publishingPlan(targets) {
  if (!Array.isArray(targets)) throw new Error('发布入口须为列表');
  const platforms = new Set();
  const videos = new Map();
  const destinations = targets.map(({profile, videoRatio, coverRatios}) => {
    if (!Object.hasOwn(publishingProfiles, profile) || platforms.has(profile)) {
      throw new Error(`发布入口无效或重复：${profile}`);
    }
    platforms.add(profile);
    const defaults = publishingProfiles[profile];
    const ratio = videoRatio ?? defaults.videoRatio;
    const covers = coverRatios ?? defaults.coverRatios;
    if (!Array.isArray(covers) || !covers.length ||
        [ratio, ...covers].some(value => typeof value !== 'string' || !Object.hasOwn(episodeSizes, value)) ||
        new Set(covers).size !== covers.length) {
      throw new Error(`视频或封面画幅无效：${defaults.label}`);
    }
    if (!videos.has(ratio)) {
      videos.set(ratio, {ratio, ...episodeSizes[ratio], platforms: []});
    }
    videos.get(ratio).platforms.push(defaults.label);
    return {profile, label: defaults.label, videoRatio: ratio, coverRatios: covers};
  });
  return {destinations, videos: [...videos.values()]};
}
