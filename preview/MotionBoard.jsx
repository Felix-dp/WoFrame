import React from 'react';
import {AbsoluteFill, interpolateColors, useVideoConfig} from 'remotion';
import {defaultBeatTime, reveal, speakerLayout} from './motion.mjs';

function Beat({beat, show, focus, pressProgress, size, themed, horizontal, replacing = false}) {
  const {label, detail, type = 'card', value, unit = ''} = beat;
  const {surface, border, text, muted, accent} = themed;
  const button = type === 'button';
  const metric = type === 'metric';
  const blend = (from, to) => interpolateColors(focus, [0, 1], [from, to]);
  const press = button ? Math.sin(Math.PI * pressProgress) * 0.026 : 0;
  const transform = `translateY(${replacing ? 0 : (1 - show) * size * 0.26}px) scale(${1 - press})`;
  const number = metric ? new Intl.NumberFormat('zh-CN', {maximumFractionDigits: 2})
    .format(Number((value * show).toFixed(2))) : null;
  return <div style={{
      position: 'relative', boxSizing: 'border-box',
      opacity: show, transform, color: blend(text, accent),
      background: surface, border: `2px solid ${blend(border, accent)}`,
      borderRadius: size * 0.25, padding: `${size * 0.27}px ${size * 0.43}px`,
      minHeight: size * 2.55, height: horizontal ? '100%' : undefined,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      fontSize: size * 0.72, fontWeight: 670, lineHeight: 1.2, overflowWrap: 'anywhere'}}>
      {focus > 0 && <span style={{position: 'absolute', left: size * 0.16, width: Math.max(3, size * 0.045),
        height: '44%', top: '28%', borderRadius: size, background: accent, opacity: focus,
        transform: `scaleY(${focus})`}}/>}
      {metric && <div style={{color: accent, fontSize: size, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums'}}>{number}{unit}</div>}
      {label}
      {detail && <div style={{fontWeight: 450, color: muted,
        fontSize: size * 0.51, lineHeight: 1.3, marginTop: size * 0.12}}>{detail}</div>}
  </div>;
}

function Connector({horizontal, symbol, show, size, accent}) {
  const distance = size * 0.92;
  return <div style={{position: 'absolute', width: distance, height: distance, display: 'grid', placeItems: 'center',
    right: horizontal ? '100%' : undefined, left: horizontal ? undefined : '50%',
    top: horizontal ? '50%' : -distance,
    transform: horizontal ? 'translateY(-50%)' : 'translateX(-50%)',
    color: accent, opacity: show, fontSize: size * 0.62, fontWeight: 700}}>
    <span style={{transform: horizontal ? `translateX(${(show - 1) * size * 0.2}px)` :
      `translateY(${(show - 1) * size * 0.2}px)`}}>{symbol}</span>
  </div>;
}

export function MotionBoard({scene, frame, themed, settledTitle = false, previous}) {
  const {width, height, fps} = useVideoConfig();
  const portrait = height > width * 1.2;
  const scale = Math.min(width, height);
  const {text, frames} = scene;
  const motion = scene.motion ?? {};
  const {beats = [], focus, relation, layout = beats.length > 1 ? 'compare' : 'title'} = motion;
  const pip = motion.speaker === 'pip';
  const speaker = pip ? speakerLayout(width, height) : null;
  const row = !portrait && layout !== 'title';
  const title = settledTitle ? 1 : Math.max(0.28, reveal(frame, frames, fps, 0, 0.32));
  const underline = reveal(frame, frames, fps, 0.06, 0.36);
  const compact = (row && beats.length > 2) || (beats.length > 3 && (height / width < 1.6 || pip));
  const size = scale * (compact ? 0.061 : 0.076);
  const {background, border, text: foreground, accent, surface} = themed;
  const panel = Boolean(beats.length || pip);
  const connected = layout === 'steps' || Boolean(relation);
  return <AbsoluteFill style={{background, color: foreground,
    backgroundImage: `radial-gradient(ellipse at 18% 12%, ${accent}17, transparent 48%)`,
    display: 'flex', justifyContent: 'center', padding: panel ? '0' : '8%'}}>
    <div style={{position: 'absolute', inset: panel ? '11% 7% 24%' : '13% 10% 21%',
      ...(speaker && {right: speaker.panelRight, bottom: speaker.panelBottom}),
      overflow: pip ? 'hidden' : undefined,
      border: panel ? `2px solid ${border}` : undefined, borderRadius: scale * 0.035,
      background: panel ? `linear-gradient(140deg, ${surface}, ${background})` : undefined,
      padding: panel ? (row && pip ? '3%' : '4%') : 0, display: 'flex', flexDirection: 'column',
      justifyContent: panel ? 'flex-start' : 'center', gap: size * (row ? 0.65 : 0.48)}}>
      {text && <div style={{
        fontSize: scale * (panel ? (portrait ? 0.085 : 0.092) : 0.091), fontWeight: 750,
        letterSpacing: '-0.045em', lineHeight: 1.15, opacity: title,
        transform: `translateY(${(1 - title) * size * 0.4}px)`, textAlign: panel ? 'left' : 'center',
        overflowWrap: 'anywhere', textWrap: 'balance'}}>
        {text}
        <div style={{height: Math.max(3, scale * 0.006), width: size * 1.85, borderRadius: size,
          margin: panel ? `${size * 0.25}px 0 0` : `${size * 0.32}px auto 0`,
          background: accent, transform: `scaleX(${settledTitle ? 1 : underline})`, transformOrigin: 'left'}}/>
      </div>}
      {beats.length > 0 && <div style={{display: 'flex', flexDirection: row ? 'row' : 'column', alignItems: row ? 'stretch' : undefined,
        gap: connected ? size * 0.92 : size * 0.29,
        maxWidth: '100%'}}>
        {beats.map((beat, index) => {
          const prior = previous?.motion?.beats?.[index];
          const retained = prior && prior.label === beat.label && prior.detail === beat.detail &&
            (prior.type ?? 'card') === (beat.type ?? 'card') && prior.value === beat.value && prior.unit === beat.unit;
          const wasFocused = retained && previous.motion.focus?.beat === index;
          const isFocused = focus?.beat === index;
          const pressProgress = isFocused && !wasFocused ? reveal(frame, frames, fps, focus.at, 0.26) : 0;
          const release = reveal(frame, frames, fps, 0, 0.24);
          const emphasis = wasFocused ? (isFocused ? 1 : 1 - release) : pressProgress;
          const show = retained ? 1 : reveal(frame, frames, fps, beat.at ?? defaultBeatTime(index, beats.length));
          const carry = prior && !retained && previous.motion?.layout === motion.layout && motion.transition !== 'cut';
          const connectorShow = previous?.motion?.relation === relation && prior ? 1 : show;
          return <div key={index} style={{position: 'relative', minWidth: 0, flex: 1}}>
            {connected && index > 0 && <Connector horizontal={row} symbol={relation ?? (row ? '→' : '↓')}
              show={connectorShow} size={size} accent={accent}/>}
            {carry && show < 1 && <div style={{position: 'absolute', inset: 0}}>
              <Beat beat={prior} horizontal={row} show={1} focus={previous.motion.focus?.beat === index ? 1 : 0}
                pressProgress={0} size={size} themed={themed}/>
            </div>}
            <Beat beat={beat} horizontal={row} show={show} focus={emphasis} replacing={Boolean(carry)}
              pressProgress={pressProgress} size={size} themed={themed}/>
          </div>;
        })}
      </div>}
    </div>
  </AbsoluteFill>;
}
