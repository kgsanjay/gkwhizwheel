import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { BookingDetailScreen } from '../screens/BookingDetailScreen';
import { HandoverFlowScreen } from '../screens/HandoverFlowScreen';
import { ReturnFlowScreen } from '../screens/ReturnFlowScreen';
import { ServiceBookingDetailScreen } from '../screens/ServiceBookingDetailScreen';
import { RefundProcessingScreen } from '../screens/admin/RefundProcessingScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { token, user, isLoading } = useAuth();
  const isAuthenticated = Boolean(
    token && user && ['super_admin', 'store_manager', 'staff'].includes(user.role)
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'MainTabs' : 'Login'}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="HandoverFlow" component={HandoverFlowScreen} />
      <Stack.Screen name="ReturnFlow" component={ReturnFlowScreen} />
      <Stack.Screen name="ServiceBookingDetail" component={ServiceBookingDetailScreen} />
      <Stack.Screen name="RefundProcessing" component={RefundProcessingScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
