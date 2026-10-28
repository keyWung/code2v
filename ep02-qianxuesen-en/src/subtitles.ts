import type {SubtitleLine} from './components/Subtitle';
import {ZONE} from './layout';
import type {Shot} from './timeline';
import {theme} from './theme';

const KEYWORDS: Record<number, string[][]> = {
  1: [['changes course']],
  2: [['inertia and gravity', 'fixed']],
  3: [['Glide on lift']],
  4: [['Seen late']],
  5: [['Hard to reach', 'gap']],
  6: [['Hard to predict', 'turns']],
  7: [['fixed parabola'], ['pendulum', 'refraction']],
};

// 比喻与示意图属性写在字幕小注里
const NOTES: Record<number, string> = {
  3: 'Note: “skipping stone” is a metaphor · schematic, not to scale',
  5: 'Note: “gap” is a plain-language term · schematic, not to scale',
};

const SIZE = 52;
const textWidth = (s: string, size: number) => s.length * size * 0.5;
// 断行后单行仍放不下就整行缩小字号（每行固定，不做动画）
const fit = (s: string) => Math.min(SIZE, Math.floor(ZONE.subtitle.width / (s.length * 0.5)));

// 太长时在最靠中间的句号、冒号、逗号后断行，一行一个意思
export const breakAtClause = (s: string) => {
  const cuts = [...s.matchAll(/[.:,?] /g)].map((m) => m.index! + 1);
  if (!cuts.length) return [s];
  const mid = s.length / 2;
  const cut = cuts.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  return [s.slice(0, cut), s.slice(cut + 1)];
};

export const subtitleLines = (shot: Shot): SubtitleLine[] => {
  const [main, next] = shot.字幕.split(/\s+\/\s+/);
  const keywords = KEYWORDS[shot.shot] ?? [];
  const lines = textWidth(main, SIZE) > ZONE.subtitle.width ? breakAtClause(main) : [main];
  return [
    ...lines.map((text) => ({text, keywords: keywords[0] ?? [], size: Math.min(...lines.map(fit))})),
    ...(next ? [{text: next, keywords: keywords[1] ?? [], size: 38, color: theme.textMuted}] : []),
  ];
};

export const subtitleNote = (shot: Shot): SubtitleLine | null =>
  NOTES[shot.shot] ? {text: NOTES[shot.shot], keywords: [], size: 26, color: theme.textMuted} : null;
