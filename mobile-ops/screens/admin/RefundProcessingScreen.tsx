import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Header, Card, Button, Badge } from '../../components';
import { opsApi, adminApi } from '../../api/client';
import { OpsBooking, OpsRefund } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'RefundProcessing'>;

export const RefundProcessingScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { isManager } = useAuth();
  
  const [booking, setBooking] = useState<OpsBooking | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const data = await opsApi.getBookingById(bookingId);
      setBooking(data);
      // Pre-fill amount if there's a paid amount and it's cancelled/returned
      if (data && (data.status === 'cancelled' || data.status === 'returned')) {
        const totalRefunded = data.refunds?.reduce((acc: number, r: OpsRefund) => acc + Number(r.amount), 0) || 0;
        const paid = Number(data.paid_amount || 0) + Number(data.deposit_amount || 0);
        const maxRefund = paid - totalRefunded;
        if (maxRefund > 0) {
          setAmount(maxRefund.toString());
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load booking details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid refund amount.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the refund.');
      return;
    }

    try {
      setIsProcessing(true);
      await adminApi.processRefund(bookingId, {
        amount: Number(amount),
        reason: reason.trim(),
      });
      
      Alert.alert('Success', 'Refund processed successfully.');
      setAmount('');
      setReason('');
      await loadBooking();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to process refund.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderRefundStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge label="Completed" variant="success" />;
      case 'pending':
        return <Badge label="Pending Manual Processing" variant="warning" />;
      case 'failed':
        return <Badge label="Failed" variant="danger" />;
      default:
        return <Badge label={status.toUpperCase()} variant="neutral" />;
    }
  };

  if (!isManager) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Refund Processing" onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Access Denied. Only Store Managers can process refunds.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Refund Processing" onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={`Refund: ${booking.booking_reference}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Financials</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Amount:</Text>
            <Text style={styles.value}>₹{booking.total_amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Paid Amount:</Text>
            <Text style={styles.value}>₹{booking.paid_amount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Deposit Amount:</Text>
            <Text style={styles.value}>₹{booking.deposit_amount}</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Initiate Refund</Text>
          
          <Text style={styles.inputLabel}>Refund Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            editable={!isProcessing}
          />
          
          <Text style={styles.inputLabel}>Reason</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for refund (e.g. Cancelled, Deposit return)"
            multiline
            numberOfLines={3}
            editable={!isProcessing}
          />

          <Button
            title="Process Refund"
            onPress={handleProcessRefund}
            loading={isProcessing}
            style={styles.actionBtn}
          />
        </Card>

        {booking.refunds && booking.refunds.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Refund History</Text>
            {booking.refunds.map((refund: OpsRefund, idx: number) => (
              <View key={idx} style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyAmount}>₹{refund.amount}</Text>
                  <Text style={styles.historyReason} numberOfLines={1}>{refund.reason}</Text>
                  <Text style={styles.historyDate}>{refund.created_at ? new Date(refund.created_at).toLocaleDateString() : 'N/A'}</Text>
                </View>
                <View style={styles.historyRight}>
                  {renderRefundStatusBadge(refund.status)}
                </View>
              </View>
            ))}
          </Card>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.danger,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  value: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionBtn: {
    marginTop: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLeft: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  historyReason: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyDate: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});
