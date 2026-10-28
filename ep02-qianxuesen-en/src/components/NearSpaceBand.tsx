import React from 'react';
import {GLOBE} from '../layout';
import {NEAR_SPACE} from '../physics';
import {limb} from '../globe';
import {alpha, roles} from '../theme';
import {GLOBE_MASK} from './Globe';
import {Label} from './Arrow';

const SPACE_TOP = 430;

const ring = (r1: number, r2: number) => {
  const {cx, cy} = limb(0);
  const circle = (r: number) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  return `${circle(r2)} ${circle(r1)}`;
};

// 屏幕 x 处、离地 h 的那一圈的 y（正侧面）
export const shellY = (x: number, h: number) => {
  const {cx, cy, R} = GLOBE;
  return cy - Math.sqrt((R + h) ** 2 - (x - cx) ** 2);
};

// 正侧面分层：下方传统防空、中间临近空间（高亮）、上方太空段；高度不按比例
export const NearSpaceBand: React.FC<{opacity: number; highlight: number}> = ({opacity, highlight}) => {
  if (opacity <= 0) return null;
  const {R} = GLOBE;
  const {cx, cy} = limb(0);
  return (
    <g opacity={opacity} mask={GLOBE_MASK}>
      <path d={ring(R + NEAR_SPACE.hi, R + SPACE_TOP)} fill={alpha(roles.space, 0.07)} fillRule="evenodd" />
      <path d={ring(R, R + NEAR_SPACE.lo)} fill={alpha(roles.airDefense, 0.13)} fillRule="evenodd" />
      <path d={ring(R + NEAR_SPACE.lo, R + NEAR_SPACE.hi)} fill={alpha(roles.nearSpace, 0.04 + 0.07 * highlight)} fillRule="evenodd" />
      {[NEAR_SPACE.lo, NEAR_SPACE.hi].map((h) => (
        <circle
          key={h}
          cx={cx}
          cy={cy}
          r={R + h}
          fill="none"
          stroke={alpha(roles.nearSpace, 0.35 + 0.5 * highlight)}
          strokeWidth={3}
          strokeDasharray="14 10"
        />
      ))}
    </g>
  );
};

const LABEL_X = 74;
const mid = (lo: number, hi: number) => (shellY(LABEL_X + 130, lo) + shellY(LABEL_X + 130, hi)) / 2;

export const LayerLabels: React.FC<{band: number; airDefense: number; space: number}> = ({band, airDefense, space}) => (
  <g>
    <Label x={LABEL_X} y={mid(NEAR_SPACE.hi, SPACE_TOP) - 20} color={roles.space} size={30} opacity={space}>
      Space layer
    </Label>
    <Label x={LABEL_X} y={mid(NEAR_SPACE.lo, NEAR_SPACE.hi) - 6} color={roles.nearSpace} size={32} opacity={band}>
      Near space
    </Label>
    <Label x={LABEL_X} y={mid(NEAR_SPACE.lo, NEAR_SPACE.hi) + 28} color={roles.nearSpace} size={24} weight={700} opacity={band}>
      about 20–100 km
    </Label>
    <Label x={LABEL_X} y={mid(0, NEAR_SPACE.lo) + 40} color={roles.airDefense} size={28} opacity={airDefense}>
      Air defense
    </Label>
  </g>
);
