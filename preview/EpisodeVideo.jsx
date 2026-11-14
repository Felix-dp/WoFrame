import React from 'react';
import {AbsoluteFill, Audio, Html5Video, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MotionBoard} from './MotionBoard.jsx';
import {ease, isBoard, palettes, resizesSpeaker, reveal, sceneTransition, speakerLayout, videoTimeline} from './motion.mjs';

function EpisodeScene({scene, previous, themed, asset, onError, index}) {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const portrait = height > width * 1.2;
  const scale = Math.min(width, height);
  const transition = sceneTransition(previous, scene, fps);
  const crossing = frame < transition.frames;
  const progress = crossing ? ease(frame + 1, 0, transition.frames) : 1;
  const moving = transition.type === 'slide' && crossing;
  const pip = scene.motion?.speaker === 'pip';
  const sharedTitle = previous && previous.text === scene.text && isBoard(previous);
  const enter = reveal(frame + 1, scene.frames, fps, 0, 0.28);
  const resizing = resizesSpeaker(previous, scene);
  // A shrinking video sweeps across the layout before it reaches its dock.
  const boardOpacity = pip && resizing
    ? ease(frame, Math.min(Math.ceil(fps * 0.28), Math.max(0, scene.frames - 2)),
      Math.min(fps * 0.16, Math.max(1, scene.frames - 1 - Math.ceil(fps * 0.28))))
    : progress;
  const compatibleBoards = (previous?.motion?.speaker === 'pip') === pip;

  return <>
    {isBoard(scene) && <>
      {crossing && compatibleBoards && <MotionBoard scene={previous} frame={previous.frames - 1} themed={themed}/>}
      <AbsoluteFill style={{opacity: boardOpacity, transform: moving
        ? `translateX(${(pip ? -4 : 4) * (1 - progress)}%)` : undefined}}>
        <MotionBoard scene={scene} frame={frame} themed={themed} settledTitle={sharedTitle} previous={sharedTitle ? previous : undefined}/>
      </AbsoluteFill>
    </>}
    {scene.audio && <Audio src={asset(scene.audio)} onError={() => onError?.(`分镜 ${index + 1} 的音频加载失败`)}/>}
    {scene.text && !isBoard(scene) && <div style={{
      position: 'absolute', zIndex: 2, left: '7%', top: '10%', maxWidth: '74%', padding: '0.6em 0.8em',
      borderRadius: scale * 0.015, background: '#101923e8', color: '#fff', fontSize: scale * 0.05,
      fontWeight: 700, opacity: enter, transform: `translateY(${(1 - enter) * 16}px)`,
    }}>{scene.text}</div>}
    {scene.caption && <div style={{position: 'absolute', zIndex: 2, bottom: portrait ? '7%' : '8%', left: '7%', right: '7%', textAlign: 'center'}}>
      <span style={{display: 'inline-block', maxWidth: '100%', padding: '0.24em 0.6em', color: '#fff',
        background: '#101923ed', borderRadius: '0.24em', fontSize: scale * 0.039, lineHeight: 1.2,
        fontWeight: 550, textWrap: 'balance', overflowWrap: 'anywhere'}}>{scene.caption}</span>
    </div>}
  </>;
}

function SpeakerVideo({run, shots, themed, asset, onError, pipShape}) {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const current = shots.findLast(shot => shot.from <= run.from + frame);
  const {scene, previous, index} = current;
  const pip = scene.motion?.speaker === 'pip';
  const enter = reveal(run.from + frame - current.from + 1, scene.frames, fps, 0, 0.28);
  const resizeSpeaker = resizesSpeaker(previous, scene);
  const {size, right, bottom} = speakerLayout(width, height);
  const insetWeight = resizeSpeaker ? (pip ? enter : 1 - enter) : Number(pip);
  const crop = (pip ? scene : previous)?.motion?.pipCrop;
  const x = 50 + ((crop?.x ?? 50) - 50) * insetWeight;
  const y = 50 + ((crop?.y ?? 50) - 50) * insetWeight;
  const position = `${x}% ${y}%`;
  const zoom = 1 + ((crop?.zoom ?? 1) - 1) * insetWeight;
  const videoStyle = {
    position: 'absolute', overflow: 'hidden', width: width - (width - size) * insetWeight,
    height: height - (height - size) * insetWeight,
    right: right * insetWeight, bottom: bottom * insetWeight,
    borderRadius: `${(pipShape === 'circle' ? 50 : 11) * insetWeight}%`,
    boxShadow: insetWeight > 0 ? `0 0 0 ${2 * insetWeight}px ${themed.border}` : undefined,
    opacity: pip && !previous?.video ? enter : 1,
  };

  return <div style={{...videoStyle, zIndex: 1}}>
    <Html5Video src={asset(run.video)} trimBefore={run.trimBefore} muted={run.muted}
      onError={() => onError?.(`分镜 ${index + 1} 的视频加载失败`)}
      style={{width: '100%', height: '100%', objectFit: pip || insetWeight > 0 ? 'cover' : 'contain',
        objectPosition: position, transformOrigin: position, transform: `scale(${zoom})`}}/>
  </div>;
}

export function EpisodeVideo({project, assetBase, onError}) {
  const asset = name => {
    const path = name.split('/').map(encodeURIComponent).join('/');
    return assetBase ? new URL(path, assetBase).href : staticFile(name);
  };
  const themed = palettes[project.theme ?? 'ink'];
  const {shots, runs} = videoTimeline(project.scenes);
  return <AbsoluteFill style={{background: themed.background, fontFamily: 'system-ui, sans-serif', overflow: 'hidden'}}>
    {project.bgm && <Audio src={asset(project.bgm)} volume={0.15} loop onError={() => onError?.('背景音乐加载失败')}/>}
    {shots.map(({scene, previous, from, index}) => <Sequence key={index} from={from} durationInFrames={scene.frames} layout="none">
      <EpisodeScene scene={scene} previous={previous} themed={themed}
        asset={asset} onError={onError} index={index}/>
    </Sequence>)}
    {runs.map(run => <Sequence key={run.from} from={run.from} durationInFrames={run.frames} layout="none">
      <SpeakerVideo run={run} shots={shots} themed={themed} asset={asset} onError={onError}
        pipShape={project.preferences?.pipShape}/>
    </Sequence>)}
  </AbsoluteFill>;
}
