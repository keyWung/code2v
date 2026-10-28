import React from 'react';
import {position} from '../physics';
import {toScreen} from '../layout';

const SAMPLES = 180;

// 镜 1 的 EP01 抛物线：逐点由 x(t)、y(t) 算出
export const trajectoryPath = (tEnd: number, tStart = 0) => {
  const pts: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const {x, y} = position(tStart + ((tEnd - tStart) * i) / SAMPLES);
    const {sx, sy} = toScreen(x, Math.max(0, y));
    pts.push(`${i === 0 ? 'M' : 'L'} ${sx.toFixed(2)} ${sy.toFixed(2)}`);
  }
  return pts.join(' ');
};

export const Trajectory: React.FC<{
  d: string;
  color: string;
  opacity?: number;
  width?: number;
  glow?: number;
  dash?: string;
}> = ({d, color, opacity = 1, width = 6, glow = 6, dash}) => {
  if (!d || opacity <= 0) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
      opacity={opacity}
      style={{filter: glow > 0 ? `drop-shadow(0 0 ${glow}px ${color})` : undefined}}
    />
  );
};
