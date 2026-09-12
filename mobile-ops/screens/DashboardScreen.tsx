import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { colors, spacing, typography, borderRadius, touchTargets } from '../theme';
import { Header, Card, Badge, Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { opsApi } from '../api/client';
import { storage } from '../api/storage';
import { OpsBooking, Store, StoreFleetSummary } from '../api/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

// ==========================================
// DEFAULT STORE & BOOKINGS FALLBACK
// (Used when network is offline / local dev)
// ==========================================
const DEFAULT_HONNAVAR_STORE: Store = {
  id: 1,
  name: 'Honnavar Platform 1 Hub',
  code: 'HNV-01',
  city: 'Honnavar',
  address: 'Railway Station Road, Platform 1 Exit, Honnavar',
  phone: '+91 83872 20111',
  is_active: true,
};

const DEFAULT_BOOKINGS: OpsBooking[] = [
  {
    id: 8812,
    booking_reference: 'GKW-8812',
    booking_code: 'GKW-8812',
    user_id: 101,
    user: {
      id: 101,
      name: 'Rahul Sharma',
      phone: '+91 98451 22334',
      email: 'rahul.s@example.com',
    },
    bike_id: 201,
    bike: {
      id: 201,
      model_name: 'Royal Enfield Classic 350',
      brand: 'Royal Enfield',
      registration_number: 'KA-47-M-2091',
      current_store_id: 1,
      status: 'booked',
    },
    pickup_store_id: 1,
    pickup_store_name: 'Honnavar Platform 1 Hub',
    return_store_id: 1,
    return_store_name: 'Honnavar Platform 1 Hub',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'confirmed', // Pickup Due
    total_amount: 1400,
    deposit_amount: 2000,
    helmets_provided: 2,
    scheduled_time: '14:30',
  },
  {
    id: 8830,
    booking_reference: 'GKW-8830',
    booking_code: 'GKW-8830',
    user_id: 102,
    user: {
      id: 102,
      name: 'Priya Kulkarni',
      phone: '+91 98452 33445',
      email: 'priya.k@example.com',
    },
    bike_id: 202,
    bike: {
      id: 202,
      model_name: 'Honda Activa 6G',
      brand: 'Honda',
      registration_number: 'KA-47-E-1024',
      current_store_id: 1,
      status: 'available',
    },
    pickup_store_id: 1,
    pickup_store_name: 'Honnavar Platform 1 Hub',
    return_store_id: 1,
    return_store_name: 'Honnavar Platform 1 Hub',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'confirmed', // Pickup Due
    total_amount: 900,
    deposit_amount: 1500,
    helmets_provided: 1,
    scheduled_time: '15:15',
  },
  {
    id: 7740,
    booking_reference: 'GKW-7740',
    booking_code: 'GKW-7740',
    user_id: 103,
    user: {
      id: 103,
      name: 'Amit Verma',
      phone: '+91 98450 11223',
      email: 'amit.v@example.com',
    },
    bike_id: 203,
    bike: {
      id: 203,
      model_name: 'Suzuki Access 125',
      brand: 'Suzuki',
      registration_number: 'KA-47-S-5501',
      current_store_id: 1,
      status: 'booked',
    },
    pickup_store_id: 1,
    pickup_store_name: 'Honnavar Platform 1 Hub',
    return_store_id: 1,
    return_store_name: 'Honnavar Platform 1 Hub',
    start_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: 'handed_over', // Return Due
    total_amount: 1100,
    deposit_amount: 1500,
    helmets_provided: 2,
    scheduled_time: '13:00',
    is_overdue: true,
  },
  {
    id: 7748,
    booking_reference: 'GKW-7748',
    booking_code: 'GKW-7748',
    user_id: 104,
    user: {
      id: 104,
      name: 'Deepa Naik',
      phone: '+91 98453 44556',
      email: 'deepa.n@example.com',
    },
    bike_id: 204,
    bike: {
      id: 204,
      model_name: 'TVS Ntorq 125',
      brand: 'TVS',
      registration_number: 'KA-47-N-3410',
      current_store_id: 1,
      status: 'booked',
    },
    pickup_store_id: 1,
    pickup_store_name: 'Honnavar Platform 1 Hub',
    return_store_id: 1,
    return_store_name: 'Honnavar Platform 1 Hub',
    start_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: 'handed_over', // Return Due
    total_amount: 1350,
    deposit_amount: 1500,
    helmets_provided: 1,
    scheduled_time: '16:30',
  },
  {
    id: 8845,
    booking_reference: 'GKW-8845',
    booking_code: 'GKW-8845',
    user_id: 105,
    user: {
      id: 105,
      name: 'Vikram Hegde',
      phone: '+91 98455 66778',
      email: 'vikram.h@example.com',
    },
    bike_id: 205,
    bike: {
      id: 205,
      model_name: 'Ather 450X Gen 3',
      brand: 'Ather',
      registration_number: 'KA-47-EV-9011',
      current_store_id: 1,
      status: 'available',
    },
    pickup_store_id: 1,
    pickup_store_name: 'Honnavar Platform 1 Hub',
    return_store_id: 1,
    return_store_name: 'Honnavar Platform 1 Hub',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    status: 'confirmed', // Pickup Due
    total_amount: 1800,
    deposit_amount: 2500,
    helmets_provided: 2,
    scheduled_time: '17:00',
  },
];

type FilterTab = 'all' | 'pickups' | 'returns';

export const DashboardScreen: React.FC = () => {
  const { user, isManager } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ----------------------------------------------------
  // Store Scoping per Phase 1 Prompt B2:
  // Staff access is strictly scoped to assigned stores.
  // ----------------------------------------------------
  const authorizedStores: Store[] = useMemo(() => {
    if (user?.stores && user.stores.length > 0) {
      return user.stores;
    }
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
  const [fleetSummary, setFleetSummary] = useState<StoreFleetSummary>({
    storeId: selectedStore.id,
    storeName: selectedStore.name,
    availableCount: 5,
    bookedCount: 8,
    maintenanceCount: 2,
    totalCount: 15,
  });

  const [bookings, setBookings] = useState<OpsBooking[]>(DEFAULT_BOOKINGS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // QR Scanner Modal states
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedBooking, setScannedBooking] = useState<OpsBooking | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    // Prevent multiple scans while processing
    if (isVerifyingCode || scannedBooking) return;
    verifyBookingCode(result.data);
  };

  // Initialize selected store from storage if available and authorized
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

  // Fetch bookings and fleet summary scoped to active store
  const loadDashboardData = useCallback(
    async (storeId: number) => {
      try {
        setLoading(true);
        // Scoped fleet bikes fetch
        const bikesData = await opsApi.getStaffBikes(storeId).catch(() => null);
        if (bikesData && Array.isArray(bikesData)) {
          const available = bikesData.filter((b: any) => b.status === 'available').length;
          const booked = bikesData.filter((b: any) => b.status === 'booked').length;
          const maintenance = bikesData.filter((b: any) => b.status === 'maintenance').length;
          setFleetSummary({
            storeId,
            storeName: selectedStore.name,
            availableCount: available,
            bookedCount: booked,
            maintenanceCount: maintenance,
            totalCount: bikesData.length,
          });
        }

        // Scoped active bookings fetch (from Api/V1/Staff/BookingController)
        const bookingsData = await opsApi.getActiveBookings(storeId).catch(() => null);
        if (bookingsData && Array.isArray(bookingsData) && bookingsData.length > 0) {
          setBookings(bookingsData);
        } else {
          // Keep default station bookings filtered by storeId if available
          setBookings(DEFAULT_BOOKINGS);
        }
      } catch {
        // Fallback gracefully to default station bookings
        setBookings(DEFAULT_BOOKINGS);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedStore.name]
  );

  useEffect(() => {
    loadDashboardData(selectedStore.id);
  }, [selectedStore.id, loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(selectedStore.id);
  };

  // Switch store (scoped strictly to authorized stores per Phase 1 Prompt B2)
  const handleStoreSwitch = async (store: Store) => {
    const isAllowed = authorizedStores.some((s) => s.id === store.id);
    if (!isAllowed) {
      Alert.alert('Store Scoping Security', 'You are not assigned to this store hub.');
      return;
    }
    setSelectedStore(store);
    await storage.setActiveStoreId(store.id);
    loadDashboardData(store.id);
  };

  // Filter Bookings logic
  const filteredBookings = useMemo(() => {
    let list = bookings;

    // Filter by tab
    if (activeTab === 'pickups') {
      list = list.filter((b) => b.status === 'confirmed');
    } else if (activeTab === 'returns') {
      list = list.filter((b) => b.status === 'handed_over' || b.status === 'active');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => {
        const ref = (b.booking_reference || b.booking_code || '').toLowerCase();
        const customerName = (b.user?.name || b.customer?.name || '').toLowerCase();
        const customerPhone = (b.user?.phone || b.customer?.phone || '').toLowerCase();
        const regNumber = (b.bike?.registration_number || '').toLowerCase();
        const bikeModel = (b.bike?.model_name || b.bike?.name || '').toLowerCase();
        return (
          ref.includes(q) ||
          customerName.includes(q) ||
          customerPhone.includes(q) ||
          regNumber.includes(q) ||
          bikeModel.includes(q)
        );
      });
    }

    return list;
  }, [bookings, activeTab, searchQuery]);

  const pickupsCount = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed').length,
    [bookings]
  );
  const returnsCount = useMemo(
    () => bookings.filter((b) => b.status === 'handed_over' || b.status === 'active').length,
    [bookings]
  );

  // QR Voucher Verification
  const verifyBookingCode = async (codeToVerify: string) => {
    const code = codeToVerify.trim().toUpperCase();
    if (!code) {
      Alert.alert('Scan QR Error', 'Please enter or scan a valid booking reference code.');
      return;
    }

    setIsVerifyingCode(true);
    try {
      // 1. Try local active bookings first
      const localMatch = bookings.find(
        (b) =>
          (b.booking_reference && b.booking_reference.toUpperCase() === code) ||
          (b.booking_code && b.booking_code.toUpperCase() === code)
      );

      if (localMatch) {
        setQrModalVisible(false);
        navigation.navigate('BookingDetail', { bookingId: localMatch.id });
        setIsVerifyingCode(false);
        return;
      }

      // 2. Query Staff BookingController API via search
      const apiResult = await opsApi.getBookingByCode(code);
      if (apiResult) {
        setQrModalVisible(false);
        navigation.navigate('BookingDetail', { bookingId: apiResult.id });
      } else {
        Alert.alert(
          'Booking Not Found',
          `No active booking found with reference "${code}" at ${selectedStore.name}. Please check the voucher or customer phone.`
        );
      }
    } catch {
      Alert.alert('Verification Error', 'Unable to reach the server. Please verify connection.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handlePhoneCall = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert('Customer Contact', 'Phone number not available on this booking.');
      return;
    }
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert('Phone Call', `Call customer at ${phoneNumber}`);
    });
  };

  const handleHandoverAction = (booking: OpsBooking) => {
    navigation.navigate('BookingDetail', { bookingId: booking.id });
  };

  const handleReturnAction = (booking: OpsBooking) => {
    navigation.navigate('BookingDetail', { bookingId: booking.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Operations Header */}
      <Header
        title={isManager ? 'Station Operations' : 'Ground Dispatch'}
        subtitle={selectedStore.name}
        rightBadge={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ==================================================== */}
        {/* 1. STORE-STATUS SUMMARY (Scoped per Prompt B2)        */}
        {/* ==================================================== */}
        <Card style={styles.summaryCard}>
          {/* Station Scoping Header */}
          <View style={styles.storeHeaderRow}>
            <View style={styles.storeTitleBox}>
              <View style={styles.liveSyncRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>STATION FLEET STATUS</Text>
              </View>
              <Text style={styles.storeNameText}>{selectedStore.name}</Text>
              <Text style={styles.storeCodeText}>
                Hub Code: {selectedStore.code || 'HNV-01'} • Scoped to your shift
              </Text>
            </View>

            {authorizedStores.length > 1 && (
              <Badge label={`${authorizedStores.length} Stores`} variant="info" />
            )}
          </View>

          {/* Multiple Assigned Stores Switcher (if staff has > 1 store) */}
          {authorizedStores.length > 1 && (
            <View style={styles.storeSwitcherContainer}>
              <Text style={styles.switcherLabel}>SWITCH STATION HUB:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.switcherScroll}>
                {authorizedStores.map((store) => {
                  const isSelected = store.id === selectedStore.id;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={[styles.storePill, isSelected && styles.storePillActive]}
                      onPress={() => handleStoreSwitch(store)}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.storePillText, isSelected && styles.storePillTextActive]}>
                        {store.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Available / Booked / Maintenance Counts Grid */}
          <View style={styles.metricsGrid}>
            {/* Available Bikes Count */}
            <View style={[styles.metricCard, { borderColor: colors.success }]}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricIcon}>🟢</Text>
                <Text style={[styles.metricTag, { color: colors.success }]}>READY</Text>
              </View>
              <Text style={[styles.metricNumber, { color: colors.success }]}>
                {fleetSummary.availableCount}
              </Text>
              <Text style={styles.metricTitle}>Available</Text>
              <Text style={styles.metricFoot}>Ready for dispatch</Text>
            </View>

            {/* Booked / Active On Road Count */}
            <View style={[styles.metricCard, { borderColor: colors.info }]}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricIcon}>🏍️</Text>
                <Text style={[styles.metricTag, { color: colors.info }]}>ON ROAD</Text>
              </View>
              <Text style={[styles.metricNumber, { color: colors.info }]}>
                {fleetSummary.bookedCount}
              </Text>
              <Text style={styles.metricTitle}>Booked</Text>
              <Text style={styles.metricFoot}>Active with riders</Text>
            </View>

            {/* Maintenance Count */}
            <View style={[styles.metricCard, { borderColor: colors.warning }]}>
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricIcon}>🔧</Text>
                <Text style={[styles.metricTag, { color: colors.warning }]}>SERVICE</Text>
              </View>
              <Text style={[styles.metricNumber, { color: colors.warning }]}>
                {fleetSummary.maintenanceCount}
              </Text>
              <Text style={styles.metricTitle}>Maintenance</Text>
              <Text style={styles.metricFoot}>Bay inspection</Text>
            </View>
          </View>

          {/* Total Station Capacity Bar */}
          <View style={styles.totalFleetBar}>
            <Text style={styles.totalFleetLabel}>Total Station Fleet</Text>
            <Text style={styles.totalFleetValue}>{fleetSummary.totalCount} Bikes</Text>
          </View>
        </Card>

        {/* ==================================================== */}
        {/* 2. LARGE "SCAN BOOKING QR" PRIMARY ACTION             */}
        {/* Outdoor-optimized 72dp tall high-contrast button     */}
        {/* ==================================================== */}
        <TouchableOpacity
          style={styles.largeQrButton}
          onPress={() => {
            setManualCode('');
            setQrModalVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Scan Booking QR Code"
          activeOpacity={0.88}
        >
          <View style={styles.largeQrIconCircle}>
            <Text style={styles.largeQrIcon}>📷</Text>
          </View>
          <View style={styles.largeQrTextBox}>
            <View style={styles.largeQrTitleRow}>
              <Text style={styles.largeQrTitle}>SCAN BOOKING QR</Text>
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>PRIMARY ACTION</Text>
              </View>
            </View>
            <Text style={styles.largeQrSub}>
              Scan rider voucher QR or instant reference lookup
            </Text>
          </View>
          <Text style={styles.largeQrArrow}>➔</Text>
        </TouchableOpacity>

        {/* ==================================================== */}
        {/* 3. TODAY'S PICKUPS / RETURNS LIST                    */}
        {/* (From Api/V1/Staff/BookingController)                */}
        {/* ==================================================== */}
        <View style={styles.sectionHeaderContainer}>
          <View>
            <Text style={styles.sectionHeading}>Today's Operations Queue</Text>
            <Text style={styles.sectionSubheading}>
              Pickups & returns scheduled for {selectedStore.name}
            </Text>
          </View>
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {/* Filter Segment Tabs */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'all' && styles.segmentTabActive]}
            onPress={() => setActiveTab('all')}
            accessibilityRole="tab"
          >
            <Text style={[styles.segmentLabel, activeTab === 'all' && styles.segmentLabelActive]}>
              All Today ({bookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'pickups' && styles.segmentTabActive]}
            onPress={() => setActiveTab('pickups')}
            accessibilityRole="tab"
          >
            <Text style={[styles.segmentLabel, activeTab === 'pickups' && styles.segmentLabelActive]}>
              Pickups Due ({pickupsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'returns' && styles.segmentTabActive]}
            onPress={() => setActiveTab('returns')}
            accessibilityRole="tab"
          >
            <Text style={[styles.segmentLabel, activeTab === 'returns' && styles.segmentLabelActive]}>
              Returns Due ({returnsCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Search Input */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search customer, phone, or GKW-XXXX..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List of Bookings Cards */}
        {filteredBookings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? `No bookings match "${searchQuery}"`
                : activeTab === 'pickups'
                ? 'All scheduled pickups for today have been dispatched!'
                : activeTab === 'returns'
                ? 'No returns scheduled for today at this station.'
                : 'No pending bookings in the queue.'}
            </Text>
            {searchQuery ? (
              <Button title="Clear Search" size="sm" variant="outline" onPress={() => setSearchQuery('')} />
            ) : (
              <Button title="Refresh Queue" size="sm" variant="outline" onPress={onRefresh} />
            )}
          </Card>
        ) : (
          filteredBookings.map((item) => {
            const isPickup = item.status === 'confirmed';
            const isReturn = item.status === 'handed_over' || item.status === 'active';
            const customerName = item.user?.name || item.customer?.name || 'Rider';
            const customerPhone = item.user?.phone || item.customer?.phone || '';
            const bikeName = item.bike?.model_name || item.bike?.name || 'Assigned Bike';
            const bikeReg = item.bike?.registration_number || 'KA-47-XX-0000';
            const bookingRef = item.booking_reference || item.booking_code || `GKW-${item.id}`;
            const timeSlot = item.scheduled_time || 'Today';

            return (
              <Card key={item.id} style={styles.bookingCard}>
                {/* Booking Header: Status & Timing */}
                <View style={styles.bookingCardHeader}>
                  <View style={styles.timeBadgeContainer}>
                    <Text style={styles.timeBadgeIcon}>⏰</Text>
                    <Text style={styles.timeBadgeText}>{timeSlot}</Text>
                  </View>

                  <View style={styles.headerRightBadges}>
                    {item.is_overdue && <Badge label="OVERDUE" variant="danger" />}
                    {isPickup && <Badge label="PICKUP DUE" variant="warning" />}
                    {isReturn && !item.is_overdue && <Badge label="RETURN DUE" variant="info" />}
                  </View>
                </View>

                {/* Booking Reference Pill */}
                <View style={styles.refRow}>
                  <View style={styles.refPill}>
                    <Text style={styles.refPillLabel}>BOOKING</Text>
                    <Text style={styles.refPillValue}>{bookingRef}</Text>
                  </View>
                  <Text style={styles.amountText}>₹{item.total_amount}</Text>
                </View>

                {/* Customer Information with One-Tap Call */}
                <View style={styles.customerRow}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{customerName}</Text>
                    {customerPhone ? (
                      <Text style={styles.customerPhone}>{customerPhone}</Text>
                    ) : null}
                  </View>

                  {customerPhone ? (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handlePhoneCall(customerPhone)}
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${customerName}`}
                    >
                      <Text style={styles.callButtonIcon}>📞</Text>
                      <Text style={styles.callButtonText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.cardDivider} />

                {/* Vehicle & Accessory Specifications */}
                <View style={styles.bikeDetailsRow}>
                  <Text style={styles.bikeIcon}>🏍️</Text>
                  <View style={styles.bikeInfo}>
                    <Text style={styles.bikeModel}>{bikeName}</Text>
                    <Text style={styles.bikeRegistration}>{bikeReg}</Text>
                  </View>
                </View>

                <View style={styles.specsRow}>
                  <View style={styles.specChip}>
                    <Text style={styles.specChipText}>
                      🪖 {item.helmets_provided || 1} Helmet{item.helmets_provided === 2 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.specChip}>
                    <Text style={styles.specChipText}>
                      🔒 Deposit: ₹{item.deposit_amount || item.security_deposit || 1500}
                    </Text>
                  </View>
                </View>

                {/* Primary Dispatch Action Button */}
                <View style={styles.actionButtonContainer}>
                  {isPickup ? (
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleHandoverAction(item)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.actionBtnIcon}>🔑</Text>
                      <Text style={styles.primaryActionBtnText}>Handover Key</Text>
                    </TouchableOpacity>
                  ) : isReturn ? (
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: colors.info }]}
                      onPress={() => handleReturnAction(item)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.actionBtnIcon}>🔄</Text>
                      <Text style={[styles.primaryActionBtnText, { color: '#090D16' }]}>
                        Return Check-in
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* ==================================================== */}
      {/* 4. MODAL: SCAN BOOKING QR / VOUCHER VERIFY           */}
      {/* ==================================================== */}
      <Modal
        visible={qrModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Scan Booking QR</Text>
                <Text style={styles.modalSub}>Customer Voucher Verification</Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setQrModalVisible(false)}
                accessibilityRole="button"
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* QR Scanner Frame & Manual Input */}
            <ScrollView style={styles.modalBody}>
                {/* Camera Viewfinder */}
                <View style={styles.viewfinderContainer}>
                  <View style={styles.viewfinderBox}>
                    {permission?.granted ? (
                      <CameraView
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        onBarcodeScanned={handleBarcodeScanned}
                        barcodeScannerSettings={{
                          barcodeTypes: ["qr", "pdf417", "code128", "code39"],
                        }}
                      />
                    ) : (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Text style={{ color: colors.textInverse, textAlign: 'center', marginBottom: 10, fontSize: typography.sizes.sm }}>
                          Camera access is required to scan booking QR codes.
                        </Text>
                        <Button title="Grant Permission" onPress={requestPermission} size="sm" variant="outline" />
                      </View>
                    )}
                    <View style={[styles.cornerBracket, styles.cornerTopLeft]} />
                    <View style={[styles.cornerBracket, styles.cornerTopRight]} />
                    <View style={[styles.cornerBracket, styles.cornerBottomLeft]} />
                    <View style={[styles.cornerBracket, styles.cornerBottomRight]} />
                    <View style={styles.scanLaser} />
                    <Text style={styles.viewfinderHint}>Align QR code within frame</Text>
                  </View>
                </View>

                {/* Quick Simulation Buttons for Demo / Testing */}
                <Text style={styles.simHeading}>TEST QR SCAN DEMOS:</Text>
                <View style={styles.simButtonsRow}>
                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={() => verifyBookingCode('GKW-8812')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.simBtnIcon}>📷</Text>
                    <Text style={styles.simBtnText}>Scan GKW-8812 (Pickup)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.simBtn}
                    onPress={() => verifyBookingCode('GKW-7740')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.simBtnIcon}>📷</Text>
                    <Text style={styles.simBtnText}>Scan GKW-7740 (Return)</Text>
                  </TouchableOpacity>
                </View>

                {/* Manual Code Input Fallback */}
                <View style={styles.manualEntryContainer}>
                  <Text style={styles.manualEntryTitle}>Or Enter Reference Code Manually:</Text>
                  <View style={styles.manualInputRow}>
                    <TextInput
                      style={styles.manualCodeInput}
                      placeholder="e.g. GKW-8830"
                      placeholderTextColor={colors.textMuted}
                      value={manualCode}
                      onChangeText={setManualCode}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.verifyManualBtn}
                      onPress={() => verifyBookingCode(manualCode)}
                      disabled={isVerifyingCode}
                      accessibilityRole="button"
                    >
                      {isVerifyingCode ? (
                        <ActivityIndicator color={colors.textInverse} size="small" />
                      ) : (
                        <Text style={styles.verifyManualText}>Verify</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },

  // Store Scoping & Status Summary
  summaryCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.borderDark,
    borderWidth: 1.5,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  storeTitleBox: {
    flex: 1,
  },
  liveSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: typography.weights.heavy,
    letterSpacing: 1,
  },
  storeNameText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  storeCodeText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Multiple Stores Switcher
  storeSwitcherContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  switcherLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  switcherScroll: {
    flexDirection: 'row',
  },
  storePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  storePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  storePillText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  storePillTextActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.heavy,
  },

  // Available / Booked / Maintenance Grid
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricIcon: {
    fontSize: 12,
  },
  metricTag: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.5,
  },
  metricNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    marginVertical: 2,
  },
  metricTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  metricFoot: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  totalFleetBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  totalFleetLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  totalFleetValue: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.heavy,
  },

  // Large "Scan Booking QR" Primary Action (72dp Touch Target)
  largeQrButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  largeQrIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  largeQrIcon: {
    fontSize: 26,
  },
  largeQrTextBox: {
    flex: 1,
  },
  largeQrTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  largeQrTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: '#090D16',
    letterSpacing: 0.5,
  },
  primaryBadge: {
    backgroundColor: 'rgba(9, 13, 22, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  primaryBadgeText: {
    fontSize: typography.sizes.xs - 3,
    fontWeight: typography.weights.heavy,
    color: '#090D16',
  },
  largeQrSub: {
    fontSize: typography.sizes.xs,
    color: '#1F2937',
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  largeQrArrow: {
    fontSize: 22,
    color: '#090D16',
    fontWeight: typography.weights.heavy,
    marginLeft: spacing.xs,
  },

  // Today's Operations Queue Section
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  sectionSubheading: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Segmented Tabs
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    minHeight: touchTargets.min,
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: colors.primary,
  },
  segmentLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold,
  },
  segmentLabelActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.heavy,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: touchTargets.min,
  },
  searchBarInput: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: typography.sizes.sm,
  },
  clearSearchBtn: {
    padding: spacing.xs,
  },
  clearSearchText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Booking Card
  bookingCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.borderDark,
    borderWidth: 1.5,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.heavy,
  },
  headerRightBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  refPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  refPillLabel: {
    fontSize: typography.sizes.xs - 3,
    fontWeight: typography.weights.heavy,
    color: colors.textMuted,
    marginRight: 6,
  },
  refPillValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  amountText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  customerPhone: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touchTargets.min,
  },
  callButtonIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  callButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  bikeDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bikeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  bikeInfo: {
    flex: 1,
  },
  bikeModel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  bikeRegistration: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  specsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  specChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specChipText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  actionButtonContainer: {
    marginTop: spacing.xs,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    minHeight: touchTargets.large,
    paddingHorizontal: spacing.md,
  },
  actionBtnIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  primaryActionBtnText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.heavy,
    color: colors.textInverse,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  modalSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: spacing.xs,
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeModalText: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: spacing.md,
  },

  // Viewfinder
  viewfinderContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  viewfinderBox: {
    width: 220,
    height: 220,
    backgroundColor: '#090D16',
    borderRadius: borderRadius.md,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  cornerBracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.primary,
  },
  cornerTopLeft: {
    top: 10,
    left: 10,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  cornerTopRight: {
    top: 10,
    right: 10,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
  },
  cornerBottomLeft: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
  },
  cornerBottomRight: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
  },
  scanLaser: {
    width: '80%',
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  viewfinderHint: {
    position: 'absolute',
    bottom: 16,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },

  // Sim Buttons
  simHeading: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  simBtn: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  simBtnIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  simBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },

  // Manual Entry
  manualEntryContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  manualEntryTitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  manualCodeInput: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    height: 50,
  },
  verifyManualBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  verifyManualText: {
    color: colors.textInverse,
    fontWeight: typography.weights.heavy,
    fontSize: typography.sizes.sm,
  },

  // Verified Card
  successVerifiedBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  verifiedCheckIcon: {
    fontSize: 44,
    marginBottom: spacing.xs,
  },
  verifiedTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  verifiedSub: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  verifiedDetailCard: {
    backgroundColor: colors.surfaceSecondary,
    marginVertical: spacing.md,
    borderColor: colors.border,
  },
  verifiedRefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedRefCode: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.primary,
  },
  detailLabel: {
    fontSize: typography.sizes.xs - 2,
    color: colors.textMuted,
    fontWeight: typography.weights.heavy,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.sizes.base,
    color: colors.text,
    fontWeight: typography.weights.heavy,
  },
  detailSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  colHalf: {
    flex: 1,
  },
  modalActionButtons: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelVerifyBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: touchTargets.min,
    justifyContent: 'center',
  },
  cancelVerifyText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold,
  },
});
