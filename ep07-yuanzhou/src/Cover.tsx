import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import episode from '../episodes/ep07-yuanzhou.json';
import {Label} from './components/Arrow';
import {CentripetalArrow} from './components/CentripetalArrow';
import {CircularOrbit} from './components/CircularOrbit';
import {VelocityArrow} from './components/VelocityArrow';
import {A_PX, accelOf, FORMULA, PX_PER_M, R_BIG, R_SMALL, ringAt, V, V_PX} from './physics';
import {alpha, fonts, theme} from './theme';

// 9:16 封面在主页会被居中裁成 3:4，内容整体放进中间 1440 高的区域
const CROP_H = 1440;
const BIG_C = {x: 340, y: 760};
const SMALL_C = {x: 770, y: 760};

const Orbit: React.FC<{c: {x: number; y: number}; r: number; th: number}> = ({c, r, th}) => {
  const s = ringAt(c, r * PX_PER_M, th);
  return (
    <g>
      <CircularOrbit c={c} rPx={r * PX_PER_M} p={s.p} radius={1} />
      <CentripetalArrow p={s.p} inward={s.inward} vel={s.vel} len={accelOf(V, r) * A_PX} rightAngle={1} />
      <VelocityArrow p={s.p} dir={s.vel} len={V * V_PX} />
    </g>
  );
};

export const Cover: React.FC = () => {
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <AbsoluteFill style={{transform: `translateY(${(height - CROP_H) / 2}px)`}}>
        <div style={{position: 'absolute', top: 96, left: 60, display: 'flex', gap: 14, alignItems: 'center'}}>
          <span
            style={{
              fontFamily: fonts.sans,
              fontSize: 30,
              fontWeight: 800,
              color: theme.bg,
              background: theme.accent,
              borderRadius: 10,
              padding: '4px 14px',
            }}
          >
            {episode.series} 07
          </span>
          <span style={{fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: theme.textMuted}}>{episode.title}</span>
        </div>
        <div style={{position: 'absolute', top: 160, left: 60, fontFamily: fonts.sans, fontWeight: 900, fontSize: 88, color: theme.accent, textShadow: `0 0 40px ${alpha(theme.accent, 0.35)}`}}>
          {episode.publish.cover_text}
        </div>
        <div style={{position: 'absolute', top: 300, left: 60, fontFamily: fonts.math, fontStyle: 'italic', fontSize: 60, color: theme.text}}>
          {FORMULA}
        </div>
        <svg width={1080} height={CROP_H} style={{position: 'absolute', inset: 0}}>
          <Orbit c={BIG_C} r={R_BIG} th={Math.PI / 4} />
          <Orbit c={SMALL_C} r={R_SMALL} th={Math.PI * 0.62} />
          <Label x={BIG_C.x} y={BIG_C.y - 26} color={theme.text} size={34} anchor="middle">
            {`r = ${R_BIG} m`}
          </Label>
          <Label x={BIG_C.x} y={BIG_C.y + 58} color={theme.accent} size={52} anchor="middle" weight={900}>
            {`a = ${accelOf(V, R_BIG)}`}
          </Label>
          <Label x={SMALL_C.x} y={SMALL_C.y - R_SMALL * PX_PER_M - 28} color={theme.text} size={34} anchor="middle">
            {`r = ${R_SMALL} m`}
          </Label>
          <Label x={SMALL_C.x} y={SMALL_C.y + R_SMALL * PX_PER_M + 70} color={theme.accent} size={52} anchor="middle" weight={900}>
            {`a = ${accelOf(V, R_SMALL)}`}
          </Label>
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 1130,
            left: 60,
            width: 900,
            fontFamily: fonts.sans,
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.4,
            color: theme.text,
          }}
        >
          {episode.hook.split(/(?<=？)/).map((l) => (
            <div key={l}>{l}</div>
          ))}
          <div style={{fontSize: 26, fontWeight: 700, color: alpha(theme.textMuted, 0.9), marginTop: 14}}>
            同样 v = {V} m/s · 单位 m/s² · 代码渲染示意图
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
