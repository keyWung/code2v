import React from 'react';
import episode from '../../episodes/ep04-guangzheshe.json';
import {pillCx, pillWidth, ZONE} from '../layout';
import {chapters} from '../timeline';
import {alpha, fonts, theme} from '../theme';

export type ChapterStatus = 'locked' | 'current' | 'done';

// 盖章落下的那一刻打勾
export const chapterStatus = (f: number, i: number): ChapterStatus => {
  const c = chapters[i];
  if (f < c.start) return 'locked';
  if (f < c.stampAt) return 'current';
  return 'done';
};

const Lock: React.FC<{color: string}> = ({color}) => (
  <svg width={22} height={26} viewBox="0 0 22 26">
    <rect x={2} y={11} width={18} height={14} rx={3} fill={color} />
    <path d="M6 11 V7 a5 5 0 0 1 10 0 V11" fill="none" stroke={color} strokeWidth={3} />
  </svg>
);

const Check: React.FC = () => (
  <svg width={30} height={30} viewBox="0 0 30 30">
    <circle cx={15} cy={15} r={14} fill={theme.traj60} />
    <path d="M8 15.5 l4.5 4.5 l9.5 -10" fill="none" stroke={theme.bg} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChapterHeader: React.FC<{f: number}> = ({f}) => {
  const {top, height} = ZONE.header;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: ZONE.series.top,
          left: ZONE.header.left,
          fontFamily: fonts.sans,
          fontSize: 24,
          color: theme.textMuted,
          letterSpacing: 2,
        }}
      >
        {episode.series} · {episode.episode} · {episode.title}
      </div>
      {chapters.map((c, i) => {
        const s = chapterStatus(f, i);
        const pulse = s === 'current' ? 0.55 + 0.45 * Math.sin(((f - c.start) / 30) * Math.PI * 2) ** 2 : 1;
        const color = s === 'locked' ? alpha(theme.textMuted, 0.45) : s === 'current' ? theme.accent : theme.text;
        return (
          <div
            key={c.id}
            style={{
              position: 'absolute',
              top,
              left: pillCx(i) - pillWidth / 2,
              width: pillWidth,
              height,
              borderRadius: height / 2,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px 0 24px',
              border: `${s === 'current' ? 3 : 2}px solid ${
                s === 'locked' ? alpha(theme.textMuted, 0.2) : s === 'current' ? theme.accent : alpha(theme.traj60, 0.55)
              }`,
              background:
                s === 'current' ? alpha(theme.accent, 0.12) : s === 'done' ? alpha(theme.traj60, 0.08) : 'transparent',
              boxShadow: s === 'current' ? `0 0 24px ${alpha(theme.accent, 0.35)}` : undefined,
            }}
          >
            <div style={{display: 'flex', alignItems: 'baseline', gap: 12, color}}>
              <span style={{fontFamily: fonts.mono, fontWeight: 800, fontSize: 30}}>{c.id}</span>
              <span style={{fontFamily: fonts.sans, fontWeight: 700, fontSize: c.name.length > 4 ? 26 : 30, whiteSpace: 'nowrap'}}>{c.name}</span>
            </div>
            {s === 'locked' && <Lock color={alpha(theme.textMuted, 0.45)} />}
            {s === 'current' && (
              <div style={{width: 16, height: 16, borderRadius: 8, background: theme.accent, opacity: pulse, marginRight: 6}} />
            )}
            {s === 'done' && <Check />}
          </div>
        );
      })}
    </>
  );
};
