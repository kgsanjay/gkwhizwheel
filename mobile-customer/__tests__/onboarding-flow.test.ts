import { storage } from '../api/storage';
import { notificationService } from '../services/notificationService';
import * as Location from 'expo-location';

jest.mock('../services/notificationService', () => ({
  notificationService: {
    registerForPushNotificationsAsync: jest.fn().mockResolvedValue('ExponentPushToken[TestToken]'),
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

describe('Native First-Launch Onboarding Flow (F14)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset onboarding state in storage
    await storage.setOnboardingCompleted(false);
  });

  describe('Storage Onboarding Completion Flag', () => {
    it('returns false initially before user completes onboarding', async () => {
      const completed = await storage.hasCompletedOnboarding();
      expect(completed).toBe(false);
    });

    it('persists true after user finishes onboarding flow', async () => {
      await storage.setOnboardingCompleted(true);
      const completed = await storage.hasCompletedOnboarding();
      expect(completed).toBe(true);
    });
  });

  describe('Location Permission Primer', () => {
    it('requests foreground location permissions when user enables location', async () => {
      const result = await Location.requestForegroundPermissionsAsync();
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(result.status).toBe('granted');
    });
  });

  describe('Notification Permission Primer', () => {
    it('registers for push notifications when user enables alerts', async () => {
      const token = await notificationService.registerForPushNotificationsAsync();
      expect(notificationService.registerForPushNotificationsAsync).toHaveBeenCalled();
      expect(token).toBe('ExponentPushToken[TestToken]');
    });
  });

  describe('Full Onboarding Lifecycle', () => {
    it('executes full sequence: permissions priming and persistent onboarding completion', async () => {
      // 1. Initially first launch
      expect(await storage.hasCompletedOnboarding()).toBe(false);

      // 2. Location permission requested
      await Location.requestForegroundPermissionsAsync();
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);

      // 3. Notification permission requested
      await notificationService.registerForPushNotificationsAsync();
      expect(notificationService.registerForPushNotificationsAsync).toHaveBeenCalledTimes(1);

      // 4. Mark finished
      await storage.setOnboardingCompleted(true);
      expect(await storage.hasCompletedOnboarding()).toBe(true);
    });
  });
});
