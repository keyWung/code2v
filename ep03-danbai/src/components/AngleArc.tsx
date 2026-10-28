import React from 'react';
import {DRAW_GAIN} from '../physics';
import {alpha, theme} from '../theme';
import {Label} from './Arrow';

const rad = (d: number) => (d * Math.PI) / 180;

// 摆角弧线：竖直参考线 + 从竖直到摆线的弧；角度按画面放大后的角度画，标签写真实角度
export const AngleArc: React.FC<{
  x: number;
  y: number;
  length: number;
  thetaDeg: number;
  label: string;
  opacity: number;
  radius?: number;
}> = ({x, y, length, thetaDeg, label, opacity, radius = 170}) => {
  if (opacity <= 0) return null;
  const a = rad(thetaDeg * DRAW_GAIN);
  const end = {x: x + radius * Math.sin(a), y: y + radius * Math.cos(a)};
  const sweep = a > 0 ? 0 : 1;
  return (
    <g opacity={opacity}>
      <line x1={x} y1={y} x2={x} y2={y + length + 40} stroke={alpha(theme.textMuted, 0.6)} strokeWidth={2} strokeDasharray="8 8" />
      {Math.abs(a) > 0.002 && (
        <path d={`M ${x} ${y + radius} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`} fill="none" stroke={theme.accent} strokeWidth={4} />
      )}
      {/* 标签放在竖直线另一侧，不压摆线 */}
      <Label x={x - (a >= 0 ? 1 : -1) * 16} y={y + radius + 10} color={theme.accent} size={28} anchor={a >= 0 ? 'end' : 'start'}>
        {label}
      </Label>
    </g>
  );
};
