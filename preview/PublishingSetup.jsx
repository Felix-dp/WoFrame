import React from 'react';
import {episodeSizes} from './episode.mjs';
import {publishingProfiles} from './publishing.mjs';

function formatSize(ratio) {
  const {width, height} = episodeSizes[ratio];
  return `${ratio} · ${width}×${height}`;
}

export function PublishingSetup({plan, ratio, onTargets, onRatio}) {
  const {destinations, videos} = plan;
  const update = next => onTargets(next.map(({profile, videoRatio, coverRatios}) =>
    ({profile, videoRatio, coverRatios})));
  return <section aria-labelledby="publishing-heading">
    <h2 id="publishing-heading">发布规格</h2>
    <fieldset>
      <legend>1. 选择发布平台和入口（可多选）</legend>
      {Object.entries(publishingProfiles).map(([profile, {label}]) => {
        const selected = destinations.some(target => target.profile === profile);
        return <label key={profile} style={{display: 'block', margin: '.25rem 0'}}>
          <input type="checkbox" checked={selected} onChange={event => update(event.target.checked
            ? [...destinations, {profile}]
            : destinations.filter(target => target.profile !== profile))} /> {label}
        </label>;
      })}
      {destinations.length > 1 && <label>主发入口{' '}
        <select value={destinations[0].profile} onChange={event => {
          const profile = event.target.value;
          update([destinations.find(target => target.profile === profile),
            ...destinations.filter(target => target.profile !== profile)]);
        }}>
          {destinations.map(({profile, label}) => <option key={profile} value={profile}>{label}</option>)}
        </select>
      </label>}
    </fieldset>
    {destinations.length > 0 && <>
      <fieldset style={{marginTop: '1rem'}}>
        <legend>2. 确认各平台的视频和封面画幅</legend>
        {destinations.map(target => {
          const change = changes => update(destinations.map(item =>
            item.profile === target.profile ? {...item, ...changes} : item));
          return <section key={target.profile} aria-label={target.label} style={{marginBottom: '.75rem'}}>
            <strong>{target.label}</strong>
            <label style={{display: 'block'}}>视频画幅{' '}
              <select value={target.videoRatio} onChange={event => change({videoRatio: event.target.value})}>
                {Object.keys(episodeSizes).map(size => <option key={size} value={size}>{formatSize(size)}</option>)}
              </select>
            </label>
            <details>
              <summary>封面 · {target.coverRatios.map(formatSize).join(' / ')}</summary>
              {Object.keys(episodeSizes).map(size => {
                const selected = target.coverRatios.includes(size);
                return <label key={size} style={{display: 'block'}}>
                  <input type="checkbox" checked={selected} disabled={selected && target.coverRatios.length === 1}
                    onChange={event => change({coverRatios: event.target.checked
                      ? [...target.coverRatios, size] : target.coverRatios.filter(item => item !== size)})} /> {formatSize(size)}
                </label>;
              })}
              <small>封面按平台发布页检查裁切后定稿。</small>
            </details>
          </section>;
        })}
      </fieldset>
      <label style={{display: 'block', margin: '1rem 0'}}>3. 选择要预览和导出的视频版本{' '}
        <select value={ratio} onChange={event => onRatio(event.target.value)}>
          {videos.map(video => <option key={video.ratio} value={video.ratio}>
            {formatSize(video.ratio)} · {video.platforms.join('、')}
          </option>)}
        </select>
      </label>
    </>}
  </section>;
}
