import React from 'react';
import {Composition, Still} from 'remotion';
import {Cover} from './Cover';
import {EP03} from './EP03';
import {H, W} from './layout';
import {FPS, TOTAL_FRAMES} from './timeline';

export const Root: React.FC = () => (
  <>
    <Composition
      id="EP03"
      component={EP03}
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
