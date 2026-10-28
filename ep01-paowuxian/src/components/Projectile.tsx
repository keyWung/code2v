import React from 'react';
import {position} from '../physics';
import {toScreen} from '../layout';
import {alpha, theme} from '../theme';

export const Projectile: React.FC<{
  deg: number;
  t: number;
  color: string;
  opacity?: number;
  r?: number;
}> = ({deg, t, color, opacity = 1, r = 14}) => {
  if (opacity <= 0) return null;
  const {x, y} = position(deg, t);
  const {sx, sy} = toScreen(x, Math.max(0, y));
  return (
    <g opacity={opacity}>
      <circle cx={sx} cy={sy} r={r * 2.2} fill={alpha(color, 0.18)} />
      <circle cx={sx} cy={sy} r={r} fill={color} style={{filter: `drop-shadow(0 0 10px ${color})`}} />
      <circle cx={sx - r * 0.3} cy={sy - r * 0.3} r={r * 0.35} fill={alpha(theme.text, 0.75)} />
    </g>
  );
};
