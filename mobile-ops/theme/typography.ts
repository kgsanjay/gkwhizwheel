import { TextStyle } from 'react-native';

/**
 * GK WhizWheel Operations Mobile - Outdoor High-Legibility Typography Scale
 * Stepped up by ~2pt across every level compared to the customer app,
 * designed for quick scanning at arm's length while staff handle bikes,
 * helmets, or boat mooring lines under bright sunlight.
 */
export const typography = {
  fonts: {
    sans: 'System',
  },
  sizes: {
    xs: 13,     // Badges, status chips, small timestamps (customer app: 12)
    sm: 15,     // Subtitle, helper text, form labels (customer app: 14)
    md: 17,     // Primary body text, input fields (customer app: 15)
    base: 18,   // Standard body, button labels (customer app: 16)
    lg: 20,     // Card headers, sub-metrics (customer app: 18)
    xl: 24,     // Section titles, primary dialog headers (customer app: 20)
    xxl: 28,    // Screen titles, vehicle numbers (customer app: 24)
    '2xl': 28,  // Screen titles (alias)
    '3xl': 34,  // Major section headers (customer app: 30)
    title: 34,  // Screen title (alias)
    '4xl': 42,  // Metric figures, voucher hero display (customer app: 36)
    hero: 42,   // Hero figures (alias)
  },
  weights: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    heavy: '800' as TextStyle['fontWeight'],
    black: '900' as TextStyle['fontWeight'],
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.65,
  },
  letterSpacings: {
    tight: -0.5,
    normal: 0,
    wide: 0.6,
  },
} as const;

export type Typography = typeof typography;
export type TypographyTokens = typeof typography;
