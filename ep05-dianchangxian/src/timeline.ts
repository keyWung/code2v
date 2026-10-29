import {interpolate, spring, SpringConfig} from 'remotion';
import episode from '../episodes/ep05-dianchangxian.json';
import {pillCx, ZONE} from './layout';

export const FPS = episode.format.fps;
export const TOTAL_FRAMES = episode.format.total_frames;

export const shots = episode.shots.map((s) => {
  const [from, to] = s.frames.split('-').map(Number);
  return {...s, from, to};
});
export type Shot = (typeof shots)[number];
export const shotAt = (f: number): Shot =>
  shots.find((s) => f >= s.from && f < s.to) ?? shots[shots.length - 1];

// 最后一镜整段冻结：所有画面元素只读到这一帧
export const FREEZE_FROM = shots[shots.length - 1].from;

const STAMP_LEAD = 60;
export const STAMP_HOLD = 28;
export const STAMP_DOCK = 26;

// 每章一枚，章节最后一镜末尾落下，停靠在该章下方
export type StampSpec = {
  key: string;
  chapter: string;
  text: string;
  shot: number;
  hitAt: number;
  dock: {x: number; y: number; scale: number};
};
export const stamps: StampSpec[] = episode.chapters.map((c, index) => {
  const own = shots.filter((s) => c.shots.includes(s.shot));
  const last = own[own.length - 1];
  return {
    key: c.id,
    chapter: c.id,
    text: c.stamp,
    shot: last.shot,
    hitAt: last.to - STAMP_LEAD,
    dock: {x: pillCx(index), y: ZONE.dock.cy, scale: ZONE.dock.scale},
  };
});

export const chapters = episode.chapters.map((c, index) => {
  const own = shots.filter((s) => c.shots.includes(s.shot));
  const mine = stamps.filter((s) => s.chapter === c.id);
  return {...c, index, start: own[0].from, end: own[own.length - 1].to, stampAt: mine[mine.length - 1].hitAt};
});

const at = (shot: number) => shots[shot - 1].from;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 弹簧 40 帧后定格为精确的 1：小数残差会让字号等在多标签页渲染时光栅化不一致，冻结段出现闪烁
export const settle = (f: number, from: number, config: Partial<SpringConfig>) =>
  f < from ? 0 : f - from >= 40 ? 1 : spring({frame: f - from, fps: FPS, config});

export const progress = (f: number, from: number, to: number) => interpolate(f, [from, to], [0, 1], clamp);

// 口播从本镜 +4 帧开始，下面的节拍按口播里每个短句开口的时间排
export const beats = {
  hook: {lines: at(1) + 36, ask: at(1) + 78},
  model: {count8: at(2) + 34, count24: at(2) + 62, count16: at(2) + 92, chip: at(2) + 86, lens: at(2) + 115, tangent: at(2) + 138, field: at(2) + 184, match: at(2) + 198},
  dense: {
    in: at(3),
    typeFrom: at(3) + 12,
    near: at(3) + 43,
    dense: at(3) + 77,
    strong: at(3) + 104,
    far: at(3) + 144,
    sparse: at(3) + 174,
    weak: at(3) + 201,
    probe: at(3) + 236,
  },
  double: {move: at(4), p1: at(4) + 67, slide: at(4) + 80, p2: at(4) + 97, e1: at(4) + 139, e2: at(4) + 197, quarter: at(4) + 246},
  patterns: {
    in: at(5),
    dipole: at(5) + 75,
    dipoleLines: at(5) + 108,
    same: at(5) + 144,
    sameLines: at(5) + 182,
    plates: at(5) + 219,
    uniform: at(5) + 257,
    uniformName: at(5) + 293,
    cross: at(5) + 355,
    path: at(5) + 385,
  },
};
