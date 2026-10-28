import React from 'react';
import {period, theta} from '../physics';
import {alpha, fonts, theme} from '../theme';
import {Pendulum} from './Pendulum';

const deg = Math.PI / 180;

// 镜 1 摆钟示意：摆到一边就“嘀嗒”一下，秒针走一格
export const Clock: React.FC<{t: number; L: number; theta0: number; opacity: number; cx?: number}> = ({
  t,
  L,
  theta0,
  opacity,
  cx = 480,
}) => {
  if (opacity <= 0) return null;
  const half = period(L) / 2;
  const ticks = Math.floor(t / half + 1e-9);
  const flash = Math.max(0, 1 - (t - ticks * half) / 0.25);
  const face = {x: cx, y: 600, r: 100};
  const hand = ticks * 6 * deg;
  return (
    <g opacity={opacity}>
      <rect x={cx - 180} y={466} width={360} height={570} rx={40} fill={alpha(theme.panel, 0.9)} stroke={theme.panelBorder} strokeWidth={4} />
      <circle cx={face.x} cy={face.y} r={face.r} fill={theme.bg} stroke={theme.axis} strokeWidth={4} />
      {Array.from({length: 12}, (_, i) => {
        const a = i * 30 * deg;
        return (
          <line
            key={i}
            x1={face.x + Math.sin(a) * (face.r - 8)}
            y1={face.y - Math.cos(a) * (face.r - 8)}
            x2={face.x + Math.sin(a) * (face.r - 20)}
            y2={face.y - Math.cos(a) * (face.r - 20)}
            stroke={theme.textMuted}
            strokeWidth={i % 3 === 0 ? 5 : 3}
          />
        );
      })}
      <line x1={face.x} y1={face.y} x2={face.x} y2={face.y - 50} stroke={theme.text} strokeWidth={6} strokeLinecap="round" />
      <line
        x1={face.x}
        y1={face.y}
        x2={face.x + Math.sin(hand) * 80}
        y2={face.y - Math.cos(hand) * 80}
        stroke={theme.accent}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <circle cx={face.x} cy={face.y} r={7} fill={theme.accent} />
      <Pendulum x={cx} pivotY={730} lengthPx={250} thetaDeg={theta(theta0, L, t)} bobR={28} color={theme.accent} />
      <text
        x={cx + (ticks % 2 === 0 ? 1 : -1) * 140}
        y={face.y + 8}
        textAnchor="middle"
        opacity={flash}
        style={{fontFamily: fonts.sans, fontWeight: 900, fontSize: 34, fill: theme.accent}}
      >
        {ticks % 2 === 0 ? '嘀' : '嗒'}
      </text>
    </g>
  );
};
