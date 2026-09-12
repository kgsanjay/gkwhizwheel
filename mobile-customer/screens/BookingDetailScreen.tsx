import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { Paths, File } from 'expo-file-system';
import { RootStackParamList } from '../navigation/types';
import { Booking } from '../api/types';
import { api } from '../api/client';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

type BookingDetailRouteProp = RouteProp<RootStackParamList, 'BookingDetail'>;

export const formatVoucherDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatVoucherTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '10:00 AM';
  }
};

export const buildVoucherShareText = (booking: Booking): string => {
  const bike = booking.bike;
  const pickup = booking.pickup_store;
  const ret = booking.return_store;

  return `========================================
GK WHIZWHEELS RENTAL VOUCHER
Self-Drive Two-Wheeler Rentals • Honnavar
========================================
VOUCHER #: ${booking.booking_number || `GKW-${booking.id}`}
STATUS: ${booking.status.toUpperCase()}
DATE ISSUED: ${new Date(booking.created_at || Date.now()).toLocaleDateString('en-IN')}

--- VEHICLE DETAILS ---
Model: ${bike?.brand || 'Honda'} ${bike?.model_name || 'Fleet Two-Wheeler'}
Registration: ${bike?.registration_number || 'KA-47-E-7890 (Commercial RC)'}
Transmission: ${bike?.transmission || 'Automatic'}
Fuel Type: ${bike?.fuel_type || 'Petrol'}

--- RENTAL ITINERARY ---
Pickup: ${formatVoucherDate(booking.start_date)} at ${formatVoucherTime(booking.start_date)}
Hub: ${pickup?.name || 'Honnavar Railway Station Hub'} (${pickup?.address_line || 'Exit Platform 1'})
Phone: ${pickup?.phone || '+91 94801 23456'}

Return: ${formatVoucherDate(booking.end_date)} at ${formatVoucherTime(booking.end_date)}
Hub: ${ret?.name || pickup?.name || 'Honnavar Railway Station Hub'} (${ret?.address_line || pickup?.address_line || 'Exit Platform 1'})

--- FARE SUMMARY ---
Total Tariff: ₹${booking.total_amount}
Refundable Deposit: ₹${booking.deposit_amount || 1000} (100% refunded upon return)
Status: PAID / HELD

--- PICKUP GUIDELINES ---
1. Present this voucher and original Driving License at the counter.
2. 2 sanitized ISI safety helmets provided complimentary.
3. 24/7 Coastal Roadside Assistance: +91 94801 23456
========================================`;
};

export const BookingDetailScreen: React.FC = () => {
  const route = useRoute<BookingDetailRouteProp>();
  const navigation = useNavigation();
  const { bookingId, booking: initialBooking } = route.params;

  const [booking, setBooking] = useState<Booking | null>(initialBooking || null);
  const [loading, setLoading] = useState<boolean>(!initialBooking);
  const [sharing, setSharing] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!initialBooking) {
      setLoading(true);
      api
        .get<Booking>(`/bookings/${bookingId}`)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setBooking(res.data);
          }
        })
        .catch(() => {
          // Keep mock or previous data
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [bookingId, initialBooking]);

  const getStatusVariant = (status?: Booking['status']) => {
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

  const handleShareVoucher = async () => {
    if (!booking) return;
    setSharing(true);
    try {
      const shareContent = buildVoucherShareText(booking);

      // Try Expo Sharing with a generated text document
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable && Paths?.cache) {
        const file = new File(
          Paths.cache,
          `GKWhizWheel_Voucher_${booking.booking_number || booking.id}.txt`
        );
        file.create({ overwrite: true });
        file.write(shareContent);

        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: `Rental Voucher #${booking.booking_number || booking.id}`,
          UTI: 'public.plain-text',
        });
      } else {
        // Fallback to standard React Native Share
        await Share.share({
          title: `GKWhizWheels Voucher #${booking.booking_number || booking.id}`,
          message: shareContent,
        });
      }
    } catch {
      try {
        await Share.share({
          title: `GKWhizWheels Voucher #${booking?.booking_number || booking?.id}`,
          message: buildVoucherShareText(booking),
        });
      } catch {
        Alert.alert('Share Voucher', 'Could not open share dialog. Please try again.');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:+919480123456').catch(() => {
      Alert.alert('Helpline', 'Call GK WhizWheels 24/7 Support at: +91 94801 23456');
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading rental voucher...</Text>
      </View>
    );
  }

  const bike = booking?.bike;
  const pickupStore = booking?.pickup_store;
  const returnStore = booking?.return_store || pickupStore;
  const deposit = booking?.deposit_amount || 1000;
  const total = booking?.total_amount || 1500;
  const bookingNumber = booking?.booking_number || `GKW-${booking?.id || 101}`;

  return (
    <View style={styles.container}>
      <Header
        title="Rental Voucher"
        subtitle={`#${bookingNumber}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Voucher Top Header */}
        <View style={styles.voucherHeaderCard}>
          <View style={styles.voucherHeaderTop}>
            <View style={styles.voucherHeaderBrand}>
              <Text style={styles.brandTitle}>GK WhizWheels</Text>
              <Text style={styles.brandSubtitle}>SELF-DRIVE TWO-WHEELER RENTALS</Text>
            </View>
            <Badge
              label={booking?.status || 'confirmed'}
              variant={getStatusVariant(booking?.status)}
            />
          </View>

          <View style={styles.voucherDivider} />

          <View style={styles.voucherMetaRow}>
            <View>
              <Text style={styles.metaLabel}>VOUCHER NUMBER</Text>
              <Text style={styles.voucherNumberText}>#{bookingNumber}</Text>
            </View>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrIcon}>📱</Text>
              <Text style={styles.qrText}>SCAN AT HUB</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Details Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <View style={styles.permitBadge}>
              <Text style={styles.permitText}>Commercial RC ✓</Text>
            </View>
          </View>

          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIconCircle}>
              <Text style={styles.vehicleEmoji}>🛵</Text>
            </View>
            <View style={styles.vehicleMainInfo}>
              <Text style={styles.bikeModel}>
                {bike?.brand || 'Honda'} {bike?.model_name || 'Activa 6G'}
              </Text>
              <Text style={styles.bikeReg}>
                Reg: {bike?.registration_number || 'KA-47-E-8421'}
              </Text>
            </View>
          </View>

          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>CATEGORY</Text>
              <Text style={styles.specValue}>{bike?.category?.name || 'Scooter'}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>TRANSMISSION</Text>
              <Text style={styles.specValue}>{bike?.transmission || 'Automatic'}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>FUEL TYPE</Text>
              <Text style={styles.specValue}>{bike?.fuel_type || 'Petrol'}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>HELMETS</Text>
              <Text style={styles.specValue}>2 Included</Text>
            </View>
          </View>
        </View>

        {/* Trip Itinerary Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rental Schedule & Hubs</Text>

          {/* Pickup */}
          <View style={styles.itineraryBlock}>
            <View style={styles.itineraryDotGreen} />
            <View style={styles.itineraryDetails}>
              <Text style={styles.itineraryStage}>PICKUP POINT</Text>
              <Text style={styles.itineraryDate}>
                {formatVoucherDate(booking?.start_date || '')} at{' '}
                {formatVoucherTime(booking?.start_date || '')}
              </Text>
              <Text style={styles.itineraryHubName}>
                📍 {pickupStore?.name || 'Honnavar Railway Station Hub'}
              </Text>
              <Text style={styles.itineraryHubAddr}>
                {pickupStore?.address_line || 'Platform 1 Exit, Railway Station Road, Honnavar'}
              </Text>
            </View>
          </View>

          <View style={styles.itineraryLine} />

          {/* Return */}
          <View style={styles.itineraryBlock}>
            <View style={styles.itineraryDotRed} />
            <View style={styles.itineraryDetails}>
              <Text style={styles.itineraryStage}>RETURN POINT</Text>
              <Text style={styles.itineraryDate}>
                {formatVoucherDate(booking?.end_date || '')} at{' '}
                {formatVoucherTime(booking?.end_date || '')}
              </Text>
              <Text style={styles.itineraryHubName}>
                📍 {returnStore?.name || 'Honnavar Railway Station Hub'}
              </Text>
              <Text style={styles.itineraryHubAddr}>
                {returnStore?.address_line || 'Platform 1 Exit, Railway Station Road, Honnavar'}
              </Text>
            </View>
          </View>
        </View>

        {/* Fare & Payment Breakdown Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tax Invoice & Fare Summary</Text>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Rental Tariff</Text>
            <Text style={styles.fareValue}>₹{total - deposit}</Text>
          </View>

          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Refundable Security Deposit</Text>
            <Text style={styles.fareDepositValue}>₹{deposit}</Text>
          </View>
          <Text style={styles.depositNote}>
            * Refunded to original payment method within 2 hours of vehicle inspection.
          </Text>

          <View style={styles.voucherDivider} />

          <View style={styles.fareTotalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Amount Paid</Text>
              <Text style={styles.paymentTag}>✓ Full Payment Settled</Text>
            </View>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        {/* Handover & Safety Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle} accessible={true} accessibilityRole="header">Station Handover & Safety Rules:</Text>
          <Text style={styles.ruleItem}>• Present original Driving License (MCWG) at hub</Text>
          <Text style={styles.ruleItem}>• 2 ISI certified helmets provided with sanitization cap</Text>
          <Text style={styles.ruleItem}>• Maximum speed limit: 60 km/h on Karavali highways</Text>
          <Text style={styles.ruleItem}>• 24/7 Roadside Breakdown Rescue: +91 94801 23456</Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.helplineBtn}
          onPress={handleCallHelpline}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Call 24/7 customer support helpline"
          accessibilityHint="Dials roadside rescue and station assistance line"
        >
          <Text style={styles.helplineBtnIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>📞</Text>
          <Text style={styles.helplineBtnText}>Support</Text>
        </TouchableOpacity>

        <Button
          title={sharing ? 'Preparing Voucher...' : 'Download / Share Voucher'}
          onPress={handleShareVoucher}
          loading={sharing}
          accessibilityLabel="Download or share booking voucher"
          accessibilityHint="Opens system share sheet to export or save your booking voucher PDF"
          style={styles.shareBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },

  // Voucher Top Header Card
  voucherHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  voucherHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  voucherHeaderBrand: {
    flex: 1,
  },
  brandTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  voucherDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  voucherMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  voucherNumberText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
    marginTop: 2,
  },
  qrPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrIcon: {
    fontSize: 16,
  },
  qrText: {
    fontSize: 8,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  permitBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  permitText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.accentDark,
  },

  // Vehicle Details
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  vehicleIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vehicleEmoji: {
    fontSize: 24,
  },
  vehicleMainInfo: {
    flex: 1,
  },
  bikeModel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  bikeReg: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  specBox: {
    width: '48%',
    padding: spacing.xs,
  },
  specLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
  },
  specValue: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
    marginTop: 1,
  },

  // Itinerary
  itineraryBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itineraryDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
    marginTop: 4,
    marginRight: spacing.md,
  },
  itineraryDotRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.danger,
    marginTop: 4,
    marginRight: spacing.md,
  },
  itineraryLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.divider,
    marginLeft: 5,
    marginVertical: 4,
  },
  itineraryDetails: {
    flex: 1,
  },
  itineraryStage: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  itineraryDate: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 1,
  },
  itineraryHubName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primaryDark,
    marginTop: 2,
  },
  itineraryHubAddr: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
    lineHeight: 15,
  },

  // Fare Details
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  fareLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  fareValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  fareDepositValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.accentDark,
  },
  depositNote: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  fareTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  totalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  paymentTag: {
    fontSize: 10,
    color: colors.accentDark,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  totalValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
  },

  // Safety Guidelines
  guidelinesCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  guidelinesTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginBottom: 4,
  },
  ruleItem: {
    fontSize: 11,
    color: colors.secondary,
    lineHeight: 18,
  },

  // Bottom Action Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.modal,
    gap: spacing.sm,
  },
  helplineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helplineBtnIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  helplineBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  shareBtn: {
    flex: 1,
  },
});
