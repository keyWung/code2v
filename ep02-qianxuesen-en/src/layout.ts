import episode from '../episodes/ep02-qianxuesen-en.json';

export const [W, H] = episode.format.size.split('x').map(Number);

// 平台遮挡区：顶部标签栏、右侧点赞评论栏、底部操作栏
export const SAFE = {top: 180, railX: 920, railFromY: 900, bottomY: 1540};

// 镜 1 复用 EP01 的坐标区：1 米 = PX 像素
export const PX = 18.6;
export const PLOT = {left: 80, bottom: 870};
export const toScreen = (x: number, y: number) => ({
  sx: PLOT.left + x * PX,
  sy: PLOT.bottom - y * PX,
});

// 地球示意：正交投影的球，只露出顶部一段；高度与比例都是示意，不按真实地球
export const GLOBE = {cx: 470, cy: 1640, R: 720};
// 地球只在这个范围内显示，左右和下沿渐隐，避开右侧互动区和下方面板
export const GLOBE_FADE = {left: [30, 90], right: [830, 912], bottom: [1000, 1072]} as const;

export const ZONE = {
  series: {top: 186},
  header: {top: 222, height: 68, left: 60, width: 840, gap: 30},
  dock: {cy: 336, scale: 0.34},
  chip: {left: 60, right: 1020, top: 398},
  stage: {cx: 480, cy: 700},
  panel: {left: 60, top: 1046, width: 840, height: 262},
  reasons: {cy: 1180, xs: [200, 480, 760], scale: 0.62},
  subtitle: {left: 60, top: 1322, width: 840, height: 208},
};

export const pillCx = (i: number) => {
  const {left, width, gap} = ZONE.header;
  const w = (width - 2 * gap) / 3;
  return left + i * (w + gap) + w / 2;
};
export const pillWidth = (ZONE.header.width - 2 * ZONE.header.gap) / 3;
