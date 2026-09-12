import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Header, Card, Badge, Button } from '../components';
import { colors, spacing, typography, borderRadius } from '../theme';
import { serviceBookingsApi } from '../api/client';
import { OpsServiceBooking } from '../api/types';

type RouteProps = {
  key: string;
  name: 'ServiceBookingDetail';
  params: { bookingId: number };
};

export const ServiceBookingDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { bookingId } = route.params;

  const [booking, setBooking] = useState<OpsServiceBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const data = await serviceBookingsApi.getBookingDetails(bookingId);
      setBooking(data);
    } catch (error) {
      console.error('Error fetching service booking details:', error);
      Alert.alert('Error', 'Failed to load service booking details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    Alert.alert(
      'Confirm Check-In',
      'Are you sure you want to mark this service booking as checked in (in progress)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await serviceBookingsApi.markInProgress(bookingId);
              Alert.alert('Success', 'Booking marked as in progress.');
              loadBookingDetails();
            } catch (error) {
              console.error('Failed to check in:', error);
              Alert.alert('Error', 'Failed to check in service booking.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    Alert.alert(
      'Confirm Completion',
      'Are you sure you want to mark this service booking as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsProcessing(true);
              await serviceBookingsApi.markCompleted(bookingId);
              Alert.alert('Success', 'Booking marked as completed.');
              loadBookingDetails();
            } catch (error) {
              console.error('Failed to complete:', error);
              Alert.alert('Error', 'Failed to complete service booking.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return null;
  }

  const customerName = booking.customer_name || 'N/A';
  const customerPhone = booking.customer_phone || 'N/A';
  const serviceType = booking.service_type || 'Unknown';
  const refCode = booking.booking_number || `#${booking.id}`;
  const balanceDue = booking.balance_due ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Service Details" onBack={() => navigation.goBack()} subtitle={refCode} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Current Status:</Text>
          <Badge
            label={booking.status.replace('_', ' ').toUpperCase()}
            variant={
              booking.status === 'confirmed'
                ? 'warning'
                : booking.status === 'in_progress'
                ? 'info'
                : booking.status === 'completed'
                ? 'success'
                : 'neutral'
            }
          />
        </View>

        {/* Customer Information */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.detailValue}>{customerName}</Text>
          <Text style={styles.detailSub}>{customerPhone}</Text>
        </Card>

        {/* Service Information */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Service Details</Text>
          <View style={styles.row}>
            <View style={styles.colHalf}>
              <Text style={styles.detailLabel}>SERVICE</Text>
              <Text style={styles.detailValue}>{serviceType.toUpperCase()}</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.detailLabel}>QUANTITY</Text>
              <Text style={styles.detailValue}>{booking.quantity}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.colFull}>
              <Text style={styles.detailLabel}>DATE / TIME</Text>
              <Text style={styles.detailValue}>{booking.start_datetime}</Text>
            </View>
          </View>
        </Card>

        {/* Financials */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Financials</Text>
          <View style={styles.row}>
            <View style={styles.colHalf}>
              <Text style={styles.detailLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.detailValue}>₹{booking.total_amount}</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.detailLabel}>ADVANCE PAID</Text>
              <Text style={styles.detailValue}>₹{booking.advance_paid}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.colHalf}>
              <Text style={styles.detailLabel}>OUTSTANDING BALANCE</Text>
              <Text style={[styles.detailValue, balanceDue > 0 && { color: colors.danger }]}>
                ₹{balanceDue}
              </Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.detailLabel}>PAYMENT STATUS</Text>
              <Text style={styles.detailValue}>{booking.payment_status.toUpperCase()}</Text>
            </View>
          </View>
        </Card>

        {/* Role-Appropriate Actions */}
        <View style={styles.actionContainer}>
          {booking.status === 'confirmed' && (
            <Button
              title="Check In (Start Service)"
              onPress={handleCheckIn}
              loading={isProcessing}
              style={styles.actionBtn}
            />
          )}

          {booking.status === 'in_progress' && (
            <Button
              title="Mark Completed"
              onPress={handleComplete}
              loading={isProcessing}
              style={styles.actionBtn}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  colHalf: {
    flex: 1,
  },
  colFull: {
    flex: 1,
    marginTop: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  detailSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  actionContainer: {
    marginTop: spacing.lg,
  },
  actionBtn: {
    marginBottom: spacing.md,
  },
});
