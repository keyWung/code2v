import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {ZONE} from '../layout';
import {stampLines} from '../stampText';
import {STAMP_DOCK, STAMP_HOLD, StampSpec} from '../timeline';
import {alpha, fonts, theme} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;


export const StampBox: React.FC<{text: string; style?: React.CSSProperties}> = ({text, style}) => (
  <div
    style={{
      whiteSpace: 'nowrap',
      padding: '20px 34px',
      borderRadius: 22,
      border: `7px solid ${theme.accent}`,
      boxShadow: `inset 0 0 0 6px ${theme.bg}, inset 0 0 0 10px ${theme.accent}, 0 0 40px ${alpha(theme.accent, 0.35)}`,
      background: alpha(theme.bg, 0.94),
      fontFamily: fonts.sans,
      fontWeight: 900,
      fontSize: 62,
      lineHeight: 1.25,
      letterSpacing: 4,
      color: theme.accent,
      textAlign: 'center',
      ...style,
    }}
  >
    {stampLines(text).map((l) => (
      <div key={l}>{l}</div>
    ))}
  </div>
);

// 章节或小节结束时落一次，随后缩小停靠到自己的位置并保持静止
export const Stamp: React.FC<{spec: StampSpec; f: number}> = ({spec, f}) => {
  const {hitAt, dock, text} = spec;
  const appearAt = hitAt - 7;
  if (f < appearAt) return null;
  const dockFrom = hitAt + STAMP_HOLD;
  const fall = interpolate(f, [appearAt, hitAt], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const shake = f >= hitAt && f < hitAt + 8 ? Math.sin((f - hitAt) * 2.4) * (8 - (f - hitAt)) * 0.9 : 0;
  const d = interpolate(f, [dockFrom, dockFrom + STAMP_DOCK], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cx = interpolate(d, [0, 1], [ZONE.stage.cx, dock.x]) + shake;
  const cy = interpolate(d, [0, 1], [ZONE.stage.cy, dock.y]);
  const scale = interpolate(fall, [0, 1], [2.6, 1]) * interpolate(d, [0, 1], [1, dock.scale]);
  const rotate = interpolate(d, [0, 1], [-7, -3]);
  const dim = interpolate(f, [appearAt, hitAt, dockFrom, dockFrom + 10], [0, 0.5, 0.5, 0], clamp);
  const ring = interpolate(f, [hitAt, hitAt + 14], [0, 1], clamp);

  return (
    <>
      {dim > 0 && <AbsoluteFill style={{background: alpha(theme.bg, dim)}} />}
      {ring > 0 && ring < 1 && (
        <div
          style={{
            position: 'absolute',
            left: ZONE.stage.cx,
            top: ZONE.stage.cy,
            width: 640,
            height: 220,
            marginLeft: -320,
            marginTop: -110,
            borderRadius: 30,
            border: `6px solid ${alpha(theme.accent, 1 - ring)}`,
            transform: `scale(${1 + ring * 0.35}) rotate(-7deg)`,
          }}
        />
      )}
      <StampBox
        text={text}
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity: fall,
        }}
      />
    </>
  );
};
