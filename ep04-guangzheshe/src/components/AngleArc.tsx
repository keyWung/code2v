import React from 'react';
import type {Pt} from '../physics';
import {Label} from './Arrow';

// 角度弧：从法线方向扫到光线方向。方向用屏幕角度表示（0° 向右，90° 向下）
export const AngleArc: React.FC<{
  o: Pt;
  r: number;
  from: number;
  to: number;
  color: string;
  label?: string;
  labelR?: number;
  labelSize?: number;
  opacity?: number;
}> = ({o, r, from, to, color, label, labelR = r + 46, labelSize = 28, opacity = 1}) => {
  if (opacity <= 0 || Math.abs(to - from) < 0.3) return null;
  const p = (a: number, rr: number) => ({x: o.x + rr * Math.cos((a * Math.PI) / 180), y: o.y + rr * Math.sin((a * Math.PI) / 180)});
  const s = p(from, r);
  const e = p(to, r);
  const l = p((from + to) / 2, labelR);
  return (
    <g opacity={opacity}>
      <path d={`M ${s.x} ${s.y} A ${r} ${r} 0 0 ${to > from ? 1 : 0} ${e.x} ${e.y}`} fill="none" stroke={color} strokeWidth={4} />
      {label && (
        <Label x={l.x} y={l.y + labelSize * 0.35} color={color} size={labelSize} anchor="middle">
          {label}
        </Label>
      )}
    </g>
  );
};
