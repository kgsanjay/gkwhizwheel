import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './navigation/RootNavigator';
import { RootStackParamList } from './navigation/types';
import { notificationService } from './services/notificationService';
import { OfflineBanner } from './components/OfflineBanner';
import { monitoringService, ErrorBoundary } from './services/monitoringService';
import { analyticsService } from './services/analyticsService';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // 1. Initialize Sentry crash reporting & monitoring
    monitoringService.init();

    // 2. Track app_open funnel milestone
    analyticsService.trackAppOpen();

    // 3. Register push notification token on app launch
    notificationService.registerForPushNotificationsAsync();

    // 4. Listen for notification tap / deep link into BookingDetail
    const responseSub = notificationService.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data as any;
      if (data && data.booking_id && navigationRef.isReady()) {
        navigationRef.navigate('BookingDetail', { bookingId: Number(data.booking_id) });
      }
    });

    return () => {
      responseSub.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <OfflineBanner />
            <NavigationContainer
              ref={navigationRef}
              onStateChange={() => {
                const currentRoute = navigationRef.getCurrentRoute();
                if (currentRoute) {
                  analyticsService.trackScreenView(currentRoute.name, currentRoute.params);
                }
              }}
            >
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
