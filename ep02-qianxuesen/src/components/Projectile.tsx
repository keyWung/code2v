import React from 'react';
import {alpha, theme} from '../theme';

export const Projectile: React.FC<{x: number; y: number; color: string; opacity?: number; r?: number}> = ({
  x,
  y,
  color,
  opacity = 1,
  r = 13,
}) => {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r * 2.2} fill={alpha(color, 0.18)} />
      <circle cx={x} cy={y} r={r} fill={color} style={{filter: `drop-shadow(0 0 10px ${color})`}} />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.35} fill={alpha(theme.text, 0.75)} />
    </g>
  );
};
