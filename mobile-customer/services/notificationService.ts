import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { api } from '../api/client';

// Configure default notification handler for foreground presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPayloadData {
  type?: 'booking_confirmation' | 'pickup_reminder' | 'return_reminder' | string;
  booking_id?: number;
  booking_reference?: string;
  [key: string]: any;
}

export const notificationService = {
  /**
   * Request push notification permissions, generate Expo Push Token,
   * configure Android notification channel, and sync token to backend.
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'GK WhizWheels Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0F172A',
          sound: 'default',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Push notification permission was not granted by user.');
          return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
      } else {
        // Fallback for development simulators / testing environments
        token = 'ExponentPushToken[GKWhizWheel_Simulated_Device]';
      }

      if (token && api.getToken()) {
        await this.syncPushTokenWithBackend(token);
      }

      return token;
    } catch (error) {
      console.warn('Failed to register for push notifications:', error);
      return null;
    }
  },

  /**
   * Sync the device Expo push token with the backend API
   */
  async syncPushTokenWithBackend(token: string): Promise<boolean> {
    try {
      const res = await api.post('/customer/push-token', {
        expo_push_token: token,
      });
      return !!res.success;
    } catch (err) {
      console.warn('Error syncing push token to backend:', err);
      return false;
    }
  },

  /**
   * Unregister / remove the push token from backend on logout
   */
  async unregisterPushTokenAsync(): Promise<boolean> {
    try {
      const res = await api.delete('/customer/push-token');
      return !!res.success;
    } catch {
      return false;
    }
  },

  /**
   * Add listener for notifications arriving while the app is in foreground
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add listener for user tapping or interacting with a push notification
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};
