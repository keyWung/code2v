import {spring, SpringConfig} from 'remotion';
import episode from '../episodes/ep01-paowuxian.json';
import {flightTime} from './physics';

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

const STAMP_LEAD = 52;
export const STAMP_HOLD = 22;
export const STAMP_DOCK = 26;

export const chapters = episode.chapters.map((c, index) => {
  const own = shots.filter((s) => c.shots.includes(s.shot));
  const start = own[0].from;
  const end = own[own.length - 1].to;
  return {...c, index, start, end, stampAt: end - STAMP_LEAD};
});

const at = (shot: number) => shots[shot - 1].from;

// 弹簧 40 帧后定格为精确的 1：小数残差会让字号等在多标签页渲染时光栅化不一致，冻结段出现闪烁
export const settle = (f: number, from: number, config: Partial<SpringConfig>) =>
  f < from ? 0 : f - from >= 40 ? 1 : spring({frame: f - from, fps: FPS, config});

// 模拟时钟：慢放时 t 与画面帧线性对应
export const simClock = (f: number, launch: number, frames: number, tMax: number) =>
  Math.max(0, Math.min(1, (f - launch) / frames)) * tMax;

export const beats = {
  hook: {launch: at(1) + 15, frames: 60, tStop: 1.2, mark: at(1) + 80},
  split: {launch: at(2) + 20, frames: 180, xFrom: at(2) + 40, yFrom: at(2) + 125},
  main: {launch: at(3) + 30, frames: 270},
  compare: {launch: at(4) + 40, framesPerSimSecond: 210 / flightTime(60)},
  formula: {in: at(5) + 15, x2: at(5) + 45},
};

export const compareLanding = (deg: number) =>
  Math.round(beats.compare.launch + flightTime(deg) * beats.compare.framesPerSimSecond);
