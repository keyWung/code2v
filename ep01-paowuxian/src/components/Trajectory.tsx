import React from 'react';
import {position} from '../physics';
import {toScreen} from '../layout';

const SAMPLES = 180;

// 轨迹逐点由 x(t)、y(t) 算出，不用手绘曲线
export const trajectoryPath = (deg: number, tEnd: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const {x, y} = position(deg, (tEnd * i) / SAMPLES);
    const {sx, sy} = toScreen(x, Math.max(0, y));
    pts.push(`${i === 0 ? 'M' : 'L'} ${sx.toFixed(2)} ${sy.toFixed(2)}`);
  }
  return pts.join(' ');
};

export const Trajectory: React.FC<{
  deg: number;
  tEnd: number;
  color: string;
  opacity?: number;
  width?: number;
  glow?: number;
}> = ({deg, tEnd, color, opacity = 1, width = 6, glow = 6}) => {
  if (tEnd <= 0 || opacity <= 0) return null;
  return (
    <path
      d={trajectoryPath(deg, tEnd)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      style={{filter: glow > 0 ? `drop-shadow(0 0 ${glow}px ${color})` : undefined}}
    />
  );
};
