import React from 'react';
import {interpolateColors} from 'remotion';
import {alpha, fonts, theme} from '../theme';
import {PanelFrame} from './CodePanel';

const I: React.FC<{children: React.ReactNode}> = ({children}) => <i style={{fontStyle: 'italic'}}>{children}</i>;
const Sup: React.FC<{children: React.ReactNode}> = ({children}) => (
  <sup style={{fontSize: '0.6em', verticalAlign: '0.75em', lineHeight: 0}}>{children}</sup>
);
// 上下标叠放，如 v₀²
const SubSup: React.FC<{sub: string; sup: string}> = ({sub, sup}) => (
  <span
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      fontSize: '0.6em',
      lineHeight: 1,
      verticalAlign: '0.75em',
      marginLeft: 2,
    }}
  >
    <span>{sup}</span>
    <span style={{marginTop: '0.1em'}}>{sub}</span>
  </span>
);

// 视频内只留这一行：y = x·tanθ − g·x² / (2v0²cos²θ)
export const FormulaPanel: React.FC<{opacity: number; hl: number}> = ({opacity, hl}) => {
  if (opacity <= 0) return null;
  const x2Color = interpolateColors(hl, [0, 1], [theme.text, theme.accent]);
  return (
    <PanelFrame
      opacity={opacity}
      tabs={<div style={{fontFamily: fonts.sans, fontSize: 22, color: theme.text}}>消去时间 t 之后</div>}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.math,
          fontSize: 66,
          color: theme.text,
          whiteSpace: 'nowrap',
        }}
      >
        <I>y</I>
        <span style={{margin: '0 18px'}}>=</span>
        <I>x</I>
        <span style={{margin: '0 6px'}}>·</span>
        tan<I>θ</I>
        <span style={{margin: '0 18px'}}>−</span>
        <span style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', fontSize: 56}}>
          <span style={{padding: '0 12px 6px', display: 'flex', alignItems: 'baseline'}}>
            <I>g</I>
            <span style={{margin: '0 4px'}}>·</span>
            <span
              style={{
                color: x2Color,
                padding: '0 8px',
                borderRadius: 10,
                background: alpha(theme.accent, 0.16 * hl),
                boxShadow: `0 0 0 3px ${alpha(theme.accent, hl)}`,
                transform: `scale(${1 + 0.14 * hl})`,
                display: 'inline-block',
              }}
            >
              <I>x</I>
              <Sup>2</Sup>
            </span>
          </span>
          <span style={{alignSelf: 'stretch', height: 4, background: theme.text}} />
          <span style={{padding: '8px 12px 0'}}>
            2<I>v</I>
            <SubSup sub="0" sup="2" />
            <span style={{marginLeft: 6}}>cos</span>
            <Sup>2</Sup>
            <I>θ</I>
          </span>
        </span>
      </div>
    </PanelFrame>
  );
};
