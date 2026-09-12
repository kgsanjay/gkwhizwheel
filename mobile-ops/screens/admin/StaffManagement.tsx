import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { adminApi } from '../../api/client';
import { StaffUser } from '../../api/types';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card, Badge } from '../../components';

export const StaffManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const data = await adminApi.getStaff();
      setStaff(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Store Staff</Text>
          <Badge label={`${staff.length} Total`} variant="neutral" />
        </View>
        <Text style={styles.sectionSubtitle}>Assigned staff members and store managers</Text>

        {staff.map((user) => (
          <View key={user.id} style={styles.staffItem}>
            <View style={styles.staffAvatar}>
              <Text style={styles.staffAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{user.name}</Text>
              <Text style={styles.staffRole}>{user.role.replace('_', ' ').toUpperCase()}</Text>
              {user.stores && user.stores.length > 0 && (
                <Text style={styles.staffStores}>
                  Stores: {user.stores.map((s) => s.name).join(', ')}
                </Text>
              )}
            </View>
            <Badge label="Active" variant="success" />
          </View>
        ))}

        {staff.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No staff members found.</Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.base,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.divider,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  staffAvatarText: {
    color: colors.textInverse,
    fontWeight: typography.weights.heavy,
    fontSize: typography.sizes.md,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  staffRole: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    marginTop: 2,
    fontWeight: typography.weights.semibold,
  },
  staffStores: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
