import React from 'react';
import {ZONE} from '../layout';
import {alpha, fonts, theme} from '../theme';

export type SubtitleLine = {text: string; keywords: string[]; size: number; color?: string};

const split = (text: string, keywords: string[]) => {
  const parts: {s: string; hl: boolean}[] = [];
  let rest = text;
  while (rest) {
    let best = -1;
    let kw = '';
    for (const k of keywords) {
      const i = rest.indexOf(k);
      if (i >= 0 && (best < 0 || i < best)) {
        best = i;
        kw = k;
      }
    }
    if (best < 0) {
      parts.push({s: rest, hl: false});
      break;
    }
    if (best > 0) parts.push({s: rest.slice(0, best), hl: false});
    parts.push({s: kw, hl: true});
    rest = rest.slice(best + kw.length);
  }
  return parts;
};

// 一句一结论，关键词 accent 高亮
export const Subtitle: React.FC<{lines: SubtitleLine[]; opacity: number}> = ({lines, opacity}) => {
  const {left, top, width, height} = ZONE.subtitle;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        textAlign: 'center',
      }}
    >
      {lines.map((l) => (
        <div
          key={l.text}
          style={{
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: l.size,
            lineHeight: 1.28,
            textWrap: 'balance',
            color: l.color ?? theme.text,
            textShadow: `0 4px 18px ${alpha(theme.bg, 0.9)}`,
          }}
        >
          {split(l.text, l.keywords).map((p, i) => (
            <span key={i} style={{color: p.hl ? theme.accent : undefined, whiteSpace: p.hl ? 'nowrap' : undefined}}>
              {p.s}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};
