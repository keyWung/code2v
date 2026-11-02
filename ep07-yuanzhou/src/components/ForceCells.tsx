import React from 'react';
import {GRID} from '../layout';
import {add, ringAt, unit, type Pt} from '../physics';
import {beats, FPS} from '../timeline';
import {alpha, fonts, roles, theme} from '../theme';
import {Label} from './Arrow';
import {Car} from './Car';
import {CentripetalArrow} from './CentripetalArrow';
import {VectorArrow} from './VectorArrow';

// 镜 5 四格里的示意运动：只看方向，不按 4 m/s 的比例
export const CELL_OMEGA = 0.9;
const spin = (phase: number, f: number) => phase + (CELL_OMEGA * f) / FPS;
const FORCE_LEN = 66;

const Caption: React.FC<{text: string; color?: string; opacity: number}> = ({text, color = theme.accent, opacity}) => (
  <Label x={GRID.w / 2} y={GRID.h - 16} color={color} size={23} anchor="middle" opacity={opacity}>
    {text}
  </Label>
);

const Pin: React.FC<{c: Pt}> = ({c}) => <circle cx={c.x} cy={c.y} r={6} fill={theme.text} />;

// ---------- 第 1 格：汽车转弯，摩擦力指向圆心
export const CAR = {c: {x: 205, y: 226}, r: 108, road: 30, phase: 2.2};
export const carAt = (f: number) => ringAt(CAR.c, CAR.r, spin(CAR.phase, f));

export const CarCell: React.FC<{f: number; force: number; caption: number; pulse: number}> = ({f, force, caption, pulse}) => {
  const s = carAt(f);
  return (
    <g>
      <circle cx={CAR.c.x} cy={CAR.c.y} r={CAR.r} fill="none" stroke={roles.road} strokeWidth={CAR.road} />
      <circle cx={CAR.c.x} cy={CAR.c.y} r={CAR.r} fill="none" stroke={alpha(theme.textMuted, 0.45)} strokeWidth={2} strokeDasharray="10 10" />
      <Pin c={CAR.c} />
      <CentripetalArrow p={s.p} inward={s.inward} len={FORCE_LEN * force} width={6 + 2 * pulse} opacity={force > 0 ? 1 : 0} />
      <Car p={s.p} dir={s.vel} scale={0.78} />
      <Label x={add(s.p, s.inward, FORCE_LEN * 0.55).x + s.vel.x * 24} y={add(s.p, s.inward, FORCE_LEN * 0.55).y + s.vel.y * 24 + 9} color={roles.centripetal} size={26} anchor="middle" opacity={force}>
        f
      </Label>
      <Caption text="摩擦力 f 指向圆心" opacity={caption} />
    </g>
  );
};

// ---------- 第 2 格：绳拉小球，拉力沿绳指向圆心
export const ROPE = {c: {x: 205, y: 226}, r: 108, phase: 0.6};
export const ropeAt = (f: number) => ringAt(ROPE.c, ROPE.r, spin(ROPE.phase, f));

export const RopeCell: React.FC<{f: number; force: number; caption: number; pulse: number}> = ({f, force, caption, pulse}) => {
  const s = ropeAt(f);
  return (
    <g>
      <circle cx={ROPE.c.x} cy={ROPE.c.y} r={ROPE.r} fill="none" stroke={alpha(roles.orbit, 0.4)} strokeWidth={2.5} strokeDasharray="8 9" />
      <line x1={ROPE.c.x} y1={ROPE.c.y} x2={s.p.x} y2={s.p.y} stroke={theme.textMuted} strokeWidth={3} />
      <Pin c={ROPE.c} />
      <CentripetalArrow p={s.p} inward={s.inward} len={FORCE_LEN * force} width={6 + 2 * pulse} opacity={force > 0 ? 1 : 0} />
      <circle cx={s.p.x} cy={s.p.y} r={13} fill={roles.body} />
      <Label x={add(s.p, s.inward, FORCE_LEN * 0.55).x + s.vel.x * 24} y={add(s.p, s.inward, FORCE_LEN * 0.55).y + s.vel.y * 24 + 9} color={roles.centripetal} size={26} anchor="middle" opacity={force}>
        T
      </Label>
      <Caption text="拉力 T 指向圆心" opacity={caption} />
    </g>
  );
};

// ---------- 第 3 格：圆锥摆侧视，某一瞬间摆球在轨迹最右点
// 拉力沿绳指向悬点，竖直分量与重力抵消，合力 = 重力 + 拉力，水平指向圆心
export const CONE = {pivot: {x: 180, y: 96}, c: {x: 180, y: 272}, r: 120, ry: 30, g: 80};
export const CONE_BOB: Pt = {x: CONE.c.x + CONE.r, y: CONE.c.y};
const along = unit({x: CONE.pivot.x - CONE_BOB.x, y: CONE.pivot.y - CONE_BOB.y});
export const CONE_GRAVITY: Pt = {x: 0, y: CONE.g};
// 竖直方向平衡：T cosθ = mg
export const CONE_TENSION: Pt = {x: (along.x * CONE.g) / -along.y, y: -CONE.g};
export const CONE_NET: Pt = add(CONE_GRAVITY, CONE_TENSION);

export const ConeCell: React.FC<{parts: number; net: number; caption: number; pulse: number}> = ({parts, net, caption, pulse}) => {
  const b = CONE_BOB;
  const tip = (v: Pt) => add(b, v);
  const len = (v: Pt) => Math.hypot(v.x, v.y);
  return (
    <g>
      <line x1={CONE.pivot.x - 70} y1={CONE.pivot.y} x2={CONE.pivot.x + 70} y2={CONE.pivot.y} stroke={theme.textMuted} strokeWidth={4} />
      {Array.from({length: 8}, (_, i) => (
        <line key={i} x1={CONE.pivot.x - 64 + i * 18} y1={CONE.pivot.y} x2={CONE.pivot.x - 76 + i * 18} y2={CONE.pivot.y - 12} stroke={alpha(theme.textMuted, 0.6)} strokeWidth={2} />
      ))}
      <line x1={CONE.pivot.x} y1={CONE.pivot.y} x2={CONE.c.x} y2={CONE.c.y + 64} stroke={alpha(theme.textMuted, 0.5)} strokeWidth={2} strokeDasharray="6 8" />
      <path d={`M ${CONE.c.x - CONE.r} ${CONE.c.y} A ${CONE.r} ${CONE.ry} 0 0 1 ${CONE.c.x + CONE.r} ${CONE.c.y}`} fill="none" stroke={alpha(roles.orbit, 0.35)} strokeWidth={2.5} strokeDasharray="8 9" />
      <path d={`M ${CONE.c.x - CONE.r} ${CONE.c.y} A ${CONE.r} ${CONE.ry} 0 0 0 ${CONE.c.x + CONE.r} ${CONE.c.y}`} fill="none" stroke={alpha(roles.orbit, 0.6)} strokeWidth={2.5} />
      <path d={`M ${CONE.c.x + 40} ${CONE.c.y + CONE.ry - 1} l -14 -8 l 0 16 Z`} fill={alpha(roles.orbit, 0.7)} transform={`rotate(-8 ${CONE.c.x + 40} ${CONE.c.y + CONE.ry})`} />
      <line x1={CONE.pivot.x} y1={CONE.pivot.y} x2={b.x} y2={b.y} stroke={theme.textMuted} strokeWidth={3} />
      <circle cx={CONE.c.x} cy={CONE.c.y} r={5} fill={theme.text} />
      <Label x={CONE.c.x - 12} y={CONE.c.y - 12} color={theme.textMuted} size={20} anchor="end">
        圆心
      </Label>
      {parts > 0 && (
        <g opacity={parts * (1 - 0.45 * net)}>
          <line x1={tip(CONE_GRAVITY).x} y1={tip(CONE_GRAVITY).y} x2={tip(CONE_NET).x} y2={tip(CONE_NET).y} stroke={alpha(roles.component, 0.7)} strokeWidth={2} strokeDasharray="6 6" opacity={net} />
          <line x1={tip(CONE_TENSION).x} y1={tip(CONE_TENSION).y} x2={tip(CONE_NET).x} y2={tip(CONE_NET).y} stroke={alpha(roles.component, 0.7)} strokeWidth={2} strokeDasharray="6 6" opacity={net} />
          <VectorArrow p={b} dir={unit(CONE_GRAVITY)} len={len(CONE_GRAVITY)} color={roles.component} width={4} />
          <VectorArrow p={b} dir={unit(CONE_TENSION)} len={len(CONE_TENSION)} color={roles.component} width={4} />
          <Label x={b.x + 14} y={tip(CONE_GRAVITY).y - 4} color={roles.component} size={22}>
            重力 mg
          </Label>
          <Label x={tip(CONE_TENSION).x + 14} y={tip(CONE_TENSION).y + 8} color={roles.component} size={22}>
            拉力 T
          </Label>
        </g>
      )}
      <CentripetalArrow p={b} inward={unit(CONE_NET)} len={len(CONE_NET) * net} width={6 + 2 * pulse} opacity={net > 0 ? 1 : 0} />
      <circle cx={b.x} cy={b.y} r={13} fill={roles.body} />
      <Label x={tip(CONE_NET).x - 8} y={b.y + 54} color={roles.centripetal} size={24} anchor="middle" opacity={net}>
        合力 F
      </Label>
      <Caption text="重力 + 拉力 = 合力，指向圆心" opacity={caption} />
    </g>
  );
};

// ---------- 第 4 格：绳一断，小球沿断开那一刻的切线走直线，速度不变
export const SNAP = {c: {x: 140, y: 220}, r: 92, ghostStep: 16};
export const SNAP_AT = beats.forces.notEnough;
// 断开那一刻正好在最下方、朝右走
const SNAP_PHASE = -Math.PI / 2 - (CELL_OMEGA * SNAP_AT) / FPS;
const SNAP_RELEASE = ringAt(SNAP.c, SNAP.r, spin(SNAP_PHASE, SNAP_AT));
export const SNAP_SPEED = (CELL_OMEGA * SNAP.r) / FPS;
export const snapAt = (f: number) => {
  if (f <= SNAP_AT) return ringAt(SNAP.c, SNAP.r, spin(SNAP_PHASE, f));
  return {...SNAP_RELEASE, p: add(SNAP_RELEASE.p, SNAP_RELEASE.vel, SNAP_SPEED * (f - SNAP_AT))};
};
export const snapGhosts = (f: number) =>
  Array.from({length: Math.max(0, Math.floor((f - SNAP_AT) / SNAP.ghostStep) + 1)}, (_, k) => SNAP_AT + k * SNAP.ghostStep).map((g) => snapAt(g).p);

export const SnapCell: React.FC<{f: number; lineOn: number; caption: number}> = ({f, lineOn, caption}) => {
  const s = snapAt(f);
  const cut = f > SNAP_AT;
  const r = SNAP_RELEASE;
  return (
    <g>
      <circle cx={SNAP.c.x} cy={SNAP.c.y} r={SNAP.r} fill="none" stroke={alpha(roles.orbit, cut ? 0.25 : 0.4)} strokeWidth={2.5} strokeDasharray="8 9" />
      {!cut && <line x1={SNAP.c.x} y1={SNAP.c.y} x2={s.p.x} y2={s.p.y} stroke={theme.textMuted} strokeWidth={3} />}
      {cut && (
        <g opacity={0.8}>
          <line x1={SNAP.c.x} y1={SNAP.c.y} x2={SNAP.c.x + (r.p.x - SNAP.c.x) * 0.35} y2={SNAP.c.y + (r.p.y - SNAP.c.y) * 0.35} stroke={theme.textMuted} strokeWidth={3} />
          <Label x={SNAP.c.x + 16} y={SNAP.c.y + 42} color={theme.textMuted} size={22}>
            绳断了
          </Label>
        </g>
      )}
      <Pin c={SNAP.c} />
      {cut && (
        <g opacity={lineOn}>
          <line x1={r.p.x} y1={r.p.y} x2={GRID.w + 10} y2={r.p.y} stroke={alpha(roles.velocity, 0.7)} strokeWidth={3} strokeDasharray="10 8" />
          <Label x={GRID.w - 14} y={r.p.y - 26} color={roles.velocity} size={23} anchor="end">
            沿切线走直线
          </Label>
        </g>
      )}
      {snapGhosts(f).map((g, i) => (
        <circle key={`g-${i}`} cx={g.x} cy={g.y} r={12} fill="none" stroke={alpha(roles.body, 0.5)} strokeWidth={2} />
      ))}
      <circle cx={s.p.x} cy={s.p.y} r={13} fill={roles.body} />
      {!cut && <CentripetalArrow p={s.p} inward={s.inward} len={FORCE_LEN} width={6} />}
      <text
        x={GRID.w / 2}
        y={GRID.h - 50}
        textAnchor="middle"
        opacity={lineOn}
        style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: 20, fill: theme.textMuted}}
      >
        频闪：间隔相等，速度不变
      </text>
      <Caption text="按惯性走直线，不是被推出去的" opacity={caption} />
    </g>
  );
};
