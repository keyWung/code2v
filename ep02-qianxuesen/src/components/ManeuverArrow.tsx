import React from 'react';
import {Pt} from '../physics';
import {polyline, project} from '../globe';
import {Arrow, Label} from './Arrow';

// 变向箭头：画在滑行高度上方的一段水平弧，斜着看时和轨迹一起透视
export const ManeuverArrow: React.FC<{
  center: Pt;
  radius: number;
  from: number;
  to: number;
  tilt: number;
  color: string;
  progress: number;
  label?: string;
}> = ({center, radius, from, to, tilt, color, progress, label = '变向'}) => {
  if (progress <= 0) return null;
  const end = from + (to - from) * Math.min(1, progress);
  const pts: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = from + ((end - from) * i) / 40;
    pts.push({s: center.s + radius * Math.cos(a), h: center.h, l: center.l + radius * Math.sin(a)});
  }
  const a = project(pts[pts.length - 3], tilt);
  const b = project(pts[pts.length - 1], tilt);
  const mid = project(pts[Math.floor(pts.length / 2)], tilt);
  return (
    <g opacity={Math.min(1, progress * 2)}>
      <path d={polyline(pts.slice(0, -2), tilt)} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeDasharray="12 8" />
      <Arrow x1={a.x} y1={a.y} x2={b.x + (b.x - a.x) * 2} y2={b.y + (b.y - a.y) * 2} color={color} />
      <Label x={mid.x} y={mid.y - 22} color={color} anchor="middle" size={30} opacity={Math.min(1, Math.max(0, progress * 3 - 2))}>
        {label}
      </Label>
    </g>
  );
};
