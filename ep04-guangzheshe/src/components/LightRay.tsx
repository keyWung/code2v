import React from 'react';
import type {Pt} from '../physics';
import {alpha, roles} from '../theme';

// 一段光线：从 a 画向 b，progress 控制画到哪里；画过一半后在中点标出方向
export const LightRay: React.FC<{
  a: Pt;
  b: Pt;
  progress?: number;
  opacity?: number;
  color?: string;
  width?: number;
  dashed?: boolean;
  arrow?: boolean;
}> = ({a, b, progress = 1, opacity = 1, color = roles.ray, width = 5, dashed = false, arrow = true}) => {
  if (progress <= 0 || opacity <= 0) return null;
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (len < 1) return null;
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  const end = {x: a.x + ux * len * progress, y: a.y + uy * len * progress};
  const mid = {x: a.x + ux * len * 0.5, y: a.y + uy * len * 0.5};
  const head = `M ${mid.x + ux * 14} ${mid.y + uy * 14} L ${mid.x - ux * 10 - uy * 11} ${mid.y - uy * 10 + ux * 11} L ${mid.x - ux * 10 + uy * 11} ${mid.y - uy * 10 - ux * 11} Z`;
  return (
    <g opacity={opacity}>
      {!dashed && <line x1={a.x} y1={a.y} x2={end.x} y2={end.y} stroke={alpha(color, 0.2)} strokeWidth={width * 3.4} strokeLinecap="round" />}
      <line
        x1={a.x}
        y1={a.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? '14 12' : undefined}
      />
      {arrow && progress > 0.56 && <path d={head} fill={color} />}
    </g>
  );
};

// 从 o 出发、与竖直法线成 deg 角的点；up 为 true 时往上
export const along = (o: Pt, len: number, deg: number, side: 1 | -1, up: boolean): Pt => {
  const r = (deg * Math.PI) / 180;
  return {x: o.x + side * len * Math.sin(r), y: o.y + (up ? -1 : 1) * len * Math.cos(r)};
};
