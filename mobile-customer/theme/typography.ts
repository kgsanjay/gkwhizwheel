/**
 * GK WhizWheel Mobile Design System - Typography Scale
 * Directly extracted from web app MUI theme (resources/js/theme/index.js) & Inter/Figtree scales:
 * 
 * - h1: 40px (2.5rem, weight 800, letterSpacing -0.025em)
 * - h2: 32px (2.0rem, weight 700, letterSpacing -0.02em)
 * - h3: 24px (1.5rem, weight 700, letterSpacing -0.015em)
 * - h4: 20px (1.25rem, weight 600)
 * - h5: 18px (1.1rem, weight 600)
 * - h6 / subtitle1: 16px (1rem, weight 600)
 * - body1: 15px (0.9375rem, lineHeight 1.6)
 * - body2 / subtitle2: 14px (0.875rem, weight 400/600)
 * - caption / badge: 12px (0.75rem)
 */
export const typography = {
  fonts: {
    sans: 'System', // Native fallback to iOS SF Pro / Android Roboto
  },
  sizes: {
    xs: 12,    // Caption, badge, small chips (0.75rem)
    sm: 14,    // Body 2, Subtitle 2, form inputs (0.875rem)
    md: 15,    // Body 1, primary paragraphs (0.9375rem)
    base: 16,  // Subtitle 1, H6, button labels (1.0rem)
    lg: 18,    // H5, card subheaders (1.1rem)
    xl: 20,    // H4, section headers (1.25rem)
    xxl: 24,   // H3, dialog titles (1.5rem)
    title: 32, // H2, screen headers (2.0rem)
    hero: 40,  // H1, hero branding (2.5rem)
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  letterSpacings: {
    tight: -0.5, // Headings letter spacing
    normal: 0,
    wide: 0.5,   // Button labels and badge uppercase tracking
  },
} as const;

export type TypographyTokens = typeof typography;
