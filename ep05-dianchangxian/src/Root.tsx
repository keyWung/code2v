import React from 'react';
import {Composition, Still} from 'remotion';
import {Cover} from './Cover';
import {EP05} from './EP05';
import {H, W} from './layout';
import {FPS, TOTAL_FRAMES} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition
      id="EP05"
      component={EP05}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{voice: true, debugSafe: false}}
    />
    <Still id="Cover" component={Cover} width={W} height={H} />
    <Still id="Cover34" component={Cover} width={W} height={1440} />
  </>
);
