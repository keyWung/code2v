import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {AngleComparison, ApexLabel, LandingMarker, pop} from './components/AngleComparison';
import {ChapterHeader} from './components/ChapterHeader';
import {CODE_CHARS, CodePanel} from './components/CodePanel';
import {Counter} from './components/Counter';
import {FormulaPanel} from './components/FormulaPanel';
import {GridAxes} from './components/GridAxes';
import {Projectile} from './components/Projectile';
import {Stamp} from './components/Stamp';
import {Subtitle} from './components/Subtitle';
import {Trajectory} from './components/Trajectory';
import {VelocityVector} from './components/VelocityVector';
import {g, flightTime, mainCase, position, v0} from './physics';
import {H, pillCx, SAFE, toScreen, W, ZONE} from './layout';
import {subtitleLines} from './subtitles';
import {beats, chapters, compareLanding, FREEZE_FROM, settle, shotAt, shots, simClock} from './timeline';
import {alpha, angleColor, fonts, theme} from './theme';
import episode from '../episodes/ep01-paowuxian.json';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fadeIn = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const fadeOut = (f: number, a: number, b: number) => interpolate(f, [a, b], [1, 0], clamp);

const Chip: React.FC<{opacity: number; left?: number; color?: string; children: React.ReactNode}> = ({
  opacity,
  left = ZONE.chip.left,
  color = theme.textMuted,
  children,
}) =>
  opacity <= 0 ? null : (
    <div
      style={{
        position: 'absolute',
        left,
        top: ZONE.chip.top,
        opacity,
        padding: '8px 18px',
        borderRadius: 999,
        border: `2px solid ${alpha(color, 0.5)}`,
        background: alpha(theme.panel, 0.85),
        fontFamily: fonts.sans,
        fontSize: 26,
        fontWeight: 700,
        color,
      }}
    >
      {children}
    </div>
  );

const typedChars = (f: number) => {
  const lx = episode.physics.core_code[0].length;
  const startX = 6;
  const startY = startX + lx + 7;
  if (f < startX) return 0;
  if (f < startX + lx) return f - startX;
  if (f < startY) return lx;
  return Math.min(CODE_CHARS, lx + (f - startY));
};

const SafeZones: React.FC = () => {
  const hatch = alpha(theme.accent, 0.22);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: SAFE.top, background: hatch}} />
      <div style={{position: 'absolute', left: SAFE.railX, top: SAFE.railFromY, width: W - SAFE.railX, height: H - SAFE.railFromY, background: hatch}} />
      <div style={{position: 'absolute', left: 0, top: SAFE.bottomY, width: W, height: H - SAFE.bottomY, background: hatch}} />
    </AbsoluteFill>
  );
};

export const EP01: React.FC<{voice?: boolean; debugSafe?: boolean}> = ({voice = true, debugSafe = false}) => {
  const frame = useCurrentFrame();
  // 47-52 秒整段冻结：只读到冻结帧
  const f = Math.min(frame, FREEZE_FROM);
  const shot = shotAt(f);
  const S = (n: number) => shots[n - 1];
  const MAIN = mainCase.angle_deg;
  const T = flightTime(MAIN);
  const mainColor = angleColor(MAIN);

  // 镜 1：钩子，小球只飞上升段
  const hookT = simClock(f, beats.hook.launch, beats.hook.frames, beats.hook.tStop);
  const hookOut = fadeOut(f, S(2).from, S(2).from + 15);
  const markIn = fadeIn(f, beats.hook.mark, beats.hook.mark + 12) * hookOut;
  const markPulse = 1 + 0.12 * Math.sin((f - beats.hook.mark) / 5);
  const land = toScreen(mainCase.range_m, 0);

  // 镜 2：拆成两个分运动
  const {launch: sLaunch, frames: sFrames} = beats.split;
  const splitT = simClock(f, sLaunch, sFrames, T);
  const splitLand = sLaunch + sFrames;
  const splitIn = fadeIn(f, S(2).from + 4, S(2).from + 16) * fadeOut(f, S(3).from, S(3).from + 16);
  const vecIn = fadeOut(f, splitLand, splitLand + 12);
  const strobe = Array.from({length: 11}, (_, i) => (T * i) / 10).filter((t) => t <= splitT + 1e-9);
  const ball2 = position(MAIN, splitT);

  // 镜 3：45° 主轨迹慢放
  const mainT = simClock(f, beats.main.launch, beats.main.frames, T);
  const mainLand = beats.main.launch + beats.main.frames;
  const mainApex = beats.main.launch + beats.main.frames / 2;
  const s3Out = fadeOut(f, S(4).from, S(4).from + 18);
  const mainIn = fadeIn(f, S(3).from + 8, S(3).from + 20);
  const ball3 = position(MAIN, mainT);

  // 镜 4–6
  const compareIn = fadeIn(f, S(4).from + 10, S(4).from + 28);
  const x2 = beats.formula.x2;
  const glow = interpolate(f, [x2, x2 + 15, x2 + 45, x2 + 60], [0, 10, 10, 0], clamp);

  const hx =
    fadeIn(f, beats.split.xFrom, beats.split.xFrom + 10) *
    interpolate(f, [beats.split.yFrom, beats.split.yFrom + 10], [1, 0.35], clamp) *
    fadeOut(f, splitLand + 10, splitLand + 25);
  const hy = fadeIn(f, beats.split.yFrom, beats.split.yFrom + 10) * fadeOut(f, splitLand + 10, splitLand + 25);

  const apex = toScreen(position(MAIN, T / 2).x, mainCase.max_height_m);
  const yAxis = toScreen(0, mainCase.max_height_m);

  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <GridAxes />

        {/* 镜 1 */}
        <g opacity={hookOut}>
          <Trajectory deg={MAIN} tEnd={hookT} color={mainColor} />
          <Projectile deg={MAIN} t={hookT} color={mainColor} />
        </g>
        {markIn > 0 && (
          <g opacity={markIn}>
            <circle cx={land.sx} cy={land.sy} r={26 * markPulse} fill="none" stroke={theme.accent} strokeWidth={4} strokeDasharray="8 7" />
            <text x={land.sx} y={land.sy - 44} textAnchor="middle" style={{fontFamily: fonts.sans, fontWeight: 900, fontSize: 52, fill: theme.accent}}>
              ?
            </text>
          </g>
        )}

        {/* 镜 2 */}
        {splitIn > 0 && (
          <g opacity={splitIn}>
            {strobe.map((t) => {
              const p = position(MAIN, t);
              const onPath = toScreen(p.x, Math.max(0, p.y));
              const onX = toScreen(p.x, 0);
              const onY = toScreen(0, Math.max(0, p.y));
              return (
                <g key={t}>
                  <circle cx={onPath.sx} cy={onPath.sy} r={8} fill={alpha(mainColor, 0.35)} />
                  <circle cx={onX.sx} cy={onX.sy} r={8} fill={theme.text} />
                  {t >= T / 2 - 1e-9 && <circle cx={onY.sx} cy={onY.sy} r={8} fill={theme.accent} />}
                </g>
              );
            })}
            <Trajectory deg={MAIN} tEnd={splitT} color={mainColor} opacity={0.55} glow={0} width={4} />
            {(() => {
              const b = toScreen(ball2.x, Math.max(0, ball2.y));
              const bx = toScreen(ball2.x, 0);
              const by = toScreen(0, Math.max(0, ball2.y));
              return (
                <g opacity={vecIn}>
                  <line x1={b.sx} y1={b.sy} x2={bx.sx} y2={bx.sy} stroke={alpha(theme.text, 0.45)} strokeWidth={2} strokeDasharray="6 6" />
                  <line x1={b.sx} y1={b.sy} x2={by.sx} y2={by.sy} stroke={alpha(theme.accent, 0.5)} strokeWidth={2} strokeDasharray="6 6" />
                  <circle cx={bx.sx} cy={bx.sy} r={12} fill="none" stroke={theme.text} strokeWidth={4} />
                  <circle cx={by.sx} cy={by.sy} r={12} fill="none" stroke={theme.accent} strokeWidth={4} />
                </g>
              );
            })()}
            <Projectile deg={MAIN} t={splitT} color={mainColor} />
            <VelocityVector deg={MAIN} t={splitT} opacity={vecIn} />
          </g>
        )}

        {/* 镜 3 */}
        <g opacity={mainIn}>
          <Trajectory deg={MAIN} tEnd={mainT} color={mainColor} opacity={interpolate(f, [S(4).from, S(4).from + 18], [1, 0.22], clamp)} />
          <Projectile deg={MAIN} t={mainT} color={mainColor} opacity={s3Out} />
        </g>
        <g opacity={s3Out * fadeIn(f, mainApex, mainApex + 12)}>
          <line x1={yAxis.sx} y1={yAxis.sy} x2={apex.sx} y2={apex.sy} stroke={alpha(theme.accent, 0.8)} strokeWidth={3} strokeDasharray="8 8" />
          <ApexLabel deg={MAIN} text={`最高 ${mainCase.max_height_m} 米`} color={theme.accent} opacity={1} />
        </g>
        <g opacity={s3Out}>
          <LandingMarker
            x={mainCase.range_m}
            colors={[mainColor]}
            label={[{text: mainCase.range_display, color: theme.text}]}
            side="right"
            progress={pop(f, mainLand)}
          />
        </g>

        {/* 镜 4 起 */}
        {compareIn > 0 && (
          <g opacity={compareIn}>
            <AngleComparison f={f} glow={glow} />
          </g>
        )}
      </svg>

      {/* 左上说明 */}
      <Chip opacity={splitIn} color={theme.text}>
        → 横：匀速
      </Chip>
      <Chip opacity={splitIn} left={ZONE.chip.left + 210} color={theme.accent}>
        ↓ 竖：加速
      </Chip>
      <Chip opacity={mainIn * s3Out}>
        θ = {MAIN}° · v₀ = {v0} m/s · g = {g}
      </Chip>
      <Chip opacity={compareIn * fadeOut(f, S(5).from, S(5).from + 15)}>同一初速度 · 同时出手 · 慢放</Chip>

      <Counter
        t={mainT}
        x={ball3.x}
        y={mainT >= T ? 0 : ball3.y}
        opacity={fadeIn(f, S(3).from + 10, S(3).from + 25) * s3Out}
      />

      <CodePanel
        opacity={fadeOut(f, S(5).from, S(5).from + 18)}
        typed={typedChars(f)}
        cursor={f < S(2).from && Math.floor(f / 12) % 2 === 0}
        hx={hx}
        hy={hy}
        view={fadeIn(f, S(4).from + 20, S(4).from + 32)}
        rows={[30, 45, 60].map((d) => fadeIn(f, compareLanding(d), compareLanding(d) + 8))}
        tags={fadeIn(f, compareLanding(60) + 6, compareLanding(60) + 20)}
      />
      <FormulaPanel
        opacity={fadeIn(f, beats.formula.in, beats.formula.in + 18)}
        hl={settle(f, x2, {damping: 12})}
      />

      <Subtitle
        lines={subtitleLines(shot)}
        opacity={shot.shot === 1 || shot.shot === shots.length ? 1 : fadeIn(f, shot.from, shot.from + 8)}
      />

      <ChapterHeader f={f} />
      {chapters.map((c) => (
        <Stamp key={c.id} text={c.stamp} f={f} hitAt={c.stampAt} slotCx={pillCx(c.index)} />
      ))}

      {debugSafe && <SafeZones />}

      {voice &&
        shots.map((s) => (
          <Sequence key={s.shot} from={s.from + 4} durationInFrames={s.to - s.from - 4}>
            <Audio src={staticFile(`vo/shot${s.shot}.wav`)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
