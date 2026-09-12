import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { borderRadius } from './borderRadius';
import { shadows } from './shadows';
import { touchTargets } from './touchTargets';

/**
 * GK WhizWheel Operations Mobile Design System
 * Utilitarian, high-contrast theme optimized for bright-daylight outdoor jetty use,
 * with oversized tap targets and stepped-up typography for one-handed operation.
 */
export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
  touchTargets,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Typography = typeof typography;
export type TouchTargets = typeof touchTargets;

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './borderRadius';
export * from './shadows';
export * from './touchTargets';
export default theme;
