import { colors, spacing, typography, borderRadius, touchTargets, shadows, theme } from '../theme';

/**
 * Utility to calculate relative luminance according to WCAG 2.1 specifications.
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Utility to calculate contrast ratio between two hex colors.
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Operations Theme & Daylight High-Contrast Tokens', () => {
  describe('Touch Targets (Field & Glove Friendly)', () => {
    it('enforces minimum 48dp touch target for field accessibility', () => {
      expect(touchTargets.min).toBeGreaterThanOrEqual(48);
    });

    it('enforces standard 56dp thumb target for operations inputs and buttons', () => {
      expect(touchTargets.default).toBeGreaterThanOrEqual(56);
    });

    it('enforces 64dp hero touch target for critical dispatches and actions', () => {
      expect(touchTargets.large).toBeGreaterThanOrEqual(64);
    });

    it('enforces generous tab bar height for bottom thumb navigation', () => {
      expect(touchTargets.tabBar).toBeGreaterThanOrEqual(64);
    });
  });

  describe('Outdoor Sunlight Legibility & Stepped-Up Typography', () => {
    it('eliminates sub-12px microcopy to ensure readability in direct sunlight', () => {
      expect(typography.sizes.xs).toBeGreaterThanOrEqual(13);
      expect(typography.sizes.sm).toBeGreaterThanOrEqual(15);
      expect(typography.sizes.base).toBeGreaterThanOrEqual(18);
      expect(typography.sizes.lg).toBeGreaterThanOrEqual(20);
      expect(typography.sizes.xl).toBeGreaterThanOrEqual(24);
      expect(typography.sizes.xxl).toBeGreaterThanOrEqual(28);
    });

    it('provides heavy font weights (800) for sharp daylight definition', () => {
      expect(typography.weights.heavy).toBe('800');
      expect(typography.weights.bold).toBe('700');
    });
  });

  describe('High-Contrast Color Tokens & WCAG Compliance', () => {
    it('ensures primary text against card/surface exceeds WCAG AAA (7:1)', () => {
      const contrast = getContrastRatio(colors.text, colors.surface);
      // #090D16 against #FFFFFF gives ~18.8:1
      expect(contrast).toBeGreaterThan(15);
    });

    it('ensures primary button text against amber primary exceeds WCAG AA (4.5:1)', () => {
      const contrast = getContrastRatio(colors.primaryContrast, colors.primary);
      // #090D16 on #F59E0B gives ~8.7:1
      expect(contrast).toBeGreaterThan(7);
    });

    it('ensures inverse text against dark navy secondary background exceeds WCAG AAA', () => {
      const contrast = getContrastRatio(colors.textInverse, colors.secondary);
      // #FFFFFF on #0F172A gives ~15.9:1
      expect(contrast).toBeGreaterThan(12);
    });

    it('provides stout border and badge tokens for daylight glare resistance', () => {
      expect(colors.borderDark).toBeDefined();
      expect(colors.cardBorder).toBeDefined();
      expect(colors.successBorder).toBeDefined();
      expect(colors.warningBorder).toBeDefined();
      expect(colors.dangerBorder).toBeDefined();
    });
  });

  describe('Theme Aggregator', () => {
    it('exports complete composite theme object with all operational tokens', () => {
      expect(theme.colors).toEqual(colors);
      expect(theme.spacing).toEqual(spacing);
      expect(theme.typography).toEqual(typography);
      expect(theme.borderRadius).toEqual(borderRadius);
      expect(theme.shadows).toEqual(shadows);
      expect(theme.touchTargets).toEqual(touchTargets);
    });
  });
});
