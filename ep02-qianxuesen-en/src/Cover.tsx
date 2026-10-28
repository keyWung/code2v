import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import episode from '../episodes/ep02-qianxuesen-en.json';
import {GlideTrajectory} from './components/GlideTrajectory';
import {Globe, GlobeDefs} from './components/Globe';
import {ManeuverArrow} from './components/ManeuverArrow';
import {StampBox} from './components/Stamp';
import {Trajectory} from './components/Trajectory';
import {polyline, TILT_MAX} from './globe';
import {ballisticPath, GLIDE_A} from './physics';
import {H, W} from './layout';
import {alpha, fonts, roles, theme} from './theme';

// 9:16 封面在主页会被居中裁成 3:4，内容整体放进中间 1440 高的区域
const CROP_H = 1440;
// 英文标题占两行，地球示意不再上移
const STAGE_SHIFT = 0;

export const Cover: React.FC = () => {
  const {height} = useVideoConfig();
  const reasons = episode.chapters.flatMap((c) => c.stamps ?? []);
  const ghost = Array.from({length: 161}, (_, i) => ballisticPath(i / 160, 0.12));
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
            {episode.series} 02
          </span>
          <span style={{fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: theme.textMuted}}>{episode.title}</span>
        </div>
        <div style={{position: 'absolute', top: 160, left: 60, width: 880, fontFamily: fonts.sans, fontWeight: 900, fontSize: 62, lineHeight: 1.15, color: theme.text}}>
          Why can’t some trajectories
          <br />
          be <span style={{color: theme.accent}}>predicted</span>?
        </div>
        <div style={{position: 'absolute', top: 318, left: 20, width: 920, display: 'flex', justifyContent: 'space-between'}}>
          {reasons.map((r, i) => (
            <StampBox key={r} text={r} style={{transform: `scale(0.74) rotate(${-4 + i * 2}deg)`}} />
          ))}
        </div>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, transform: `translateY(${STAGE_SHIFT}px)`}}>
          <GlobeDefs />
          <Globe tilt={TILT_MAX} />
          <Trajectory d={polyline(ghost, TILT_MAX)} color={roles.ballistic} width={5} glow={0} dash="12 10" opacity={0.55} />
          <GlideTrajectory path={GLIDE_A} u={1} tilt={TILT_MAX} color={roles.glide} width={8} glow={10} head={false} />
          <ManeuverArrow center={{s: 50, h: 150, l: -175}} radius={175} from={Math.PI / 2} to={Math.PI / 9} tilt={TILT_MAX} color={theme.accent} progress={1} />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 1100,
            left: 60,
            width: 880,
            fontFamily: fonts.sans,
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 1.35,
            color: theme.text,
          }}
        >
          <div style={{textWrap: 'balance'}}>{episode.hook}</div>
          <div style={{fontSize: 26, fontWeight: 700, color: alpha(theme.textMuted, 0.9), marginTop: 14}}>Schematic · not to scale, no real data</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
