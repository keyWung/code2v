import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import episode from '../episodes/ep03-danbai.json';
import {Label} from './components/Arrow';
import {Formula} from './components/FormulaPanel';
import {Mount, Pendulum} from './components/Pendulum';
import {breakAtPunct} from './subtitles';
import {caseOf, cases, DRAW_GAIN, g, mainCase, SMALL_ANGLE_DEG, THETA0_DEG} from './physics';
import {PX_PER_M, W} from './layout';
import {alpha, fonts, roles, theme} from './theme';

// 9:16 封面在主页会被居中裁成 3:4，内容整体放进中间 1440 高的区域
const CROP_H = 1440;
const PIVOT = 500;

export const Cover: React.FC = () => {
  const {height} = useVideoConfig();
  const short = caseOf(cases[0].length_m);
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
            {episode.series} 03
          </span>
          <span style={{fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: theme.textMuted}}>{episode.title}</span>
        </div>
        <div style={{position: 'absolute', top: 160, left: 60, fontFamily: fonts.sans, fontWeight: 900, fontSize: 92, color: theme.accent, textShadow: `0 0 40px ${alpha(theme.accent, 0.35)}`}}>
          {episode.publish.cover_text}
        </div>
        <div style={{position: 'absolute', top: 300, left: 60}}>
          <Formula hl={1} size={72} />
        </div>
        <svg width={W} height={CROP_H} style={{position: 'absolute', inset: 0}}>
          <Mount x1={180} x2={760} y={PIVOT} />
          <Pendulum x={300} pivotY={PIVOT} lengthPx={mainCase.length_m * PX_PER_M} thetaDeg={-THETA0_DEG} bobR={28} color={roles.main} swingDeg={THETA0_DEG} />
          <Pendulum x={680} pivotY={PIVOT} lengthPx={short.length_m * PX_PER_M} thetaDeg={THETA0_DEG} bobR={24} color={roles.short} swingDeg={THETA0_DEG} />
          <Label x={340} y={PIVOT + 330} color={roles.main} size={40}>
            {`${mainCase.length_m} 米 · ${mainCase.display_period}`}
          </Label>
          <Label x={580} y={PIVOT + 200} color={roles.short} size={40}>
            {`${short.length_m} 米 · ${short.display_period}`}
          </Label>
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 1076,
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
          <div style={{fontSize: 26, fontWeight: 700, color: alpha(theme.textMuted, 0.9), marginTop: 14}}>
            摆角 &lt; {SMALL_ANGLE_DEG}°（画面角度放大 {DRAW_GAIN} 倍）· g 取 {g} · 忽略空气阻力
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
