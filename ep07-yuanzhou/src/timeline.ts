import {interpolate, spring, SpringConfig} from 'remotion';
import episode from '../episodes/ep07-yuanzhou.json';
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
  hook: {ask: at(1) + 36, throttle: at(1) + 74, radius: at(1) + 110},
  solo: {uniform: at(2) + 47, speed: at(2) + 86, dir: at(2) + 122, v: at(2) + 168, omega: at(2) + 192, period: at(2) + 214},
  formula: {in: at(3), typeFrom: at(3) + 12, dir: at(3) + 9, accel: at(3) + 39, center: at(3) + 79, size: at(3) + 109, divide: at(3) + 146, ghosts: at(3) + 200},
  compare: {in: at(4), same: at(4) + 9, r2: at(4) + 53, a8: at(4) + 82, r1: at(4) + 108, a16: at(4) + 136, smaller: at(4) + 173, sharper: at(4) + 202},
  forces: {
    in: at(5),
    car: at(5) + 51,
    rope: at(5) + 100,
    tension: at(5) + 130,
    notNew: at(5) + 157,
    net: at(5) + 204,
    notEnough: at(5) + 261,
    inertia: at(5) + 287,
    notPushed: at(5) + 340,
  },
};
