import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius, touchTargets } from '../theme';
import { Header, Card, Badge, Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { serviceBookingsApi } from '../api/client';
import { storage } from '../api/storage';
import { OpsServiceBooking, Store } from '../api/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

const DEFAULT_HONNAVAR_STORE: Store = {
  id: 1,
  name: 'Honnavar Platform 1 Hub',
  code: 'HNV-01',
  city: 'Honnavar',
  address: 'Railway Station Road, Platform 1 Exit, Honnavar',
  phone: '+91 83872 20111',
  is_active: true,
};

export const ServicesScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const authorizedStores: Store[] = useMemo(() => {
    if (user?.stores && user.stores.length > 0) return user.stores;
    if (user?.assigned_stores && user.assigned_stores.length > 0) {
      return user.assigned_stores.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        city: 'Honnavar',
      }));
    }
    if (user?.store_id) {
      return [
        {
          id: user.store_id,
          name: user.store_name || DEFAULT_HONNAVAR_STORE.name,
          code: 'HNV-01',
          city: 'Honnavar',
        },
      ];
    }
    return [DEFAULT_HONNAVAR_STORE];
  }, [user]);

  const [selectedStore, setSelectedStore] = useState<Store>(authorizedStores[0] || DEFAULT_HONNAVAR_STORE);
  const [bookings, setBookings] = useState<OpsServiceBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  useEffect(() => {
    const initStore = async () => {
      const storedStoreId = await storage.getActiveStoreId();
      if (storedStoreId) {
        const found = authorizedStores.find((s) => s.id === storedStoreId);
        if (found) {
          setSelectedStore(found);
        }
      }
    };
    initStore();
  }, [authorizedStores]);

  const loadData = useCallback(
    async (storeId: number) => {
      try {
        setLoading(true);
        const data = await serviceBookingsApi.getTodayBookings(storeId).catch(() => []);
        if (data && Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Error loading service bookings:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(selectedStore.id);
  }, [selectedStore, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(selectedStore.id);
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsVerifyingCode(true);
    try {
      const b = await serviceBookingsApi.getBookingByCode(searchQuery.trim());
      if (b) {
        navigation.navigate('ServiceBookingDetail', { bookingId: b.id });
        setSearchQuery('');
      } else {
        Alert.alert('Not Found', 'No service booking found with that code.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to look up booking.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!searchQuery) return bookings;
    const lowerQuery = searchQuery.toLowerCase();
    return bookings.filter(
      (b) =>
        b.booking_number.toLowerCase().includes(lowerQuery) ||
        b.customer_name.toLowerCase().includes(lowerQuery) ||
        b.customer_phone.includes(lowerQuery)
    );
  }, [bookings, searchQuery]);

  const renderBookingCard = (b: OpsServiceBooking) => {
    let badgeVariant: 'warning' | 'info' | 'success' | 'danger' | 'neutral' = 'neutral';
    if (b.status === 'confirmed') badgeVariant = 'warning';
    else if (b.status === 'in_progress') badgeVariant = 'info';
    else if (b.status === 'completed') badgeVariant = 'success';
    else if (b.status === 'cancelled') badgeVariant = 'danger';

    return (
      <TouchableOpacity
        key={b.id}
        onPress={() => navigation.navigate('ServiceBookingDetail', { bookingId: b.id })}
      >
        <Card style={styles.bookingCard}>
          <View style={styles.bookingHeader}>
            <View>
              <Text style={styles.bookingTitle}>{b.customer_name}</Text>
              <Text style={styles.bookingSubtitle}>
                {b.booking_number} • {b.service_type.toUpperCase()}
              </Text>
            </View>
            <Badge label={b.status.replace('_', ' ').toUpperCase()} variant={badgeVariant} />
          </View>
          <View style={styles.bookingDetails}>
            <Text style={styles.detailText}>
              Quantity: {b.quantity}
            </Text>
            <Text style={styles.detailText}>
              Phone: {b.customer_phone}
            </Text>
          </View>
          <View style={styles.bookingFooter}>
            <Text style={styles.amountText}>₹{b.total_amount}</Text>
            {b.balance_due > 0 ? (
              <Text style={styles.balanceDueText}>Balance: ₹{b.balance_due}</Text>
            ) : (
              <Text style={styles.paidText}>Fully Paid</Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Services"
        subtitle={selectedStore.name}
      />

      {authorizedStores.length > 1 && (
        <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.background }}>
           <TouchableOpacity style={styles.storeSelectorBtn}>
             <Text style={styles.storeSelectorText}>Change Store</Text>
           </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Code or Name..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="characters"
          onSubmitEditing={handleManualSearch}
        />
        <Button
          title="Search"
          onPress={handleManualSearch}
          disabled={isVerifyingCode || !searchQuery.trim()}
          style={styles.searchBtn}
        />
      </View>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>Today's Service Bookings</Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map(renderBookingCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No service bookings found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  storeSelectorBtn: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.sm,
  },
  storeSelectorText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: typography.sizes.md,
    marginRight: spacing.sm,
  },
  searchBtn: {
    width: 100,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  bookingCard: {
    marginBottom: spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bookingTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  bookingSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  bookingDetails: {
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: 2,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amountText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  balanceDueText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.danger,
  },
  paidText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
});
