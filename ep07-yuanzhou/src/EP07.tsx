import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Label} from './components/Arrow';
import {Car} from './components/Car';
import {Cell} from './components/Cell';
import {CentripetalArrow} from './components/CentripetalArrow';
import {ChapterHeader} from './components/ChapterHeader';
import {Chip} from './components/Chip';
import {CircularOrbit} from './components/CircularOrbit';
import {CODE_CHARS, CodePanel} from './components/CodePanel';
import {CarCell, ConeCell, RopeCell, SnapCell} from './components/ForceCells';
import {ResultTable} from './components/ResultTable';
import {Stamp} from './components/Stamp';
import {Subtitle} from './components/Subtitle';
import {VelocityArrow} from './components/VelocityArrow';
import {BIG_AT, cardBox, H, SAFE, SMALL_AT, STAGE, W, ZONE} from './layout';
import {A_PX, accelOf, BIG, cases, omegaOf, orbitAt, periodOf, periodText, PX_PER_M, R_BIG, R_SMALL, ringAt, SMALL, V, V_PX, type Pt} from './physics';
import {subtitleLines, subtitleNote} from './subtitles';
import {beats, FPS, FREEZE_FROM, progress, settle, shotAt, shots, stamps} from './timeline';
import {alpha, fonts, roles, theme} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fadeIn = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
const fadeOut = (f: number, a: number, b: number) => interpolate(f, [a, b], [1, 0], clamp);
const eased = (f: number, a: number, b: number, from: number, to: number) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: Easing.inOut(Easing.cubic)});

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

// 沿圆从 th0 逆时针画到 th1
const arcPath = (c: Pt, r: number, th0: number, th1: number) => {
  const n = Math.max(2, Math.ceil(Math.abs(th1 - th0) / 0.03));
  return Array.from({length: n + 1}, (_, i) => {
    const p = ringAt(c, r, th0 + ((th1 - th0) * i) / n).p;
    return `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(' ');
};

const OMEGA_BIG = omegaOf(V, R_BIG);
const A_BIG = accelOf(V, R_BIG);
const A_SMALL = accelOf(V, R_SMALL);
const T_BIG = periodOf(V, R_BIG);
const V_LEN = V * V_PX;
const R_BIG_PX = R_BIG * PX_PER_M;
const R_SMALL_PX = R_SMALL * PX_PER_M;

// 镜 2、镜 3 的残影：圆上六个固定位置
const GHOSTS = Array.from({length: 6}, (_, k) => BIG.phase + (k * Math.PI) / 3);

const Card: React.FC<{i: number; name: string; value: string; color: string; on: number; lit: number}> = ({i, name, value, color, on, lit}) => {
  if (on <= 0) return null;
  const b = cardBox(i);
  return (
    <g opacity={on}>
      <rect x={b.left} y={b.top} width={b.width} height={b.height} rx={18} fill={alpha(theme.panel, 0.9)} stroke={lit > 0 ? alpha(color, 0.3 + 0.7 * lit) : theme.panelBorder} strokeWidth={2 + 2 * lit} />
      <Label x={b.left + b.width / 2} y={b.top + 38} color={lit > 0.5 ? color : theme.textMuted} size={24} anchor="middle" weight={700}>
        {name}
      </Label>
      <Label x={b.left + b.width / 2} y={b.top + 90} color={theme.text} size={40} anchor="middle" opacity={0.25 + 0.75 * lit}>
        {lit > 0 ? value : '?'}
      </Label>
    </g>
  );
};

// 两个圆心：镜 2、3、4 开头各移动一次
export const centersAt = (f: number) => {
  const S = (n: number) => shots[n - 1];
  const bigC: Pt = {
    x: f < S(4).from ? eased(f, S(2).from, S(2).from + 24, BIG_AT.hook.x, BIG_AT.solo.x) : eased(f, S(4).from, S(4).from + 24, BIG_AT.formula.x, BIG_AT.compare.x),
    y: f < S(3).from ? eased(f, S(2).from, S(2).from + 24, BIG_AT.hook.y, BIG_AT.solo.y) : eased(f, S(3).from, S(3).from + 24, BIG_AT.solo.y, BIG_AT.formula.y),
  };
  return {bigC, smallC: f < S(4).from ? SMALL_AT.hook : SMALL_AT.compare};
};

export const EP07: React.FC<{voice?: boolean; debugSafe?: boolean}> = ({voice = true, debugSafe = false}) => {
  const frame = useCurrentFrame();
  // 55-60 秒整段冻结：只读到冻结帧
  const f = Math.min(frame, FREEZE_FROM);
  const shot = shotAt(f);
  const S = (n: number) => shots[n - 1];
  const hb = beats.hook;
  const sb = beats.solo;
  const fb = beats.formula;
  const cb = beats.compare;
  const pb = beats.forces;

  // ---------- 镜 1-4 的两条轨道：圆心随镜头移动，角度按 ω 每帧连续走
  const {bigC, smallC} = centersAt(f);
  const ob = orbitAt(BIG, bigC, f);
  const os = orbitAt(SMALL, smallC, f);
  const orbits = fadeOut(f, S(5).from, S(5).from + 12);
  const smallOn = f < S(4).from ? fadeOut(f, S(2).from, S(2).from + 12) : fadeIn(f, cb.same, cb.same + 14);
  const road = fadeOut(f, S(2).from, S(2).from + 16);

  // 速度箭头：镜 1 讲到“油门”时出现，之后一直跟着物体
  const vOn = fadeIn(f, hb.throttle, hb.throttle + 10);
  // 镜 1 写车速；之后只标 v，4 m/s 写在常驻小标签和运行结果里，免得跟着物体跑的标签压到别的字
  const vText = f < S(2).from ? `${V} m/s` : 'v';
  const vLabel = (s: typeof ob) => ({x: s.p.x + s.vel.x * (V_LEN + 30), y: s.p.y + s.vel.y * (V_LEN + 30) + 10});

  // ---------- 镜 1
  const ask = settle(f, hb.ask, {damping: 12, stiffness: 140}) * fadeOut(f, hb.radius, hb.radius + 8);
  const hookRadius = fadeIn(f, hb.radius, hb.radius + 10);
  const hookText = fadeOut(f, S(2).from, S(2).from + 10);

  // ---------- 镜 2：计时一圈、残影、三张量卡
  const lapFrom = sb.uniform;
  const lapTh0 = orbitAt(BIG, bigC, lapFrom).th;
  const lapT = Math.max(0, Math.min(T_BIG, (f - lapFrom) / FPS));
  const lapDone = f >= lapFrom && lapT >= T_BIG;
  const lapOn = fadeIn(f, lapFrom, lapFrom + 6) * fadeOut(f, S(3).from, S(3).from + 12);
  const ghostsV = (k: number) => fadeIn(f, sb.dir + k * 4, sb.dir + k * 4 + 8) * fadeOut(f, S(3).from, S(3).from + 12);
  const ghostNote = fadeIn(f, sb.dir + 26, sb.dir + 36) * fadeOut(f, S(3).from, S(3).from + 10);
  const cards = fadeIn(f, sb.uniform, sb.uniform + 12) * fadeOut(f, S(3).from, S(3).from + 12);
  const wedge = fadeIn(f, sb.omega, sb.omega + 10) * fadeOut(f, S(3).from, S(3).from + 12);
  const radiusOn = fadeIn(f, S(2).from + 6, S(2).from + 18);

  // ---------- 镜 3：向心加速度
  const aGrow = progress(f, fb.accel, fb.accel + 14);
  const aOnSmall = progress(f, cb.a16, cb.a16 + 14);
  const rightAngle = fadeIn(f, fb.center, fb.center + 10) * fadeOut(f, S(4).from, S(4).from + 10);
  const centerRing = progress(f, fb.center, fb.center + 22);
  const centerLabel = fadeIn(f, fb.center, fb.center + 10) * fadeOut(f, S(4).from, S(4).from + 10);
  const aLetter = fadeIn(f, fb.accel + 8, fb.accel + 16) * fadeOut(f, S(4).from, S(4).from + 10);
  const formula = fadeIn(f, fb.size, fb.size + 12) * fadeOut(f, S(4).from, S(4).from + 10);
  const plugIn = fadeIn(f, fb.divide + 10, fb.divide + 22) * fadeOut(f, S(4).from, S(4).from + 10);
  const ghostsA = (k: number) => fadeIn(f, fb.ghosts + k * 5, fb.ghosts + k * 5 + 10) * fadeOut(f, S(4).from, S(4).from + 12);

  // ---------- 镜 4：两个圆对比
  const r2 = fadeIn(f, cb.r2, cb.r2 + 10);
  const a8 = fadeIn(f, cb.a8, cb.a8 + 10);
  const r1 = fadeIn(f, cb.r1, cb.r1 + 10);
  const a16 = fadeIn(f, cb.a16, cb.a16 + 10);
  const smaller = fadeIn(f, cb.smaller, cb.smaller + 10);
  const sharper = fadeIn(f, cb.sharper, cb.sharper + 12);
  const compareText = f >= S(4).from ? 1 : 0;

  // ---------- 镜 5：四格
  const grid = fadeIn(f, pb.in + 6, pb.in + 22);
  const pulse = f >= pb.net && f < pb.net + 45 ? Math.sin(((f - pb.net) / 15) * Math.PI) ** 2 : 0;
  const netHl = fadeIn(f, pb.net, pb.net + 8) * fadeOut(f, pb.net + 50, pb.net + 64);
  const snapHl = fadeIn(f, pb.notPushed, pb.notPushed + 8) * fadeOut(f, pb.notPushed + 50, pb.notPushed + 64);

  const subtitle = subtitleLines(shot);
  const note = subtitleNote(shot);

  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {/* 镜 2 三张量卡 */}
        <Card i={0} name="线速度 v" value={`${V} m/s`} color={roles.velocity} on={cards} lit={fadeIn(f, sb.v, sb.v + 8)} />
        <Card i={1} name="角速度 ω = v / r" value={`${OMEGA_BIG} rad/s`} color={roles.component} on={cards} lit={fadeIn(f, sb.omega, sb.omega + 8)} />
        <Card i={2} name="周期 T = 2πr / v" value={`${periodText(V, R_BIG)} s`} color={theme.accent} on={cards} lit={fadeIn(f, sb.period, sb.period + 8)} />

        {orbits > 0 && (
          <g opacity={orbits}>
            {/* 大圆 r = 2 m：镜 1 是弯道，镜 2 起是轨迹 */}
            <CircularOrbit c={bigC} rPx={R_BIG_PX} p={ob.p} road={road} radius={Math.max(hookRadius * road, radiusOn)} radiusColor={f < S(2).from ? theme.accent : theme.textMuted} ball={1 - road} />
            {lapOn > 0 && f >= lapFrom && (
              <path d={arcPath(bigC, R_BIG_PX, lapTh0, lapTh0 + OMEGA_BIG * lapT)} fill="none" stroke={alpha(theme.accent, 0.85)} strokeWidth={6} strokeLinecap="round" opacity={lapOn} />
            )}
            {wedge > 0 && (
              <g opacity={wedge}>
                <path d={`M ${bigC.x} ${bigC.y} ${arcPath(bigC, 90, ob.th - OMEGA_BIG, ob.th).replace('M', 'L')} Z`} fill={alpha(roles.component, 0.22)} stroke={roles.component} strokeWidth={3} />
                <Label x={bigC.x} y={bigC.y + 128} color={roles.component} size={26} anchor="middle">
                  {`每秒转过 ${OMEGA_BIG} rad`}
                </Label>
              </g>
            )}
            {GHOSTS.map((th, k) => {
              const g = ringAt(bigC, R_BIG_PX, th);
              const ov = ghostsV(k);
              const oa = ghostsA(k);
              return ov > 0 || oa > 0 ? (
                <g key={`ghost-${k}`}>
                  {ov > 0 && <VelocityArrow p={g.p} dir={g.vel} len={V_LEN} opacity={0.6 * ov} width={6} />}
                  {oa > 0 && (
                    <g opacity={0.5 * oa}>
                      <VelocityArrow p={g.p} dir={g.vel} len={V_LEN} width={5} />
                      <CentripetalArrow p={g.p} inward={g.inward} vel={g.vel} len={A_BIG * A_PX} rightAngle={1} width={5} />
                    </g>
                  )}
                  {(ov > 0 || oa > 0) && <circle cx={g.p.x} cy={g.p.y} r={9} fill="none" stroke={alpha(roles.body, 0.5)} strokeWidth={2} />}
                </g>
              ) : null;
            })}
            <CentripetalArrow p={ob.p} inward={ob.inward} vel={ob.vel} len={A_BIG * A_PX * aGrow} rightAngle={rightAngle} opacity={aGrow > 0 ? 1 : 0} />
            <VelocityArrow p={ob.p} dir={ob.vel} len={V_LEN} opacity={vOn} />
            {road > 0 && <Car p={ob.p} dir={ob.vel} opacity={road} />}
            <Label x={vLabel(ob).x} y={vLabel(ob).y} color={roles.velocity} size={28} anchor="middle" opacity={vOn}>
              {vText}
            </Label>
            <Label x={ob.p.x - ob.vel.x * 24 + ob.inward.x * 30} y={ob.p.y - ob.vel.y * 24 + ob.inward.y * 30 + 10} color={roles.centripetal} size={30} anchor="middle" opacity={aLetter}>
              a
            </Label>

            {/* 小圆 r = 1 m：镜 1 急弯，镜 4 对比 */}
            {smallOn > 0 && (
              <g opacity={smallOn}>
                <CircularOrbit c={smallC} rPx={R_SMALL_PX} p={os.p} road={road} radius={f < S(2).from ? hookRadius : 1} radiusColor={f < S(2).from ? theme.accent : theme.textMuted} ball={1 - road} />
                {sharper > 0 && <circle cx={smallC.x} cy={smallC.y} r={R_SMALL_PX} fill="none" stroke={theme.accent} strokeWidth={4} opacity={sharper} />}
                <CentripetalArrow p={os.p} inward={os.inward} len={A_SMALL * A_PX * aOnSmall} opacity={aOnSmall > 0 ? 1 : 0} />
                <VelocityArrow p={os.p} dir={os.vel} len={V_LEN} opacity={vOn} />
                {road > 0 && <Car p={os.p} dir={os.vel} opacity={road} />}
                <Label x={vLabel(os).x} y={vLabel(os).y} color={roles.velocity} size={28} anchor="middle" opacity={vOn}>
                  {vText}
                </Label>
              </g>
            )}

            {/* 镜 1 文字 */}
            {hookText > 0 && (
              <g opacity={hookText}>
                <Label x={BIG_AT.hook.x} y={BIG_AT.hook.y - 16} color={theme.text} size={40} anchor="middle" weight={900}>
                  缓弯 · 大半径
                </Label>
                <Label x={SMALL_AT.hook.x - R_SMALL_PX - 40} y={SMALL_AT.hook.y - R_SMALL_PX + 4} color={theme.text} size={40} anchor="end" weight={900}>
                  急弯 · 小半径
                </Label>
                <Label x={BIG_AT.hook.x} y={BIG_AT.hook.y + 36} color={roles.velocity} size={28} anchor="middle" opacity={vOn}>
                  {`两辆车一样快：${V} m/s`}
                </Label>
                <Label x={SMALL_AT.hook.x} y={SMALL_AT.hook.y + 38} color={theme.accent} size={110} weight={900} anchor="middle" opacity={ask}>
                  ?
                </Label>
                <Label x={BIG_AT.hook.x} y={BIG_AT.hook.y + 96} color={theme.accent} size={36} anchor="middle" opacity={hookRadius}>
                  {`r = ${R_BIG} m`}
                </Label>
                <Label x={SMALL_AT.hook.x} y={SMALL_AT.hook.y + 52} color={theme.accent} size={32} anchor="middle" opacity={hookRadius}>
                  {`r = ${R_SMALL} m`}
                </Label>
              </g>
            )}

            {/* 镜 2：计时、残影说明 */}
            {lapOn > 0 && f >= lapFrom && (
              <Label x={STAGE.right - 6} y={BIG_AT.solo.y - R_BIG_PX - 14} color={lapDone ? theme.accent : theme.text} size={30} anchor="end" opacity={lapOn}>
                {lapDone ? `转一圈 ${periodText(V, R_BIG)} s` : `计时 ${lapT.toFixed(2)} s`}
              </Label>
            )}
            <Label x={BIG_AT.solo.x} y={BIG_AT.solo.y + R_BIG_PX + 74} color={theme.text} size={30} anchor="middle" opacity={ghostNote}>
              箭头一样长 → 大小不变 · 指向一直在转 → 方向在变
            </Label>

            {/* 镜 3：圆心、公式 */}
            {centerRing > 0 && centerRing < 1 && <circle cx={bigC.x} cy={bigC.y} r={6 + 30 * centerRing} fill="none" stroke={theme.accent} strokeWidth={4} opacity={1 - centerRing} />}
            <Label x={bigC.x + 16} y={bigC.y - 16} color={theme.accent} size={26} opacity={centerLabel}>
              圆心
            </Label>
            <text x={bigC.x} y={bigC.y + 90} textAnchor="middle" opacity={formula} style={{fontFamily: fonts.math, fontStyle: 'italic', fontWeight: 700, fontSize: 56, fill: theme.accent}}>
              a = v² / r
            </text>
            <Label x={bigC.x} y={bigC.y + 142} color={theme.text} size={34} anchor="middle" opacity={plugIn}>
              {`= ${V}² / ${R_BIG} = ${A_BIG} m/s²`}
            </Label>

            {/* 镜 4：两组数字同屏 */}
            {compareText > 0 && (
              <g>
                <Label x={bigC.x} y={bigC.y - 30} color={theme.text} size={34} anchor="middle" opacity={r2}>
                  {`r = ${R_BIG} m`}
                </Label>
                <Label x={bigC.x} y={bigC.y + 50} color={theme.accent} size={46} anchor="middle" weight={900} opacity={a8}>
                  {`a = ${A_BIG} m/s²`}
                </Label>
                <Label x={SMALL_AT.compare.x} y={SMALL_AT.compare.y + R_SMALL_PX + 44} color={theme.text} size={34} anchor="middle" opacity={r1 * smallOn}>
                  {`r = ${R_SMALL} m`}
                </Label>
                <Label x={SMALL_AT.compare.x} y={SMALL_AT.compare.y + R_SMALL_PX + 98} color={theme.accent} size={46} anchor="middle" weight={900} opacity={a16 * smallOn}>
                  {`a = ${A_SMALL} m/s²`}
                </Label>
                <Label x={SMALL_AT.compare.x} y={SMALL_AT.compare.y + R_SMALL_PX + 138} color={theme.accent} size={28} anchor="middle" opacity={smaller * smallOn}>
                  r 减半 → a 翻倍
                </Label>
              </g>
            )}
          </g>
        )}

        {/* 镜 5 起，镜 6 冻结在这里：三种向心力来源 + 力不够时 */}
        <Cell index={0} title="汽车转弯 · 俯视" opacity={grid} lit={fadeIn(f, pb.car, pb.car + 10)} hl={netHl}>
          <g opacity={0.4 + 0.6 * fadeIn(f, pb.car, pb.car + 10)}>
            <CarCell f={f} force={progress(f, pb.car + 6, pb.car + 20)} caption={fadeIn(f, pb.car + 14, pb.car + 24)} pulse={pulse} />
          </g>
        </Cell>
        <Cell index={1} title="绳拉小球 · 俯视" opacity={grid} lit={fadeIn(f, pb.rope, pb.rope + 10)} hl={netHl}>
          <g opacity={0.4 + 0.6 * fadeIn(f, pb.rope, pb.rope + 10)}>
            <RopeCell f={f} force={progress(f, pb.tension, pb.tension + 14)} caption={fadeIn(f, pb.tension + 10, pb.tension + 20)} pulse={pulse} />
          </g>
        </Cell>
        <Cell index={2} title="圆锥摆 · 侧视" opacity={grid} lit={fadeIn(f, pb.notNew, pb.notNew + 10)} hl={netHl}>
          <g opacity={0.4 + 0.6 * fadeIn(f, pb.notNew, pb.notNew + 10)}>
            <ConeCell parts={fadeIn(f, pb.notNew + 6, pb.notNew + 18)} net={progress(f, pb.net, pb.net + 14)} caption={fadeIn(f, pb.net + 12, pb.net + 22)} pulse={pulse} />
          </g>
        </Cell>
        <Cell index={3} title="力不够时" opacity={grid} lit={fadeIn(f, pb.notEnough, pb.notEnough + 10)} hl={snapHl}>
          <g opacity={0.4 + 0.6 * fadeIn(f, pb.notEnough - 10, pb.notEnough)}>
            <SnapCell f={f} lineOn={fadeIn(f, pb.inertia, pb.inertia + 10)} caption={fadeIn(f, pb.notPushed, pb.notPushed + 10)} />
          </g>
        </Cell>
      </svg>

      {/* 条件小标签 */}
      <Chip opacity={fadeIn(f, S(2).from + 10, S(2).from + 22) * fadeOut(f, S(4).from, S(4).from + 8)} left={ZONE.chip.left} top={ZONE.chip.top} color={theme.accent}>
        {`匀速圆周运动 · r = ${R_BIG} m · v = ${V} m/s`}
      </Chip>
      <Chip opacity={fadeIn(f, S(4).from + 8, S(4).from + 20) * fadeOut(f, S(5).from, S(5).from + 8)} left={ZONE.chip.left} top={ZONE.chip.top} color={theme.accent}>
        {`匀速圆周运动 · 两个圆 v 都是 ${V} m/s`}
      </Chip>
      <Chip opacity={fadeIn(f, S(5).from + 8, S(5).from + 20)} left={ZONE.chip.left} top={ZONE.chip.top} color={theme.accent}>
        示意图 · 黄色箭头 = 指向圆心的合力
      </Chip>
      <Chip opacity={1} right={W - ZONE.chip.right} top={ZONE.chip.top}>
        代码渲染示意图
      </Chip>

      <CodePanel
        opacity={fadeIn(f, fb.in + 4, fb.in + 18) * fadeOut(f, S(4).from, S(4).from + 12)}
        tab="圆周运动.ts"
        comment={`// v = ${V} m/s，r = ${R_BIG} m`}
        typed={Math.max(0, Math.min(CODE_CHARS, Math.round((f - fb.typeFrom) * 1.6)))}
        cursor={f < fb.size && Math.floor(f / 10) % 2 === 0}
        hl={[0, fadeIn(f, fb.size, fb.size + 12)]}
        outputs={[{text: `// → omega = ${OMEGA_BIG} rad/s，a = ${A_BIG} m/s²（画面按这两行现算）`, opacity: fadeIn(f, fb.divide, fb.divide + 10)}]}
      />
      <ResultTable
        opacity={fadeIn(f, S(4).from + 6, S(4).from + 20) * fadeOut(f, S(5).from, S(5).from + 12)}
        tab={`运行结果 · v = ${V} m/s`}
        rows={cases.map((c, i) => ({
          key: `r-${c.r_m}`,
          r: `${c.r_m} m`,
          omega: `${omegaOf(V, c.r_m)} rad/s`,
          a: `${accelOf(V, c.r_m)} m/s²`,
          period: `${periodText(V, c.r_m)} s`,
          show: i === 0 ? fadeIn(f, cb.a8, cb.a8 + 10) : fadeIn(f, cb.a16, cb.a16 + 10),
        }))}
        hl={smaller}
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
