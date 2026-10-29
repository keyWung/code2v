import episode from '../episodes/ep05-dianchangxian.json';

const {physics} = episode;
const conditionText = physics.conditions.join(' ');
const SUP: Record<string, string> = {'-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹'};
export const sup = (n: number) => [...String(n)].map((c) => SUP[c]).join('');

// 条件里写成 9.0×10^9 这种科学计数法
const readSci = (name: string) => {
  const m = conditionText.match(new RegExp(`${name} = (\\d+(?:\\.\\d+)?)×10\\^(-?\\d+)`));
  if (!m) throw new Error(`JSON conditions 里找不到 ${name}`);
  return {value: Number(m[1]) * 10 ** Number(m[2]), text: `${m[1]}×10${sup(Number(m[2]))}`};
};

export type Case = (typeof physics.cases)[number];
export const cases: Case[] = physics.cases;
export const CODE = physics.code[0];
export const FORMULA = physics.formula;
const k = readSci('k');
const q = readSci('Q');
export const K = k.value;
export const Q = q.value;
// 画面上照 JSON 原样写：9.0×10⁹、1×10⁻⁶
export const K_TEXT = k.text;
export const Q_TEXT = q.text;

// 与 JSON code 一致：const E = k * Q / (r * r)，r 单位米，E 单位 N/C
export const fieldE = (q: number, r: number) => (K * q) / (r * r);

// 9.0×10^5 / 2.25×10^5 / 约 5.6×10^4：除不尽的取两位有效数字并加“约”
export const sciParts = (v: number) => {
  const exp = Math.floor(Math.log10(v) + 1e-12);
  const m = v / 10 ** exp;
  const m2 = Math.round(m * 100) / 100;
  if (Math.abs(m - m2) < 1e-9) return {approx: false, mantissa: Number.isInteger(m2 * 10) ? m2.toFixed(1) : m2.toFixed(2), exp};
  return {approx: true, mantissa: m.toFixed(1), exp};
};
// JSON 写法：10^5；画面写法：10⁵
export const sciCaret = (v: number) => {
  const p = sciParts(v);
  return `${p.approx ? '约 ' : ''}${p.mantissa}×10^${p.exp}`;
};
export const sciText = (v: number) => {
  const p = sciParts(v);
  return `${p.approx ? '约 ' : ''}${p.mantissa}×10${sup(p.exp)}`;
};

export type Pt = {x: number; y: number};
export type Charge = Pt & {q: number};

// 画面上的长度换算：1 米画成 PX_PER_M 像素
export const PX_PER_M = 1400;

// 平面上任一点的场强：每个点电荷都按 fieldE 算，再矢量相加（正电荷向外，负电荷向里）
export const fieldAt = (charges: Charge[], p: Pt): Pt => {
  let x = 0;
  let y = 0;
  for (const c of charges) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const d = Math.hypot(dx, dy);
    if (d < 1e-6) continue;
    const e = fieldE(c.q, d / PX_PER_M);
    x += (e * dx) / d;
    y += (e * dy) / d;
  }
  return {x, y};
};

const unit = (v: Pt): Pt => {
  const n = Math.hypot(v.x, v.y);
  return n < 1e-12 ? {x: 0, y: 0} : {x: v.x / n, y: v.y / n};
};

export type Box = {left: number; top: number; right: number; bottom: number};

// 电场线：从起点沿场强方向一步步走（RK4，每步 STEP 像素），走到负电荷、出框或场强为零就停
// sign 为 -1 时逆着场强走，从负电荷往回找线是从哪里来的，走到正电荷为止
const STEP = 3;
export const traceLine = (charges: Charge[], start: Pt, box: Box, sinkR: number, maxSteps = 1200, sign = 1): Pt[] => {
  const dir = (p: Pt) => {
    const e = unit(fieldAt(charges, p));
    return {x: e.x * sign, y: e.y * sign};
  };
  const pts = [start];
  let p = start;
  for (let i = 0; i < maxSteps; i++) {
    const k1 = dir(p);
    const k2 = dir({x: p.x + (k1.x * STEP) / 2, y: p.y + (k1.y * STEP) / 2});
    const k3 = dir({x: p.x + (k2.x * STEP) / 2, y: p.y + (k2.y * STEP) / 2});
    const k4 = dir({x: p.x + k3.x * STEP, y: p.y + k3.y * STEP});
    const d = unit({x: k1.x + 2 * k2.x + 2 * k3.x + k4.x, y: k1.y + 2 * k2.y + 2 * k3.y + k4.y});
    if (d.x === 0 && d.y === 0) break;
    p = {x: p.x + d.x * STEP, y: p.y + d.y * STEP};
    const sink = charges.find((c) => c.q * sign < 0 && Math.hypot(p.x - c.x, p.y - c.y) < sinkR);
    if (sink) {
      pts.push({x: sink.x + ((p.x - sink.x) / Math.hypot(p.x - sink.x, p.y - sink.y)) * sinkR, y: sink.y + ((p.y - sink.y) / Math.hypot(p.x - sink.x, p.y - sink.y)) * sinkR});
      break;
    }
    pts.push(p);
    if (p.x < box.left || p.x > box.right || p.y < box.top || p.y > box.bottom) break;
  }
  return pts;
};

// 从每个正电荷表面按等角度出发画 n 条线；offset 是起始角（度）
export const linesFrom = (charges: Charge[], n: number, offsetDeg: number, r: number, box: Box) =>
  charges
    .filter((c) => c.q > 0)
    .flatMap((c) =>
      Array.from({length: n}, (_, i) => {
        const a = ((offsetDeg + (360 * i) / n) * Math.PI) / 180;
        return traceLine(charges, {x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a)}, box, r);
      }),
    );

// 从远处来、止于负电荷的线：从负电荷表面逆着场强往回走，走出画面的才保留（走回正电荷的已经由 linesFrom 画过）
export const linesInto = (charges: Charge[], n: number, offsetDeg: number, r: number, box: Box) =>
  charges
    .filter((c) => c.q < 0)
    .flatMap((c) =>
      Array.from({length: n}, (_, i) => {
        const a = ((offsetDeg + (360 * i) / n) * Math.PI) / 180;
        return traceLine(charges, {x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a)}, box, r, 1200, -1);
      }),
    )
    .filter((l) => {
      const e = l[l.length - 1];
      return e.x < box.left || e.x > box.right || e.y < box.top || e.y > box.bottom;
    })
    .map((l) => [...l].reverse());

// 带电粒子从静止释放：加速度沿场强方向，但速度有惯性，走出来的轨迹和弯曲的电场线不重合
// 从静止出发时轨迹形状与荷质比无关，这里只按时间步积分
export const releaseFrom = (charges: Charge[], start: Pt, box: Box, sinkR: number, steps = 4000): Pt[] => {
  const scale = 1 / Math.hypot(fieldAt(charges, start).x, fieldAt(charges, start).y);
  const acc = (p: Pt) => {
    const e = fieldAt(charges, p);
    return {x: e.x * scale, y: e.y * scale};
  };
  const dt = 0.02;
  let p = start;
  let v = {x: 0, y: 0};
  let a = acc(p);
  const pts = [p];
  for (let i = 0; i < steps; i++) {
    p = {x: p.x + v.x * dt + 0.5 * a.x * dt * dt, y: p.y + v.y * dt + 0.5 * a.y * dt * dt};
    const a2 = acc(p);
    v = {x: v.x + 0.5 * (a.x + a2.x) * dt, y: v.y + 0.5 * (a.y + a2.y) * dt};
    a = a2;
    pts.push(p);
    if (charges.some((c) => c.q < 0 && Math.hypot(p.x - c.x, p.y - c.y) < sinkR)) break;
    if (p.x < box.left || p.x > box.right || p.y < box.top || p.y > box.bottom) break;
  }
  return pts;
};

export const pathLength = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);

// 沿折线走到总长的 t（0-1）处，返回位置和切线方向
export const pointAlong = (pts: Pt[], t: number) => {
  const total = pathLength(pts);
  let left = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= seg || i === pts.length - 1) {
      const k = seg ? Math.min(1, left / seg) : 0;
      return {p: {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k}, dir: unit({x: b.x - a.x, y: b.y - a.y})};
    }
    left -= seg;
  }
  return {p: pts[0], dir: {x: 1, y: 0}};
};
