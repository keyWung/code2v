import React from 'react';
import {CHARGE_R} from '../layout';
import {alpha, fonts, roles, theme} from '../theme';

// 点电荷：正电荷暖色、负电荷冷色，圆里写 + / −
export const Charge: React.FC<{x: number; y: number; q: number; r?: number; scale?: number; opacity?: number; glow?: number}> = ({
  x,
  y,
  q,
  r = CHARGE_R,
  scale = 1,
  opacity = 1,
  glow = 0.12,
}) => {
  if (opacity <= 0 || scale <= 0) return null;
  const color = q > 0 ? roles.plus : roles.minus;
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r={r * 1.9} fill={alpha(color, glow)} />
      <circle r={r} fill={color} stroke={alpha(theme.bg, 0.6)} strokeWidth={3} />
      <text
        y={r * 0.36}
        textAnchor="middle"
        style={{fontFamily: fonts.sans, fontWeight: 900, fontSize: r * 1.3, fill: theme.bg}}
      >
        {q > 0 ? '+' : '−'}
      </text>
    </g>
  );
};
