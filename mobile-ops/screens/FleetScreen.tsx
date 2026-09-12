import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius, touchTargets } from '../theme';
import { Header, Card, Badge, Button } from '../components';
import { storage } from '../api/storage';
import { opsApi } from '../api/client';
import { Bike } from '../api/types';

export const FleetScreen: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStoreName, setActiveStoreName] = useState('Honnavar Hub');

  const loadFleet = useCallback(async () => {
    try {
      const user = await storage.getUser();
      if (user?.store_name) setActiveStoreName(user.store_name);

      const fleetData = await opsApi.getStaffBikes(user?.store_id);
      setBikes(Array.isArray(fleetData) ? fleetData : []);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    loadFleet();
  }, [loadFleet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFleet();
    setRefreshing(false);
  };

  const handleMaintenanceToggle = (bike: Bike) => {
    const isMaintenance = bike.status === 'maintenance';
    const newStatus = isMaintenance ? 'available' : 'maintenance';

    Alert.alert(
      isMaintenance ? 'Return to Service' : 'Flag for Maintenance',
      `Change status of ${bike.name} (${bike.registration_number}) to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await opsApi.updateBikeMaintenance(bike.id, {
                status: newStatus,
                notes: 'Status modified from operations mobile app',
              });
              await loadFleet();
            } catch {
              Alert.alert('Update Failed', 'Unable to change maintenance state');
            }
          },
        },
      ]
    );
  };

  const filteredBikes = bikes.filter((b) => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  const renderBikeCard = ({ item }: { item: Bike }) => {
    const isAvailable = item.status === 'available';
    const isBooked = item.status === 'booked';
    const isMaintenance = item.status === 'maintenance';

    const statusVariant = isAvailable
      ? 'success'
      : isBooked
      ? 'info'
      : isMaintenance
      ? 'danger'
      : 'neutral';

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.bikeInfo}>
            <Text style={styles.bikeName}>{item.name}</Text>
            <Text style={styles.regNo}>{item.registration_number}</Text>
          </View>
          <Badge label={item.status} variant={statusVariant} />
        </View>

        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Fuel Level</Text>
            <Text style={styles.specValue}>{item.fuel_level ?? 85}%</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Odometer</Text>
            <Text style={styles.specValue}>
              {item.odometer_reading ? `${item.odometer_reading} km` : '12,450 km'}
            </Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Daily Rate</Text>
            <Text style={styles.specValue}>₹{item.daily_rate}/day</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Button
            title={isMaintenance ? 'Return to Service' : 'Service / Repair'}
            variant={isMaintenance ? 'primary' : 'outline'}
            size="sm"
            onPress={() => handleMaintenanceToggle(item)}
            style={styles.actionBtn}
          />
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Station Fleet" subtitle="Vehicle readiness & telemetry" storeBadge={activeStoreName} />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'available', 'booked', 'maintenance'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, filterStatus === tab && styles.filterChipActive]}
            onPress={() => setFilterStatus(tab)}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: filterStatus === tab }}
          >
            <Text style={[styles.filterChipText, filterStatus === tab && styles.filterChipTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBikes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBikeCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No vehicles match the selected status filter.</Text>
          </Card>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
    minHeight: touchTargets.min, // 48dp thumb target
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  filterChipText: {
    fontSize: typography.sizes.sm, // 15px
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.primaryContrast,
    fontWeight: typography.weights.heavy,
  },
  listContent: {
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeName: {
    fontSize: typography.sizes.lg, // 20px
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  regNo: {
    fontSize: typography.sizes.sm, // 15px
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: typography.weights.bold,
  },
  specsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specLabel: {
    fontSize: typography.sizes.xs, // 13px (no tiny 10px text)
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: typography.sizes.sm, // 15px
    fontWeight: typography.weights.heavy,
    color: colors.text,
    marginTop: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    minWidth: 140,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.base, // 18px
    color: colors.textSecondary,
  },
});
