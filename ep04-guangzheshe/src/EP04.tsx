import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Label} from './components/Arrow';
import {ChapterHeader} from './components/ChapterHeader';
import {Chip} from './components/Chip';
import {Clock} from './components/Clock';
import {CODE_CHARS, CodePanel} from './components/CodePanel';
import {PeriodTable, RunPanel} from './components/Comparison';
import {FormulaPanel} from './components/FormulaPanel';
import {bobPosition, Mount, Pendulum, smallAngleLabel} from './components/Pendulum';
import {Stamp} from './components/Stamp';
import {Subtitle} from './components/Subtitle';
import {ThetaChart} from './components/ThetaChart';
import {Timer} from './components/Timer';
import {H, PIVOT_Y, PX_PER_M, SAFE, W, ZONE} from './layout';
import {caseOf, cases, DRAW_GAIN, g, mainCase, period, SMALL_ANGLE_DEG, theta, THETA0_DEG, THETA0_SMALL_DEG} from './physics';
import {subtitleLines, subtitleNote} from './subtitles';
import {beats, FPS, FREEZE_FROM, progress, settle, shotAt, shots, since, stamps} from './timeline';
import {alpha, roles, theme} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fadeIn = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const fadeOut = (f: number, a: number, b: number) => interpolate(f, [a, b], [1, 0], clamp);

const L1 = mainCase.length_m;
const L_SHORT = cases[0].length_m;
const px = (L: number) => L * PX_PER_M;
// 第 n 个完整周期结束的帧
const periodDone = (release: number, L: number, n = 1) => release + n * period(L) * FPS;
const swings = (t: number, L: number) => Math.floor(t / period(L) + 1e-9);

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

// 镜 4：四个摆同一摆长、同时松手，换的是重量和振幅
const SYNC = [
  {x: 150, r: 15, theta0: THETA0_DEG, color: roles.main, label: '轻球'},
  {x: 345, r: 32, theta0: THETA0_DEG, color: roles.main, label: '重球'},
  {x: 575, r: 22, theta0: THETA0_SMALL_DEG, color: roles.short, label: `振幅 ${THETA0_SMALL_DEG}°`},
  {x: 770, r: 22, theta0: THETA0_DEG, color: roles.short, label: `振幅 ${THETA0_DEG}°`},
];

export const EP03: React.FC<{voice?: boolean; debugSafe?: boolean}> = ({voice = true, debugSafe = false}) => {
  const frame = useCurrentFrame();
  // 55-60 秒整段冻结：只读到冻结帧
  const f = Math.min(frame, FREEZE_FROM);
  const shot = shotAt(f);
  const S = (n: number) => shots[n - 1];

  // ---------- 镜 1：摆钟
  const tClock = since(f, beats.clock.release);
  const clockOut = fadeOut(f, S(2).from, S(2).from + 15);
  const ticks = Math.floor(tClock / (period(L1) / 2) + 1e-9);

  // ---------- 镜 2：一个单摆
  const sb = beats.single;
  const t2 = since(f, sb.release);
  const th2 = theta(THETA0_DEG, L1, t2);
  const s2In = fadeIn(f, S(2).from + 10, S(2).from + 24);
  const s2Out = fadeOut(f, S(3).from, S(3).from + 16);
  const X2 = 320;

  // ---------- 镜 3：摆长
  const lb = beats.lengths;
  const t3 = since(f, lb.release);
  const s3 = fadeIn(f, lb.in + 12, lb.in + 28) * fadeOut(f, S(4).from, S(4).from + 16);
  const pairX = {long: 290, short: 690};

  // ---------- 镜 4：重量与振幅
  const yb = beats.sync;
  const t4 = since(f, yb.release);
  const s4 = fadeIn(f, yb.in + 12, yb.in + 26) * fadeOut(f, S(5).from, S(5).from + 16);

  // ---------- 镜 5：公式
  const fb = beats.formula;
  const t5 = since(f, fb.release);
  const s5 = fadeIn(f, fb.in, fb.in + 16);
  const X5 = 170;

  const subtitle = subtitleLines(shot);
  const note = subtitleNote(shot);

  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {/* 镜 1 */}
        <Clock t={tClock} L={L1} theta0={THETA0_DEG} opacity={clockOut} />

        {/* 镜 2 */}
        {s2In * s2Out > 0 && (
          <g opacity={s2In * s2Out}>
            <Mount x1={X2 - 110} x2={X2 + 110} y={PIVOT_Y} />
            <Pendulum
              x={X2}
              pivotY={PIVOT_Y}
              lengthPx={px(L1)}
              thetaDeg={th2}
              bobR={26}
              color={roles.main}
              stringProgress={progress(f, sb.stringIn, sb.stringIn + 30)}
              bobScale={settle(f, sb.bobIn, {damping: 12, stiffness: 160})}
              swingDeg={f >= sb.arc ? THETA0_DEG : undefined}
              arc={{thetaDeg: THETA0_DEG, label: smallAngleLabel(THETA0_DEG), opacity: fadeIn(f, sb.arc, sb.arc + 12)}}
            />
            <Label x={X2 + 26} y={PIVOT_Y + 200} color={theme.text} size={28} opacity={fadeIn(f, sb.stringIn + 20, sb.stringIn + 32) * fadeOut(f, sb.arc, sb.arc + 10)}>
              细线
            </Label>
            {(() => {
              const b = bobPosition(X2, PIVOT_Y, px(L1), th2);
              return (
                <Label x={b.x + 44} y={b.y + 10} color={theme.text} size={28} opacity={fadeIn(f, sb.bobIn + 10, sb.bobIn + 22) * fadeOut(f, sb.arc, sb.arc + 10)}>
                  小球
                </Label>
              );
            })()}
            <ThetaChart x={540} y={600} w={330} h={220} t={t2} tMax={3 * period(L1)} L={L1} theta0={THETA0_DEG} color={roles.main} opacity={fadeIn(f, sb.release - 12, sb.release)} />
          </g>
        )}

        {/* 镜 3 */}
        {s3 > 0 && (
          <g opacity={s3}>
            <Mount x1={pairX.long - 110} x2={pairX.short + 110} y={PIVOT_Y} />
            <Pendulum x={pairX.long} pivotY={PIVOT_Y} lengthPx={px(L1)} thetaDeg={theta(THETA0_DEG, L1, t3)} bobR={26} color={roles.main} swingDeg={THETA0_DEG} />
            <Pendulum x={pairX.short} pivotY={PIVOT_Y} lengthPx={px(L_SHORT)} thetaDeg={theta(THETA0_DEG, L_SHORT, t3)} bobR={22} color={roles.short} swingDeg={THETA0_DEG} />
            <Label x={pairX.long - 30} y={PIVOT_Y + 250} color={roles.main} size={32} anchor="end">
              {`${L1} 米`}
            </Label>
            <Label x={pairX.short + 40} y={PIVOT_Y + 70} color={roles.short} size={32}>
              {`${L_SHORT} 米`}
            </Label>
          </g>
        )}

        {/* 镜 4 */}
        {s4 > 0 && (
          <g opacity={s4}>
            <Mount x1={SYNC[0].x - 70} x2={SYNC[3].x + 70} y={PIVOT_Y} />
            {SYNC.map((p) => (
              <g key={p.x}>
                <Pendulum x={p.x} pivotY={PIVOT_Y} lengthPx={px(L1)} thetaDeg={theta(p.theta0, L1, t4)} bobR={p.r} color={p.color} swingDeg={p.theta0} />
                <Label x={p.x} y={PIVOT_Y + px(L1) + 70} color={p.color} size={28} anchor="middle">
                  {p.label}
                </Label>
              </g>
            ))}
          </g>
        )}

        {/* 镜 5 起，镜 6 冻结在这里 */}
        {s5 > 0 && (
          <g opacity={s5}>
            <Mount x1={X5 - 100} x2={X5 + 100} y={PIVOT_Y} />
            <Pendulum x={X5} pivotY={PIVOT_Y} lengthPx={px(L1)} thetaDeg={theta(THETA0_DEG, L1, t5)} bobR={26} color={roles.main} swingDeg={THETA0_DEG} />
            <Label x={X5 - 26} y={PIVOT_Y + 250} color={roles.main} size={32} anchor="end">
              {`${L1} 米`}
            </Label>
          </g>
        )}
      </svg>

      {/* 镜 5 三组数字 */}
      {s5 > 0 && (
        <PeriodTable
          x={400}
          y={466}
          w={480}
          rows={cases.map((c, i) => ({
            c,
            color: c.length_m === L1 ? roles.main : c.length_m === L_SHORT ? roles.short : theme.text,
            show: fadeIn(f, fb.rows[i], fb.rows[i] + 14),
          }))}
          arrows={fadeIn(f, fb.arrows, fb.arrows + 14)}
        />
      )}

      {/* 条件小标签：全片常驻 */}
      <Chip opacity={1} left={ZONE.chip.left} top={ZONE.chip.top} color={theme.accent}>
        摆角 &lt; {SMALL_ANGLE_DEG}° · 大角度不适用本期公式
      </Chip>
      <Chip opacity={1} right={W - ZONE.chip.right} top={ZONE.chip.top}>
        g 取 {g} · 角度画大 {DRAW_GAIN} 倍
      </Chip>

      <Timer
        opacity={clockOut * fadeIn(f, 6, 14)}
        top={470}
        right={W - ZONE.chip.right}
        label="嘀嗒"
        value={String(ticks)}
        unit="下"
        color={theme.accent}
      />

      <CodePanel
        opacity={s2In * s2Out}
        typed={Math.max(0, Math.min(CODE_CHARS, Math.round((f - sb.typeFrom) * 1.6)))}
        cursor={f < sb.release && Math.floor(f / 10) % 2 === 0}
        output={`// t = ${t2.toFixed(2)} s → θ = ${th2 >= 0 ? '+' : '−'}${Math.abs(th2).toFixed(1)}°`}
        outputOpacity={fadeIn(f, sb.release, sb.release + 8)}
        hl={fadeIn(f, sb.arc, sb.arc + 12)}
      />
      <RunPanel
        opacity={s3}
        t={t3}
        rows={[L1, L_SHORT].map((L) => ({
          name: `摆长 ${L} 米`,
          color: L === L1 ? roles.main : roles.short,
          swings: swings(t3, L),
          period: caseOf(L).display_period,
          periodOpacity: fadeIn(f, periodDone(lb.release, L), periodDone(lb.release, L) + 8),
        }))}
        footer={
          <>
            摆长 ×4，周期只 <span style={{color: theme.accent}}>×2</span>（不是 ×4）
          </>
        }
        footerOpacity={fadeIn(f, lb.ratio, lb.ratio + 12)}
      />
      <RunPanel
        opacity={s4}
        t={t4}
        rows={[
          {name: '轻球 · 重球', color: roles.main, swings: swings(t4, L1), period: `都${mainCase.display_period}`, periodOpacity: fadeIn(f, periodDone(yb.release, L1), periodDone(yb.release, L1) + 8)},
          {
            name: `振幅 ${THETA0_SMALL_DEG}° · ${THETA0_DEG}°`,
            color: roles.short,
            swings: swings(t4, L1),
            period: `都${mainCase.display_period}`,
            periodOpacity: fadeIn(f, periodDone(yb.release, L1), periodDone(yb.release, L1) + 8),
          },
        ]}
        footer={
          <>
            摆角 &lt; {SMALL_ANGLE_DEG}° 时，周期<span style={{color: theme.accent}}>基本不变</span>
          </>
        }
        footerOpacity={fadeIn(f, yb.condition, yb.condition + 12)}
      />
      <FormulaPanel opacity={s5} hl={settle(f, fb.hl, {damping: 14})} note={fadeIn(f, fb.note, fb.note + 14)} />

      <Subtitle
        lines={note ? [...subtitle, note] : subtitle}
        opacity={shot.shot === 1 || shot.shot === shots.length ? 1 : fadeIn(f, shot.from, shot.from + 8)}
      />

      <ChapterHeader f={f} />
      {stamps.map((s) => (
        <Stamp key={s.key} spec={s} f={f} />
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
