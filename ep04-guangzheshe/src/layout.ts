import episode from '../episodes/ep04-guangzheshe.json';

export const [W, H] = episode.format.size.split('x').map(Number);

// 平台遮挡区：顶部标签栏、右侧点赞评论栏、底部操作栏
export const SAFE = {top: 180, railX: 920, railFromY: 900, bottomY: 1540};

export const ZONE = {
  series: {top: 186},
  header: {top: 222, height: 68, left: 60, width: 840, gap: 30},
  dock: {cy: 338, scale: 0.32, gap: 12},
  chip: {left: 60, right: 1020, top: 398},
  stage: {cx: 480, cy: 700},
  panel: {left: 60, top: 1046, width: 840, height: 262},
  subtitle: {left: 60, top: 1322, width: 840, height: 208},
};

export const pillCx = (i: number) => {
  const {left, width, gap} = ZONE.header;
  const w = (width - 2 * gap) / 3;
  return left + i * (w + gap) + w / 2;
};
export const pillWidth = (ZONE.header.width - 2 * ZONE.header.gap) / 3;

// 镜 1-2：水杯、筷子、眼睛
export const CUP = {left: 100, right: 760, rim: 640, surface: 760, bottom: 1270, r: 44};
export const STICK = {top: {x: 130, y: 470}, tip: {x: 470, y: 1160}};
export const EYE = {x: 830, y: 486};

// 镜 3-5：界面上的入射点，水面以下画到 MEDIUM_BOTTOM
export const O = {x: 480, y: 760};
export const MEDIUM_BOTTOM = 1030;
export const DIAGRAM = {left: 60, right: 900, top: 466};
