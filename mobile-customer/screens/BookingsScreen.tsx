import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Booking } from '../api/types';
import { api } from '../api/client';
import { offlineStorage } from '../api/offlineStorage';
import { networkService } from '../services/networkService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

export type BookingTab = 'upcoming' | 'past' | 'cancelled';

const DEMO_BOOKINGS: Booking[] = [
  {
    id: 101,
    booking_number: 'GKW-2026-X841',
    customer_id: 1,
    bike_id: 1,
    pickup_store_id: 1,
    return_store_id: 1,
    start_date: '2026-09-12 10:00:00',
    end_date: '2026-09-14 10:00:00',
    total_amount: 1942,
    deposit_amount: 1000,
    status: 'confirmed',
    bike: {
      id: 1,
      category_id: 1,
      current_store_id: 1,
      home_store_id: 1,
      brand: 'Honda',
      model_name: 'Activa 6G',
      registration_number: 'KA-47-E-8421',
      daily_rate: 499,
      status: 'available',
      fuel_type: 'petrol',
      transmission: 'automatic',
    },
    pickup_store: {
      id: 1,
      name: 'Honnavar Railway Station Hub',
      city: 'Honnavar',
      address_line: 'Exit Platform 1, Railway Station Road',
      phone: '+91 94801 23456',
      latitude: 14.2831,
      longitude: 74.4534,
    },
    return_store: {
      id: 1,
      name: 'Honnavar Railway Station Hub',
      city: 'Honnavar',
      address_line: 'Exit Platform 1, Railway Station Road',
      phone: '+91 94801 23456',
      latitude: 14.2831,
      longitude: 74.4534,
    },
    created_at: '2026-09-12 09:30:00',
  },
  {
    id: 102,
    booking_number: 'GKW-2026-B319',
    customer_id: 1,
    bike_id: 3,
    pickup_store_id: 1,
    return_store_id: 2,
    start_date: '2026-08-20 09:00:00',
    end_date: '2026-08-22 18:00:00',
    total_amount: 3450,
    deposit_amount: 1500,
    status: 'returned',
    bike: {
      id: 3,
      category_id: 2,
      current_store_id: 2,
      home_store_id: 1,
      brand: 'Royal Enfield',
      model_name: 'Classic 350 Reborn',
      registration_number: 'KA-47-M-3190',
      daily_rate: 1199,
      status: 'available',
      fuel_type: 'petrol',
      transmission: 'manual',
    },
    pickup_store: {
      id: 1,
      name: 'Honnavar Railway Station Hub',
      city: 'Honnavar',
      address_line: 'Exit Platform 1, Railway Station Road',
      phone: '+91 94801 23456',
      latitude: 14.2831,
      longitude: 74.4534,
    },
    return_store: {
      id: 2,
      name: 'Palya Main Road Hub',
      city: 'Honnavar',
      address_line: 'Near Sharavathi Bridge, Palya',
      phone: '+91 94801 23457',
      latitude: 14.2754,
      longitude: 74.4412,
    },
    created_at: '2026-08-19 14:00:00',
  },
  {
    id: 103,
    booking_number: 'GKW-2026-C012',
    customer_id: 1,
    bike_id: 2,
    pickup_store_id: 2,
    return_store_id: 2,
    start_date: '2026-07-10 11:00:00',
    end_date: '2026-07-11 11:00:00',
    total_amount: 1200,
    deposit_amount: 1000,
    status: 'cancelled',
    bike: {
      id: 2,
      category_id: 1,
      current_store_id: 2,
      home_store_id: 2,
      brand: 'Suzuki',
      model_name: 'Access 125',
      registration_number: 'KA-47-H-4512',
      daily_rate: 549,
      status: 'available',
      fuel_type: 'petrol',
      transmission: 'automatic',
    },
    pickup_store: {
      id: 2,
      name: 'Palya Main Road Hub',
      city: 'Honnavar',
      address_line: 'Near Sharavathi Bridge, Palya',
      phone: '+91 94801 23457',
      latitude: 14.2754,
      longitude: 74.4412,
    },
    created_at: '2026-07-09 16:30:00',
  },
];

export const filterBookingsByTab = (
  list: Booking[],
  tab: BookingTab
): Booking[] => {
  return list.filter((b) => {
    if (tab === 'upcoming') {
      return ['held', 'confirmed', 'active', 'handed_over'].includes(b.status);
    }
    if (tab === 'past') {
      return b.status === 'returned';
    }
    if (tab === 'cancelled') {
      return b.status === 'cancelled';
    }
    return false;
  });
};

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');

  const [cachedInfo, setCachedInfo] = useState<{ isOfflineData: boolean; cachedAt?: number }>({
    isOfflineData: false,
  });

  const isAuthenticated = !!api.getToken();

  const loadFromCache = async () => {
    try {
      const cached = await offlineStorage.getCachedBookings();
      if (cached && Array.isArray(cached.bookings) && cached.bookings.length > 0) {
        setBookings(cached.bookings);
        setCachedInfo({ isOfflineData: true, cachedAt: cached.cachedAt });
      }
    } catch {
      // Keep existing
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get<Booking[]>('/bookings');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setBookings(res.data);
        setCachedInfo({ isOfflineData: false });
        await offlineStorage.saveCachedBookings(res.data);
      } else {
        await loadFromCache();
      }
    } catch {
      // If offline or network error, fallback to offline cache
      await loadFromCache();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Auto-retry when network connection transitions from offline to online
    let wasOffline = false;
    const unsubscribe = networkService.addConnectivityListener((status) => {
      const isCurrentlyOffline = !status.isConnected || status.isInternetReachable === false;
      if (wasOffline && !isCurrentlyOffline) {
        fetchBookings();
      }
      wasOffline = isCurrentlyOffline;
    });

    return unsubscribe;
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
      case 'active':
      case 'handed_over':
        return 'success';
      case 'held':
        return 'warning';
      case 'cancelled':
        return 'danger';
      case 'returned':
      default:
        return 'neutral';
    }
  };

  // Segment counts
  const upcomingCount = useMemo(
    () => filterBookingsByTab(bookings, 'upcoming').length,
    [bookings]
  );
  const pastCount = useMemo(
    () => filterBookingsByTab(bookings, 'past').length,
    [bookings]
  );
  const cancelledCount = useMemo(
    () => filterBookingsByTab(bookings, 'cancelled').length,
    [bookings]
  );

  const displayedBookings = useMemo(
    () => filterBookingsByTab(bookings, activeTab),
    [bookings, activeTab]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerSubtitle}>Manage Your Fleet Rides</Text>
              <Text style={styles.headerTitle}>My Bookings</Text>
            </View>
            {cachedInfo.isOfflineData && (
              <View style={styles.offlinePill}>
                <Text style={styles.offlinePillText}>
                  📡 Cached •{' '}
                  {cachedInfo.cachedAt
                    ? new Date(cachedInfo.cachedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Offline'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Native Segmented Control */}
        <View style={styles.segmentedControlWrap} accessible={true} accessibilityRole="tablist">
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'upcoming' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel={`Upcoming bookings, ${upcomingCount} items`}
            accessibilityState={{ selected: activeTab === 'upcoming' }}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'upcoming' && styles.segmentTextActive,
              ]}
            >
              Upcoming
            </Text>
            <View
              style={[
                styles.segmentBadge,
                activeTab === 'upcoming' && styles.segmentBadgeActive,
              ]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              <Text
                style={[
                  styles.segmentBadgeText,
                  activeTab === 'upcoming' && styles.segmentBadgeTextActive,
                ]}
              >
                {upcomingCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'past' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel={`Past bookings, ${pastCount} items`}
            accessibilityState={{ selected: activeTab === 'past' }}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'past' && styles.segmentTextActive,
              ]}
            >
              Past
            </Text>
            <View
              style={[
                styles.segmentBadge,
                activeTab === 'past' && styles.segmentBadgeActive,
              ]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              <Text
                style={[
                  styles.segmentBadgeText,
                  activeTab === 'past' && styles.segmentBadgeTextActive,
                ]}
              >
                {pastCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'cancelled' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab('cancelled')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel={`Cancelled bookings, ${cancelledCount} items`}
            accessibilityState={{ selected: activeTab === 'cancelled' }}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'cancelled' && styles.segmentTextActive,
              ]}
            >
              Cancelled
            </Text>
            <View
              style={[
                styles.segmentBadge,
                activeTab === 'cancelled' && styles.segmentBadgeActive,
              ]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              <Text
                style={[
                  styles.segmentBadgeText,
                  activeTab === 'cancelled' && styles.segmentBadgeTextActive,
                ]}
              >
                {cancelledCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bookings List */}
        <FlatList
          data={displayedBookings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bookingCard}
              onPress={() =>
                navigation.navigate('BookingDetail', {
                  bookingId: item.id,
                  booking: item,
                })
              }
              activeOpacity={0.85}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Booking #${item.booking_number || item.id}, ${item.bike?.brand || 'Fleet'} ${item.bike?.model_name || 'Bike'}, status ${item.status}, total ${item.total_amount} rupees`}
              accessibilityHint="Double tap to open booking voucher, digital key handover, and invoice"
            >
              <View style={styles.cardHeader} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.bookingNumber}>
                    #{item.booking_number || `GKW-${item.id}`}
                  </Text>
                  <Text style={styles.bikeName}>
                    {item.bike?.brand} {item.bike?.model_name || 'Fleet Two-Wheeler'}
                  </Text>
                </View>
                <Badge
                  label={item.status}
                  variant={getStatusVariant(item.status)}
                />
              </View>

              {/* Registration and Specs Pill */}
              <View style={styles.specsRow}>
                <Text style={styles.regNumberBadge}>
                  {item.bike?.registration_number || 'KA-47-E-XXXX'}
                </Text>
                <Text style={styles.transmissionTag}>
                  {item.bike?.transmission || 'Automatic'} • {item.bike?.fuel_type || 'Petrol'}
                </Text>
              </View>

              {/* Schedule Block */}
              <View style={styles.datesRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>PICKUP</Text>
                  <Text style={styles.dateValue}>
                    {new Date(item.start_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>DROP-OFF</Text>
                  <Text style={styles.dateValue}>
                    {new Date(item.end_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              {/* Hub Location Badge */}
              <View style={styles.hubBadgeRow}>
                <Text style={styles.hubBadgeText}>
                  📍 {item.pickup_store?.name || 'Honnavar Railway Station Hub'}
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.totalPaidLabel}>TOTAL TARIFF</Text>
                  <Text style={styles.amountText}>₹{item.total_amount}</Text>
                </View>
                <View style={styles.viewVoucherAction}>
                  <Text style={styles.detailsLink}>View Voucher</Text>
                  <Text style={styles.detailsArrow}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>
                {activeTab === 'upcoming'
                  ? '🛵'
                  : activeTab === 'past'
                  ? '🏁'
                  : '📋'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming'
                  ? 'No upcoming bookings'
                  : activeTab === 'past'
                  ? 'No past ride history'
                  : 'No cancelled bookings'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? 'Ready for a scenic coastal road trip? Explore available scooters and bikes with 3-minute station handover.'
                  : activeTab === 'past'
                  ? 'Completed rental rides and digital tax invoices will appear here.'
                  : 'You do not have any cancelled reservations.'}
              </Text>
              {activeTab === 'upcoming' && (
                <Button
                  title="Explore Available Fleet"
                  onPress={() =>
                    navigation.navigate('MainTabs', { screen: 'Explore' })
                  }
                  style={styles.exploreBtn}
                />
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.secondary,
    marginTop: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlinePill: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningDark,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  offlinePillText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.warningText,
  },

  // Segmented Control
  segmentedControlWrap: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  segmentText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginRight: 4,
  },
  segmentTextActive: {
    color: colors.textInverted,
  },
  segmentBadge: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  segmentBadgeActive: {
    backgroundColor: colors.primary,
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  segmentBadgeTextActive: {
    color: colors.primaryContrast,
  },

  // Cards List
  listContent: {
    padding: spacing.lg,
  },
  bookingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  bookingNumber: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  bikeName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 2,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  regNumberBadge: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transmissionTag: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  dateValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 1,
  },
  arrow: {
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  hubBadgeRow: {
    marginBottom: spacing.sm,
  },
  hubBadgeText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: typography.weights.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  totalPaidLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
  },
  amountText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  viewVoucherAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsLink: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginRight: 2,
  },
  detailsArrow: {
    fontSize: 16,
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
  },

  // Empty State
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  exploreBtn: {
    minWidth: 180,
  },
});
