import React from 'react';
import {interpolateColors} from 'remotion';
import type {Pt} from '../physics';
import {alpha, roles, theme} from '../theme';
import {Label} from './Arrow';

// 法线：过入射点、垂直于界面的虚线，角度都从它量起；hl 时变成高亮色
export const NormalLine: React.FC<{
  o: Pt;
  up: number;
  down: number;
  opacity?: number;
  hl?: number;
  label?: boolean;
  labelSize?: number;
  progress?: number;
}> = ({o, up, down, opacity = 1, hl = 0, label = true, labelSize = 28, progress = 1}) => {
  if (opacity <= 0 || progress <= 0) return null;
  const color = interpolateColors(hl, [0, 1], [alpha(roles.normal, 0.85), theme.accent]);
  const m = 16;
  return (
    <g opacity={opacity}>
      <line x1={o.x} y1={o.y - up * progress} x2={o.x} y2={o.y + down * progress} stroke={color} strokeWidth={3} strokeDasharray="10 9" />
      <path d={`M ${o.x} ${o.y - m} L ${o.x + m} ${o.y - m} L ${o.x + m} ${o.y}`} fill="none" stroke={color} strokeWidth={2} opacity={progress} />
      {label && (
        <Label x={o.x + 12} y={o.y - up + labelSize * 0.9} color={color} size={labelSize} opacity={progress}>
          法线
        </Label>
      )}
    </g>
  );
};
