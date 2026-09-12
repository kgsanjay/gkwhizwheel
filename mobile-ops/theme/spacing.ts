/**
 * GK WhizWheel Operations Mobile - Spacing Scale
 * Standard 4px / 8px grid with extended ergonomics for single-handed mobile use.
 */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  huge: 48,
  massive: 64,
} as const;

export type Spacing = typeof spacing;
export type SpacingTokens = typeof spacing;
