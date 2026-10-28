import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Label} from './components/Arrow';
import {ChapterHeader} from './components/ChapterHeader';
import {CODE_CHARS, CodePanel} from './components/CodePanel';
import {GlideTrajectory} from './components/GlideTrajectory';
import {Globe, GlobeDefs} from './components/Globe';
import {GridAxes} from './components/GridAxes';
import {ForceArrow, LiftArrow} from './components/LiftArrow';
import {ManeuverArrow} from './components/ManeuverArrow';
import {Chip, GroundMarker, PredictPoint, QuestionMark} from './components/Markers';
import {LayerLabels, NearSpaceBand} from './components/NearSpaceBand';
import {Projectile} from './components/Projectile';
import {Ping, RadarBeam} from './components/RadarBeam';
import {ReactionPanel} from './components/ReactionPanel';
import {Stamp, stampLines} from './components/Stamp';
import {Subtitle} from './components/Subtitle';
import {Trajectory, trajectoryPath} from './components/Trajectory';
import {polyline, project, upDir} from './globe';
import {H, SAFE, toScreen, W, ZONE} from './layout';
import {
  ballistic,
  ballisticPath,
  flightTime,
  GLIDE_A,
  GLIDE_B,
  HOOK_TURN,
  NEAR_SPACE,
  pathAt,
  pathUntil,
  position,
  Pt,
} from './physics';
import {subtitleLines, subtitleNote} from './subtitles';
import {beats, FREEZE_FROM, glideBU, progress, reasonStamps, settle, shotAt, shots, stamps, STAMP_HOLD, tiltAt} from './timeline';
import {alpha, roles, theme} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fadeIn = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const fadeOut = (f: number, a: number, b: number) => interpolate(f, [a, b], [1, 0], clamp);

// 普通弹道从进度 a 画到 b（含助推段）
const ballisticPts = (a: number, b: number, share: number, n = 160): Pt[] =>
  b <= a ? [] : Array.from({length: n + 1}, (_, i) => ballisticPath(a + ((b - a) * i) / n, share));

const S2_SHARE = (beats.ballistic.cut - beats.ballistic.launch) / (beats.ballistic.land - beats.ballistic.launch);
const S4_SHARE = 0.1;
const apexP = (share: number) => share + (1 - share) * (-ballistic.cut.s / ballistic.T);
const LAND: Pt = {s: ballistic.landS, h: 0, l: 0};
const GLIDE_END = pathAt(GLIDE_A, 1);

const typedChars = (f: number) => Math.max(0, Math.min(CODE_CHARS, (f - 2) * 3));

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

// 原因栏：章 03 三个小节的盖章停靠位，大小跟各自的英文盖章一致
const slotSize = (text: string) => {
  const lines = stampLines(text);
  return {w: Math.max(...lines.map((l) => l.length)) * 41 + 100, h: lines.length * 70 + 70};
};
const ReasonSlots: React.FC<{opacity: number}> = ({opacity}) => {
  if (opacity <= 0) return null;
  const {cy, xs, scale} = ZONE.reasons;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}} opacity={opacity}>
      {xs.map((x, i) => {
        const size = slotSize(reasonStamps[i].text);
        const w = size.w * scale;
        const h = size.h * scale;
        return (
        <g key={x}>
          <rect x={x - w / 2} y={cy - h / 2} width={w} height={h} rx={14} fill="none" stroke={alpha(theme.textMuted, 0.35)} strokeWidth={3} strokeDasharray="10 8" />
          <Label x={x} y={cy - h / 2 - 16} color={theme.textMuted} anchor="middle" size={24} weight={700}>
            {`03-${i + 1}`}
          </Label>
        </g>
        );
      })}
    </svg>
  );
};

export const EP02: React.FC<{voice?: boolean; debugSafe?: boolean}> = ({voice = true, debugSafe = false}) => {
  const frame = useCurrentFrame();
  // 67-72 秒整段冻结：只读到冻结帧
  const f = Math.min(frame, FREEZE_FROM);
  const shot = shotAt(f);
  const S = (n: number) => shots[n - 1];
  const tilt = tiltAt(f);

  // ---------- 镜 1：EP01 抛物线画到一半转去滑行
  const hk = beats.hook;
  const T = flightTime;
  const hookOut = fadeOut(f, S(2).from, S(2).from + 18);
  const hookT = interpolate(f, [hk.launch, hk.apex], [0, T / 2], clamp);
  const hookU = progress(f, hk.apex, hk.glideEnd);
  const hookHead = hookU > 0 ? pathAt(HOOK_TURN, hookU) : null;
  const hookBall = hookHead ? toScreen(hookHead.s, hookHead.h) : toScreen(position(hookT).x, Math.max(0, position(hookT).y));
  const hookTurnD = pathUntil(HOOK_TURN, hookU)
    .map((p, i) => {
      const {sx, sy} = toScreen(p.s, p.h);
      return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(2)} ${sy.toFixed(2)}`;
    })
    .join(' ');
  const hookLand = toScreen(position(T).x, 0);
  const qIn = fadeIn(f, hk.question, hk.question + 10);
  const qPulse = 1 + 0.1 * Math.sin((f - hk.question) / 4);

  // ---------- 镜 2：普通弹道
  const bb = beats.ballistic;
  const globeIn = fadeIn(f, bb.globeIn, bb.globeIn + 18);
  const p2 = progress(f, bb.launch, bb.land);
  const s2Out = fadeOut(f, S(3).from, S(3).from + 18);
  const ghost = interpolate(f, [S(3).from, S(3).from + 20], [1, 0.3], clamp);
  const flying2 = f >= bb.launch && f < bb.land;
  const head2 = ballisticPath(p2, S2_SHARE);
  const head2s = project(head2, tilt);
  const ahead2 = project(ballisticPath(Math.min(1, p2 + 0.004), S2_SHARE), tilt);
  const vel2 = (() => {
    const n = Math.hypot(ahead2.x - head2s.x, ahead2.y - head2s.y) || 1;
    return {x: (ahead2.x - head2s.x) / n, y: (ahead2.y - head2s.y) / n};
  })();
  const down2 = (() => {
    const u = upDir(head2, tilt);
    return {x: -u.x, y: -u.y};
  })();
  const forces = fadeIn(f, bb.cut + 4, bb.cut + 14) * fadeOut(f, bb.land - 12, bb.land);
  const cutPt = project(ballistic.cut, tilt);
  const launchPt = project({s: ballistic.launchS, h: 0, l: 0}, tilt);
  const landPt = project(LAND, tilt);
  const predictSweep = progress(f, bb.predict, bb.predictEnd);
  const apex2 = apexP(S2_SHARE);
  const landed = settle(f, bb.land, {damping: 14, stiffness: 180});

  // ---------- 镜 3：升力滑翔
  const gb = beats.glide;
  const uA = progress(f, gb.launch, gb.land);
  const s3Out = fadeOut(f, S(4).from, S(4).from + 18);
  const liftOn = uA > gb.lift && uA < gb.liftEnd ? 1 : 0;
  const liftIn = Math.min(fadeIn(uA, gb.lift, gb.lift + 0.04), fadeOut(uA, gb.liftEnd - 0.04, gb.liftEnd));
  const turnF = gb.launch + gb.turn * (gb.land - gb.launch);
  const glideLanded = settle(f, gb.land, {damping: 14, stiffness: 180});

  // ---------- 镜 4：看得晚
  const rb = beats.radar;
  const radarOn = fadeIn(f, rb.in, rb.in + 15) * fadeOut(f, S(5).from, S(5).from + 18);
  const p4 = progress(f, rb.launch, rb.arrive);
  const seenB = progress(rb.seenBallistic, rb.launch, rb.arrive);
  const seenG = progress(rb.seenGlide, rb.launch, rb.arrive);
  const r03 = reasonStamps[0];
  const reactionOut = fadeOut(f, r03.hitAt - 7, r03.hitAt + 5);

  // ---------- 镜 5：够不着
  const lb = beats.layers;
  const layersOn = fadeIn(f, lb.in, lb.in + 20) * fadeOut(f, S(6).from, S(6).from + 18);
  const u5 = progress(f, lb.glideFrom, lb.glideTo);
  const reach = progress(f, lb.reach, lb.reach + 20);

  // ---------- 镜 6：算不准
  const mb = beats.maneuver;
  const s6In = fadeIn(f, S(6).from + 5, S(6).from + 25);
  const uB = glideBU(f);

  // 普通弹道的“固定抛物线”虚影：镜 3 起一直留着作对照
  const ghostOpacity = f < S(3).from ? 0 : f < S(4).from ? ghost * s3Out : f < S(5).from ? 0 : fadeIn(f, S(5).from + 10, S(5).from + 30) * 0.3;

  const subtitle = subtitleLines(shot);
  const note = subtitleNote(shot);

  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <GlobeDefs />

        {/* 镜 1 */}
        {hookOut > 0 && (
          <g opacity={hookOut}>
            <GridAxes />
            <Trajectory d={trajectoryPath(T)} color={roles.ballistic} width={4} glow={0} dash="10 12" opacity={0.45 * fadeIn(f, hk.launch, hk.launch + 10)} />
            <GroundMarker x={hookLand.sx} y={hookLand.sy} color={roles.ballistic} progress={fadeIn(f, hk.launch + 10, hk.launch + 22)} label="Predicted landing" dy={-34} />
            <Trajectory d={trajectoryPath(hookT)} color={roles.ballistic} />
            <Trajectory d={hookTurnD} color={roles.glide} />
            {f >= hk.launch && <Projectile x={hookBall.sx} y={hookBall.sy} color={hookHead ? roles.glide : roles.ballistic} />}
            <QuestionMark x={hookLand.sx} y={hookLand.sy - 84} opacity={qIn} scale={qPulse} />
            <QuestionMark x={hookBall.sx + 4} y={hookBall.sy - 40} opacity={qIn} scale={qPulse} />
          </g>
        )}

        {/* 地球：镜 2 起 */}
        <Globe tilt={tilt} opacity={globeIn} />

        {/* 镜 5：分层 */}
        <NearSpaceBand opacity={layersOn} highlight={progress(f, lb.band, lb.band + 20)} />

        {/* 普通弹道虚影 */}
        {ghostOpacity > 0 && (
          <Trajectory d={polyline(ballisticPts(0, 1, S2_SHARE), tilt)} color={roles.ballistic} width={4} glow={0} dash="12 10" opacity={ghostOpacity} />
        )}
        {(() => {
          const apex = project({s: 0, h: ballistic.cut.h + ballistic.vy ** 2 / (2 * ballistic.g), l: 0}, tilt);
          return (
            <Label x={apex.x} y={apex.y - 22} color={roles.ballistic} anchor="middle" size={28} opacity={fadeIn(f, S(6).from + 20, S(6).from + 35) * 0.9}>
              Fixed parabola: predictable
            </Label>
          );
        })()}

        {/* 镜 2 */}
        {f >= bb.launch && s2Out > 0 && (
          <g opacity={s2Out}>
            <Trajectory d={polyline(ballisticPts(0, Math.min(p2, S2_SHARE), S2_SHARE), tilt)} color={theme.accent} width={9} glow={8} />
            {predictSweep > 0 && (
              <Trajectory
                d={polyline(ballisticPts(apex2, apex2 + (1 - apex2) * predictSweep, S2_SHARE), tilt)}
                color={roles.ballistic}
                width={4}
                glow={0}
                dash="12 10"
              />
            )}
            <Trajectory d={polyline(ballisticPts(S2_SHARE, p2, S2_SHARE), tilt)} color={roles.ballistic} />
            <Label x={launchPt.x + 22} y={launchPt.y - 40} color={theme.accent} size={28} opacity={fadeIn(f, bb.launch + 8, bb.launch + 18)}>
              Boost
            </Label>
            <GroundMarker
              x={cutPt.x}
              y={cutPt.y}
              color={theme.accent}
              progress={settle(f, bb.cut, {damping: 14, stiffness: 180})}
              label="Engine off"
              labelColor={theme.accent}
              dx={26}
              dy={40}
              anchor="start"
            />
            <Label x={70} y={530} color={roles.ballistic} size={28} opacity={fadeIn(f, bb.predict - 30, bb.predict - 18)}>
              Seen: first half
            </Label>
            <Label x={700} y={530} color={roles.ballistic} size={28} opacity={fadeIn(f, bb.predictEnd - 8, bb.predictEnd + 4)}>
              Worked out: rest
            </Label>
            <GroundMarker
              x={landPt.x}
              y={landPt.y}
              color={roles.ballistic}
              progress={fadeIn(f, bb.predictEnd - 6, bb.predictEnd + 6)}
              label={f >= bb.land ? '✓ Lands as predicted' : 'Predicted landing'}
              labelColor={f >= bb.land ? roles.ok : theme.text}
              dx={30}
              dy={-36 - 8 * landed}
              anchor="end"
            />
            {flying2 && (
              <>
                <ForceArrow x={head2s.x} y={head2s.y} dir={vel2} length={86} color={theme.text} label="Inertia" opacity={forces} />
                <ForceArrow x={head2s.x} y={head2s.y} dir={down2} length={70} color={theme.accent} label="Gravity" opacity={forces} labelSide="left" />
              </>
            )}
            {f >= bb.launch && <Projectile x={head2s.x} y={head2s.y} color={p2 < S2_SHARE ? theme.accent : roles.ballistic} />}
          </g>
        )}

        {/* 镜 3 */}
        {f >= gb.launch && s3Out > 0 && (
          <g opacity={s3Out}>
            <GroundMarker
              x={landPt.x}
              y={landPt.y}
              color={alpha(roles.ballistic, 0.6)}
              progress={0.8}
              label="Parabola landing"
              labelColor={alpha(theme.textMuted, 0.9)}
              dx={30}
              dy={44}
              anchor="end"
            />
            <GlideTrajectory path={GLIDE_A} u={uA} tilt={tilt} color={roles.glide} />
            <ManeuverArrow
              center={{s: 50, h: 150, l: -175}}
              radius={175}
              from={Math.PI / 2}
              to={Math.PI / 9}
              tilt={tilt}
              color={theme.accent}
              progress={progress(f, turnF - 6, turnF + 30)}
            />
            {liftOn > 0 && <LiftArrow p={pathAt(GLIDE_A, uA)} tilt={tilt} color={theme.accent} opacity={liftIn} />}
            {(() => {
              const e = project(GLIDE_END, tilt);
              return (
                <GroundMarker x={e.x} y={e.y} color={roles.glide} progress={glideLanded} label="Glide landing" labelColor={roles.glide} dy={-34} />
              );
            })()}
          </g>
        )}

        {/* 镜 4 */}
        <RadarBeam
          opacity={radarOn}
          horizon={progress(f, rb.horizon, rb.horizon + 25)}
          blind={fadeIn(f, rb.blind, rb.blind + 20)}
          sweep={f / 9}
        />
        {radarOn > 0 && f >= rb.launch && (
          <g opacity={radarOn}>
            <Trajectory d={polyline(ballisticPts(0, Math.min(p4, seenB), S4_SHARE), 0)} color={roles.ballistic} opacity={0.35} glow={0} />
            <Trajectory d={polyline(ballisticPts(seenB, p4, S4_SHARE), 0)} color={roles.ballistic} />
            <GlideTrajectory path={GLIDE_A} u={Math.min(p4, seenG)} tilt={0} color={roles.glide} opacity={0.4} head={p4 < seenG} glow={0} />
            {p4 > seenG && <GlideTrajectory path={GLIDE_A} from={seenG} u={p4} tilt={0} color={roles.glide} />}
            {(() => {
              const b = project(ballisticPath(p4, S4_SHARE), 0);
              const bs = project(ballisticPath(seenB, S4_SHARE), 0);
              const gs = project(pathAt(GLIDE_A, seenG), 0);
              return (
                <>
                  <Projectile x={b.x} y={b.y} color={roles.ballistic} opacity={p4 < seenB ? 0.45 : 1} />
                  <Ping x={bs.x} y={bs.y} f={f} at={rb.seenBallistic} color={roles.ballistic} label="Seen early" />
                  <Ping x={gs.x} y={gs.y} f={f} at={rb.seenGlide} color={roles.glide} label="Seen late" side="left" />
                </>
              );
            })()}
          </g>
        )}

        {/* 镜 5 */}
        {layersOn > 0 && (
          <g opacity={layersOn}>
            <GlideTrajectory path={GLIDE_A} u={u5} tilt={0} color={roles.glide} />
            {reach > 0 &&
              (() => {
                const s = -60;
                const lo = project({s, h: 4, l: 0}, 0);
                const loEnd = project({s, h: NEAR_SPACE.lo - 6, l: 0}, 0);
                const hi = project({s, h: 330, l: 0}, 0);
                const hiEnd = project({s: s, h: NEAR_SPACE.hi + 6, l: 0}, 0);
                const lerp = (a: {x: number; y: number}, b: {x: number; y: number}) => ({x: a.x + (b.x - a.x) * reach, y: a.y + (b.y - a.y) * reach});
                const l2 = lerp(lo, loEnd);
                const h2 = lerp(hi, hiEnd);
                const X: React.FC<{x: number; y: number; c: string}> = ({x, y, c}) => (
                  <g stroke={c} strokeWidth={5} strokeLinecap="round" opacity={reach >= 1 ? 1 : 0}>
                    <line x1={x - 11} y1={y - 11} x2={x + 11} y2={y + 11} />
                    <line x1={x + 11} y1={y - 11} x2={x - 11} y2={y + 11} />
                  </g>
                );
                return (
                  <>
                    <line x1={lo.x} y1={lo.y} x2={l2.x} y2={l2.y} stroke={roles.airDefense} strokeWidth={5} strokeDasharray="8 7" strokeLinecap="round" />
                    <line x1={hi.x} y1={hi.y} x2={h2.x} y2={h2.y} stroke={roles.space} strokeWidth={5} strokeDasharray="8 7" strokeLinecap="round" />
                    <X x={loEnd.x} y={loEnd.y} c={roles.airDefense} />
                    <X x={hiEnd.x} y={hiEnd.y} c={roles.space} />
                  </>
                );
              })()}
          </g>
        )}
        <g opacity={layersOn}>
          <LayerLabels band={fadeIn(f, lb.band, lb.band + 12)} airDefense={fadeIn(f, lb.airDefense, lb.airDefense + 12)} space={fadeIn(f, lb.space, lb.space + 12)} />
        </g>

        {/* 镜 6 起，镜 7 冻结在这里 */}
        {s6In > 0 && (
          <g opacity={s6In}>
            {mb.predictions.map((pr, i) => {
              const from = project(pathAt(GLIDE_B, glideBU(pr.at)), tilt);
              const to = project(pr.pt, tilt);
              const appear = progress(f, pr.at, pr.at + 12);
              const fail = i < mb.fails.length ? progress(f, mb.fails[i], mb.fails[i] + 10) : 0;
              return (
                appear > 0 && (
                  <g key={pr.at}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={from.x + (to.x - from.x) * appear}
                      y2={from.y + (to.y - from.y) * appear}
                      stroke={alpha(theme.accent, 0.75 * (1 - 0.6 * fail))}
                      strokeWidth={3}
                      strokeDasharray="10 9"
                    />
                    <PredictPoint x={to.x} y={to.y} appear={appear} fail={fail} label={i === 0 ? 'Predicted point' : 'Recalculate'} anchor={i === 1 ? 'end' : i === 2 ? 'middle' : 'start'} below={i === 2} />
                  </g>
                )
              );
            })}
            <GlideTrajectory path={GLIDE_B} u={uB} tilt={tilt} color={roles.glide} />
          </g>
        )}
      </svg>

      {/* 示意图小注：所有轨迹画面都在 */}
      <Chip opacity={1} left={ZONE.chip.left} top={ZONE.chip.top}>
        Schematic · not to scale, no real data
      </Chip>
      <Chip opacity={hookOut} right={W - ZONE.chip.right} top={ZONE.chip.top} color={roles.ballistic}>
        EP01 recap: landing is predictable
      </Chip>
      <Chip opacity={fadeIn(f, gb.chip, gb.chip + 12) * s3Out} right={W - ZONE.chip.right} top={ZONE.chip.top} color={theme.accent}>
        70+ years ago · Qian Xuesen’s idea
      </Chip>

      <CodePanel
        opacity={fadeOut(f, S(4).from, S(4).from + 15)}
        typed={typedChars(f)}
        cursor={f < 40 && Math.floor(f / 10) % 2 === 0}
        comment={f < S(2).from ? '// EP01: landing is predictable' : f < gb.codeNote ? '// engine off: inertia + gravity only' : '// new idea: add lift'}
        xNote={{text: '// inertia', color: theme.text, opacity: fadeIn(f, bb.predict, bb.predict + 10)}}
        yNote={
          f < S(2).from
            ? {text: '// landing?', color: theme.accent, opacity: qIn}
            : f < gb.codeNote
              ? {text: '// gravity', color: theme.accent, opacity: fadeIn(f, bb.predict, bb.predict + 10)}
              : {text: '// not just gravity', color: theme.accent, opacity: 1}
        }
        strike={fadeIn(uA, gb.lift, gb.lift + 0.05)}
      />
      <ReactionPanel
        opacity={fadeIn(f, rb.launch, rb.launch + 12) * reactionOut}
        f={f}
        seen={{ballistic: rb.seenBallistic, glide: rb.seenGlide}}
        arrive={rb.arrive}
      />
      <ReasonSlots opacity={fadeIn(f, r03.hitAt + STAMP_HOLD, r03.hitAt + STAMP_HOLD + 12)} />

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

