import type {SubtitleLine} from './components/Subtitle';
import {ZONE} from './layout';
import type {Shot} from './timeline';
import {theme} from './theme';

const KEYWORDS: Record<number, string[][]> = {
  1: [['画线']],
  2: [['模型', '切线方向']],
  3: [['线密', '场就强']],
  4: [['只剩 1/4']],
  5: [['不相交']],
  6: [['疏密就是强弱'], ['波的干涉']],
};

// 条件和“必须讲清”的边界写在字幕小注里
const NOTES: Record<number, string> = {
  2: '注：线是人为画的模型，不是真实存在的线，条数只是示意',
  3: '注：条数是示意，看的是疏密趋势，不是数出来的',
  4: '注：r 翻倍，r² 变成 4 倍，所以 E 只剩 1/4',
  5: '注：平行板间的线平行等距，是忽略了边缘效应',
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
