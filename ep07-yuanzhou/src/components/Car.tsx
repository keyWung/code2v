import React from 'react';
import type {Pt} from '../physics';
import {roles, theme} from '../theme';

// 俯视小车：车头朝 dir
export const Car: React.FC<{p: Pt; dir: Pt; scale?: number; opacity?: number}> = ({p, dir, scale = 1, opacity = 1}) => {
  if (opacity <= 0) return null;
  const deg = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  return (
    <g opacity={opacity} transform={`translate(${p.x} ${p.y}) rotate(${deg}) scale(${scale})`}>
      <rect x={-27} y={-15} width={54} height={30} rx={9} fill={roles.body} />
      <rect x={6} y={-11} width={12} height={22} rx={4} fill={theme.bg} />
      <rect x={-20} y={-10} width={9} height={20} rx={3} fill={theme.bg} opacity={0.7} />
      {[-1, 1].map((s) => (
        <rect key={s} x={-19} y={s * 15 - 3} width={12} height={6} rx={2} fill={theme.grid} />
      ))}
      {[-1, 1].map((s) => (
        <rect key={`f${s}`} x={9} y={s * 15 - 3} width={12} height={6} rx={2} fill={theme.grid} />
      ))}
    </g>
  );
};
