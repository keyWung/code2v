import React from 'react';
import {alpha, fonts, theme} from '../theme';
import {Label} from './Arrow';

// 地面落点：圆圈 + 标签（标签只往左或往上放，避开右侧互动区）
export const GroundMarker: React.FC<{
  x: number;
  y: number;
  color: string;
  progress: number;
  label?: string;
  labelColor?: string;
  dx?: number;
  dy?: number;
  anchor?: 'start' | 'middle' | 'end';
}> = ({x, y, color, progress, label, labelColor = theme.text, dx = 0, dy = -34, anchor = 'middle'}) => {
  if (progress <= 0) return null;
  return (
    <g opacity={Math.min(1, progress)}>
      <circle cx={x} cy={y} r={20 * progress} fill="none" stroke={color} strokeWidth={4} />
      <circle cx={x} cy={y} r={6} fill={color} />
      {label && (
        <Label x={x + dx} y={y + dy} color={labelColor} anchor={anchor} size={28}>
          {label}
        </Label>
      )}
    </g>
  );
};

// 预测相遇点：准星；失效时打叉变暗
export const PredictPoint: React.FC<{
  x: number;
  y: number;
  appear: number;
  fail: number;
  label: string;
  anchor?: 'start' | 'middle' | 'end';
  below?: boolean;
}> = ({x, y, appear, fail, label, anchor = 'middle', below = false}) => {
  if (appear <= 0) return null;
  const r = 20;
  const c = theme.accent;
  return (
    <g opacity={Math.min(1, appear) * (1 - 0.45 * fail)}>
      <circle cx={x} cy={y} r={r * Math.min(1, appear)} fill="none" stroke={c} strokeWidth={4} />
      <line x1={x - r - 10} y1={y} x2={x + r + 10} y2={y} stroke={c} strokeWidth={3} />
      <line x1={x} y1={y - r - 10} x2={x} y2={y + r + 10} stroke={c} strokeWidth={3} />
      <Label
        x={anchor === 'middle' ? x : anchor === 'start' ? x + r + 16 : x - r - 16}
        y={below ? y + r + 40 : anchor === 'middle' ? y - r - 18 : y + 9}
        color={c}
        anchor={anchor}
        size={26}
        opacity={1 - fail}
      >
        {label}
      </Label>
      {fail > 0 && (
        <g stroke={theme.text} strokeWidth={7} strokeLinecap="round" opacity={fail}>
          <line x1={x - 22} y1={y - 22} x2={x + 22} y2={y + 22} />
          <line x1={x + 22} y1={y - 22} x2={x - 22} y2={y + 22} />
        </g>
      )}
    </g>
  );
};

export const QuestionMark: React.FC<{x: number; y: number; opacity: number; scale?: number}> = ({x, y, opacity, scale = 1}) =>
  opacity <= 0 ? null : (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      opacity={opacity}
      transform={`translate(${x} ${y}) scale(${scale}) translate(${-x} ${-y})`}
      style={{fontFamily: fonts.sans, fontWeight: 900, fontSize: 64, fill: theme.accent, filter: `drop-shadow(0 0 12px ${alpha(theme.accent, 0.6)})`}}
    >
      ?
    </text>
  );

// 左上 / 右上的小标签
export const Chip: React.FC<{
  opacity: number;
  left?: number;
  right?: number;
  top: number;
  color?: string;
  children: React.ReactNode;
}> = ({opacity, left, right, top, color = theme.textMuted, children}) =>
  opacity <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        left,
        right,
        top,
        opacity,
        padding: '6px 16px',
        borderRadius: 999,
        border: `2px solid ${alpha(color, 0.5)}`,
        background: alpha(theme.panel, 0.85),
        fontFamily: fonts.sans,
        fontSize: 24,
        fontWeight: 700,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
