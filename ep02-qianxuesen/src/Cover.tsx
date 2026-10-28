import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import episode from '../episodes/ep02-qianxuesen.json';
import {GlideTrajectory} from './components/GlideTrajectory';
import {Globe, GlobeDefs} from './components/Globe';
import {ManeuverArrow} from './components/ManeuverArrow';
import {StampBox} from './components/Stamp';
import {Trajectory} from './components/Trajectory';
import {polyline, TILT_MAX} from './globe';
import {ballisticPath, GLIDE_A} from './physics';
import {breakAtPunct} from './subtitles';
import {H, W} from './layout';
import {alpha, fonts, roles, theme} from './theme';

// 9:16 封面在主页会被居中裁成 3:4，内容整体放进中间 1440 高的区域
const CROP_H = 1440;
// 地球示意整体上移，给下方文字留位置
const STAGE_SHIFT = -40;

export const Cover: React.FC = () => {
  const {height} = useVideoConfig();
  const reasons = episode.publish.cover_text.split(' · ');
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
        <div style={{position: 'absolute', top: 168, left: 60, fontFamily: fonts.sans, fontWeight: 900, fontSize: 66, color: theme.text}}>
          为什么有的弹道<span style={{color: theme.accent}}>算不出来</span>？
        </div>
        <div style={{position: 'absolute', top: 290, left: 40, width: 880, display: 'flex', justifyContent: 'space-between'}}>
          {reasons.map((r, i) => (
            <StampBox key={r} text={r} style={{transform: `scale(0.86) rotate(${-4 + i * 2}deg)`, fontSize: 64}} />
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
            top: 1080,
            left: 60,
            width: 860,
            fontFamily: fonts.sans,
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.4,
            color: theme.text,
          }}
        >
          {breakAtPunct(episode.hook).map((line) => (
            <div key={line}>{line}</div>
          ))}
          <div style={{fontSize: 26, fontWeight: 700, color: alpha(theme.textMuted, 0.9), marginTop: 14}}>示意图 · 非真实比例与参数</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
