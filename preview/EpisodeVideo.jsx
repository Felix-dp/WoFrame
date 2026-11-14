import React from 'react';
import {AbsoluteFill, Audio, Html5Video, Sequence, staticFile} from 'remotion';

export function EpisodeVideo({project, assetBase, onError}) {
  const asset = name => {
    const path = name.split('/').map(encodeURIComponent).join('/');
    return assetBase ? new URL(path, assetBase).href : staticFile(name);
  };
  let from = 0;
  return <AbsoluteFill style={{background: '#172638', color: '#fff', fontFamily: 'system-ui, sans-serif'}}>
    {project.bgm && <Audio src={asset(project.bgm)} volume={0.15} loop onError={() => onError?.('背景音乐加载失败')} />}
    {project.scenes.map((scene, index) => {
      const start = from;
      from += scene.frames;
      return <Sequence key={index} from={start} durationInFrames={scene.frames}>
        {scene.video && <Html5Video src={asset(scene.video)} muted={Boolean(scene.audio)}
          onError={() => onError?.(`分镜 ${index + 1} 的视频加载失败`)}
          style={{width: '100%', height: '100%', objectFit: 'contain'}} />}
        {scene.audio && <Audio src={asset(scene.audio)} onError={() => onError?.(`分镜 ${index + 1} 的音频加载失败`)} />}
        {scene.text && <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '10%', fontSize: 68, fontWeight: 700}}>{scene.text}</AbsoluteFill>}
        {scene.caption && <div style={{position: 'absolute', bottom: '12%', left: '8%', right: '8%', padding: '2%', textAlign: 'center', background: '#101b28ee', fontSize: 44}}>{scene.caption}</div>}
      </Sequence>;
    })}
  </AbsoluteFill>;
}
