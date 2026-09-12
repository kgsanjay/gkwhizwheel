import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius, touchTargets } from '../theme';
import { Header, Card, Badge, Button } from '../components';
import { opsApi } from '../api/client';
import { OpsBooking } from '../api/types';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>;

export const BookingDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId, bookingCode } = route.params;
  const { isManager } = useAuth();

  const [booking, setBooking] = useState<OpsBooking | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('upi');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId, bookingCode]);

  const loadBooking = async () => {
    setLoading(true);
    try {
      let data;
      if (bookingId) {
        data = await opsApi.getBookingById(bookingId);
      } else if (bookingCode) {
        data = await opsApi.getBookingByCode(bookingCode);
      }

      if (data) {
        setBooking(data);
      } else {
        // Fallback for demo if API doesn't return anything
        Alert.alert('Error', 'Booking not found', [
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking) return;
    setIsProcessing(true);
    try {
      await opsApi.confirmBooking(booking.id);
      Alert.alert('Success', 'Booking confirmed.');
      loadBooking();
    } catch (error) {
      Alert.alert('Error', 'Failed to confirm booking.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    Alert.prompt(
      'Cancel Booking',
      'Please enter a reason for cancellation:',
      async (reason) => {
        setIsProcessing(true);
        try {
          await opsApi.cancelBooking(booking.id, { reason });
          Alert.alert('Success', 'Booking cancelled.');
          loadBooking();
        } catch (error) {
          Alert.alert('Error', 'Failed to cancel booking.');
        } finally {
          setIsProcessing(false);
        }
      },
      'plain-text'
    );
  };

  const handleHandover = async () => {
    if (!booking) return;
    // In a full flow, you would capture odometer, fuel, helmets, etc.
    // Here we'll do a simple prompt for demonstration or navigate to HandoverFlow.
    navigation.navigate('HandoverFlow', { bookingId: booking.id });
  };

  const handleReturn = async () => {
    if (!booking) return;
    navigation.navigate('ReturnFlow', { bookingId: booking.id });
  };

  const handleCollectPayment = async () => {
    if (!booking) return;
    setIsProcessing(true);
    try {
      // Amount is implicitly the outstanding balance
      await opsApi.collectPayment(booking.id, {
        amount: booking.outstanding_balance || 0,
        payment_method: paymentMethod,
        notes: paymentNotes
      });
      Alert.alert('Success', 'Payment collected successfully.');
      setPaymentModalVisible(false);
      loadBooking();
    } catch (error) {
      Alert.alert('Error', 'Failed to process payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Booking Details" onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return null; // Handled in loadBooking
  }

  const customerName = booking.user?.name || booking.customer?.name || 'Customer';
  const customerPhone = booking.user?.phone || booking.customer?.phone || 'N/A';
  const bikeName = booking.bike?.model_name || booking.bike?.name || 'Assigned Bike';
  const bikeReg = booking.bike?.registration_number || 'N/A';
  const refCode = booking.booking_reference || booking.booking_code || `#${booking.id}`;
  
  const balanceDue = booking.outstanding_balance ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Booking Details" onBack={() => navigation.goBack()} subtitle={refCode} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Current Status:</Text>
          <Badge label={booking.status.replace('_', ' ').toUpperCase()} variant={
            booking.status === 'confirmed' ? 'warning' :
            booking.status === 'handed_over' ? 'info' :
            booking.status === 'completed' ? 'success' : 'neutral'
          } />
        </View>

        {/* Customer Information */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.detailValue}>{customerName}</Text>
          <Text style={styles.detailSub}>{customerPhone}</Text>
          
          <Button 
            title="View KYC Document" 
            variant="outline" 
            size="sm" 
            onPress={() => setKycModalVisible(true)} 
            style={styles.kycButton}
          />
        </Card>

        {/* Vehicle Information */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle Assigned</Text>
          <Text style={styles.detailValue}>{bikeName}</Text>
          <Text style={styles.detailSub}>{bikeReg}</Text>
        </Card>

        {/* Booking Timeline */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Timeline</Text>
          <View style={styles.row}>
            <View style={styles.colHalf}>
              <Text style={styles.detailLabel}>START DATE</Text>
              <Text style={styles.detailValue}>{booking.start_date}</Text>
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.detailLabel}>END DATE</Text>
              <Text style={styles.detailValue}>{booking.end_date}</Text>
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
              <Text style={styles.detailLabel}>DEPOSIT</Text>
              <Text style={styles.detailValue}>₹{booking.deposit_amount || booking.security_deposit || 0}</Text>
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
          </View>
          {isManager && (
            <>
              <View style={styles.divider} />
              <Button 
                title="Manage Refunds" 
                variant="outline" 
                onPress={() => navigation.navigate('RefundProcessing', { bookingId: booking.id })} 
                style={{ marginTop: spacing.sm }}
              />
            </>
          )}
        </Card>

        {/* Role-Appropriate Actions */}
        <View style={styles.actionContainer}>
          {booking.status === 'pending' && (
            <Button title="Confirm Booking" onPress={handleConfirm} loading={isProcessing} style={styles.actionBtn} />
          )}

          {booking.status === 'confirmed' && (
            <Button title="Start Hand Over" onPress={handleHandover} style={styles.actionBtn} />
          )}

          {(booking.status === 'handed_over' || booking.status === 'active') && (
            <Button title="Mark Returned" onPress={handleReturn} style={styles.actionBtn} />
          )}

          {balanceDue > 0 && (
            <Button title="Collect Payment" variant="primary" onPress={() => setPaymentModalVisible(true)} style={styles.actionBtn} />
          )}

          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <Button title="Cancel Booking" variant="danger" onPress={handleCancel} loading={isProcessing} style={styles.actionBtn} />
          )}
        </View>

      </ScrollView>

      {/* KYC Modal */}
      <Modal visible={kycModalVisible} transparent animationType="slide" onRequestClose={() => setKycModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>KYC Document</Text>
              <TouchableOpacity onPress={() => setKycModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.kycContent}>
              <Text style={styles.kycLabel}>Driving License Number:</Text>
              <Text style={styles.kycValue}>{booking.customer?.driving_license_number || 'Not provided'}</Text>
              
              <View style={styles.kycPlaceholder}>
                <Text style={styles.kycPlaceholderText}>📷 Document Image (Front)</Text>
              </View>
              <View style={styles.kycPlaceholder}>
                <Text style={styles.kycPlaceholderText}>📷 Document Image (Back)</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Collection Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Collect Payment</Text>
                <Text style={styles.modalSub}>Server-verified outstanding balance</Text>
              </View>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}><Text style={styles.closeIcon}>✕</Text></TouchableOpacity>
            </View>
            
            <View style={styles.paymentContent}>
              <Text style={styles.detailLabel}>AMOUNT DUE (READ ONLY)</Text>
              <TextInput 
                style={styles.readOnlyInput}
                value={`₹ ${balanceDue}`}
                editable={false} // CRITICAL: This closes the payment-amount trust gap
              />
              
              <Text style={styles.detailLabel}>PAYMENT METHOD</Text>
              <View style={styles.paymentMethodRow}>
                {['upi', 'cash', 'card'].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.methodBtn, paymentMethod === method && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod(method as 'upi'|'cash'|'card')}
                  >
                    <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
                      {method.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.detailLabel}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Transaction ID or notes..."
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                multiline
              />

              <Button title={`Confirm ₹${balanceDue} Collection`} onPress={handleCollectPayment} loading={isProcessing} style={styles.confirmPaymentBtn} />
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
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
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colHalf: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.heavy,
  },
  detailSub: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  kycButton: {
    marginTop: spacing.md,
  },
  actionContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    marginBottom: spacing.sm,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
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
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textMuted,
  },
  kycContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  kycLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  kycValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  kycPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  kycPlaceholderText: {
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
  },
  
  paymentContent: {
    paddingVertical: spacing.sm,
  },
  readOnlyInput: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    marginBottom: spacing.md,
    opacity: 0.8, // visually indicate read-only
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  methodTextActive: {
    color: colors.textInverse,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
    color: colors.text,
  },
  confirmPaymentBtn: {
    marginTop: spacing.sm,
  },
});
