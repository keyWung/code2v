import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import episode from '../episodes/ep01-paowuxian.json';
import {LandingMarker} from './components/AngleComparison';
import {GridAxes} from './components/GridAxes';
import {Trajectory} from './components/Trajectory';
import {cases, flightTime} from './physics';
import {breakAtPunct} from './subtitles';
import {H, W} from './layout';
import {alpha, angleColor, fonts, theme} from './theme';

// 9:16 封面在主页会被居中裁成 3:4，内容整体放进中间 1440 高的区域
const CROP_H = 1440;

export const Cover: React.FC = () => {
  const {height} = useVideoConfig();
  const [lhs, rhs] = episode.publish.cover_text.split(' = ');
  const byDeg = (deg: number) => cases.find((c) => c.angle_deg === deg)!;
  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <AbsoluteFill style={{transform: `translateY(${(height - CROP_H) / 2}px)`}}>
        <div style={{position: 'absolute', top: 210, left: 60, display: 'flex', gap: 14, alignItems: 'center'}}>
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
            {episode.series} 01
          </span>
          <span style={{fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: theme.textMuted}}>{episode.title}</span>
        </div>
        <div style={{position: 'absolute', top: 285, left: 60, width: 860, fontFamily: fonts.sans, fontWeight: 900}}>
          <div style={{fontSize: 74, color: theme.text, lineHeight: 1.25}}>{lhs}</div>
          <div style={{fontSize: 128, color: theme.accent, lineHeight: 1.15, textShadow: `0 0 40px ${alpha(theme.accent, 0.35)}`}}>
            = {rhs}
          </div>
        </div>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <GridAxes />
          {cases.map((c) => (
            <Trajectory key={c.angle_deg} deg={c.angle_deg} tEnd={flightTime(c.angle_deg)} color={angleColor(c.angle_deg)} width={8} glow={10} />
          ))}
          <LandingMarker
            x={byDeg(30).range_m}
            colors={[theme.traj30, theme.traj60]}
            label={[{text: byDeg(30).range_display, color: theme.text}]}
            tag={[
              {text: '30° ', color: theme.traj30},
              {text: '60° ', color: theme.traj60},
              {text: '同落', color: theme.accent},
            ]}
            side="left"
            progress={1}
          />
          <LandingMarker
            x={byDeg(45).range_m}
            colors={[theme.traj45]}
            label={[{text: byDeg(45).range_display, color: theme.text}]}
            tag={[{text: '最远', color: theme.accent}]}
            side="right"
            progress={1}
          />
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
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
