import {interpolate, spring, SpringConfig} from 'remotion';
import episode from '../episodes/ep04-guangzheshe.json';
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
  hook: {ring: at(1) + 34},
  eye: {real: at(2) + 6, eye: at(2) + 36, water: at(2) + 76, air: at(2) + 108, back: at(2) + 146, image: at(2) + 176},
  water: {
    in: at(3),
    typeFrom: at(3) + 14,
    incident: at(3) + 30,
    theta1: at(3) + 54,
    refracted: at(3) + 98,
    theta2: at(3) + 120,
    normal: at(3) + 150,
    notSurface: at(3) + 198,
    speed: at(3) + 236,
    bend: at(3) + 276,
  },
  glass: {move: at(4), refracted: at(4) + 34, theta2: at(4) + 56, ghost: at(4) + 78, n: at(4) + 110, v: at(4) + 145, bend: at(4) + 172},
  tir: {
    in: at(5),
    incident: at(5) + 20,
    sweep: at(5) + 56,
    critical: at(5) + 100,
    beyond: at(5) + 112,
    total: at(5) + 134,
    fiber: at(5) + 212,
    again: at(5) + 300,
  },
};
