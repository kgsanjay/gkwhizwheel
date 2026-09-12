import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ServicesScreen } from '../screens/ServicesScreen';
import { FleetScreen } from '../screens/FleetScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StationAdminScreen } from '../screens/StationAdminScreen';
import { useAuth } from '../context/AuthContext';
import { colors, typography, touchTargets } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  const { isManager, role } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1.5,
          height: touchTargets.tabBar, // 68dp: Generous bottom thumb bar
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs, // 13px
          fontWeight: typography.weights.heavy,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: isManager ? 'Manager Hub' : 'Dispatch',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>📊</Text>,
        }}
      />

      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🤿</Text>,
        }}
      />

      <Tab.Screen
        name="Fleet"
        component={FleetScreen}
        options={{
          tabBarLabel: 'Fleet',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏍️</Text>,
        }}
      />

      {/* Admin-only navigation item: strictly rendered ONLY for Store Manager / Super Admin.
          Staff will NOT see this navigation item at all, ensuring complete role isolation. */}
      {isManager ? (
        <Tab.Screen
          name="StationAdmin"
          component={StationAdminScreen}
          options={{
            tabBarLabel: 'Station Admin',
            tabBarIcon: () => <Text style={{ fontSize: 24 }}>🏢</Text>,
          }}
        />
      ) : null}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};
