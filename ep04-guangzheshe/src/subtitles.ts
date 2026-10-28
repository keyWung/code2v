import type {SubtitleLine} from './components/Subtitle';
import {ZONE} from './layout';
import type {Shot} from './timeline';
import {theme} from './theme';

const KEYWORDS: Record<number, string[][]> = {
  1: [['看起来断了']],
  2: [['光走直线']],
  3: [['约 32°']],
  4: [['约 28°']],
  5: [['约 49°', '全反射']],
  6: [['折射率越大', '拐得越多'], ['电场线']],
};

// 条件和“一句话带过”的现象写在字幕小注里
const NOTES: Record<number, string> = {
  2: '池水看起来比实际浅，也是同一个原理',
  3: '注：入射角、折射角都从法线量起，不是从水面量',
  4: '注：折射率取近似值，不同玻璃略有差异',
  5: '注：光从水射向空气（n 大 → n 小）才会全反射',
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
  const parts = shot.字幕.split(/(?<=。)\s*\/\s*|\s+\/\s+/);
  if (parts.length > 1) {
    return parts.map((text, i) => ({
      text,
      keywords: KEYWORDS[shot.shot]?.[i] ?? [],
      size: i === 0 ? 54 : 40,
      color: i > 0 ? theme.textMuted : undefined,
    }));
  }
  const lines = textWidth(parts[0], 56) > ZONE.subtitle.width ? breakAtPunct(parts[0]) : parts;
  // 两行加小注时略缩字号，整块放得进字幕区
  const size = lines.length > 1 && NOTES[shot.shot] ? 50 : 56;
  return lines.map((text) => ({text, keywords: KEYWORDS[shot.shot]?.[0] ?? [], size}));
};

export const subtitleNote = (shot: Shot): SubtitleLine | null =>
  NOTES[shot.shot] ? {text: NOTES[shot.shot], keywords: [], size: 28, color: theme.textMuted} : null;
