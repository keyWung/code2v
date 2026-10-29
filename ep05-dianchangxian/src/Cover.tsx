import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import episode from '../episodes/ep05-dianchangxian.json';
import {Label} from './components/Arrow';
import {Dipole, TITLE_H} from './components/Dipole';
import {GRID, W} from './layout';
import {FORMULA, Q_TEXT} from './physics';
import {alpha, fonts, theme} from './theme';

// 9:16 封面在主页会被居中裁成 3:4，内容整体放进中间 1440 高的区域
const CROP_H = 1440;
const SCALE = 2;
const TOP = 420;

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
            {episode.series} 05
          </span>
          <span style={{fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: theme.textMuted}}>{episode.title}</span>
        </div>
        <div style={{position: 'absolute', top: 160, left: 60, fontFamily: fonts.sans, fontWeight: 900, fontSize: 88, color: theme.accent, textShadow: `0 0 40px ${alpha(theme.accent, 0.35)}`}}>
          {episode.publish.cover_text}
        </div>
        <div style={{position: 'absolute', top: 300, left: 60, fontFamily: fonts.math, fontStyle: 'italic', fontSize: 64, color: theme.text}}>
          {FORMULA}
        </div>
        <svg width={W} height={CROP_H} style={{position: 'absolute', inset: 0}}>
          <defs>
            <clipPath id="cover-clip">
              <rect x={0} y={TITLE_H} width={GRID.w} height={GRID.h - TITLE_H} />
            </clipPath>
          </defs>
          <g transform={`translate(${60} ${TOP - TITLE_H * SCALE}) scale(${SCALE})`}>
            <g clipPath="url(#cover-clip)">
              <Dipole charges={1} lines={1} />
            </g>
          </g>
          <Label x={470} y={TOP + 60} color={theme.textMuted} size={34} anchor="middle">
            外面线稀 → 场弱
          </Label>
          <Label x={470} y={TOP + 620} color={theme.accent} size={34} anchor="middle">
            电荷附近线密 → 场强
          </Label>
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 1130,
            left: 60,
            width: 860,
            fontFamily: fonts.sans,
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.4,
            color: theme.text,
          }}
        >
          {episode.hook}
          <div style={{fontSize: 26, fontWeight: 700, color: alpha(theme.textMuted, 0.9), marginTop: 14}}>
            电场线是人为画的模型 · 条数只是示意 · Q = {Q_TEXT} C
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
