import { colors } from './colors';

/**
 * GK WhizWheel Mobile Design System - Spacing Scale
 * Standard 4px / 8px grid matching web CSS and Tailwind conventions.
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
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
} as const;

/**
 * GK WhizWheel Mobile Design System - Border Radius Tokens
 * Extracted directly from web MUI theme shape & component overrides:
 * - MuiButton: 8px
 * - MuiOutlinedInput: 8px
 * - Shape default: 10px
 * - MuiCard & MuiPaper: 12px
 */
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,      // Buttons, inputs (MuiButton, MuiOutlinedInput)
  base: 10,   // Web default shape.borderRadius
  lg: 12,     // Cards, paper (MuiCard, MuiPaper)
  xl: 16,
  xxl: 20,
  full: 9999, // Pills, badges, rounded avatars
} as const;

/**
 * GK WhizWheel Mobile Design System - Elevation & Shadows
 * Aligned with web MUI card shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06)
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modal: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export type SpacingTokens = typeof spacing;
export type BorderRadiusTokens = typeof borderRadius;
export type ShadowTokens = typeof shadows;
