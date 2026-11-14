import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {episodeComposition, isEpisodePath, resolutions, validateEpisode} from './episode.mjs';
import {EpisodeVideo} from './EpisodeVideo.jsx';
import {PublishingSetup} from './PublishingSetup.jsx';
import {publishingPlan} from './publishing.mjs';

function Preview({project, url, publishing}) {
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [mp4, setMp4] = useState('');
  const exportRequest = useRef(null);
  useEffect(() => () => exportRequest.current?.abort(), []);
  const {width, height, durationInFrames, fps} = episodeComposition(project);
  const outputSize = width + '×' + height;
  useEffect(() => () => { if (mp4) URL.revokeObjectURL(mp4); }, [mp4]);

  async function exportEpisode() {
    const request = new AbortController();
    exportRequest.current = request;
    setExporting(true);
    setExportError('');
    setMp4('');
    try {
      const response = await fetch('/api/render-episode', {
        method: 'POST',
        signal: request.signal,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({path: url.pathname, project}),
      });
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('video/mp4')) {
        const failure = await response.json().catch(() => ({}));
        throw new Error(failure.error || '无法生成 MP4');
      }
      const rendered = await response.blob();
      if (!request.signal.aborted) setMp4(URL.createObjectURL(rendered));
    } catch (failure) {
      if (!request.signal.aborted) setExportError(failure.message);
    } finally {
      if (!request.signal.aborted) setExporting(false);
    }
  }
  return <section style={{margin: '2rem auto', maxWidth: `${36 * width / height}rem`, padding: '0 1rem', fontFamily: 'system-ui'}}>
    <h1>{project.title}</h1>
    <p>{project.ratio} · {project.scenes.length} 镜 · {(durationInFrames / fps).toFixed(1)} 秒 · {outputSize}</p>
    {error && <p role="alert">{error}</p>}
    <Player component={EpisodeVideo} inputProps={{project, assetBase: url.href, onError: setError}}
      compositionWidth={width} compositionHeight={height}
      durationInFrames={durationInFrames} fps={fps} controls style={{width: '100%'}}
      errorFallback={({error}) => <p role="alert">预览失败：{error.message}</p>} />
    {import.meta.env.DEV && <section style={{marginTop: '1rem'}}>
      <button type="button" onClick={exportEpisode} disabled={exporting || Boolean(error)}>生成 MP4</button>
      {exporting && <p role="status">正在渲染成片…</p>}
      {exportError && <p role="alert">{exportError}</p>}
      {mp4 && <>
        <h2>成片回看</h2>
        <video controls src={mp4} style={{width: '100%'}} />
        <a href={mp4} download={project.title.replace(/[\\/:*?"<>|]/g, '_') + (publishing ? '-' + outputSize.replace('×', 'x') : '') + (project.resolution === '1080p' ? '' : '-' + project.resolution) + '.mp4'}>下载此 MP4</a>
      </>}
    </section>}
  </section>;
}

function EpisodePage({project, url, initialTargets}) {
  const [targets, setTargets] = useState(initialTargets);
  const [resolution, setResolution] = useState(project.resolution ?? '1080p');
  const [selectedRatio, setSelectedRatio] = useState(null);
  const plan = publishingPlan(targets);
  const ratio = plan.videos.find(video => video.ratio === selectedRatio)?.ratio
    ?? plan.videos[0]?.ratio ?? project.ratio;

  function downloadProject() {
    const {duration, ...config} = project;
    const publishingTargets = plan.destinations.map(({profile, videoRatio, coverRatios}) =>
      ({profile, videoRatio, coverRatios}));
    const file = new Blob([JSON.stringify({...config, resolution, publishingTargets}, null, 2) + '\n'],
      {type: 'application/json'});
    const source = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = source;
    link.download = 'episode-publishing.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(source), 1000);
  }

  return <main style={{fontFamily: 'system-ui, sans-serif'}}>
    <div style={{maxWidth: '46rem', margin: '2rem auto', padding: '0 1rem'}}>
      <PublishingSetup plan={plan} ratio={ratio} onTargets={setTargets} onRatio={setSelectedRatio} />
      <label>导出画质 <select value={resolution} onChange={event => setResolution(event.target.value)}>
        {resolutions.map(value => <option key={value}>{value}</option>)}
      </select></label>
      <button type="button" onClick={downloadProject}>保存发布配置 JSON</button>
    </div>
    <Preview key={ratio + resolution} project={{...project, ratio, resolution}} url={url} publishing={targets.length > 0} />
  </main>;
}

const root = createRoot(document.querySelector('#root'));
try {
  const source = new URLSearchParams(location.search).get('project') ?? '/examples/episode.json';
  const url = new URL(source, location.origin);
  if (url.origin !== location.origin || !isEpisodePath(url.pathname)) {
    throw new Error('请选择 public/work 或 public/examples 内的项目 JSON');
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`项目读取失败 (${response.status})`);
  const project = validateEpisode(await response.json());
  const initialTargets = publishingPlan(project.publishingTargets ?? []).destinations;
  root.render(<EpisodePage project={project} url={url} initialTargets={initialTargets} />);
} catch (error) {
  root.render(<p role="alert">{error.message}</p>);
}
