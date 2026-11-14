import React from 'react';
import {AbsoluteFill, Audio, Html5Video, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MotionBoard} from './MotionBoard.jsx';
import {PaperCollage} from './PaperCollage.jsx';
import {IllustratedBoard} from './IllustratedBoard.jsx';
import {ease, isBoard, palettes, resizesSpeaker, reveal, sceneTransition, speakerLayout, videoTimeline} from './motion.mjs';

function CueCards({cue, frame, size, steady, themed}) {
  const enter = steady ? 1 : ease(frame, cue.frame, 8);
  return <div style={{display: 'grid', gridTemplateColumns: `repeat(${cue.cards.length}, minmax(0, 1fr))`,
    gap: size * 0.22, width: '100%'}}>
    {cue.cards.map((card, index) => {
      const latest = index === cue.cards.length - 1;
      return <div key={index} style={{padding: size * 0.25, borderRadius: size * 0.22,
        display: 'grid', placeItems: 'center', minHeight: size * 1.65, overflowWrap: 'anywhere',
        visibility: card === null ? 'hidden' : undefined, color: latest ? themed.accent : themed.text,
        background: themed.surface, border: `2px solid ${latest && !steady ? themed.accent : themed.border}`,
        opacity: latest ? 0.4 + 0.6 * enter : 1, transform: latest ? `translateY(${(1 - enter) * size * 0.26}px)` : undefined}}>
        {card}
      </div>;
    })}
  </div>;
}

function EpisodeScene({scene, previous, themed, asset, onError, index, pipSize, renew}) {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const portrait = height > width * 1.2;
  const scale = Math.min(width, height);
  const captionCue = scene.cues?.findLast(cue => cue.frame <= frame);
  const caption = captionCue?.text ?? scene.caption;
  const emphasis = captionCue?.emphasis;
  const emphasisStart = emphasis ? caption.indexOf(emphasis) : -1;
  const text = scene.cues?.findLast(cue => cue.frame <= frame && cue.screenText)?.screenText ?? scene.text;
  const cardCue = scene.cues?.findLast(cue => cue.frame <= frame && cue.cards);
  const boardScene = text === scene.text ? scene : {...scene, text};
  const transition = sceneTransition(previous, scene, fps);
  const crossing = frame < transition.frames;
  const progress = crossing ? ease(frame + 1, 0, transition.frames) : 1;
  const moving = transition.type === 'slide' && crossing;
  const pip = scene.motion?.speaker === 'pip';
  const sharedTitle = previous && previous.text === text && isBoard(previous) && !previous.collage && !previous.illustration;
  const enter = reveal(frame + 1, scene.frames, fps, 0, 0.28);
  const resizing = resizesSpeaker(previous, scene);
  // A shrinking video sweeps across the layout before it reaches its dock.
  const boardOpacity = pip && resizing
    ? ease(frame, Math.min(Math.ceil(fps * 0.28), Math.max(0, scene.frames - 2)),
      Math.min(fps * 0.16, Math.max(1, scene.frames - 1 - Math.ceil(fps * 0.28))))
    : progress;
  const compatibleBoards = (previous?.motion?.speaker === 'pip') === pip;
  const renderBoard = (shot, localFrame, settled = false) => shot.collage
    ? <PaperCollage scene={shot} frame={localFrame} asset={asset} settled={settled}
        textOpacity={settled && scene.collage ? Math.max(0, 1 - 2 * progress) : 1}
        previous={settled ? undefined : previous}
        onError={() => onError?.('纸页拼贴的图片加载失败')}/>
    : shot.illustration
    ? <IllustratedBoard scene={shot} themed={themed} pipSize={pipSize} asset={asset}
        textOpacity={settled && scene.illustration ? Math.max(0, 1 - 2 * progress) : 1}
        onError={() => onError?.(`分镜 ${index + 1} 的插图加载失败`)}/>
    : <MotionBoard scene={shot} frame={localFrame} themed={themed} pipSize={pipSize}
        settledTitle={!settled && sharedTitle} previous={!settled && sharedTitle ? previous : undefined}>
        {!settled && cardCue && <CueCards cue={cardCue} frame={localFrame} size={scale * 0.05}
          steady={scene.cueStyle === 'steady'} themed={themed}/>}
      </MotionBoard>;

  return <>
    {isBoard(scene) && <>
      {crossing && compatibleBoards && renderBoard(previous, previous.frames - 1, true)}
      <AbsoluteFill style={{opacity: boardOpacity, transform: moving
        ? `translateX(${(pip ? -4 : 4) * (1 - progress)}%)` : undefined}}>
        {renderBoard(boardScene, frame)}
      </AbsoluteFill>
    </>}
    {scene.audio && <Audio src={asset(scene.audio)} onError={() => onError?.(`分镜 ${index + 1} 的音频加载失败`)}/>}
    {text && !isBoard(scene) && <div style={{
      position: 'absolute', zIndex: 2, left: '7%', top: '10%', maxWidth: '74%', padding: '0.6em 0.8em',
      borderRadius: scale * 0.015, background: renew ? themed.background : '#101923e8',
      color: renew ? themed.text : '#fff', fontSize: scale * (renew ? 0.038 : 0.05),
      fontWeight: 700, opacity: enter, transform: `translateY(${(1 - enter) * 16}px)`,
    }}>{text}</div>}
    {cardCue && !isBoard(scene) && <div style={{position: 'absolute', zIndex: 2, top: '24%', left: '8%', right: '8%',
      fontSize: scale * 0.042, fontWeight: 650}}>
      <CueCards cue={cardCue} frame={frame} size={scale * 0.05} steady={scene.cueStyle === 'steady'} themed={themed}/>
    </div>}
    {caption && <div style={{position: 'absolute', zIndex: 2, bottom: portrait ? '7%' : renew ? '5.4%' : '8%',
      left: renew ? '6%' : '7%', right: renew ? '6%' : '7%', textAlign: 'center',
      ...(renew && scene.illustration && {borderTop: `2px solid ${themed.border}`, paddingTop: scale * 0.011})}}>
      <span style={{display: 'inline-block', maxWidth: '100%', padding: '0.24em 0.6em', color: scene.illustration ? themed.text : '#fff',
        background: scene.illustration ? themed.background : '#101923ed', borderRadius: '0.24em',
        fontSize: scale * (renew ? 0.058 : 0.039), lineHeight: 1.2,
        fontWeight: renew ? 720 : 550, textWrap: 'balance', overflowWrap: 'anywhere'}}>{emphasisStart < 0 ? caption : <>
        {caption.slice(0, emphasisStart)}
        <mark style={{color: '#e8ffaf', background: '#536d36', borderRadius: '0.15em', padding: '0 0.12em'}}>{emphasis}</mark>
        {caption.slice(emphasisStart + emphasis.length)}
      </>}</span>
    </div>}
  </>;
}

function SpeakerVideo({run, shots, themed, asset, onError, pipShape, pipSize}) {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const current = shots.findLast(shot => shot.from <= run.from + frame);
  const {scene, previous, index} = current;
  const pip = scene.motion?.speaker === 'pip';
  const enter = reveal(run.from + frame - current.from + 1, scene.frames, fps, 0, 0.28);
  const resizeSpeaker = resizesSpeaker(previous, scene);
  const {size, right, bottom} = speakerLayout(width, height, pipSize);
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
  return <AbsoluteFill lang={project.language} style={{background: themed.background, fontFamily: 'system-ui, sans-serif', overflow: 'hidden'}}>
    {project.bgm && <Audio src={asset(project.bgm)} volume={0.15} loop onError={() => onError?.('背景音乐加载失败')}/>}
    {shots.map(({scene, previous, from, index}) => <Sequence key={index} from={from} durationInFrames={scene.frames} layout="none">
      <EpisodeScene scene={scene} previous={previous} themed={themed}
        asset={asset} onError={onError} index={index} pipSize={project.preferences?.pipSize} renew={project.theme === 'renew'}/>
    </Sequence>)}
    {runs.map(run => <Sequence key={run.from} from={run.from} durationInFrames={run.frames} layout="none">
      <SpeakerVideo run={run} shots={shots} themed={themed} asset={asset} onError={onError}
        pipShape={project.preferences?.pipShape} pipSize={project.preferences?.pipSize}/>
    </Sequence>)}
  </AbsoluteFill>;
}
