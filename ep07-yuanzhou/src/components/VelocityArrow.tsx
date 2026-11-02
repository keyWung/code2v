import React from 'react';
import type {Pt} from '../physics';
import {roles} from '../theme';
import {VectorArrow} from './VectorArrow';

// 速度箭头：沿切线，长度按 V_PX 每 m/s 画
export const VelocityArrow: React.FC<{p: Pt; dir: Pt; len: number; opacity?: number; width?: number}> = (props) => (
  <VectorArrow color={roles.velocity} {...props} />
);
