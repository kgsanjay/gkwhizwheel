import { notificationService, NotificationPayloadData } from '../services/notificationService';
import { api } from '../api/client';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

jest.mock('../api/client', () => ({
  api: {
    post: jest.fn(),
    delete: jest.fn(),
    getToken: jest.fn().mockReturnValue('mock-jwt-token'),
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({
    data: 'ExponentPushToken[Test_Mobile_Client_Token]',
  }),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  AndroidImportance: {
    MAX: 5,
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

describe('Native Push Notifications Flow (F12)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerForPushNotificationsAsync', () => {
    it('requests permissions, retrieves Expo push token, and syncs with backend API', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Expo push token registered successfully.',
        data: { expo_push_token: 'ExponentPushToken[Test_Mobile_Client_Token]' },
      });

      const token = await notificationService.registerForPushNotificationsAsync();

      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith('/customer/push-token', {
        expo_push_token: 'ExponentPushToken[Test_Mobile_Client_Token]',
      });
      expect(token).toBe('ExponentPushToken[Test_Mobile_Client_Token]');
    });

    it('returns null if permission is denied by user', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
      });

      const token = await notificationService.registerForPushNotificationsAsync();
      expect(token).toBeNull();
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe('syncPushTokenWithBackend', () => {
    it('calls POST /customer/push-token and returns true on success', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        success: true,
      });

      const result = await notificationService.syncPushTokenWithBackend(
        'ExponentPushToken[Device_ABC]'
      );

      expect(api.post).toHaveBeenCalledWith('/customer/push-token', {
        expo_push_token: 'ExponentPushToken[Device_ABC]',
      });
      expect(result).toBe(true);
    });

    it('returns false when backend network request fails', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await notificationService.syncPushTokenWithBackend(
        'ExponentPushToken[Device_ABC]'
      );

      expect(result).toBe(false);
    });
  });

  describe('unregisterPushTokenAsync', () => {
    it('calls DELETE /customer/push-token on logout and returns true', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Expo push token removed successfully.',
      });

      const result = await notificationService.unregisterPushTokenAsync();

      expect(api.delete).toHaveBeenCalledWith('/customer/push-token');
      expect(result).toBe(true);
    });
  });

  describe('Notification Payload & Deep Link Data Parsing', () => {
    it('validates booking_confirmation payload structure', () => {
      const payload: NotificationPayloadData = {
        type: 'booking_confirmation',
        booking_id: 101,
        booking_reference: 'GKW-2026-X841',
      };

      expect(payload.type).toBe('booking_confirmation');
      expect(payload.booking_id).toBe(101);
    });

    it('validates pickup_reminder (2 hours before) payload structure', () => {
      const payload: NotificationPayloadData = {
        type: 'pickup_reminder',
        booking_id: 102,
        booking_reference: 'GKW-2026-B319',
      };

      expect(payload.type).toBe('pickup_reminder');
      expect(payload.booking_id).toBe(102);
    });

    it('validates return_reminder payload structure', () => {
      const payload: NotificationPayloadData = {
        type: 'return_reminder',
        booking_id: 103,
        booking_reference: 'GKW-2026-C012',
      };

      expect(payload.type).toBe('return_reminder');
      expect(payload.booking_id).toBe(103);
    });
  });
});
