import { colors } from './colors';
import { spacing, borderRadius, shadows } from './spacing';
import { typography } from './typography';

/**
 * GK WhizWheel Mobile Design System
 * Unified theme tokens matching the web app's brand identity (resources/js/theme/index.js).
 */
export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Typography = typeof typography;

export * from './colors';
export * from './spacing';
export * from './typography';
export default theme;
