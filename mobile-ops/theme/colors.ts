/**
 * GK WhizWheel Operations Mobile - Utilitarian High-Contrast Palette
 * Tuned specifically for outdoor, bright-daylight jetty/dockside use in coastal Karnataka.
 * High contrast ratios (> 7:1 for text, deep borders) prevent UI washout under direct sunlight glare.
 */
export const colors = {
  // Primary brand palette (High-Visibility Safety Amber / Gold)
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryLight: '#FEF3C7',
  primaryHover: '#FBBF24',
  primaryContrast: '#090D16', // Deep industrial ink on amber for maximum daylight legibility

  // Secondary brand palette (Deep Industrial Slate / Black)
  secondary: '#0F172A',
  secondaryLight: '#1E293B',
  secondaryDark: '#090D16',
  secondaryContrast: '#FFFFFF',

  // Neutral backgrounds & daylight surfaces (Higher contrast than customer app)
  background: '#F1F5F9', // Crisp Slate 100 for glare reduction
  surface: '#FFFFFF',
  surfaceSecondary: '#E2E8F0', // Clearly distinguished from white in full daylight
  card: '#FFFFFF',
  cardBorder: '#CBD5E1', // Slate 300 strong border to keep cards defined under glare
  darkBackground: '#090D16',
  darkCard: '#0F172A',

  // High-Contrast Typography (Resists direct sunlight washing out)
  text: '#090D16', // Deepest high-contrast black/slate (15:1 contrast on white)
  textSecondary: '#334155', // Slate 700 (> 7:1 contrast on white)
  textMuted: '#64748B', // Slate 500 (accessible metadata)
  textInverse: '#FFFFFF',

  // Utilitarian Operational Status Colors (Saturated & distinct)
  success: '#059669', // Emerald 600
  successLight: '#D1FAE5',
  successDark: '#064E3B',
  successBorder: '#059669',

  warning: '#D97706', // Amber 600
  warningLight: '#FEF3C7',
  warningDark: '#78350F',
  warningBorder: '#D97706',

  danger: '#DC2626', // Red 600
  dangerLight: '#FEE2E2',
  dangerDark: '#7F1D1D',
  dangerBorder: '#DC2626',

  info: '#2563EB', // Blue 600
  infoLight: '#DBEAFE',
  infoDark: '#1E40AF',

  opsBadge: '#4F46E5', // Indigo 600
  opsBadgeLight: '#EEF2FF',

  // Field & Jetty High-Visibility Accents
  hazardYellow: '#FACC15',
  hazardStripe: '#000000',
  highContrastBorder: '#0F172A',
  touchHighlight: '#FEF3C7',

  // Borders & Dividers (Pronounced for sunlight definition)
  border: '#CBD5E1',
  borderDark: '#64748B',
  divider: '#E2E8F0',
  shadow: '#090D16',
  overlay: 'rgba(9, 13, 22, 0.75)',
} as const;

export type Colors = typeof colors;
export type ColorTokens = typeof colors;
