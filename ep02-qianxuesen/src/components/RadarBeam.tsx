import React from 'react';
import {GLOBE} from '../layout';
import {RADAR} from '../physics';
import {project} from '../globe';
import {alpha, theme} from '../theme';
import {Label} from './Arrow';

const {cx, cy, R} = GLOBE;
const TH = RADAR.s / R;
// 屏幕坐标（y 向下）：地面法向、沿地平线朝左的切向
const N = {x: Math.sin(TH), y: -Math.cos(TH)};
const T = {x: -Math.cos(TH), y: -Math.sin(TH)};
const LEFT_X = 70;
const BEAM_R = 560;
const BEAM_MAX = (68 * Math.PI) / 180;

export const radarPoint = () => project(RADAR, 0);

const dir = (a: number) => ({x: T.x * Math.cos(a) + N.x * Math.sin(a), y: T.y * Math.cos(a) + N.y * Math.sin(a)});

// 只在正侧面（tilt = 0）使用：雷达、波束、贴地平线的视线极限、地平线后面的盲区
export const RadarBeam: React.FC<{
  opacity: number;
  horizon: number;
  blind: number;
  sweep: number;
}> = ({opacity, horizon, blind, sweep}) => {
  if (opacity <= 0) return null;
  const o = radarPoint();
  const len = (o.x - LEFT_X) / -T.x;
  const end = {x: o.x + T.x * len * horizon, y: o.y + T.y * len * horizon};
  const fan: string[] = [`M ${o.x} ${o.y}`];
  for (let i = 0; i <= 24; i++) {
    const d = dir((BEAM_MAX * i) / 24);
    fan.push(`L ${(o.x + d.x * BEAM_R).toFixed(1)} ${(o.y + d.y * BEAM_R).toFixed(1)}`);
  }
  fan.push('Z');

  const limbAt = (x: number) => cy - Math.sqrt(R * R - (x - cx) ** 2);
  const blindPts = [`M ${o.x} ${o.y}`, `L ${LEFT_X} ${o.y + T.y * len}`, `L ${LEFT_X} ${limbAt(LEFT_X)}`];
  for (let i = 0; i <= 40; i++) {
    const x = LEFT_X + ((o.x - LEFT_X) * i) / 40;
    blindPts.push(`L ${x.toFixed(1)} ${limbAt(x).toFixed(1)}`);
  }
  blindPts.push('Z');

  const sw = dir(BEAM_MAX * (0.5 + 0.5 * Math.sin(sweep)));
  const labelAt = {x: o.x + T.x * len * 0.94, y: o.y + T.y * len * 0.94};
  const angle = (Math.atan2(-T.y, -T.x) * 180) / Math.PI;

  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id="radar-beam" gradientUnits="userSpaceOnUse" cx={o.x} cy={o.y} r={BEAM_R}>
          <stop offset={0} stopColor={theme.traj45} stopOpacity={0.3} />
          <stop offset={1} stopColor={theme.traj45} stopOpacity={0} />
        </radialGradient>
        <pattern id="blind-hatch" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={16} stroke={alpha(theme.textMuted, 0.32)} strokeWidth={3} />
        </pattern>
      </defs>
      {blind > 0 && (
        <g opacity={blind}>
          <path d={blindPts.join(' ')} fill={alpha(theme.textMuted, 0.1)} />
          <path d={blindPts.join(' ')} fill="url(#blind-hatch)" />
          <Label x={LEFT_X + 12} y={limbAt(LEFT_X) - 120} color={theme.text} size={28}>
            盲区
          </Label>
        </g>
      )}
      <path d={fan.join(' ')} fill="url(#radar-beam)" />
      <line
        x1={o.x}
        y1={o.y}
        x2={o.x + sw.x * BEAM_R * 0.92}
        y2={o.y + sw.y * BEAM_R * 0.92}
        stroke={alpha(theme.traj45, 0.55)}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {horizon > 0 && (
        <line x1={o.x} y1={o.y} x2={end.x} y2={end.y} stroke={theme.text} strokeWidth={3} strokeDasharray="14 10" opacity={0.85} />
      )}
      <g transform={`rotate(${angle} ${labelAt.x} ${labelAt.y})`}>
        <Label x={labelAt.x} y={labelAt.y + 34} color={theme.text} anchor="middle" size={26} opacity={horizon >= 1 ? 1 : 0}>
          地平线
        </Label>
      </g>
      {/* 雷达 */}
      <g stroke={theme.text} strokeWidth={4} strokeLinecap="round" fill="none">
        <line x1={o.x} y1={o.y} x2={o.x + N.x * 24} y2={o.y + N.y * 24} />
        <path
          d={`M ${o.x + N.x * 24 + T.x * 20} ${o.y + N.y * 24 + T.y * 20} Q ${o.x + N.x * 14 + dir(0.9).x * 4} ${o.y + N.y * 14} ${o.x + N.x * 34 - T.x * 14} ${o.y + N.y * 34 - T.y * 14}`}
        />
      </g>
      <circle cx={o.x} cy={o.y} r={7} fill={theme.text} />
      <Label x={o.x + 26} y={o.y - 2} color={theme.text} size={28}>
        雷达
      </Label>
    </g>
  );
};

// 雷达发现目标：一圈扩散 + 停留的小圈
export const Ping: React.FC<{x: number; y: number; f: number; at: number; color: string; label: string; side?: 'left' | 'right'}> = ({
  x,
  y,
  f,
  at,
  color,
  label,
  side = 'right',
}) => {
  if (f < at) return null;
  const k = Math.min(1, (f - at) / 18);
  return (
    <g>
      {k < 1 && <circle cx={x} cy={y} r={16 + 40 * k} fill="none" stroke={alpha(color, 1 - k)} strokeWidth={4} />}
      <circle cx={x} cy={y} r={22} fill="none" stroke={color} strokeWidth={4} />
      <Label x={x + (side === 'right' ? 32 : -32)} y={y + 10} color={color} anchor={side === 'right' ? 'start' : 'end'} size={30}>
        {label}
      </Label>
    </g>
  );
};
