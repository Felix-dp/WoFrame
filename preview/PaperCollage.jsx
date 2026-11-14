import React from 'react';
import {AbsoluteFill, Img, useVideoConfig} from 'remotion';
import {reveal} from './motion.mjs';

const ink = '#28221d';
const accent = '#c26031';
const grain = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".66 .40" numOctaves="3" seed="23" stitchTiles="stitch"/></filter><path fill="#888" filter="url(#g)" d="M0 0h256v256H0z"/></svg>');

export function PaperCollage({scene, frame, asset, onError, settled = false, textOpacity = 1, previous}) {
  const {width, height, fps} = useVideoConfig();
  const {cover, portrait, illustration, book, author, originalTitle, note, credit, eyebrow = '阅读札记'} = scene.collage;
  const stacked = height >= width;
  const unit = Math.min(width, height);
  const u = n => n * unit / 1080;
  const enter = (at, duration) => settled ? 1 : reveal(frame + 1, scene.frames, fps, at, duration);
  const appear = (at, shift = 12) => {
    const progress = enter(at, 0.55);
    return {opacity: progress, transform: `translateY(${u(shift) * (1 - progress)}px)`};
  };
  const last = previous?.collage;
  const carryPortrait = last?.portrait === portrait;
  const carryBook = last && ['cover', 'book', 'author', 'originalTitle'].every(key => last[key] === scene.collage[key]);
  const at = (x, y, w) => ({position: 'absolute', left: x + '%', top: y + '%', width: w + '%'});
  const serif = '"Noto Serif SC", "Songti SC", SimSun, "Noto Serif CJK SC", serif';
  const line = scene.text.split('\n');
  const headlinePercent = stacked ? 81 : 45;
  const headlineWidth = width * headlinePercent / 100;
  const longest = Math.max(...line.map(text => [...text].length));
  const compact = height < width * 1.25;
  const headlineSize = Math.min(u(stacked && compact && line.length === 3 ? 57 : 77), headlineWidth / (longest * 1.024 + 1.1));
  // Give the book and main image separate columns in both portrait and landscape.
  const artworkColumn = {right: '5%', width: stacked ? '55%' : '39%'};
  const portraitLayout = stacked
    ? {bottom: '10.3%', height: height > width * 1.4 ? '43.5%' : '42%'}
    : {bottom: '10.5%', height: '76%'};
  const landscapeLayout = stacked
    ? {bottom: '23%', height: compact ? '28%' : '27%'}
    : {bottom: '14%', height: '68%'};
  return <AbsoluteFill style={{
    overflow: 'hidden',
    background: 'radial-gradient(ellipse at 40% 35%, #fbf6e9 15%, #f2e9d8 100%)',
    fontFamily: serif, color: ink,
  }}>
    <AbsoluteFill style={{backgroundImage: `url("data:image/svg+xml,${grain}")`, opacity: 0.24, mixBlendMode: 'multiply'}}/>
    <div style={{...at(8, stacked ? 7.2 : 8.2, 84), display: 'flex', alignItems: 'baseline',
      justifyContent: 'space-between', paddingBottom: u(13), borderBottom: '1px solid #aa927373',
      fontSize: u(29), letterSpacing: '0.14em', fontWeight: 600}}>
      <span>{eyebrow}</span>
      <span style={{fontFamily: 'Georgia, serif', color: '#71543e', fontSize: u(21), fontWeight: 400}}>READING NOTES</span>
    </div>
    <div style={{...at(stacked ? 6.4 : 6.8, stacked ? 15 : 17, 9),
      fontFamily: 'Georgia, serif', fontWeight: 700, color: accent, fontSize: u(131), lineHeight: 0.9,
      ...appear(0, 5)}}>“</div>
    <div style={{...at(stacked ? 12 : 11.5, stacked ? 20 : 24, headlinePercent), fontSize: headlineSize,
      fontWeight: 600, lineHeight: 1.34, letterSpacing: '0.018em', opacity: textOpacity}}>
      {line.map((text, i) => <div key={i} style={{whiteSpace: 'nowrap', ...appear((last ? 0 : 0.025) + 0.04 * i)}}>{text}
        {i === line.length - 1 && <span aria-hidden style={{fontFamily: 'Georgia, serif', color: accent,
          marginLeft: '0.14em', fontSize: '1.24em', lineHeight: 0}}>”</span>}</div>)}
      {note && <div style={{fontSize: u(stacked && compact ? 26 : 30), fontWeight: 400, lineHeight: 1.63,
        marginTop: u(22), color: '#665448', textWrap: 'balance', overflowWrap: 'anywhere', ...appear(0.2)}}>{note}</div>}
    </div>
    {illustration
      ? <div style={{position: 'absolute', ...artworkColumn, ...landscapeLayout}}>
        <Img src={asset(illustration)} onError={onError} style={{width: '100%', height: '100%', objectFit: 'cover',
          clipPath: 'polygon(1% 3%, 17% 2%, 35% 3%, 58% 1%, 80% 2%, 99% 0%, 100% 25%, 99% 54%, 100% 80%, 98% 99%, 80% 98%, 60% 100%, 41% 98%, 21% 100%, 0% 98%, 1% 72%, 0% 50%, 1% 24%)'}}/>
      </div>
      : <div style={{position: 'absolute', ...artworkColumn, ...portraitLayout, ...(!carryPortrait && !last && appear(0.075, 20))}}>
        <Img src={asset(portrait)} onError={onError} style={{width: '100%', height: '100%', objectFit: 'contain',
          objectPosition: 'right bottom'}}/>
      </div>}
    <div style={{position: 'absolute', left: '8.1%', bottom: stacked ? '12.2%' : '13%',
      width: stacked ? '29%' : '45%', display: 'flex', flexDirection: stacked ? 'column' : 'row',
      alignItems: stacked ? 'flex-start' : 'flex-end', gap: u(stacked ? 22 : 30), ...(!carryBook && appear(0.1, 19))}}>
      <Img src={asset(cover)} onError={onError} style={{width: u(stacked && !compact ? 218 : 150), height: u(stacked && !compact ? 306 : 221),
        objectFit: 'contain', objectPosition: 'left bottom', filter: 'drop-shadow(6px 10px 7px #36281840)'}}/>
      <div style={{minWidth: 0, textWrap: 'pretty'}}>
        <div style={{fontSize: u(stacked ? 31 : 39), fontWeight: 700, lineHeight: 1.32, marginLeft: '-0.49em'}}>《{book}》</div>
        {originalTitle && <div style={{font: `italic ${u(25)}px Georgia, serif`, color: '#8e472b', marginTop: u(7)}}>{originalTitle}</div>}
        <div style={{color: '#5f4e40', fontSize: u(25), lineHeight: 1.4, marginTop: u(11)}}>{author}</div>
      </div>
    </div>
    <div style={{position: 'absolute', bottom: stacked ? '6.5%' : '6%', left: '8%', width: '84%',
      paddingTop: u(13), borderTop: '1px solid #aa927373', display: 'flex', gap: u(12),
      justifyContent: 'space-between', alignItems: 'baseline', fontSize: u(23), color: '#71543e'}}>
      <span style={{fontFamily: 'Georgia, serif', whiteSpace: 'nowrap', fontStyle: 'italic'}}>{scene.collage.folio ?? 'BOOK / NOTE'}</span>
      {credit && <span style={{textAlign: 'right'}}>{credit}</span>}
    </div>
  </AbsoluteFill>;
}
