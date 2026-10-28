import React from 'react';
import {alpha, theme} from '../theme';

export const Bob: React.FC<{x: number; y: number; r: number; color: string; scale?: number}> = ({x, y, r, color, scale = 1}) => {
  if (scale <= 0) return null;
  const rr = r * scale;
  return (
    <g>
      <circle cx={x} cy={y} r={rr * 1.9} fill={alpha(color, 0.16)} />
      <circle cx={x} cy={y} r={rr} fill={color} style={{filter: `drop-shadow(0 0 10px ${alpha(color, 0.8)})`}} />
      <circle cx={x - rr * 0.32} cy={y - rr * 0.32} r={rr * 0.34} fill={alpha(theme.text, 0.75)} />
    </g>
  );
};
