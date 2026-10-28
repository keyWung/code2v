import {Easing, interpolate, spring, SpringConfig} from 'remotion';
import episode from '../episodes/ep02-qianxuesen.json';
import {TILT_MAX} from './globe';
import {pillCx, ZONE} from './layout';
import {ballisticPath, extrapolate, GLIDE_A, GLIDE_B, pathAt, radarSees, uAtS} from './physics';

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

// 章 01、02 各一枚，停靠到顶部该章下方；章 03 每个小节一枚，停靠到原因栏
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
  if (c.stamps) {
    return c.stamps.map((text, i) => ({
      key: `${c.id}-${i + 1}`,
      chapter: c.id,
      text,
      shot: own[i].shot,
      hitAt: own[i].to - STAMP_LEAD,
      dock: {x: ZONE.reasons.xs[i], y: ZONE.reasons.cy, scale: ZONE.reasons.scale},
    }));
  }
  const last = own[own.length - 1];
  return [
    {
      key: c.id,
      chapter: c.id,
      text: c.stamp,
      shot: last.shot,
      hitAt: last.to - STAMP_LEAD,
      dock: {x: pillCx(index), y: ZONE.dock.cy, scale: ZONE.dock.scale},
    },
  ];
});
export const reasonStamps = stamps.filter((s) => s.dock.y === ZONE.reasons.cy);

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

// 镜 3、镜 6 转到斜上方视角，侧向变向才看得出来；镜 4、镜 5 回到正侧面
export const tiltAt = (f: number) =>
  TILT_MAX *
  interpolate(f, [at(3), at(3) + 30, at(4), at(4) + 25, at(6), at(6) + 25], [0, 1, 1, 0, 0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

const s4Launch = at(4) + 75;
const s4Arrive = at(4) + 240;
const firstSeen = (pos: (p: number) => Parameters<typeof radarSees>[0]) => {
  for (let f = s4Launch; f <= s4Arrive; f++) if (radarSees(pos(progress(f, s4Launch, s4Arrive)))) return f;
  return s4Arrive;
};

const s6From = at(6) + 25;
const s6To = at(6) + 310;
const s6U = [uAtS(GLIDE_B, -120), uAtS(GLIDE_B, 240)] as const;
export const glideBU = (f: number) => interpolate(f, [s6From, s6To], [...s6U], clamp);
const PREDICT = 190;
const predict = (f: number) => ({at: f, pt: extrapolate(GLIDE_B, glideBU(f), PREDICT)});

export const beats = {
  hook: {launch: at(1) + 12, apex: at(1) + 62, glideEnd: at(1) + 132, question: at(1) + 118},
  ballistic: {
    globeIn: at(2) + 4,
    launch: at(2) + 50,
    cut: at(2) + 90,
    predict: at(2) + 215,
    predictEnd: at(2) + 245,
    land: at(2) + 320,
  },
  glide: {
    chip: at(3) + 12,
    launch: at(3) + 50,
    land: at(3) + 360,
    codeNote: at(3) + 40,
    lift: uAtS(GLIDE_A, -116),
    liftEnd: uAtS(GLIDE_A, 222),
    turn: uAtS(GLIDE_A, 50),
  },
  radar: {
    in: at(4) + 18,
    horizon: at(4) + 40,
    blind: at(4) + 55,
    launch: s4Launch,
    arrive: s4Arrive,
    seenBallistic: firstSeen((p) => ballisticPath(p, 0.1)),
    seenGlide: firstSeen((p) => pathAt(GLIDE_A, p)),
  },
  layers: {
    in: at(5) + 15,
    band: at(5) + 50,
    glideFrom: at(5) + 30,
    glideTo: at(5) + 180,
    airDefense: at(5) + 140,
    space: at(5) + 165,
    reach: at(5) + 190,
  },
  maneuver: {
    from: s6From,
    to: s6To,
    predictions: [predict(at(6) + 65), predict(at(6) + 170), predict(at(6) + 255)],
    fails: [at(6) + 160, at(6) + 245],
  },
};
