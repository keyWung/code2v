import React from 'react';
import {interpolate} from 'remotion';
import {cases, flightTime, maxHeight, position} from '../physics';
import {toScreen, ZONE} from '../layout';
import {beats, compareLanding, settle} from '../timeline';
import {angleColor, fonts, theme} from '../theme';
import {Projectile} from './Projectile';
import {Trajectory} from './Trajectory';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const pop = (f: number, from: number) => settle(f, from, {damping: 14, stiffness: 180});

type Span = {text: string; color: string};

// 落点：地面圆点 + 向下引线 + 标签（左侧或右侧对齐，避开右侧互动区）
export const LandingMarker: React.FC<{
  x: number;
  colors: string[];
  label: Span[];
  tag?: Span[];
  side: 'left' | 'right';
  progress: number;
  tagOpacity?: number;
}> = ({x, colors, label, tag, side, progress, tagOpacity = 1}) => {
  if (progress <= 0) return null;
  const {sx, sy} = toScreen(x, 0);
  const tx = side === 'left' ? sx - 12 : sx + 12;
  const anchor = side === 'left' ? 'end' : 'start';
  const y = ZONE.landingLabelY;
  return (
    <g opacity={Math.min(1, progress)}>
      <line x1={sx} y1={sy} x2={sx} y2={y + 4} stroke={colors[0]} strokeWidth={3} strokeDasharray="6 6" />
      {colors.map((c, i) => (
        <circle key={c} cx={sx} cy={sy} r={(9 + (colors.length - 1 - i) * 7) * progress} fill="none" stroke={c} strokeWidth={4} />
      ))}
      {/* 字号保持恒定：动画过字号的渲染标签页会把同一行字画得略有不同，冻结段会闪 */}
      <text x={tx} y={y} textAnchor={anchor} style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 32}}>
        {label.map((s) => (
          <tspan key={s.text} fill={s.color}>
            {s.text}
          </tspan>
        ))}
      </text>
      {tag && (
        <text
          x={tx}
          y={y + 38}
          textAnchor={anchor}
          opacity={tagOpacity}
          style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: 27}}
        >
          {tag.map((s) => (
            <tspan key={s.text} fill={s.color}>
              {s.text}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
};

export const ApexLabel: React.FC<{deg: number; text: string; color: string; opacity: number}> = ({
  deg,
  text,
  color,
  opacity,
}) => {
  if (opacity <= 0) return null;
  const {x} = position(deg, flightTime(deg) / 2);
  const {sx, sy} = toScreen(x, maxHeight(deg));
  return (
    <text
      x={sx}
      y={sy - 24}
      textAnchor="middle"
      opacity={opacity}
      style={{fontFamily: fonts.sans, fontWeight: 800, fontSize: 30, fill: color}}
    >
      {text}
    </text>
  );
};

// 镜 4 起：同初速度三角度同一模拟时钟出手
export const AngleComparison: React.FC<{f: number; glow?: number}> = ({f, glow = 0}) => {
  const {launch, framesPerSimSecond} = beats.compare;
  const tSim = Math.max(0, (f - launch) / framesPerSimSecond);
  const ballsIn = interpolate(f, [launch - 30, launch - 12], [0, 1], clamp);

  const byDeg = (deg: number) => cases.find((c) => c.angle_deg === deg)!;
  const land30 = compareLanding(30);
  const land45 = compareLanding(45);
  const land60 = compareLanding(60);
  const allLanded = interpolate(f, [land60 + 6, land60 + 20], [0, 1], clamp);

  return (
    <g>
      {cases.map((c) => {
        const deg = c.angle_deg;
        const T = flightTime(deg);
        const t = Math.min(tSim, T);
        const color = angleColor(deg);
        const apexF = launch + (T / 2) * framesPerSimSecond;
        return (
          <g key={deg}>
            <Trajectory deg={deg} tEnd={t} color={color} glow={6 + glow} width={6 + glow * 0.25} />
            <Projectile deg={deg} t={t} color={color} opacity={ballsIn} />
            <ApexLabel
              deg={deg}
              text={`${deg}°`}
              color={color}
              opacity={interpolate(f, [apexF, apexF + 12], [0, 1], clamp)}
            />
          </g>
        );
      })}
      <LandingMarker
        x={byDeg(30).range_m}
        colors={f >= land60 ? [theme.traj30, theme.traj60] : [theme.traj30]}
        label={[{text: byDeg(30).range_display, color: theme.text}]}
        tag={[
          {text: '30° ', color: theme.traj30},
          {text: '60° ', color: theme.traj60},
          {text: '同落', color: theme.accent},
        ]}
        tagOpacity={allLanded}
        side="left"
        progress={pop(f, land30)}
      />
      <LandingMarker
        x={byDeg(45).range_m}
        colors={[theme.traj45]}
        label={[{text: byDeg(45).range_display, color: theme.text}]}
        tag={[{text: '最远', color: theme.accent}]}
        tagOpacity={allLanded}
        side="right"
        progress={pop(f, land45)}
      />
    </g>
  );
};
