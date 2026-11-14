import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {AbsoluteFill, Audio, Html5Video, Sequence} from 'remotion';
import {validateEpisode} from './episode.mjs';

function Composition({project, asset, onError}) {
  let from = 0;
  return <AbsoluteFill style={{background: '#172638', color: '#fff', fontFamily: 'system-ui, sans-serif'}}>
    {project.bgm && <Audio src={asset(project.bgm)} volume={0.15} loop onError={() => onError('背景音乐加载失败')} />}
    {project.scenes.map((scene, index) => {
      const start = from;
      from += scene.frames;
      return <Sequence key={index} from={start} durationInFrames={scene.frames}>
        {scene.video && <Html5Video src={asset(scene.video)} muted={Boolean(scene.audio)}
          onError={() => onError(`分镜 ${index + 1} 的视频加载失败`)}
          style={{width: '100%', height: '100%', objectFit: 'contain'}} />}
        {scene.audio && <Audio src={asset(scene.audio)} onError={() => onError(`分镜 ${index + 1} 的音频加载失败`)} />}
        {scene.text && <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '10%', fontSize: 68, fontWeight: 700}}>{scene.text}</AbsoluteFill>}
        {scene.caption && <div style={{position: 'absolute', bottom: '12%', left: '8%', right: '8%', padding: '2%', textAlign: 'center', background: '#101b28ee', fontSize: 44}}>{scene.caption}</div>}
      </Sequence>;
    })}
  </AbsoluteFill>;
}

function Preview({project, url}) {
  const [error, setError] = useState('');
  const vertical = project.ratio === '9:16';
  return <section style={{margin: '2rem auto', maxWidth: vertical ? '24rem' : '64rem', padding: '0 1rem', fontFamily: 'system-ui'}}>
    <h1>{project.title}</h1>
    <p>{project.ratio} · {project.scenes.length} 镜 · {(project.duration / project.fps).toFixed(1)} 秒</p>
    {error && <p role="alert">{error}</p>}
    <Player component={Composition} inputProps={{project, asset: name => new URL(name.split('/').map(encodeURIComponent).join('/'), url).href, onError: setError}}
      compositionWidth={vertical ? 1080 : 1920} compositionHeight={vertical ? 1920 : 1080}
      durationInFrames={project.duration} fps={project.fps} controls style={{width: '100%'}}
      errorFallback={({error}) => <p role="alert">预览失败：{error.message}</p>} />
  </section>;
}

const root = createRoot(document.querySelector('#root'));
try {
  const source = new URLSearchParams(location.search).get('project') ?? '/examples/episode.json';
  const url = new URL(source, location.origin);
  if (url.origin !== location.origin || !/^\/(work|examples)\/.+\.json$/.test(url.pathname)) {
    throw new Error('请选择 public/work 或 public/examples 内的项目 JSON');
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`项目读取失败 (${response.status})`);
  root.render(<Preview project={validateEpisode(await response.json())} url={url} />);
} catch (error) {
  root.render(<p role="alert">{error.message}</p>);
}
