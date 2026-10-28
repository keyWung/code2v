import type {SubtitleLine} from './components/Subtitle';
import {ZONE} from './layout';
import type {Shot} from './timeline';
import {theme} from './theme';

const KEYWORDS: Record<number, string[][]> = {
  1: [['改主意']],
  2: [['惯性与重力', '轨迹固定']],
  3: [['借升力']],
  4: [['看得晚']],
  5: [['够不着', '夹层']],
  6: [['算不准', '变向']],
  7: [['固定抛物线'], ['单摆', '光的折射']],
};

// 比喻与示意图属性写在字幕小注里
const NOTES: Record<number, string> = {
  3: '注：打水漂是比喻 · 示意图，非真实比例',
  5: '注：夹层是通俗说法 · 示意图，非真实比例',
};

const textWidth = (s: string, size: number) =>
  [...s].reduce((w, ch) => w + (ch === ' ' ? 0.3 : ch.charCodeAt(0) > 0x2e80 ? 1 : 0.6) * size, 0);

// 太长时在最靠中间的标点后断行，避免把关键词拆开
export const breakAtPunct = (s: string) => {
  const cuts = [...s.matchAll(/[，？：]/g)].map((m) => m.index! + 1).filter((i) => i < s.length);
  if (!cuts.length) return [s];
  const mid = s.length / 2;
  const cut = cuts.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
  return [s.slice(0, cut), s.slice(cut)];
};

export const subtitleLines = (shot: Shot): SubtitleLine[] => {
  const parts = shot.字幕.split(/\s*\/\s*/);
  if (parts.length > 1) {
    return parts.map((text, i) => ({
      text,
      keywords: KEYWORDS[shot.shot]?.[i] ?? [],
      size: i === 0 ? 54 : 40,
      color: i > 0 ? theme.textMuted : undefined,
    }));
  }
  const size = 56;
  const lines = textWidth(parts[0], size) > ZONE.subtitle.width ? breakAtPunct(parts[0]) : parts;
  return lines.map((text) => ({text, keywords: KEYWORDS[shot.shot]?.[0] ?? [], size}));
};

export const subtitleNote = (shot: Shot): SubtitleLine | null =>
  NOTES[shot.shot] ? {text: NOTES[shot.shot], keywords: [], size: 28, color: theme.textMuted} : null;
