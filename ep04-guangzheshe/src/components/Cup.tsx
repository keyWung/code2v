import React from 'react';
import {CUP} from '../layout';
import type {Pt} from '../physics';
import {alpha, roles, theme} from '../theme';
import {Label} from './Arrow';

const {left, right, rim, surface, bottom, r} = CUP;
const body = (top: number) =>
  `M ${left} ${top} L ${left} ${bottom - r} Q ${left} ${bottom} ${left + r} ${bottom} L ${right - r} ${bottom} Q ${right} ${bottom} ${right} ${bottom - r} L ${right} ${top}`;

// 水杯：杯壁 + 杯里的水
export const Cup: React.FC<{opacity?: number}> = ({opacity = 1}) =>
  opacity <= 0 ? null : (
    <g opacity={opacity}>
      <path d={`${body(surface)} Z`} fill={alpha(roles.water, 0.18)} />
      <line x1={left} y1={surface} x2={right} y2={surface} stroke={roles.water} strokeWidth={4} />
      <path d={body(rim)} fill="none" stroke={alpha(theme.axis, 0.7)} strokeWidth={5} strokeLinejoin="round" />
      <Label x={left + 22} y={bottom - 26} color={roles.water} size={30}>
        水
      </Label>
    </g>
  );

// 筷子：一段折线；dashed 时画成虚线轮廓（实际位置）
export const Chopstick: React.FC<{points: Pt[]; opacity?: number; dashed?: boolean}> = ({points, opacity = 1, dashed = false}) =>
  opacity <= 0 ? null : (
    <polyline
      points={points.map((p) => `${p.x},${p.y}`).join(' ')}
      fill="none"
      stroke={dashed ? alpha(roles.stick, 0.75) : roles.stick}
      strokeWidth={dashed ? 4 : 16}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '12 10' : undefined}
      opacity={opacity}
    />
  );

// 眼睛：侧面看的眼球，瞳孔朝向光来的方向
export const Eye: React.FC<{at: Pt; look: Pt; opacity?: number}> = ({at, look, opacity = 1}) => {
  if (opacity <= 0) return null;
  const d = Math.hypot(look.x - at.x, look.y - at.y);
  const ux = (look.x - at.x) / d;
  const uy = (look.y - at.y) / d;
  return (
    <g opacity={opacity}>
      <circle cx={at.x} cy={at.y} r={26} fill={theme.bg} stroke={theme.text} strokeWidth={4} />
      <circle cx={at.x + ux * 13} cy={at.y + uy * 13} r={10} fill={theme.text} />
      <Label x={at.x + 40} y={at.y + 10} color={theme.text} size={28}>
        眼睛
      </Label>
    </g>
  );
};
