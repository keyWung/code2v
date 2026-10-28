import React from 'react';
import {Pt} from '../physics';
import {project, upDir} from '../globe';
import {Arrow, Label} from './Arrow';

// 力的示意箭头：起点在物体上，方向是屏幕上的单位向量
export const ForceArrow: React.FC<{
  x: number;
  y: number;
  dir: {x: number; y: number};
  length: number;
  color: string;
  label: string;
  opacity?: number;
  labelSide?: 'left' | 'right';
}> = ({x, y, dir, length, color, label, opacity = 1, labelSide = 'right'}) => {
  if (opacity <= 0) return null;
  const tx = x + dir.x * length;
  const ty = y + dir.y * length;
  return (
    <g opacity={opacity}>
      <Arrow x1={x + dir.x * 16} y1={y + dir.y * 16} x2={tx} y2={ty} color={color} />
      <Label x={tx + (labelSide === 'right' ? 12 : -12)} y={ty + 10} color={color} anchor={labelSide === 'right' ? 'start' : 'end'}>
        {label}
      </Label>
    </g>
  );
};

// 升力：垂直于地面向上
export const LiftArrow: React.FC<{p: Pt; tilt: number; color: string; opacity?: number; length?: number}> = ({
  p,
  tilt,
  color,
  opacity = 1,
  length = 84,
}) => {
  const {x, y} = project(p, tilt);
  return <ForceArrow x={x} y={y} dir={upDir(p, tilt)} length={length} color={color} label="升力" opacity={opacity} />;
};
