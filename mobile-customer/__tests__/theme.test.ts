import { theme, colors, spacing, borderRadius, shadows, typography } from '../theme';

describe('Design System Theme Tokens', () => {
  it('exports cohesive brand colors matching the web app identity', () => {
    // Brand Electric Amber
    expect(colors.primary).toBe('#F59E0B');
    expect(colors.primaryDark).toBe('#D97706');
    expect(colors.primaryLight).toBe('#FEF3C7');
    expect(colors.primaryContrast).toBe('#0F172A');

    // Deep Slate (Web primary text / dark theme surface)
    expect(colors.secondary).toBe('#0F172A');
    expect(colors.text).toBe('#0F172A');
    expect(colors.background).toBe('#F8FAFC');
    expect(colors.darkBackground).toBe('#0B1120');

    // Web Sky Dark Mode / Info Accent
    expect(colors.info).toBe('#38BDF8');

    // Semantic status colors
    expect(colors.success).toBe('#10B981');
    expect(colors.danger).toBe('#EF4444');
    expect(colors.dangerText).toBe('#991B1B');
    expect(colors.warning).toBe('#F59E0B');
  });

  it('matches web app typography scale & hierarchy', () => {
    // Scale matching h1 (40), h2 (32), h3 (24), h4 (20), h5 (18), h6 (16), body1 (15), body2 (14), caption (12)
    expect(typography.sizes.xs).toBe(12);
    expect(typography.sizes.sm).toBe(14);
    expect(typography.sizes.md).toBe(15);
    expect(typography.sizes.base).toBe(16);
    expect(typography.sizes.lg).toBe(18);
    expect(typography.sizes.xl).toBe(20);
    expect(typography.sizes.xxl).toBe(24);
    expect(typography.sizes.title).toBe(32);
    expect(typography.sizes.hero).toBe(40);

    // Font weights
    expect(typography.weights.regular).toBe('400');
    expect(typography.weights.semibold).toBe('600');
    expect(typography.weights.bold).toBe('700');
    expect(typography.weights.heavy).toBe('800');
  });

  it('provides spacing tokens based on 4px/8px grid', () => {
    expect(spacing.none).toBe(0);
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(12);
    expect(spacing.lg).toBe(16);
    expect(spacing.xl).toBe(20);
    expect(spacing.xxl).toBe(24);
    expect(spacing.xxxl).toBe(32);
  });

  it('provides border radius tokens matching web MUI component shapes', () => {
    // MuiButton & MuiOutlinedInput: 8px
    expect(borderRadius.md).toBe(8);
    // Web default shape.borderRadius: 10px
    expect(borderRadius.base).toBe(10);
    // MuiCard & MuiPaper: 12px
    expect(borderRadius.lg).toBe(12);
    // Pills / circular badges: 9999
    expect(borderRadius.full).toBe(9999);
  });

  it('provides shadow tokens for native cards and modals', () => {
    expect(shadows.card.elevation).toBe(2);
    expect(shadows.card.shadowColor).toBe(colors.shadow);
    expect(shadows.modal.elevation).toBe(8);
  });

  it('bundles all tokens into unified default theme export', () => {
    expect(theme.colors).toBe(colors);
    expect(theme.spacing).toBe(spacing);
    expect(theme.borderRadius).toBe(borderRadius);
    expect(theme.typography).toBe(typography);
    expect(theme.shadows).toBe(shadows);
  });
});
