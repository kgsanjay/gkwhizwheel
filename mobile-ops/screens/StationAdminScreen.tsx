import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Header } from '../components';
import { useAuth } from '../context/AuthContext';
import { PerformanceDashboard } from './admin/PerformanceDashboard';
import { StaffManagement } from './admin/StaffManagement';

export const StationAdminScreen: React.FC = () => {
  const { isManager, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff'>('dashboard');

  if (!isManager) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Access Restricted" />
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedTitle}>Manager Permissions Required</Text>
          <Text style={styles.restrictedDesc}>
            This section is restricted to Store Managers and Fleet Administrators.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Station Admin"
        subtitle={user?.store_name || 'Admin Hub'}
        rightBadge={user?.role?.replace('_', ' ').toUpperCase()}
      />

      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'dashboard' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'dashboard' && styles.segmentBtnTextActive]}>
            Performance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'staff' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'staff' && styles.segmentBtnTextActive]}>
            Staff
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'dashboard' ? <PerformanceDashboard /> : <StaffManagement />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  restrictedTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  restrictedDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  segmentBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
  },
  contentContainer: {
    flex: 1,
  },
});
