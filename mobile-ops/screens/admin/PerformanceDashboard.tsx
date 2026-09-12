import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { adminApi } from '../../api/client';
import { AdminRevenueReport, AdminUtilizationReport } from '../../api/types';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card, Badge } from '../../components';

export const PerformanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revenue, setRevenue] = useState<AdminRevenueReport | null>(null);
  const [utilization, setUtilization] = useState<AdminUtilizationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const [rev, util] = await Promise.all([
        adminApi.getRevenueReport({ group_by: 'channel' }),
        adminApi.getUtilizationReport(),
      ]);
      setRevenue(rev);
      setUtilization(util);
    } catch (err: any) {
      setError(err.message || 'Failed to load performance data');
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

  if (error || !revenue || !utilization) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load data'}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Overview (Last 30 Days)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Bookings</Text>
            <Text style={styles.statValue}>{revenue.total_bookings}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>₹{revenue.total_revenue.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Fleet Utilization</Text>
            <Text style={styles.statValue}>{utilization.overall_utilization_percentage}%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Active Fleet</Text>
            <Text style={styles.statValue}>{utilization.total_bikes}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Revenue by Channel</Text>
        {revenue.items.map((item, index) => (
          <View key={index} style={styles.channelRow}>
            <View style={styles.channelInfo}>
              <Text style={styles.channelLabel}>{item.label}</Text>
              <Text style={styles.channelSub}>{item.booking_count} bookings</Text>
            </View>
            <Text style={styles.channelRevenue}>₹{item.total_revenue.toLocaleString()}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bike Utilization</Text>
          <Badge label={`${utilization.total_days} Days`} variant="neutral" />
        </View>
        {utilization.bikes.map((bike) => (
          <View key={bike.id} style={styles.bikeRow}>
            <View style={styles.bikeInfo}>
              <Text style={styles.bikeName}>{bike.brand} {bike.model_name}</Text>
              <Text style={styles.bikeReg}>{bike.registration_number}</Text>
            </View>
            <View style={styles.utilizationBox}>
              <Text style={styles.utilizationText}>{bike.utilization_percentage}%</Text>
              <Text style={styles.utilizationSub}>{bike.booked_days} days</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
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
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  channelInfo: {
    flex: 1,
  },
  channelLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  channelSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  channelRevenue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  bikeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  bikeReg: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  utilizationBox: {
    alignItems: 'flex-end',
  },
  utilizationText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  utilizationSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
