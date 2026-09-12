import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './navigation/RootNavigator';
import { RootStackParamList } from './navigation/types';
import { AuthProvider } from './context/AuthContext';
import { SecurityProvider } from './context/SecurityContext';
import { syncManager } from './services/SyncManager';
import { SyncIndicator } from './components/SyncIndicator';
import { AppLockOverlay } from './components/AppLockOverlay';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function App() {
  React.useEffect(() => {
    syncManager.init();
    return () => syncManager.destroy();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SecurityProvider>
            <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#0F172A' }}>
              <NavigationContainer ref={navigationRef}>
                <StatusBar style="light" />
                <SyncIndicator />
                <RootNavigator />
                <AppLockOverlay />
              </NavigationContainer>
            </SafeAreaView>
          </SecurityProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
