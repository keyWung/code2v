import {interpolate, spring, SpringConfig} from 'remotion';
import episode from '../episodes/ep03-danbai.json';
import {pillCx, ZONE} from './layout';
import {stampWidth} from './stampText';

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

// 每章一枚停在该章下方；章 02 两个小节各一枚，并排停在章 02 下方
export type StampSpec = {
  key: string;
  chapter: string;
  text: string;
  shot: number;
  hitAt: number;
  dock: {x: number; y: number; scale: number};
};
export const stamps: StampSpec[] = episode.chapters.flatMap((c, index) => {
  const own = shots.filter((s) => c.shots.includes(s.shot));
  const texts = c.stamps ?? [c.stamp];
  const {scale, gap, cy} = ZONE.dock;
  const widths = texts.map((t) => stampWidth(t) * scale);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (texts.length - 1);
  let left = pillCx(index) - total / 2;
  return texts.map((text, i) => {
    const x = left + widths[i] / 2;
    left += widths[i] + gap;
    const shot = c.stamps ? own[i] : own[own.length - 1];
    return {
      key: `${c.id}-${i + 1}`,
      chapter: c.id,
      text,
      shot: shot.shot,
      hitAt: shot.to - STAMP_LEAD,
      dock: {x, y: cy, scale},
    };
  });
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

// 松手后的真实时间（秒）：摆动是实时的，不慢放
export const since = (f: number, release: number) => Math.max(0, (f - release) / FPS);

export const beats = {
  clock: {release: at(1)},
  single: {
    stringIn: at(2) + 18,
    bobIn: at(2) + 50,
    release: at(2) + 90,
    arc: at(2) + 122,
    typeFrom: at(2) + 10,
  },
  lengths: {in: at(3) + 5, release: at(3) + 40, ratio: at(3) + 196},
  sync: {in: at(4) + 5, release: at(4) + 30, condition: at(4) + 92},
  formula: {in: at(5) + 10, release: at(5) + 20, rows: [at(5) + 55, at(5) + 95, at(5) + 135], arrows: at(5) + 180, hl: at(5) + 115, note: at(5) + 200},
};
