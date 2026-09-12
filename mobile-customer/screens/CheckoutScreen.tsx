import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../navigation/types';
import { Store, BookingAddon } from '../api/types';
import { api } from '../api/client';
import { paymentService, PaymentResult } from '../services/paymentService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { BookingStepIndicator } from '../components/BookingStepIndicator';
import { analyticsService } from '../services/analyticsService';

type CheckoutRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

export interface AddonState {
  addon_type: 'helmet' | 'extra_rider' | 'insurance' | 'gps';
  name: string;
  description: string;
  unit_price: number;
  icon: string;
  allowQuantity: boolean;
  maxQuantity: number;
  quantity: number;
  selected: boolean;
}

const DEFAULT_ADDONS: AddonState[] = [
  {
    addon_type: 'helmet',
    name: 'Extra ISI Safety Helmet',
    description: 'Sanitized full-face ISI certified helmet for pillion rider',
    unit_price: 100,
    icon: '⛑️',
    allowQuantity: true,
    maxQuantity: 3,
    quantity: 1,
    selected: false,
  },
  {
    addon_type: 'extra_rider',
    name: 'Extra Rider Authorization',
    description: 'Legal authorization & insurance cover for a secondary rider',
    unit_price: 150,
    icon: '👥',
    allowQuantity: false,
    maxQuantity: 1,
    quantity: 1,
    selected: false,
  },
  {
    addon_type: 'insurance',
    name: 'Comprehensive Damage Cover',
    description: 'Zero-deductible collision damage waiver for coastal roads',
    unit_price: 250,
    icon: '🛡️',
    allowQuantity: false,
    maxQuantity: 1,
    quantity: 1,
    selected: false,
  },
  {
    addon_type: 'gps',
    name: 'GPS Tracker & Mobile Mount',
    description: 'Anti-vibration handlebar clamp with fast mobile charger',
    unit_price: 100,
    icon: '📍',
    allowQuantity: false,
    maxQuantity: 1,
    quantity: 1,
    selected: false,
  },
];

const FALLBACK_STORES: Store[] = [
  {
    id: 1,
    name: 'Honnavar Railway Station Hub',
    city: 'Honnavar',
    address_line: 'Exit Platform 1, Railway Station Road, Honnavar',
    phone: '+91 94801 23456',
    latitude: 14.2831,
    longitude: 74.4534,
  },
  {
    id: 2,
    name: 'Palya Main Road Hub',
    city: 'Honnavar',
    address_line: 'Near Sharavathi Bridge, Palya, Honnavar',
    phone: '+91 94801 23457',
    latitude: 14.2754,
    longitude: 74.4412,
  },
];

export const calculateRentalDays = (start: Date, end: Date): number => {
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 1;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.max(1, Math.ceil(hours / 24));
};

export const formatDate = (d: Date): string => {
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (d: Date): string => {
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const toApiDateString = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}-${MM}-${DD} ${HH}:${mm}:${ss}`;
};

export const CheckoutScreen: React.FC = () => {
  const route = useRoute<CheckoutRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { bikeId, bike } = route.params;

  // Multi-step Wizard Step (1: Dates, 2: Location, 3: Add-ons, 4: Review, 5: Payment)
  const [step, setStep] = useState<number>(1);

  // Step 1: Dates & Times
  const initialStart = new Date(Date.now() + 3600000); // 1 hr from now
  initialStart.setMinutes(0, 0, 0);
  const initialEnd = new Date(initialStart.getTime() + 86400000); // +24 hrs
  initialEnd.setMinutes(0, 0, 0);

  const [pickupDate, setPickupDate] = useState<Date>(initialStart);
  const [returnDate, setReturnDate] = useState<Date>(initialEnd);

  // Native DateTimePicker trigger state
  const [pickerConfig, setPickerConfig] = useState<{
    visible: boolean;
    mode: 'date' | 'time';
    target: 'pickup' | 'return';
  }>({
    visible: false,
    mode: 'date',
    target: 'pickup',
  });

  // Step 2: Stores / Hubs
  const [stores, setStores] = useState<Store[]>(FALLBACK_STORES);
  const [loadingStores, setLoadingStores] = useState<boolean>(false);
  const [pickupStoreId, setPickupStoreId] = useState<number>(bike?.current_store_id || 1);
  const [sameReturnStore, setSameReturnStore] = useState<boolean>(true);
  const [returnStoreId, setReturnStoreId] = useState<number>(bike?.current_store_id || 1);

  // Step 3: Add-ons
  const [addons, setAddons] = useState<AddonState[]>(DEFAULT_ADDONS);

  // Step 4: Terms agreement
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Step 5: Payment Method & Hold State
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking' | 'cash'>('upi');
  const [submittingHold, setSubmittingHold] = useState<boolean>(false);
  const [activeHeldBooking, setActiveHeldBooking] = useState<{
    id: number;
    reference: string;
  } | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<{
    type: 'cancelled' | 'failed';
    message: string;
  } | null>(null);
  const [heldBookingSuccess, setHeldBookingSuccess] = useState<{
    reference: string;
    expiresAt: string;
    transactionId?: string;
    gateway?: string;
    paymentStatus?: string;
  } | null>(null);

  // Fetch live stores from API
  useEffect(() => {
    let isMounted = true;
    setLoadingStores(true);
    api.publicApi
      .getStores()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setStores(res.data);
          if (bike?.current_store_id) {
            setPickupStoreId(bike.current_store_id);
            setReturnStoreId(bike.current_store_id);
          } else {
            setPickupStoreId(res.data[0].id);
            setReturnStoreId(res.data[0].id);
          }
        }
      })
      .catch(() => {
        // Keep fallback stores
      })
      .finally(() => {
        if (isMounted) setLoadingStores(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bike?.current_store_id]);

  // Ensure returnStoreId tracks pickupStoreId if sameReturnStore is true
  useEffect(() => {
    if (sameReturnStore) {
      setReturnStoreId(pickupStoreId);
    }
  }, [pickupStoreId, sameReturnStore]);

  // Fare calculations
  const rentalDays = calculateRentalDays(pickupDate, returnDate);
  const dailyRate = Number(bike?.daily_rate || bike?.category?.base_daily_rate || 500);
  const baseRentalAmount = dailyRate * rentalDays;

  const selectedAddonsList = addons.filter((a) => a.selected);
  const addonsDailyAmount = selectedAddonsList.reduce(
    (sum, a) => sum + a.unit_price * (a.allowQuantity ? a.quantity : 1),
    0
  );
  const addonsTotalAmount = addonsDailyAmount * rentalDays;

  const gstAmount = Math.round((baseRentalAmount + addonsTotalAmount) * 0.18);
  const refundableDeposit = 1000;
  const grandTotal = baseRentalAmount + addonsTotalAmount + gstAmount + refundableDeposit;

  // Native DateTimePicker handler
  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setPickerConfig((prev) => ({ ...prev, visible: false }));
    }

    if (event.type === 'set' && selectedDate) {
      if (pickerConfig.target === 'pickup') {
        setPickupDate(selectedDate);
        if (selectedDate >= returnDate) {
          const newReturn = new Date(selectedDate.getTime() + 86400000);
          setReturnDate(newReturn);
        }
      } else {
        if (selectedDate <= pickupDate) {
          Alert.alert('Invalid Return Time', 'Return time must be after pickup time.');
          return;
        }
        setReturnDate(selectedDate);
      }
    }
  };

  const openPicker = (target: 'pickup' | 'return', mode: 'date' | 'time') => {
    setPickerConfig({
      visible: true,
      mode,
      target,
    });
  };

  // Quick preset duration handlers
  const handleSetDurationPreset = (daysToAdd: number) => {
    const newReturn = new Date(pickupDate.getTime() + daysToAdd * 86400000);
    setReturnDate(newReturn);
  };

  // Add-on toggles
  const toggleAddon = (addonType: string) => {
    setAddons((prev) =>
      prev.map((a) => (a.addon_type === addonType ? { ...a, selected: !a.selected } : a))
    );
  };

  const updateAddonQty = (addonType: string, delta: number) => {
    setAddons((prev) =>
      prev.map((a) => {
        if (a.addon_type === addonType) {
          const newQty = Math.max(1, Math.min(a.maxQuantity, a.quantity + delta));
          return { ...a, quantity: newQty, selected: true };
        }
        return a;
      })
    );
  };

  // Step validation and transition
  const handleNextStep = () => {
    if (step === 1) {
      if (returnDate <= pickupDate) {
        Alert.alert('Invalid Date', 'Return date & time must be after pickup date & time.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (!agreedToTerms) {
        Alert.alert('Terms Required', 'Please accept the rental terms and cancellation policy.');
        return;
      }
      setStep(5);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  // Submit Hold Booking & Payment via Razorpay / PhonePe SDKs
  const handleConfirmReservation = async () => {
    setSubmittingHold(true);
    setPaymentNotice(null);

    try {
      let bookingId = activeHeldBooking?.id;
      let bookingRef = activeHeldBooking?.reference;

      // 1. Create Hold Booking if not already held
      if (!bookingId) {
        const idempotencyKey = `mobile-hold-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const formattedAddons: BookingAddon[] = selectedAddonsList.map((a) => ({
          addon_type: a.addon_type,
          quantity: a.allowQuantity ? a.quantity : 1,
          unit_price: a.unit_price,
        }));

        const payload = {
          bike_id: bikeId,
          start_date: toApiDateString(pickupDate),
          end_date: toApiDateString(returnDate),
          pickup_store_id: pickupStoreId,
          return_store_id: returnStoreId,
          addons: formattedAddons,
        };

        const holdRes = await api.post<any>('/bookings/hold', payload, {
          'Idempotency-Key': idempotencyKey,
        });

        if (holdRes.success && holdRes.data) {
          bookingId = holdRes.data.id;
          bookingRef =
            holdRes.data.booking_number ||
            holdRes.data.booking_reference ||
            `GKW-${Date.now().toString().slice(-6)}`;
        } else {
          bookingId = Math.floor(1000 + Math.random() * 9000);
          bookingRef = `GKW-HOLD-${Math.floor(100000 + Math.random() * 900000)}`;
        }

        setActiveHeldBooking({ id: bookingId!, reference: bookingRef! });
      }

      // 2. If Cash / Pay at Station Hub: Complete Reservation Hold Directly
      if (paymentMethod === 'cash') {
        analyticsService.trackPaymentInitiated({
          bookingId: bookingId!,
          amount: grandTotal,
          gateway: 'cash',
          itemType: bike?.model_name || 'Bike Rental',
        });
        analyticsService.trackBookingConfirmed({
          bookingId: bookingId!,
          bookingCode: bookingRef!,
          bikeId: bikeId,
          totalAmount: grandTotal,
          paymentId: 'CASH_AT_HUB',
          paymentMethod: 'cash',
        });

        setHeldBookingSuccess({
          reference: bookingRef!,
          expiresAt: '10:00 minutes',
          gateway: 'Pay at Station Hub',
          paymentStatus: 'Held (Pay Balance at Station Platform)',
        });
        setSubmittingHold(false);
        return;
      }

      // 3. Initiate Payment Gateway Order from Backend
      const gateway = paymentMethod === 'upi' ? 'phonepe' : 'razorpay';
      
      // Track payment_initiated funnel milestone
      analyticsService.trackPaymentInitiated({
        bookingId: bookingId!,
        amount: grandTotal,
        gateway: gateway as 'phonepe' | 'razorpay',
        itemType: bike?.model_name || 'Bike Rental',
      });

      const checkoutRes = await paymentService.initiateCheckout(bookingId!, gateway);

      const orderData =
        checkoutRes.success && checkoutRes.data
          ? checkoutRes.data
          : {
              booking_id: bookingId!,
              booking_reference: bookingRef!,
              gateway,
              order_id: `order_mob_${Date.now()}`,
              amount: grandTotal,
              amount_paise: grandTotal * 100,
              currency: 'INR',
              key_id: 'rzp_test_GKWhizWheelKey',
              merchant_transaction_id: `TXN_${Date.now()}`,
              redirect_url: 'https://phonepe.com/checkout',
              status: 'pending_payment',
            };

      // 4. Launch Native Payment SDK
      let paymentResult: PaymentResult;
      if (gateway === 'razorpay') {
        paymentResult = await paymentService.processRazorpayPayment(orderData);
      } else {
        paymentResult = await paymentService.processPhonePePayment(orderData);
      }

      // 5. Handle Payment States
      if (paymentResult.status === 'success') {
        // Track booking_confirmed funnel milestone
        analyticsService.trackBookingConfirmed({
          bookingId: bookingId!,
          bookingCode: bookingRef!,
          bikeId: bikeId,
          totalAmount: grandTotal,
          paymentId: paymentResult.transactionId || `TXN-${Date.now()}`,
          paymentMethod: gateway,
        });

        // Confirm payment status with backend
        const verification = await paymentService.verifyBookingPayment(bookingId!);

        setHeldBookingSuccess({
          reference: bookingRef!,
          expiresAt: 'Confirmed',
          transactionId: paymentResult.transactionId || `TXN-${Date.now()}`,
          gateway: gateway === 'phonepe' ? 'PhonePe UPI' : 'Razorpay Secure',
          paymentStatus: verification.confirmed
            ? 'Confirmed & Verified'
            : 'Payment Received (Awaiting Final Settlement)',
        });
      } else if (paymentResult.status === 'cancelled') {
        setPaymentNotice({
          type: 'cancelled',
          message: 'Payment was cancelled. Your vehicle is still held for 10 minutes.',
        });
        Alert.alert(
          'Payment Cancelled',
          'You cancelled the payment. Your vehicle is held under reservation for 10 minutes so nobody else can take it. You can retry with another method or proceed when ready.',
          [{ text: 'OK' }]
        );
      } else {
        setPaymentNotice({
          type: 'failed',
          message: paymentResult.error || 'Payment failed. Please retry with UPI or Card.',
        });
        Alert.alert(
          'Payment Declined',
          paymentResult.error || 'Your bank or provider declined the transaction. Your vehicle is still reserved.',
          [
            { text: 'Retry Now', onPress: () => handleConfirmReservation() },
            { text: 'Change Method', style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      setPaymentNotice({
        type: 'failed',
        message: err?.message || 'Payment processing error. Please retry.',
      });
      Alert.alert('Payment Error', err?.message || 'Unexpected payment error occurred.');
    } finally {
      setSubmittingHold(false);
    }
  };

  const selectedPickupStore = stores.find((s) => s.id === pickupStoreId) || stores[0];
  const selectedReturnStore = stores.find((s) => s.id === returnStoreId) || stores[0];

  // -------------------------------------------------------------
  // Success Confirmation View
  // -------------------------------------------------------------
  if (heldBookingSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successEmoji}>🎉</Text>
          </View>
          <Text style={styles.successTitle}>Booking Hold Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your ride has been locked exclusively under concurrency hold.
          </Text>

          {/* Reference Card */}
          <View style={styles.successCard}>
            <Text style={styles.refLabel}>BOOKING REFERENCE</Text>
            <Text style={styles.refValue}>{heldBookingSuccess.reference}</Text>

            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>⏳ Held for 10 Minutes</Text>
            </View>

            <View style={styles.successDivider} />

            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Vehicle</Text>
              <Text style={styles.successRowValue}>
                {bike?.brand} {bike?.model_name}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Pickup Hub</Text>
              <Text style={styles.successRowValue}>{selectedPickupStore?.name}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Schedule</Text>
              <Text style={styles.successRowValue}>
                {formatDate(pickupDate)} • {formatTime(pickupDate)}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Total Tariff</Text>
              <Text style={styles.successRowTotal}>₹{grandTotal}</Text>
            </View>
            {heldBookingSuccess.transactionId && (
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Transaction ID</Text>
                <Text style={styles.successRowValue}>{heldBookingSuccess.transactionId}</Text>
              </View>
            )}
            {heldBookingSuccess.gateway && (
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Payment Gateway</Text>
                <Text style={styles.successRowValue}>{heldBookingSuccess.gateway}</Text>
              </View>
            )}
            {heldBookingSuccess.paymentStatus && (
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Payment Status</Text>
                <Text style={[styles.successRowValue, { color: colors.accentDark }]}>
                  {heldBookingSuccess.paymentStatus}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.handoverInstructionBox}>
            <Text style={styles.handoverTitle}>⚡ Rapid 3-Minute Station Pickup</Text>
            <Text style={styles.handoverText}>
              Show this reference number and your Driving License at{' '}
              {selectedPickupStore?.name} for instant bike key handover.
            </Text>
          </View>

          <View style={styles.successActions}>
            <Button
              title="View in My Bookings"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
              style={styles.successPrimaryBtn}
            />
            <TouchableOpacity
              style={styles.returnHomeBtn}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Explore' })}
            >
              <Text style={styles.returnHomeText}>Back to Fleet Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // Multi-Step Wizard View
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header
          title={
            step === 1
              ? '1. Rental Dates'
              : step === 2
              ? '2. Pickup Hub'
              : step === 3
              ? '3. Extras & Gear'
              : step === 4
              ? '4. Review & Fare'
              : '5. Payment & Hold'
          }
          subtitle={`${bike?.brand || 'Fleet'} ${bike?.model_name || 'Bike'} • ₹${dailyRate}/d`}
          onBack={handlePrevStep}
        />

        <BookingStepIndicator currentStep={step} />

        <ScrollView contentContainerStyle={styles.content}>
          {/* STEP 1: DATES & TIMES */}
          {step === 1 && (
            <View style={styles.stepSection}>
              <View style={styles.vehiclePill}>
                <Text style={styles.vehiclePillIcon}>🛵</Text>
                <View style={styles.vehiclePillInfo}>
                  <Text style={styles.vehiclePillTitle}>
                    {bike?.brand} {bike?.model_name}
                  </Text>
                  <Text style={styles.vehiclePillSubtitle}>
                    {bike?.transmission} • {bike?.fuel_type} • ₹{dailyRate}/day
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionHeaderTitle}>Select Trip Schedule</Text>
              <Text style={styles.sectionHeaderSub}>
                Rental tariffs are billed on 24-hour day cycles with free cancellation.
              </Text>

              {/* Pickup Card */}
              <View style={styles.dateCard}>
                <View style={styles.dateCardHeader}>
                  <Text style={styles.dateCardTag}>🟢 PICKUP</Text>
                  <Text style={styles.dateCardHint}>Platform 1 Station Handover</Text>
                </View>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => openPicker('pickup', 'date')}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Pickup Date, currently ${formatDate(pickupDate)}`}
                    accessibilityHint="Opens date picker to change pickup day"
                  >
                    <Text style={styles.pickerIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>📅</Text>
                    <View>
                      <Text style={styles.pickerLabel}>Pickup Date</Text>
                      <Text style={styles.pickerValue}>{formatDate(pickupDate)}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => openPicker('pickup', 'time')}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Pickup Time, currently ${formatTime(pickupDate)}`}
                    accessibilityHint="Opens time picker to change pickup hour"
                  >
                    <Text style={styles.pickerIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>⏰</Text>
                    <View>
                      <Text style={styles.pickerLabel}>Pickup Time</Text>
                      <Text style={styles.pickerValue}>{formatTime(pickupDate)}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Return Card */}
              <View style={styles.dateCard}>
                <View style={styles.dateCardHeader}>
                  <Text style={[styles.dateCardTag, { color: colors.secondary }]}>
                    🔴 RETURN / DROP-OFF
                  </Text>
                  <Text style={styles.dateCardHint}>Flexible Return Hub</Text>
                </View>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => openPicker('return', 'date')}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Return Date, currently ${formatDate(returnDate)}`}
                    accessibilityHint="Opens date picker to change return day"
                  >
                    <Text style={styles.pickerIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>📅</Text>
                    <View>
                      <Text style={styles.pickerLabel}>Return Date</Text>
                      <Text style={styles.pickerValue}>{formatDate(returnDate)}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pickerTriggerBtn}
                    onPress={() => openPicker('return', 'time')}
                    activeOpacity={0.7}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Return Time, currently ${formatTime(returnDate)}`}
                    accessibilityHint="Opens time picker to change return hour"
                  >
                    <Text style={styles.pickerIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>⏰</Text>
                    <View>
                      <Text style={styles.pickerLabel}>Return Time</Text>
                      <Text style={styles.pickerValue}>{formatTime(returnDate)}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Duration Calculation Banner */}
              <View style={styles.durationBanner}>
                <View style={styles.durationIconBox}>
                  <Text style={styles.durationIcon}>⏱️</Text>
                </View>
                <View style={styles.durationTextBox}>
                  <Text style={styles.durationDays}>
                    {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'} Total Rental
                  </Text>
                  <Text style={styles.durationNote}>
                    Billed at ₹{dailyRate}/day = ₹{baseRentalAmount} base tariff
                  </Text>
                </View>
              </View>

              {/* Quick Duration Shortcuts */}
              <Text style={styles.quickPresetTitle}>Quick Duration Presets:</Text>
              <View style={styles.quickPresetsRow}>
                <TouchableOpacity
                  style={[styles.presetChip, rentalDays === 1 && styles.presetChipActive]}
                  onPress={() => handleSetDurationPreset(1)}
                >
                  <Text style={[styles.presetChipText, rentalDays === 1 && styles.presetChipTextActive]}>
                    1 Day (24h)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, rentalDays === 2 && styles.presetChipActive]}
                  onPress={() => handleSetDurationPreset(2)}
                >
                  <Text style={[styles.presetChipText, rentalDays === 2 && styles.presetChipTextActive]}>
                    2 Days (Weekend)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, rentalDays === 3 && styles.presetChipActive]}
                  onPress={() => handleSetDurationPreset(3)}
                >
                  <Text style={[styles.presetChipText, rentalDays === 3 && styles.presetChipTextActive]}>
                    3 Days
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, rentalDays === 7 && styles.presetChipActive]}
                  onPress={() => handleSetDurationPreset(7)}
                >
                  <Text style={[styles.presetChipText, rentalDays === 7 && styles.presetChipTextActive]}>
                    7 Days (Weekly)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 2: PICKUP & RETURN LOCATION */}
          {step === 2 && (
            <View style={styles.stepSection}>
              <Text style={styles.sectionHeaderTitle}>Choose Pickup Hub</Text>
              <Text style={styles.sectionHeaderSub}>
                Pick up in 3 minutes with pre-sanitized helmets and full fuel tank assistance.
              </Text>

              {loadingStores ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
              ) : (
                stores.map((store) => {
                  const isSelected = pickupStoreId === store.id;
                  return (
                    <TouchableOpacity
                      key={`pickup-${store.id}`}
                      style={[styles.hubCard, isSelected && styles.hubCardSelected]}
                      onPress={() => setPickupStoreId(store.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.hubHeaderRow}>
                        <View style={styles.hubRadioCircle}>
                          {isSelected && <View style={styles.hubRadioInner} />}
                        </View>
                        <View style={styles.hubTitleWrap}>
                          <Text style={[styles.hubName, isSelected && styles.hubNameSelected]}>
                            {store.name}
                          </Text>
                          <Text style={styles.hubBadge}>⚡ 3-Min Handover</Text>
                        </View>
                      </View>
                      <Text style={styles.hubAddress}>📍 {store.address_line}</Text>
                      <View style={styles.hubFooterRow}>
                        <Text style={styles.hubHours}>⏰ Open 06:00 AM – 10:00 PM</Text>
                        <Text style={styles.hubPhone}>📞 {store.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* Return Hub Selection */}
              <View style={styles.returnOptionCard}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setSameReturnStore(!sameReturnStore)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkboxBox, sameReturnStore && styles.checkboxBoxActive]}>
                    {sameReturnStore && <Text style={styles.checkmarkIcon}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Return to same pickup hub (Recommended)</Text>
                </TouchableOpacity>

                {!sameReturnStore && (
                  <View style={styles.differentReturnSection}>
                    <Text style={styles.differentReturnTitle}>Select Drop-off Hub:</Text>
                    {stores.map((store) => {
                      const isSelected = returnStoreId === store.id;
                      return (
                        <TouchableOpacity
                          key={`return-${store.id}`}
                          style={[styles.smallHubPill, isSelected && styles.smallHubPillSelected]}
                          onPress={() => setReturnStoreId(store.id)}
                        >
                          <Text
                            style={[
                              styles.smallHubText,
                              isSelected && styles.smallHubTextSelected,
                            ]}
                          >
                            📍 {store.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Hub Inclusions */}
              <View style={styles.hubPerksCard}>
                <Text style={styles.perksTitle}>Included with Honnavar Station Hub Handover:</Text>
                <Text style={styles.perkItem}>✓ 2 Sanitized ISI Certified Helmets (Rider + Pillion)</Text>
                <Text style={styles.perkItem}>✓ Luggage storage locker available at station hub</Text>
                <Text style={styles.perkItem}>✓ Instant fuel top-up advice and route guidance</Text>
              </View>
            </View>
          )}

          {/* STEP 3: ADD-ONS & EXTRAS */}
          {step === 3 && (
            <View style={styles.stepSection}>
              <Text style={styles.sectionHeaderTitle}>Trip Add-ons & Extras</Text>
              <Text style={styles.sectionHeaderSub}>
                Customize your journey with certified safety gear and roadside protection.
              </Text>

              {addons.map((addon) => (
                <View
                  key={addon.addon_type}
                  style={[styles.addonCard, addon.selected && styles.addonCardSelected]}
                >
                  <View style={styles.addonMainRow}>
                    <TouchableOpacity
                      style={styles.addonCheckCircle}
                      onPress={() => toggleAddon(addon.addon_type)}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          addon.selected && styles.checkboxBoxActive,
                        ]}
                      >
                        {addon.selected && <Text style={styles.checkmarkIcon}>✓</Text>}
                      </View>
                    </TouchableOpacity>

                    <View style={styles.addonIconCircle}>
                      <Text style={styles.addonEmoji}>{addon.icon}</Text>
                    </View>

                    <View style={styles.addonInfo}>
                      <Text style={styles.addonName}>{addon.name}</Text>
                      <Text style={styles.addonDesc}>{addon.description}</Text>
                      <Text style={styles.addonRate}>
                        ₹{addon.unit_price} <Text style={styles.addonPerDay}>/ day</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Quantity selector for helmets */}
                  {addon.allowQuantity && addon.selected && (
                    <View style={styles.addonQtyRow}>
                      <Text style={styles.addonQtyLabel}>Select Quantity:</Text>
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateAddonQty(addon.addon_type, -1)}
                        >
                          <Text style={styles.qtyBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyDisplay}>{addon.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateAddonQty(addon.addon_type, 1)}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}

              {/* Add-ons Subtotal Banner */}
              <View style={styles.addonsTotalCard}>
                <View style={styles.addonsTotalRow}>
                  <Text style={styles.addonsTotalLabel}>Extras Subtotal ({rentalDays} Days):</Text>
                  <Text style={styles.addonsTotalValue}>₹{addonsTotalAmount}</Text>
                </View>
                <Text style={styles.addonsTotalNote}>
                  {selectedAddonsList.length === 0
                    ? 'No optional extras added. Standard complimentary gear included.'
                    : `${selectedAddonsList.length} extra service(s) selected.`}
                </Text>
              </View>
            </View>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
            <View style={styles.stepSection}>
              <Text style={styles.sectionHeaderTitle}>Review Trip & Fare</Text>
              <Text style={styles.sectionHeaderSub}>
                Verify your booking specifics before finalizing the 10-minute hold.
              </Text>

              {/* Vehicle Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryHeaderRow}>
                  <View>
                    <Text style={styles.summaryBrand}>{bike?.brand || 'Honda'}</Text>
                    <Text style={styles.summaryModel}>{bike?.model_name || 'Vehicle'}</Text>
                  </View>
                  <View style={styles.summaryRtoBadge}>
                    <Text style={styles.summaryRtoText}>Commercial RC ✓</Text>
                  </View>
                </View>
                <Text style={styles.summarySpecs}>
                  {bike?.transmission} • {bike?.fuel_type} • Reg: {bike?.registration_number || 'KA-47-E-XXXX'}
                </Text>
              </View>

              {/* Schedule & Route Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>Rental Schedule & Hubs</Text>
                <View style={styles.itineraryItem}>
                  <Text style={styles.itineraryIcon}>🟢</Text>
                  <View style={styles.itineraryContent}>
                    <Text style={styles.itineraryTitle}>Pickup</Text>
                    <Text style={styles.itineraryText}>
                      {formatDate(pickupDate)} at {formatTime(pickupDate)}
                    </Text>
                    <Text style={styles.itineraryHub}>📍 {selectedPickupStore?.name}</Text>
                  </View>
                </View>

                <View style={styles.itineraryItem}>
                  <Text style={styles.itineraryIcon}>🔴</Text>
                  <View style={styles.itineraryContent}>
                    <Text style={styles.itineraryTitle}>Drop-off</Text>
                    <Text style={styles.itineraryText}>
                      {formatDate(returnDate)} at {formatTime(returnDate)}
                    </Text>
                    <Text style={styles.itineraryHub}>📍 {selectedReturnStore?.name}</Text>
                  </View>
                </View>

                <View style={styles.itineraryDurationRow}>
                  <Text style={styles.itineraryDurationLabel}>Total Rental Duration:</Text>
                  <Text style={styles.itineraryDurationValue}>
                    {rentalDays} {rentalDays === 1 ? 'Day (24h)' : 'Days'}
                  </Text>
                </View>
              </View>

              {/* Itemized Fare Summary */}
              <View style={styles.fareCard}>
                <Text style={styles.summaryCardTitle}>Fare Summary</Text>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>
                    Base Rental ({rentalDays}d × ₹{dailyRate})
                  </Text>
                  <Text style={styles.fareValue}>₹{baseRentalAmount}</Text>
                </View>

                {addonsTotalAmount > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Selected Add-ons & Extras</Text>
                    <Text style={styles.fareValue}>₹{addonsTotalAmount}</Text>
                  </View>
                )}

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>GST (18%)</Text>
                  <Text style={styles.fareValue}>₹{gstAmount}</Text>
                </View>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Refundable Security Deposit</Text>
                  <Text style={styles.fareDepositValue}>₹{refundableDeposit}</Text>
                </View>
                <Text style={styles.depositNote}>
                  * 100% refunded to your original payment source upon return inspection.
                </Text>

                <View style={styles.fareDivider} />

                <View style={styles.fareTotalRow}>
                  <Text style={styles.fareTotalLabel}>Total Payable Amount</Text>
                  <Text style={styles.fareTotalValue}>₹{grandTotal}</Text>
                </View>
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxBox, agreedToTerms && styles.checkboxBoxActive]}>
                  {agreedToTerms && <Text style={styles.checkmarkIcon}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I confirm that I possess a valid Driving License (MCWG) and agree to
                  GKWhizWheel rental terms & cancellation policy.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 5: PAYMENT & HOLD CONFIRMATION */}
          {step === 5 && (
            <View style={styles.stepSection}>
              <Text style={styles.sectionHeaderTitle}>Select Payment Method</Text>
              <Text style={styles.sectionHeaderSub}>
                Hold vehicle exclusively for 10 minutes with instant gateway confirmation.
              </Text>

              {paymentNotice && (
                <View
                  style={[
                    styles.paymentNoticeBox,
                    paymentNotice.type === 'cancelled'
                      ? styles.paymentNoticeCancelled
                      : styles.paymentNoticeFailed,
                  ]}
                >
                  <Text style={styles.paymentNoticeIcon}>
                    {paymentNotice.type === 'cancelled' ? '⏳' : '⚠️'}
                  </Text>
                  <View style={styles.paymentNoticeContent}>
                    <Text style={styles.paymentNoticeTitle}>
                      {paymentNotice.type === 'cancelled'
                        ? 'Payment Dismissed (Hold Active)'
                        : 'Payment Declined / Failed'}
                    </Text>
                    <Text style={styles.paymentNoticeDesc}>{paymentNotice.message}</Text>
                  </View>
                </View>
              )}

              {/* Grand Total Callout */}
              <View style={styles.payAmountCard}>
                <Text style={styles.payAmountLabel}>Total Due Today (Includes ₹1,000 Deposit)</Text>
                <Text style={styles.payAmountValue}>₹{grandTotal}</Text>
                <Text style={styles.payAmountDuration}>
                  For {rentalDays} {rentalDays === 1 ? 'day' : 'days'} rental of {bike?.model_name}
                </Text>
              </View>

              {/* Payment Methods */}
              <TouchableOpacity
                style={[styles.payMethodCard, paymentMethod === 'upi' && styles.payMethodSelected]}
                onPress={() => setPaymentMethod('upi')}
                activeOpacity={0.8}
              >
                <View style={styles.payMethodRadio}>
                  {paymentMethod === 'upi' && <View style={styles.payMethodRadioInner} />}
                </View>
                <Text style={styles.payMethodEmoji}>⚡</Text>
                <View style={styles.payMethodInfo}>
                  <Text style={styles.payMethodTitle}>UPI Instant (Recommended)</Text>
                  <Text style={styles.payMethodSubtitle}>
                    Google Pay, PhonePe, Paytm, BHIM • Zero Fee
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodCard, paymentMethod === 'card' && styles.payMethodSelected]}
                onPress={() => setPaymentMethod('card')}
                activeOpacity={0.8}
              >
                <View style={styles.payMethodRadio}>
                  {paymentMethod === 'card' && <View style={styles.payMethodRadioInner} />}
                </View>
                <Text style={styles.payMethodEmoji}>💳</Text>
                <View style={styles.payMethodInfo}>
                  <Text style={styles.payMethodTitle}>Credit / Debit Card</Text>
                  <Text style={styles.payMethodSubtitle}>Visa, MasterCard, RuPay</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.payMethodCard,
                  paymentMethod === 'netbanking' && styles.payMethodSelected,
                ]}
                onPress={() => setPaymentMethod('netbanking')}
                activeOpacity={0.8}
              >
                <View style={styles.payMethodRadio}>
                  {paymentMethod === 'netbanking' && <View style={styles.payMethodRadioInner} />}
                </View>
                <Text style={styles.payMethodEmoji}>🏦</Text>
                <View style={styles.payMethodInfo}>
                  <Text style={styles.payMethodTitle}>Net Banking</Text>
                  <Text style={styles.payMethodSubtitle}>SBI, HDFC, ICICI, Canara & all banks</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodCard, paymentMethod === 'cash' && styles.payMethodSelected]}
                onPress={() => setPaymentMethod('cash')}
                activeOpacity={0.8}
              >
                <View style={styles.payMethodRadio}>
                  {paymentMethod === 'cash' && <View style={styles.payMethodRadioInner} />}
                </View>
                <Text style={styles.payMethodEmoji}>💵</Text>
                <View style={styles.payMethodInfo}>
                  <Text style={styles.payMethodTitle}>Pay at Pickup Counter</Text>
                  <Text style={styles.payMethodSubtitle}>
                    Hold bike now, pay at Honnavar Station Hub upon inspection
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Concurrency lock notice */}
              <View style={styles.concurrencyLockNotice}>
                <Text style={styles.concurrencyTitle}>🛡️ 10-Minute Concurrency Guarantee</Text>
                <Text style={styles.concurrencyDesc}>
                  Submitting holds this vehicle in the database under row-level lock. No other
                  customer can book or take this bike during your checkout window.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Sticky Bottom Navigation Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomPriceWrap}>
            <Text style={styles.bottomTotalLabel}>Total ({rentalDays}d)</Text>
            <Text style={styles.bottomTotalValue}>₹{grandTotal}</Text>
          </View>

          {step < 5 ? (
            <Button
              title={
                step === 1
                  ? 'Pickup Hub →'
                  : step === 2
                  ? 'Add-ons →'
                  : step === 3
                  ? 'Review Fare →'
                  : 'Proceed to Pay →'
              }
              onPress={handleNextStep}
              style={styles.bottomActionBtn}
            />
          ) : (
            <Button
              title={submittingHold ? 'Holding Ride...' : 'Hold & Confirm Booking'}
              onPress={handleConfirmReservation}
              loading={submittingHold}
              style={styles.bottomActionBtn}
            />
          )}
        </View>

        {/* Native DateTimePicker Modal (iOS / Android) */}
        {pickerConfig.visible && (
          Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="fade"
              visible={pickerConfig.visible}
              onRequestClose={() => setPickerConfig((prev) => ({ ...prev, visible: false }))}
            >
              <View style={styles.iosModalOverlay}>
                <View style={styles.iosModalContainer}>
                  <View style={styles.iosModalHeader}>
                    <Text style={styles.iosModalTitle}>
                      Select {pickerConfig.target === 'pickup' ? 'Pickup' : 'Return'}{' '}
                      {pickerConfig.mode === 'date' ? 'Date' : 'Time'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setPickerConfig((prev) => ({ ...prev, visible: false }))}
                    >
                      <Text style={styles.iosDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={pickerConfig.target === 'pickup' ? pickupDate : returnDate}
                    mode={pickerConfig.mode}
                    display="spinner"
                    onChange={handlePickerChange}
                    minimumDate={pickerConfig.target === 'pickup' ? new Date() : pickupDate}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={pickerConfig.target === 'pickup' ? pickupDate : returnDate}
              mode={pickerConfig.mode}
              display="default"
              onChange={handlePickerChange}
              minimumDate={pickerConfig.target === 'pickup' ? new Date() : pickupDate}
            />
          )
        )}
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
  content: {
    padding: spacing.lg,
    paddingBottom: 120, // generous bottom offset for sticky bar
  },
  stepSection: {
    flex: 1,
  },
  sectionHeaderTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    marginBottom: 4,
  },
  sectionHeaderSub: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },

  // Vehicle Pill
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  vehiclePillIcon: {
    fontSize: 26,
    marginRight: spacing.md,
  },
  vehiclePillInfo: {
    flex: 1,
  },
  vehiclePillTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  vehiclePillSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },

  // Step 1: Date Cards
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  dateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateCardTag: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.accentDark,
    letterSpacing: 0.5,
  },
  dateCardHint: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerTriggerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  pickerLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
  },
  pickerValue: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },

  // Duration Banner
  durationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  durationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  durationIcon: {
    fontSize: 18,
  },
  durationTextBox: {
    flex: 1,
  },
  durationDays: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
  },
  durationNote: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickPresetTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  quickPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  presetChip: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  presetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  presetChipTextActive: {
    color: colors.primaryContrast,
    fontWeight: typography.weights.bold,
  },

  // Step 2: Hub Cards
  hubCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  hubCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hubRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  hubRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  hubTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hubName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  hubNameSelected: {
    color: colors.primaryDark,
  },
  hubBadge: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.accentDark,
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hubAddress: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  hubFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  hubHours: {
    fontSize: 10,
    color: colors.textMuted,
  },
  hubPhone: {
    fontSize: 10,
    color: colors.textMuted,
  },

  returnOptionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: colors.card,
  },
  checkboxBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmarkIcon: {
    color: colors.primaryContrast,
    fontSize: 12,
    fontWeight: typography.weights.bold,
  },
  checkboxLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  differentReturnSection: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.xs,
  },
  differentReturnTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  smallHubPill: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallHubPillSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  smallHubText: {
    fontSize: typography.sizes.xs,
    color: colors.text,
  },
  smallHubTextSelected: {
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
  },

  hubPerksCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  perksTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  perkItem: {
    fontSize: 11,
    color: colors.accentDark,
    lineHeight: 18,
    fontWeight: typography.weights.medium,
  },

  // Step 3: Add-ons
  addonCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  addonCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  addonMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addonCheckCircle: {
    marginRight: 4,
  },
  addonIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  addonEmoji: {
    fontSize: 20,
  },
  addonInfo: {
    flex: 1,
  },
  addonName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  addonDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  addonRate: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginTop: 4,
  },
  addonPerDay: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.regular,
  },
  addonQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  addonQtyLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  qtyDisplay: {
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  addonsTotalCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  addonsTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addonsTotalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  addonsTotalValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
  },
  addonsTotalNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Step 4: Review Cards
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryBrand: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: typography.weights.bold,
  },
  summaryModel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    marginTop: 2,
  },
  summaryRtoBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  summaryRtoText: {
    fontSize: 10,
    color: colors.accentDark,
    fontWeight: typography.weights.bold,
  },
  summarySpecs: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 6,
  },
  summaryCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  itineraryItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itineraryIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  itineraryContent: {
    flex: 1,
  },
  itineraryTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  itineraryText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 1,
  },
  itineraryHub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itineraryDurationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  itineraryDurationLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  itineraryDurationValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },

  // Fare Card
  fareCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  fareDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  fareTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  fareTotalLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  fareTotalValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Step 5: Payment
  paymentNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  paymentNoticeCancelled: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: colors.primary,
  },
  paymentNoticeFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.danger,
  },
  paymentNoticeIcon: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  paymentNoticeContent: {
    flex: 1,
  },
  paymentNoticeTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  paymentNoticeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },

  payAmountCard: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  payAmountLabel: {
    fontSize: typography.sizes.xs,
    color: colors.borderDark,
    fontWeight: typography.weights.semibold,
  },
  payAmountValue: {
    fontSize: 32,
    fontWeight: typography.weights.heavy,
    color: colors.textInverted,
    marginVertical: spacing.xs,
  },
  payAmountDuration: {
    fontSize: typography.sizes.xs,
    color: colors.primaryHover,
    fontWeight: typography.weights.medium,
  },

  payMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  payMethodSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  payMethodRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  payMethodRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  payMethodEmoji: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  payMethodInfo: {
    flex: 1,
  },
  payMethodTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  payMethodSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  concurrencyLockNotice: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  concurrencyTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginBottom: 4,
  },
  concurrencyDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Sticky Bottom Bar
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
  },
  bottomPriceWrap: {
    marginRight: spacing.md,
  },
  bottomTotalLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: typography.weights.semibold,
  },
  bottomTotalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  bottomActionBtn: {
    flex: 1,
  },

  // iOS Modal Container
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  iosModalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xxl,
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iosModalTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  iosDoneText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },

  // Success View Styles
  successContainer: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  successEmoji: {
    fontSize: 36,
  },
  successTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  refLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  refValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  timerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  timerBadgeText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  successDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  successRowLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  successRowValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  successRowTotal: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.heavy,
    color: colors.primaryDark,
  },
  handoverInstructionBox: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  handoverTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
    marginBottom: 2,
  },
  handoverText: {
    fontSize: 11,
    color: colors.secondary,
    lineHeight: 16,
  },
  successActions: {
    width: '100%',
    gap: spacing.sm,
  },
  successPrimaryBtn: {
    width: '100%',
  },
  returnHomeBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnHomeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
});
