import { colors, spacing, typography, borderRadius, shadows } from '../theme';
import { storage } from '../api/storage';
import { Button, Input, Header, Badge, Card } from '../components';

describe('GKWhizWheel Ops Mobile App Initialization', () => {
  describe('Design System & Theme Tokens', () => {
    test('theme exports expected brand color tokens', () => {
      expect(colors.primary).toBe('#F59E0B');
      expect(colors.secondary).toBe('#0F172A');
      expect(colors.background).toBe('#F1F5F9');
      expect(colors.surface).toBe('#FFFFFF');
      expect(colors.opsBadge).toBe('#4F46E5');
      expect(colors.success).toBe('#059669');
      expect(colors.danger).toBe('#DC2626');
    });

    test('spacing tokens follow standard 4px/8px rhythm', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(12);
      expect(spacing.lg).toBe(16);
      expect(spacing.xl).toBe(20);
      expect(spacing.xxl).toBe(24);
      expect(spacing['3xl']).toBe(32);
    });

    test('typography scale defines mobile readable sizes and weights', () => {
      expect(typography.sizes.xs).toBe(13);
      expect(typography.sizes.sm).toBe(15);
      expect(typography.sizes.md).toBe(17);
      expect(typography.sizes.lg).toBe(20);
      expect(typography.weights.bold).toBe('700');
    });

    test('borderRadius defines expected corner radius tokens', () => {
      expect(borderRadius.sm).toBe(6);
      expect(borderRadius.md).toBe(8);
      expect(borderRadius.lg).toBe(12);
      expect(borderRadius.full).toBe(9999);
    });

    test('shadows define elevation for Android and iOS', () => {
      expect(shadows.card.elevation).toBe(3);
      expect(shadows.lg.elevation).toBe(6);
    });
  });

  describe('Component Exports', () => {
    test('core operational components are defined', () => {
      expect(Button).toBeDefined();
      expect(Input).toBeDefined();
      expect(Header).toBeDefined();
      expect(Badge).toBeDefined();
      expect(Card).toBeDefined();
    });
  });

  describe('Operations Storage & Session', () => {
    beforeEach(async () => {
      await storage.clearSession();
    });

    test('stores and retrieves staff auth token securely', async () => {
      expect(await storage.getToken()).toBeNull();
      await storage.setToken('test-ops-token-xyz');
      expect(await storage.getToken()).toBe('test-ops-token-xyz');
      await storage.removeToken();
      expect(await storage.getToken()).toBeNull();
    });

    test('stores and retrieves staff user profile', async () => {
      const staffMember = {
        id: 42,
        name: 'Ramesh Crew',
        email: 'ramesh@gkwhizwheel.com',
        role: 'staff' as const,
        store_id: 1,
        store_name: 'Honnavar Platform 1 Hub',
      };

      await storage.setUser(staffMember);
      const retrieved = await storage.getUser();
      expect(retrieved).toEqual(staffMember);

      await storage.clearSession();
      expect(await storage.getUser()).toBeNull();
    });

    test('stores and retrieves active station store id', async () => {
      await storage.setActiveStoreId(2);
      expect(await storage.getActiveStoreId()).toBe(2);
    });
  });
});
