import React from 'react';
import type {Pt} from '../physics';
import {alpha, roles} from '../theme';
import {VectorArrow} from './VectorArrow';

const CORNER = 20;

// 向心箭头：从物体指向圆心；rightAngle 画出它和速度方向之间的直角
export const CentripetalArrow: React.FC<{
  p: Pt;
  inward: Pt;
  len: number;
  vel?: Pt;
  rightAngle?: number;
  opacity?: number;
  width?: number;
  color?: string;
}> = ({p, inward, len, vel, rightAngle = 0, opacity = 1, width, color = roles.centripetal}) => (
  <g opacity={opacity}>
    {vel && rightAngle > 0 && (
      <path
        d={`M ${p.x + vel.x * CORNER} ${p.y + vel.y * CORNER} L ${p.x + (vel.x + inward.x) * CORNER} ${p.y + (vel.y + inward.y) * CORNER} L ${p.x + inward.x * CORNER} ${p.y + inward.y * CORNER}`}
        fill="none"
        stroke={alpha(color, 0.9)}
        strokeWidth={3}
        opacity={rightAngle}
      />
    )}
    <VectorArrow p={p} dir={inward} len={len} color={color} width={width} />
  </g>
);
