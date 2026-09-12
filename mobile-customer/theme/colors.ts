/**
 * GK WhizWheel Mobile Design System - Color Palette
 * Extracted directly from web app brand identity (resources/js/theme/index.js & Tailwind).
 * 
 * - Brand Primary / Accent: Electric Amber (#F59E0B)
 * - Contrast / Dark: Deep Slate (#0F172A)
 * - Info / Dark Accent: Sky (#38BDF8)
 * - Semantic Emerald / Red / Amber for confirmed/error/warning states.
 */
export const colors = {
  // Brand Amber (GK WhizWheel primary CTA & brand highlight from web MUI theme)
  primary: '#F59E0B',        // Electric Amber 500
  primaryDark: '#D97706',    // Amber 600
  primaryLight: '#FEF3C7',   // Amber 100
  primaryHover: '#FBBF24',   // Amber 400
  primaryContrast: '#0F172A', // Slate 900 on Amber

  // Slate (Web primary dark & typography)
  secondary: '#0F172A',      // Slate 900
  secondaryLight: '#1E293B',  // Slate 800
  secondaryMuted: '#334155',  // Slate 700

  // Semantic Status Colors
  accent: '#10B981',         // Emerald 500 (Confirmed / Active)
  accentLight: '#D1FAE5',    // Emerald 100
  accentDark: '#059669',     // Emerald 600

  danger: '#EF4444',         // Red 500 (Error)
  dangerLight: '#FEF2F2',    // Red 50 / 100 background
  dangerDark: '#DC2626',     // Red 600
  dangerText: '#991B1B',     // Red 800 (Accessible high-contrast text on dangerLight)

  warning: '#F59E0B',        // Amber 500
  warningLight: '#FEF3C7',   // Amber 100
  warningDark: '#D97706',    // Amber 600
  warningText: '#92400E',    // Amber 800 (High-contrast text on warningLight)

  info: '#38BDF8',           // Sky 400 (Web Dark Theme Primary)
  infoLight: '#E0F2FE',      // Sky 100
  infoDark: '#0284C7',       // Sky 600

  success: '#10B981',        // Emerald 500
  successLight: '#D1FAE5',   // Emerald 100
  successDark: '#059669',    // Emerald 600
  successText: '#065F46',    // Emerald 800 (High-contrast text on successLight)

  // Surfaces & Backgrounds
  background: '#F8FAFC',     // Slate 50 (Web light mode background)
  card: '#FFFFFF',           // White paper/card
  cardBorder: '#E2E8F0',     // Slate 200
  darkBackground: '#0B1120', // Midnight / Slate 950 (Web dark background)
  darkCard: '#131D2F',       // Web dark paper

  // Typography Colors
  text: '#0F172A',           // Slate 900 (Web text.primary)
  textSecondary: '#64748B',  // Slate 500 (Web text.secondary / muted)
  textMuted: '#94A3B8',      // Slate 400
  textInverted: '#FFFFFF',   // Pure white for dark buttons

  // Borders, Dividers & Shadows
  border: '#E2E8F0',         // Slate 200
  borderDark: '#CBD5E1',     // Slate 300
  divider: '#F1F5F9',        // Slate 100
  shadow: '#0F172A',         // Slate 900 base shadow
  overlay: 'rgba(15, 23, 42, 0.6)', // 60% opacity Slate 900
};

export type ColorTokens = typeof colors;
