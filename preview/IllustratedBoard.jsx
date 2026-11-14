import React from 'react';
import {AbsoluteFill, Img, useVideoConfig} from 'remotion';
import {speakerLayout} from './motion.mjs';

export function IllustratedBoard({scene, themed, pipSize, asset, onError, textOpacity = 1}) {
  const {width, height} = useVideoConfig();
  const portrait = height > width * 1.2;
  const scale = Math.min(width, height);
  const {panelRight, panelBottom} = speakerLayout(width, height, pipSize);
  const [eyebrow, ...headline] = scene.text.split('\n');

  return <AbsoluteFill style={{background: themed.background, color: themed.text}}>
    <div style={{
      position: 'absolute', top: '9%', left: '6%', right: panelRight,
      bottom: portrait ? panelBottom : height * 0.19,
      borderTop: `2px solid ${themed.border}`, paddingTop: scale * 0.027,
      display: 'grid', gridTemplateColumns: portrait ? '1fr' : 'minmax(0, 0.78fr) minmax(0, 1.32fr)',
      gridTemplateRows: portrait ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)',
      alignItems: 'center', gap: scale * 0.038,
    }}>
      <div style={{opacity: textOpacity}}>
        {headline.length > 0 && <div style={{display: 'flex', alignItems: 'center', gap: scale * 0.017,
          color: themed.accent, fontSize: scale * 0.041, fontWeight: 700, letterSpacing: '0.025em'}}>
          <span style={{width: scale * 0.032, height: Math.max(3, scale * 0.004), background: themed.accent}}/>
          {eyebrow}
        </div>}
        <div style={{fontSize: scale * (portrait ? 0.068 : 0.074), lineHeight: 1.14, fontWeight: 800,
          whiteSpace: 'pre-line', marginTop: scale * 0.023, textWrap: 'balance'}}>
          {headline.length ? headline.join('\n') : eyebrow}
        </div>
      </div>
      <Img src={asset(scene.illustration)} onError={onError}
        style={{width: '100%', height: '100%', minHeight: 0, objectFit: 'contain'}}/>
    </div>
  </AbsoluteFill>;
}
