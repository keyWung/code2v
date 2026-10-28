import React from 'react';
import episode from '../../episodes/ep01-paowuxian.json';
import {cases, g, v0} from '../physics';
import {ZONE} from '../layout';
import {alpha, angleColor, fonts, theme} from '../theme';

const [LINE_X, LINE_Y] = episode.physics.core_code;
const CUT = LINE_Y.indexOf(' - ');
const COMMENT = `// v0 = ${v0} m/s · g = ${g} · 忽略空气阻力`;
export const CODE_CHARS = LINE_X.length + LINE_Y.length;

const TOKEN = /(\/\/.*$)|\b(const)\b|\b(Math)\b|\b(cos|sin)\b|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|(.)/g;

const Highlighted: React.FC<{code: string}> = ({code}) => {
  const out: React.ReactNode[] = [];
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(code))) {
    const [s, comment, kw, math, fn, num, id, ws] = m;
    const color = comment
      ? theme.textMuted
      : kw
        ? theme.traj30
        : math || fn
          ? theme.traj45
          : num
            ? theme.traj60
            : id
              ? theme.text
              : ws
                ? undefined
                : theme.textMuted;
    out.push(
      <span key={m.index} style={{color, fontStyle: comment ? 'italic' : undefined}}>
        {s}
      </span>,
    );
  }
  return <>{out}</>;
};

const LINE_H = 46;

const CodeRow: React.FC<{
  code: string;
  band?: string;
  bandOpacity?: number;
  note?: string;
  noteColor?: string;
  cursor?: boolean;
}> = ({code, band, bandOpacity = 0, note, noteColor, cursor}) => (
  <div style={{position: 'relative', height: LINE_H, display: 'flex', alignItems: 'center', whiteSpace: 'pre'}}>
    {band && bandOpacity > 0 && (
      <div
        style={{
          position: 'absolute',
          inset: '2px -28px',
          background: alpha(band, 0.13 * bandOpacity),
          borderLeft: `6px solid ${alpha(band, bandOpacity)}`,
        }}
      />
    )}
    <span style={{position: 'relative'}}>
      <Highlighted code={code} />
      {cursor && <span style={{background: theme.accent, width: 16, height: 34, display: 'inline-block', verticalAlign: -6}} />}
    </span>
    {note && bandOpacity > 0 && (
      <span
        style={{
          position: 'absolute',
          right: 0,
          fontFamily: fonts.sans,
          fontSize: 26,
          fontWeight: 700,
          color: noteColor,
          opacity: bandOpacity,
        }}
      >
        {note}
      </span>
    )}
  </div>
);

const Tab: React.FC<{label: string; active: boolean}> = ({label, active}) => (
  <div
    style={{
      fontFamily: fonts.sans,
      fontSize: 22,
      padding: '0 18px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      color: active ? theme.text : theme.textMuted,
      borderBottom: `3px solid ${active ? theme.accent : 'transparent'}`,
    }}
  >
    {label}
  </div>
);

export const PanelFrame: React.FC<{opacity: number; tabs: React.ReactNode; children: React.ReactNode}> = ({
  opacity,
  tabs,
  children,
}) => {
  const {left, top, width, height} = ZONE.panel;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        opacity,
        borderRadius: 22,
        background: theme.panel,
        border: `2px solid ${theme.panelBorder}`,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 18px',
          borderBottom: `2px solid ${theme.panelBorder}`,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{width: 14, height: 14, borderRadius: 7, background: alpha(theme.textMuted, 0.35)}} />
        ))}
        <div style={{width: 18}} />
        {tabs}
      </div>
      <div style={{position: 'relative', height: height - 56}}>{children}</div>
    </div>
  );
};

const fmtHeight = (h: number) => `${Number(h.toFixed(1))}`;

export const CodePanel: React.FC<{
  opacity: number;
  typed: number;
  cursor: boolean;
  hx: number;
  hy: number;
  view: number;
  rows: number[];
  tags: number;
}> = ({opacity, typed, cursor, hx, hy, view, rows, tags}) => {
  if (opacity <= 0) return null;
  const nx = Math.min(LINE_X.length, typed);
  const ny = Math.max(0, Math.min(LINE_Y.length, typed - LINE_X.length));
  const y1 = LINE_Y.slice(0, Math.min(ny, CUT));
  const y2 = ny > CUT + 1 ? ' '.repeat(8) + LINE_Y.slice(CUT + 1, ny) : '';
  const cursorRow = ny === 0 ? 0 : ny <= CUT ? 1 : 2;

  return (
    <PanelFrame
      opacity={opacity}
      tabs={
        <>
          <Tab label="抛物线.ts" active={view < 0.5} />
          <Tab label="运行输出" active={view >= 0.5} />
        </>
      }
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '14px 28px',
          fontFamily: fonts.mono,
          fontSize: 30,
          opacity: 1 - view,
        }}
      >
        <CodeRow code={COMMENT} />
        <CodeRow code={LINE_X.slice(0, nx)} band={theme.text} bandOpacity={hx} note="// 匀速" noteColor={theme.text} cursor={cursor && cursorRow === 0} />
        <CodeRow code={y1} band={theme.accent} bandOpacity={hy} cursor={cursor && cursorRow === 1} />
        <CodeRow code={y2} band={theme.accent} bandOpacity={hy} note="// 加速" noteColor={theme.accent} cursor={cursor && cursorRow === 2} />
      </div>
      <div style={{position: 'absolute', inset: 0, padding: '16px 28px', opacity: view}}>
        <div style={{fontFamily: fonts.mono, fontSize: 24, color: theme.textMuted, height: 44}}>$ node 抛物线.ts</div>
        {cases.map((c, i) => {
          const color = angleColor(c.angle_deg);
          const tag = c.angle_deg === 45 ? '最远' : '同落';
          return (
            <div
              key={c.angle_deg}
              style={{
                display: 'grid',
                gridTemplateColumns: '84px 190px 170px 220px 1fr',
                alignItems: 'baseline',
                height: 52,
                opacity: rows[i] ?? 0,
                fontFamily: fonts.sans,
                fontSize: 28,
                color: theme.text,
              }}
            >
              <span style={{fontFamily: fonts.mono, fontWeight: 700, color}}>{c.angle_deg}°</span>
              <span>
                飞行 <span style={{fontFamily: fonts.mono}}>{c.flight_time_s.toFixed(2)}</span> 秒
              </span>
              <span>
                最高 <span style={{fontFamily: fonts.mono}}>{fmtHeight(c.max_height_m)}</span> 米
              </span>
              <span style={{fontWeight: 700}}>射程 {c.range_display}</span>
              <span style={{color: theme.accent, fontWeight: 800, opacity: tags}}>{tag}</span>
            </div>
          );
        })}
      </div>
    </PanelFrame>
  );
};
