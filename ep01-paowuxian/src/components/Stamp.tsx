import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {ZONE} from '../layout';
import {STAMP_DOCK, STAMP_HOLD} from '../timeline';
import {alpha, fonts, theme} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const DOCK_SCALE = 0.4;

// 章节结束时落一次，随后缩小停靠到顶部该章下方并保持静止
export const Stamp: React.FC<{text: string; f: number; hitAt: number; slotCx: number}> = ({
  text,
  f,
  hitAt,
  slotCx,
}) => {
  const appearAt = hitAt - 7;
  if (f < appearAt) return null;
  const dockFrom = hitAt + STAMP_HOLD;
  const fall = interpolate(f, [appearAt, hitAt], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const shake = f >= hitAt && f < hitAt + 8 ? Math.sin((f - hitAt) * 2.4) * (8 - (f - hitAt)) * 0.9 : 0;
  const dock = interpolate(f, [dockFrom, dockFrom + STAMP_DOCK], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cx = interpolate(dock, [0, 1], [ZONE.stage.cx, slotCx]) + shake;
  const cy = interpolate(dock, [0, 1], [ZONE.stage.cy, ZONE.dock.cy]);
  const scale = interpolate(fall, [0, 1], [2.6, 1]) * interpolate(dock, [0, 1], [1, DOCK_SCALE]);
  const rotate = interpolate(dock, [0, 1], [-7, -3]);
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
            height: 200,
            marginLeft: -320,
            marginTop: -100,
            borderRadius: 30,
            border: `6px solid ${alpha(theme.accent, 1 - ring)}`,
            transform: `scale(${1 + ring * 0.35}) rotate(-7deg)`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity: fall,
          whiteSpace: 'nowrap',
          padding: '20px 34px',
          borderRadius: 22,
          border: `7px solid ${theme.accent}`,
          boxShadow: `inset 0 0 0 6px ${theme.bg}, inset 0 0 0 10px ${theme.accent}, 0 0 40px ${alpha(theme.accent, 0.35)}`,
          background: alpha(theme.bg, 0.94),
          fontFamily: fonts.sans,
          fontWeight: 900,
          fontSize: 62,
          letterSpacing: 4,
          color: theme.accent,
        }}
      >
        {text}
      </div>
    </>
  );
};
