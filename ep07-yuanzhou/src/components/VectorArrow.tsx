import React from 'react';
import type {Pt} from '../physics';
import {alpha, roles} from '../theme';

// 矢量箭头：从 p 沿 dir 画 len 像素；很短时箭头头部跟着缩小，长度仍按比例
export const VectorArrow: React.FC<{p: Pt; dir: Pt; len: number; color?: string; width?: number; opacity?: number}> = ({
  p,
  dir,
  len,
  color = roles.velocity,
  width = 7,
  opacity = 1,
}) => {
  if (opacity <= 0 || len <= 0.5) return null;
  const head = Math.min(22, len * 0.75);
  const half = Math.min(13, head * 0.62);
  const tip = {x: p.x + dir.x * len, y: p.y + dir.y * len};
  const base = {x: tip.x - dir.x * head, y: tip.y - dir.y * head};
  return (
    <g opacity={opacity}>
      <line x1={p.x} y1={p.y} x2={tip.x} y2={tip.y} stroke={alpha(color, 0.22)} strokeWidth={width * 3} strokeLinecap="round" />
      {len > head && <line x1={p.x} y1={p.y} x2={base.x} y2={base.y} stroke={color} strokeWidth={width} strokeLinecap="round" />}
      <path d={`M ${tip.x} ${tip.y} L ${base.x - dir.y * half} ${base.y + dir.x * half} L ${base.x + dir.y * half} ${base.y - dir.x * half} Z`} fill={color} />
      <circle cx={p.x} cy={p.y} r={width * 0.9} fill={color} />
    </g>
  );
};
