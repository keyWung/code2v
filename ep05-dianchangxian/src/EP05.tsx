import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Label} from './components/Arrow';
import {Cell, RuleCard} from './components/Cell';
import {ChapterHeader} from './components/ChapterHeader';
import {Charge} from './components/Charge';
import {Chip} from './components/Chip';
import {CODE_CHARS, CodePanel} from './components/CodePanel';
import {ARC_INDEX, ARC_TOP, Dipole, MID, OPPOSITE_LINES, pairCharges, PARTICLE_PATH} from './components/Dipole';
import {FieldLine} from './components/FieldLine';
import {FieldTable} from './components/FieldTable';
import {Stamp} from './components/Stamp';
import {Subtitle} from './components/Subtitle';
import {UniformField} from './components/UniformField';
import {VectorArrow} from './components/VectorArrow';
import {CENTER, CHARGE_R, E_PX, GRID, H, HOOK, LEFT, SAFE, STAGE, STAGE_TALL_BOTTOM, W, ZONE} from './layout';
import {cases, fieldAt, fieldE, FORMULA, K_TEXT, pathLength, pointAlong, PX_PER_M, Q, Q_TEXT, sciText, type Pt} from './physics';
import {subtitleLines, subtitleNote} from './subtitles';
import {beats, FREEZE_FROM, progress, settle, shotAt, shots, stamps} from './timeline';
import {alpha, fonts, roles, theme} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fadeIn = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const fadeOut = (f: number, a: number, b: number) => interpolate(f, [a, b], [1, 0], clamp);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const eased = (f: number, a: number, b: number, from: number, to: number) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: Easing.inOut(Easing.cubic)});
const rad = (d: number) => (d * Math.PI) / 180;
const dirOf = (deg: number): Pt => ({x: Math.cos(rad(deg)), y: Math.sin(rad(deg))});
const at = (o: Pt, deg: number, r: number): Pt => ({x: o.x + Math.cos(rad(deg)) * r, y: o.y + Math.sin(rad(deg)) * r});

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

// ---------- 镜 1-4：单个正电荷，场强处处沿半径向外，电场线是直线，画到舞台边框为止
const rayEnd = (o: Pt, d: Pt, bottom: number): Pt => {
  const ts = [
    d.x > 0 ? (STAGE.right - o.x) / d.x : d.x < 0 ? (STAGE.left - o.x) / d.x : Infinity,
    d.y > 0 ? (bottom - o.y) / d.y : d.y < 0 ? (STAGE.top - o.y) / d.y : Infinity,
  ];
  const t = Math.min(...ts);
  return {x: o.x + d.x * t, y: o.y + d.y * t};
};
const ARROW_R = 200;
const radial = (o: Pt, n: number, bottom: number) =>
  Array.from({length: n}, (_, i) => {
    const deg = (360 * i) / n;
    const d = dirOf(deg);
    const end = rayEnd(o, d, bottom);
    const len = Math.hypot(end.x - o.x, end.y - o.y) - CHARGE_R;
    return {deg, pts: [{x: o.x + d.x * CHARGE_R, y: o.y + d.y * CHARGE_R}, end], arrowAt: (ARROW_R - CHARGE_R) / len};
  });

// 镜 2：线的条数是人定的
const COUNTS = [16, 8, 24, 16];

// 镜 2 放大镜：P 在 -45° 那条线上
const P_DEG = -45;
const P = at(HOOK, P_DEG, 150);
const LENS = {x: 785, y: 640, r: 105};

// 镜 3：同样大的两个圈沿 0° 那条线一近一远；场强箭头放在四条斜线的 0.1 米和 0.2 米处
const WIN_R = 40;
const NEAR = at(CENTER, 0, 100);
const FAR = at(CENTER, 0, 330);
const ARROW_DEGS = [45, 135, 225, 315];
const PROBE_DEG = -22.5;

// 镜 4：同一条线上，0.1 米和 0.2 米
const R1 = cases[0].r_m;
const R2 = cases[1].r_m;
const ePx = (r: number) => fieldE(Q, r) * E_PX;
const ratioText = (r: number) => {
  const k = fieldE(Q, R1) / fieldE(Q, r);
  return Math.abs(k - 1) < 1e-9 ? '1' : `1/${Math.round(k)}`;
};

export const EP05: React.FC<{voice?: boolean; debugSafe?: boolean}> = ({voice = true, debugSafe = false}) => {
  const frame = useCurrentFrame();
  // 55-60 秒整段冻结：只读到冻结帧
  const f = Math.min(frame, FREEZE_FROM);
  const shot = shotAt(f);
  const S = (n: number) => shots[n - 1];
  const hb = beats.hook;
  const mb = beats.model;
  const db = beats.dense;
  const xb = beats.double;
  const pb = beats.patterns;

  // ---------- 镜 1-4 的电荷：镜 4 开头移到左边，镜 5 开头淡出
  const single = fadeOut(f, S(5).from, S(5).from + 12);
  const o: Pt = {x: eased(f, xb.move, xb.move + 24, CENTER.x, LEFT.x), y: eased(f, S(3).from, S(3).from + 24, HOOK.y, CENTER.y)};
  const bottom = eased(f, S(3).from, S(3).from + 24, STAGE_TALL_BOTTOM, STAGE.bottom);
  const pulse = f < hb.lines ? 1 + 0.06 * Math.sin((f / 30) * Math.PI * 2) : 1;

  // 镜 1 逐条画出；镜 2 换几种条数；镜 4 起变暗，突出探针
  const phases = f < S(2).from ? [{n: 16, from: 0, to: Infinity}] : COUNTS.map((n, i) => ({n, from: [0, mb.count8, mb.count24, mb.count16][i], to: [mb.count8, mb.count24, mb.count16, Infinity][i]}));
  const lineDim = f >= xb.move ? lerp(1, 0.5, fadeIn(f, xb.move, xb.move + 20)) : 1;
  const countLabel = f >= mb.count8 && f < mb.count16 + 24 ? phases.find((p) => f >= p.from && f < p.to)?.n ?? 16 : 0;
  // 画了场强箭头的线，把线上自带的方向箭头收起来，免得两种箭头叠在一起
  const hideArrow = (deg: number) =>
    (f >= db.strong && f < S(4).from && ARROW_DEGS.includes(deg)) || (f >= xb.p1 && deg === 0);

  // ---------- 镜 2 放大镜
  const lens = fadeIn(f, mb.lens, mb.lens + 12) * fadeOut(f, S(3).from, S(3).from + 12);
  const tangent = progress(f, mb.tangent, mb.tangent + 14);
  const fieldIn = progress(f, mb.field, mb.field + 12);
  const match = fadeIn(f, mb.match, mb.match + 10);
  const eAtP = fieldAt([{...HOOK, q: Q}], P);
  const eDir = {x: eAtP.x / Math.hypot(eAtP.x, eAtP.y), y: eAtP.y / Math.hypot(eAtP.x, eAtP.y)};

  // ---------- 镜 3
  const dense3 = fadeOut(f, S(4).from, S(4).from + 12);
  const nearWin = fadeIn(f, db.near, db.near + 10);
  const farWin = fadeIn(f, db.far, db.far + 10);
  const probeR = eased(f, db.probe, db.probe + 90, R1, 0.26);
  const probeOn = fadeIn(f, db.probe - 8, db.probe + 4);

  // ---------- 镜 4：探针从 0.1 米滑到 0.2 米，箭头每帧按 E 现算
  const r4 = eased(f, xb.slide, xb.p2, R1, R2);
  const p4 = fadeIn(f, xb.p1, xb.p1 + 10);
  // 探针滑走后，0.1 米处的箭头留在原地
  const ghost = fadeIn(f, xb.slide, xb.slide + 8);
  const quarter = fadeIn(f, xb.quarter, xb.quarter + 10);

  // ---------- 镜 5
  const grid = fadeIn(f, pb.in + 6, pb.in + 22);
  const dip = settle(f, pb.dipole, {damping: 12, stiffness: 160});
  const same = settle(f, pb.same, {damping: 12, stiffness: 160});
  const arc = OPPOSITE_LINES[ARC_INDEX];
  const tangents = [0.3, 0.55, 0.8].map((t) => {
    const {p} = pointAlong(arc, t);
    const e = fieldAt(pairCharges(false), p);
    const n = Math.hypot(e.x, e.y);
    return {p, dir: {x: e.x / n, y: e.y / n}};
  });
  const tanIn = fadeIn(f, pb.dipoleLines + 30, pb.dipoleLines + 40);
  const pathHl = fadeIn(f, pb.path, pb.path + 10);
  const pathP = progress(f, pb.path + 8, pb.path + 62);
  const particle = pointAlong(PARTICLE_PATH, pathP).p;
  const pathShown = (() => {
    const total = pathLength(PARTICLE_PATH);
    const out = [PARTICLE_PATH[0]];
    for (let i = 1; i < PARTICLE_PATH.length && pathLength(out) < total * pathP; i++) out.push(PARTICLE_PATH[i]);
    return out;
  })();
  const rules = [
    {text: '切线方向 = 场强方向', on: fadeIn(f, pb.in + 24, pb.in + 34), at: -1},
    {text: '线密场强，线稀场弱', on: fadeIn(f, pb.in + 30, pb.in + 40), at: -1},
    {text: '起于正，止于负或无穷远', on: fadeIn(f, pb.dipoleLines + 20, pb.dipoleLines + 30), at: pb.dipoleLines + 20},
    {text: '不相交，也不闭合', on: fadeIn(f, pb.cross, pb.cross + 10), at: pb.cross},
    {text: '不是粒子的运动轨迹', on: fadeIn(f, pb.path, pb.path + 10), at: pb.path},
  ].map((r) => ({text: r.text, on: r.on, hl: r.at < 0 ? 0 : fadeIn(f, r.at, r.at + 8) * fadeOut(f, r.at + 50, r.at + 64)}));

  const subtitle = subtitleLines(shot);
  const note = subtitleNote(shot);

  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="stage-clip">
            <rect x={STAGE.left} y={STAGE.top} width={STAGE.right - STAGE.left} height={STAGE.bottom - STAGE.top} />
          </clipPath>
        </defs>

        {/* 镜 1-4：单个正电荷 */}
        {single > 0 && (
          <g opacity={single}>
            {phases.map((ph) => {
              const op = (ph.from === 0 ? 1 : fadeIn(f, ph.from, ph.from + 10)) * (ph.to === Infinity ? 1 : fadeOut(f, ph.to, ph.to + 10));
              if (op <= 0) return null;
              return (
                <g key={`n-${ph.n}-${ph.from}`} opacity={op * lineDim}>
                  {radial(o, ph.n, bottom).map((l, i) => (
                    <FieldLine key={`r-${i}`} pts={l.pts} arrowAt={hideArrow(l.deg) ? 0 : l.arrowAt} progress={f < S(2).from ? progress(f, hb.lines + 3 * i, hb.lines + 3 * i + 14) : 1} />
                  ))}
                </g>
              );
            })}
            <Charge x={o.x} y={o.y} q={1} scale={pulse} glow={f < hb.lines ? 0.12 + 0.1 * Math.sin((f / 30) * Math.PI * 2) ** 2 : 0.12} />
            <Label x={HOOK.x + 310} y={HOOK.y - 190} color={theme.accent} size={110} weight={900} anchor="middle" opacity={settle(f, hb.ask, {damping: 12, stiffness: 140}) * fadeOut(f, S(2).from, S(2).from + 10)}>
              ?
            </Label>
            {countLabel > 0 && (
              <Label x={HOOK.x} y={bottom - 18} color={theme.accent} size={34} anchor="middle">
                {`画 ${countLabel} 条也行`}
              </Label>
            )}

            {/* 镜 2：放大一点，切线方向和算出来的场强方向重合 */}
            {lens > 0 && (
              <g opacity={lens}>
                <circle cx={P.x} cy={P.y} r={18} fill="none" stroke={theme.accent} strokeWidth={3} />
                {[1, -1].map((s) => {
                  const u = {x: (LENS.x - P.x) / Math.hypot(LENS.x - P.x, LENS.y - P.y), y: (LENS.y - P.y) / Math.hypot(LENS.x - P.x, LENS.y - P.y)};
                  const n = {x: -u.y * s, y: u.x * s};
                  return <line key={`z-${s}`} x1={P.x + n.x * 18} y1={P.y + n.y * 18} x2={LENS.x + n.x * LENS.r} y2={LENS.y + n.y * LENS.r} stroke={alpha(theme.accent, 0.6)} strokeWidth={2} />;
                })}
                <circle cx={LENS.x} cy={LENS.y} r={LENS.r} fill={theme.bg} stroke={theme.accent} strokeWidth={4} />
                <FieldLine pts={[at(LENS, P_DEG + 180, LENS.r - 6), at(LENS, P_DEG, LENS.r - 6)]} width={6} arrowAt={0} />
                <VectorArrow p={LENS} dir={eDir} len={74 * fieldIn} opacity={fieldIn > 0 ? 1 : 0} width={9} />
                {tangent > 0 && (
                  <line
                    x1={at(LENS, P_DEG + 180, 80).x}
                    y1={at(LENS, P_DEG + 180, 80).y}
                    x2={lerp(at(LENS, P_DEG + 180, 80).x, at(LENS, P_DEG, 80).x, tangent)}
                    y2={lerp(at(LENS, P_DEG + 180, 80).y, at(LENS, P_DEG, 80).y, tangent)}
                    stroke={roles.path}
                    strokeWidth={4}
                    strokeDasharray="10 8"
                  />
                )}
                <circle cx={LENS.x} cy={LENS.y} r={7} fill={theme.text} />
                {/* 标签顺着线写：切线在线的左上侧，场强在右下侧 */}
                <g transform={`translate(${at(LENS, P_DEG + 180, 44).x} ${at(LENS, P_DEG + 180, 44).y}) rotate(${P_DEG}) translate(0 -16)`}>
                  <Label x={0} y={0} color={roles.path} size={22} anchor="middle" opacity={tangent}>
                    切线方向
                  </Label>
                </g>
                <g transform={`translate(${at(LENS, P_DEG, 40).x} ${at(LENS, P_DEG, 40).y}) rotate(${P_DEG}) translate(0 36)`}>
                  <Label x={0} y={0} color={roles.field} size={22} anchor="middle" opacity={fieldIn}>
                    场强 E
                  </Label>
                </g>
                <Label x={LENS.x} y={LENS.y + LENS.r + 46} color={theme.accent} size={32} anchor="middle" opacity={match}>
                  ✓ 方向一致
                </Label>
              </g>
            )}

            {/* 镜 3：近处线密、箭头长；远处线稀、箭头短 */}
            {dense3 > 0 && f >= db.in && (
              <g opacity={dense3}>
                {[
                  {c: NEAR, on: nearWin, label: '线密', more: '场强', at1: db.dense, at2: db.strong, color: theme.accent},
                  {c: FAR, on: farWin, label: '线稀', more: '场弱', at1: db.sparse, at2: db.weak, color: theme.text},
                ].map((w) =>
                  w.on > 0 ? (
                    <g key={w.label} opacity={w.on}>
                      <circle cx={w.c.x} cy={w.c.y} r={WIN_R} fill={alpha(w.color, 0.08)} stroke={w.color} strokeWidth={3} strokeDasharray="9 7" />
                      <Label x={w.c.x} y={w.c.y - WIN_R - 16} color={w.color} size={30} anchor="middle" opacity={fadeIn(f, w.at1, w.at1 + 10)}>
                        {f >= w.at2 ? `${w.label} → ${w.more}` : w.label}
                      </Label>
                    </g>
                  ) : null,
                )}
                {ARROW_DEGS.flatMap((deg) =>
                  [
                    {r: R1, on: fadeIn(f, db.strong, db.strong + 12)},
                    {r: R2, on: fadeIn(f, db.weak, db.weak + 12)},
                  ].map((a) => (
                    <VectorArrow key={`a-${deg}-${a.r}`} p={at(CENTER, deg, a.r * PX_PER_M)} dir={dirOf(deg)} len={ePx(a.r) * a.on} opacity={a.on > 0 ? 1 : 0} />
                  )),
                )}
                {probeOn > 0 && (
                  <g opacity={probeOn}>
                    <circle cx={at(CENTER, PROBE_DEG, probeR * PX_PER_M).x} cy={at(CENTER, PROBE_DEG, probeR * PX_PER_M).y} r={13} fill="none" stroke={theme.text} strokeWidth={3} />
                    <VectorArrow p={at(CENTER, PROBE_DEG, probeR * PX_PER_M)} dir={dirOf(PROBE_DEG)} len={ePx(probeR)} />
                  </g>
                )}
              </g>
            )}

            {/* 镜 4：同一条线上 0.1 米和 0.2 米 */}
            {f >= xb.move && (
              <g>
                <g clipPath="url(#stage-clip)">
                  {[
                    {r: R1, on: fadeIn(f, xb.p1, xb.p1 + 10), deg: 52},
                    {r: R2, on: fadeIn(f, xb.p2, xb.p2 + 10), deg: 50},
                  ].map((d) => (
                    <g key={`arc-${d.r}`} opacity={d.on}>
                      <circle cx={LEFT.x} cy={LEFT.y} r={d.r * PX_PER_M} fill="none" stroke={alpha(theme.textMuted, 0.7)} strokeWidth={2.5} strokeDasharray="8 9" />
                      <Label x={at(LEFT, d.deg, d.r * PX_PER_M).x + 12} y={at(LEFT, d.deg, d.r * PX_PER_M).y + 30} color={theme.textMuted} size={28}>
                        {`${d.r} m`}
                      </Label>
                    </g>
                  ))}
                </g>
                <VectorArrow p={at(LEFT, 0, R1 * PX_PER_M)} dir={dirOf(0)} len={ePx(R1)} opacity={ghost} />
                <VectorArrow p={at(LEFT, 0, r4 * PX_PER_M)} dir={dirOf(0)} len={ePx(r4)} opacity={p4} />
                <Label x={LEFT.x + R1 * PX_PER_M + ePx(R1) / 2} y={LEFT.y - 34} color={roles.field} size={32} anchor="middle" opacity={fadeIn(f, xb.e1, xb.e1 + 10)}>
                  {`${sciText(fieldE(Q, R1))} N/C`}
                </Label>
                <Label x={LEFT.x + R2 * PX_PER_M + ePx(R2) / 2} y={LEFT.y + 62} color={roles.field} size={32} anchor="middle" opacity={fadeIn(f, xb.e2, xb.e2 + 10)}>
                  {`${sciText(fieldE(Q, R2))} N/C`}
                </Label>
                <Label x={LEFT.x + R2 * PX_PER_M + ePx(R2) + 18} y={LEFT.y - 18} color={theme.accent} size={40} weight={900} opacity={quarter}>
                  {`× ${ratioText(R2)}`}
                </Label>
                <Label x={STAGE.right - 10} y={540} color={theme.accent} size={30} anchor="end" opacity={quarter}>
                  ✓ 距离翻倍，场强只剩 1/4
                </Label>
                <Label x={STAGE.right - 10} y={586} color={theme.textMuted} size={28} anchor="end" opacity={quarter}>
                  ✗ 不是 1/2
                </Label>
              </g>
            )}
          </g>
        )}

        {/* 镜 5 起，镜 6 冻结在这里：三张典型图 + 读图规则 */}
        <Cell index={0} title="等量异种电荷" opacity={grid} lit={Math.min(1, dip)} hl={pathHl * fadeOut(f, pb.path + 70, pb.path + 90)}>
          <Dipole charges={dip} lines={progress(f, pb.dipoleLines, pb.dipoleLines + 30)} lineOpacity={1 - 0.45 * pathHl} highlight={pathHl} />
          {tangents.map((t, i) => (
            <VectorArrow key={`t-${i}`} p={t.p} dir={t.dir} len={34} width={5} opacity={tanIn * (1 - pathHl)} />
          ))}
          {pathHl > 0 && (
            <g>
              <FieldLine pts={arc} width={5} color={theme.text} opacity={pathHl} arrowAt={0.62} />
              <FieldLine pts={pathShown} width={4} color={roles.path} dashed arrowAt={0} opacity={pathHl} />
              <circle cx={particle.x} cy={particle.y} r={10} fill={roles.path} opacity={pathHl} />
              <Label x={ARC_TOP.x - 40} y={ARC_TOP.y - 16} color={theme.text} size={22} anchor="end" opacity={pathHl}>
                电场线
              </Label>
              <Label x={GRID.w - 12} y={ARC_TOP.y - 6} color={roles.path} size={22} anchor="end" opacity={fadeIn(f, pb.path + 40, pb.path + 50)}>
                粒子轨迹
              </Label>
            </g>
          )}
        </Cell>
        <Cell index={1} title="等量同种电荷" opacity={grid} lit={Math.min(1, same)}>
          <Dipole like charges={same} lines={progress(f, pb.sameLines, pb.sameLines + 30)} />
          {f >= pb.sameLines + 24 && (
            <g opacity={fadeIn(f, pb.sameLines + 24, pb.sameLines + 34)}>
              <circle cx={MID.x} cy={MID.y} r={9} fill="none" stroke={theme.accent} strokeWidth={3} />
              <Label x={MID.x} y={MID.y + 48} color={theme.accent} size={24} anchor="middle">
                中点 E = 0
              </Label>
            </g>
          )}
        </Cell>
        <Cell index={2} title={f >= pb.uniformName ? '平行板之间：匀强电场' : '两块平行板'} opacity={grid} lit={fadeIn(f, pb.plates, pb.plates + 10)}>
          <UniformField plates={fadeIn(f, pb.plates, pb.plates + 12)} lines={progress(f, pb.uniform, pb.uniform + 24)} />
          <Label x={GRID.w / 2} y={GRID.h - 18} color={theme.textMuted} size={22} anchor="middle" opacity={fadeIn(f, pb.uniformName, pb.uniformName + 10)}>
            忽略边缘效应：平行、等距、处处相等
          </Label>
        </Cell>
        <Cell index={3} title="读电场线" opacity={grid} lit={1}>
          <RuleCard rules={rules} />
        </Cell>
      </svg>

      {/* 条件小标签 */}
      <Chip opacity={fadeIn(f, mb.chip, mb.chip + 12)} left={ZONE.chip.left} top={ZONE.chip.top} color={theme.accent}>
        电场线是人为画的模型 · 条数只是示意
      </Chip>
      <Chip opacity={1} right={W - ZONE.chip.right} top={ZONE.chip.top}>
        代码渲染示意图
      </Chip>

      <CodePanel
        opacity={fadeIn(f, db.in + 4, db.in + 18) * fadeOut(f, S(4).from, S(4).from + 12)}
        tab="场强.ts"
        comment={`// ${FORMULA}：k = ${K_TEXT}，Q = ${Q_TEXT} C`}
        typed={Math.max(0, Math.min(CODE_CHARS, Math.round((f - db.typeFrom) * 1.6)))}
        cursor={f < db.strong && Math.floor(f / 10) % 2 === 0}
        hl={fadeIn(f, db.probe, db.probe + 12)}
        outputs={[
          {text: '// r 小 → E 大：近处箭头长', opacity: fadeIn(f, db.strong, db.strong + 10)},
          {text: '// r 大 → E 小：远处箭头短（箭头每帧按上一行现算）', opacity: fadeIn(f, db.weak, db.weak + 10)},
        ]}
      />
      <FieldTable
        opacity={fadeIn(f, S(4).from + 6, S(4).from + 20) * fadeOut(f, S(5).from, S(5).from + 12)}
        tab={`运行结果 · ${FORMULA}`}
        rows={cases.map((c, i) => ({
          key: `r-${c.r_m}`,
          r: `${c.r_m} m`,
          e: sciText(fieldE(Q, c.r_m)),
          ratio: ratioText(c.r_m),
          show: i === 0 ? fadeIn(f, xb.e1, xb.e1 + 10) : i === 1 ? fadeIn(f, xb.e2, xb.e2 + 10) : quarter,
        }))}
        hl={quarter}
      />

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
