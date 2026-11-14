import React from 'react';
import {AbsoluteFill, Audio, Html5Video, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {episodeSizes, episodeComposition} from './episode.mjs';

function TimedOverlay({scene}) {
  const frame = useCurrentFrame();
  const cue = scene.cues?.findLast(item => item.frame <= frame);
  const caption = cue?.text ?? scene.caption;
  const screenText = scene.cues?.findLast(item => item.frame <= frame && item.screenText)?.screenText ?? scene.text;
  const visualCue = scene.cues?.findLast(item => item.frame <= frame && item.cards);
  const cards = visualCue?.cards;
  const emphasis = cue?.emphasis;
  const start = emphasis && caption ? caption.indexOf(emphasis) : -1;
  const progress = cue ? Math.min(1, (frame - cue.frame + 1) / 7) : 1;
  return <>
    {(screenText || cards) && <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center',
      padding: '10%', fontSize: 68, fontWeight: 700}}>
      {screenText}
      {cards && <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 34}}>
        {cards.map((card, index) => {
          const active = index === cards.length - 1;
          const entrance = Math.min(1, (frame - visualCue.frame + 1) / 8);
          return <div key={index} style={{padding: '14px 24px', borderRadius: 14, fontSize: 46,
            color: active ? '#182318' : '#fff', background: active ? '#d6ff81' : '#374c59',
            opacity: active ? 0.4 + 0.6 * entrance : 1,
            transform: `translateY(${active ? (1 - entrance) * 14 : 0}px)`}}>{card}</div>;
        })}
      </div>}
    </AbsoluteFill>}
    {caption && <div style={{position: 'absolute', bottom: '12%', left: '8%', right: '8%', padding: '2%',
    textAlign: 'center', background: '#101b28ee', fontSize: 44}}>
    {start < 0 ? caption : <>
      {caption.slice(0, start)}
      <mark style={{display: 'inline-block', transform: `scale(${1 + Math.sin(Math.PI * progress) * 0.12})`,
        color: '#e8ffaf', background: '#536d36', borderRadius: 7, padding: '0 .18em', fontWeight: 700}}>
        {emphasis}
      </mark>
      {caption.slice(start + emphasis.length)}
    </>}
    </div>}
  </>;
}

export function EpisodeVideo({project, assetBase, onError}) {
  const asset = name => {
    const path = name.split('/').map(encodeURIComponent).join('/');
    return assetBase ? new URL(path, assetBase).href : staticFile(name);
  };
  let from = 0;
  const base = episodeSizes[project.ratio];
  const {width, height} = episodeComposition(project);
  return <AbsoluteFill lang={project.language} style={{background: '#172638', color: '#fff', fontFamily: 'system-ui, sans-serif'}}>
    <AbsoluteFill style={{width: base.width, height: base.height, right: 'auto', bottom: 'auto',
      transform: `scale(${width / base.width}, ${height / base.height})`, transformOrigin: 'top left'}}>
    {project.bgm && <Audio src={asset(project.bgm)} volume={0.15} loop onError={() => onError?.('背景音乐加载失败')} />}
    {project.scenes.map((scene, index) => {
      const start = from;
      from += scene.frames;
      return <Sequence key={index} from={start} durationInFrames={scene.frames}>
        {scene.video && <Html5Video src={asset(scene.video)} muted={Boolean(scene.audio)}
          onError={() => onError?.(`分镜 ${index + 1} 的视频加载失败`)}
          style={{width: '100%', height: '100%', objectFit: 'contain'}} />}
        {scene.audio && <Audio src={asset(scene.audio)} onError={() => onError?.(`分镜 ${index + 1} 的音频加载失败`)} />}
        <TimedOverlay scene={scene} />
      </Sequence>;
    })}
    </AbsoluteFill>
  </AbsoluteFill>;
}
