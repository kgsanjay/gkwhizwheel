import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { opsApi } from '../api/client';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as any),
});

export const STAFF_ALERTS_CHANNEL_ID = 'staff_alerts';

class NotificationManagerService {
  isConfigured = false;

  async configure() {
    if (this.isConfigured) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(STAFF_ALERTS_CHANNEL_ID, {
        name: 'Staff Alerts & Updates',
        description: 'Important notifications for staff operations',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
      });
    }
    
    this.isConfigured = true;
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      await this.configure();

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }

      // We use a constant projectId if we aren't heavily tied to EAS right now, 
      // but usually projectId is injected by Expo.
      // Since Expo SDK 49+, projectId is required. We'll pass it if available from Constants.
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      if (token) {
        // We'll catch and ignore errors if the endpoint is not set up on the backend yet,
        // so the app won't crash for the user.
        try {
          await opsApi.registerPushToken(token);
        } catch (e) {
          console.warn('Could not register push token on backend:', e);
        }
      }
      
      return token;
    } catch (error) {
      console.error('Error getting push token', error);
      return null;
    }
  }

  async scheduleSyncFailureAlert(actionType: string, id: string | number) {
    await this.configure();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Action Sync Failed',
        body: `A pending offline action (${actionType}) for ID ${id} failed to sync with the server. Please review.`,
        data: { type: 'sync_failure', actionType, id },
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  async simulateNewBookingAlert(bookingId: number) {
    await this.configure();
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 New Booking Assigned',
        body: `Booking #${bookingId} has been assigned to your store.`,
        data: { type: 'new_booking', bookingId },
        sound: true,
      },
      trigger: null, // Send immediately for simulation
    });
  }
}

export const NotificationManager = new NotificationManagerService();
