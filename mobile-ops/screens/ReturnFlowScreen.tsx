import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius, touchTargets } from '../theme';
import { Header, Button, Card } from '../components';
import { opsApi } from '../api/client';
import { OpsBooking } from '../api/types';

type ReturnRouteProp = RouteProp<RootStackParamList, 'ReturnFlow'>;

export const ReturnFlowScreen: React.FC = () => {
  const route = useRoute<ReturnRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bookingId = route.params?.bookingId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<OpsBooking | null>(null);
  
  const [step, setStep] = useState<number>(1);

  // Step 1: Condition
  const [odometer, setOdometer] = useState<string>('');
  const [fuel, setFuel] = useState<string>('');
  const [helmets, setHelmets] = useState<string>('');
  
  // Handover Photos vs Return Photos
  const [returnPhotos, setReturnPhotos] = useState<string[]>([]);
  
  // Step 2: Damages & Charges
  const [hasDamages, setHasDamages] = useState(false);
  const [damageNotes, setDamageNotes] = useState<string>('');
  const [extraCharges, setExtraCharges] = useState<string>('0');

  useEffect(() => {
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      const data = await opsApi.getBookingById(bookingId!);
      setBooking(data);
      if (data) {
        setOdometer(data.odometer_start ? String(data.odometer_start) : '');
        setFuel(data.fuel_start ? String(data.fuel_start) : '');
        setHelmets(data.helmets_provided ? String(data.helmets_provided) : '1');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load booking details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (!bookingId || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Return Flow" onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const handleNext = () => {
    if (step === 1) {
      if (!odometer || !fuel || !helmets) {
        Alert.alert('Validation Error', 'Odometer, Fuel level, and Helmets are required.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        setReturnPhotos([...returnPhotos, `data:image/jpeg;base64,${asset.base64}`]);
      } else {
        setReturnPhotos([...returnPhotos, asset.uri]);
      }
    }
  };

  const submitReturn = async () => {
    setSubmitting(true);
    try {
      await opsApi.returnBike(bookingId, {
        odometer_end: parseInt(odometer, 10),
        fuel_end: parseInt(fuel, 10),
        helmets_returned: parseInt(helmets, 10),
        damage_notes: hasDamages ? damageNotes : undefined,
        extra_charges: parseFloat(extraCharges || '0'),
        return_photos: returnPhotos,
      });
      Alert.alert('Success', 'Bike return completed successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Dashboard' }) }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete return.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateSettlement = () => {
    if (!booking) return 0;
    const extra = parseFloat(extraCharges || '0');
    // Outstanding = Total - Paid + Extra Charges
    return (booking.total_amount || 0) - (booking.paid_amount || 0) + extra;
  };

  const settlementAmount = calculateSettlement();
  const handoverPhotos = booking?.handover_photos || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={`Return (Step ${step}/3)`} onBack={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Step 1: Condition & Photo Comparison */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Condition Check</Text>
            
            <Card style={styles.formCard}>
              <Text style={styles.label}>Odometer End (km)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={odometer}
                onChangeText={setOdometer}
                placeholder="e.g. 15450"
              />
              {booking?.odometer_start !== undefined && (
                <Text style={styles.helperText}>Handover was: {booking.odometer_start} km</Text>
              )}

              <Text style={styles.label}>Fuel Level End (%)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={fuel}
                onChangeText={setFuel}
                placeholder="e.g. 80"
              />
              {booking?.fuel_start !== undefined && (
                <Text style={styles.helperText}>Handover was: {booking.fuel_start}%</Text>
              )}

              <Text style={styles.label}>Helmets Returned</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={helmets}
                onChangeText={setHelmets}
              />
              {booking?.helmets_provided !== undefined && (
                <Text style={styles.helperText}>Handover was: {booking.helmets_provided}</Text>
              )}
            </Card>

            <Text style={styles.sectionTitle}>Photo Comparison</Text>
            <Text style={styles.helperText}>Compare current condition with handover photos.</Text>
            
            <View style={styles.comparisonGrid}>
              <View style={styles.comparisonColumn}>
                <Text style={styles.columnTitle}>Handover</Text>
                {handoverPhotos.length > 0 ? (
                  handoverPhotos.map((uri, idx) => (
                    <Image key={`h_${idx}`} source={{ uri }} style={styles.photoThumbLarge} />
                  ))
                ) : (
                  <View style={styles.noPhotoBox}>
                    <Text style={styles.noPhotoText}>No Photos</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.comparisonColumn}>
                <Text style={styles.columnTitle}>Return</Text>
                {returnPhotos.map((uri, idx) => (
                  <Image key={`r_${idx}`} source={{ uri }} style={styles.photoThumbLarge} />
                ))}
                <TouchableOpacity style={styles.addPhotoBtnLarge} onPress={takePhoto}>
                  <Text style={styles.addPhotoIcon}>+</Text>
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button title="Next: Damages & Charges" onPress={handleNext} style={styles.actionBtn} />
          </View>
        )}

        {/* Step 2: Damages & Extra Charges */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Damages & Extra Charges</Text>
            
            <Card style={styles.formCard}>
              <TouchableOpacity 
                style={styles.checkItem}
                onPress={() => setHasDamages(!hasDamages)}
              >
                <View style={[styles.checkbox, hasDamages && styles.checkboxActive]} />
                <Text style={styles.checkText}>Report new damage or missing items?</Text>
              </TouchableOpacity>

              {hasDamages && (
                <>
                  <Text style={styles.label}>Damage Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    value={damageNotes}
                    onChangeText={setDamageNotes}
                    placeholder="Describe any scratches, broken parts, or missing helmets..."
                  />
                </>
              )}
            </Card>

            <Card style={styles.formCard}>
              <Text style={styles.label}>Extra Charges (₹)</Text>
              <Text style={styles.helperText}>Add charges for late return, damages, or low fuel.</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={extraCharges}
                onChangeText={setExtraCharges}
                placeholder="0"
              />
            </Card>

            <Button title="Next: Settlement Review" onPress={handleNext} style={styles.actionBtn} />
          </View>
        )}

        {/* Step 3: Settlement Review & Dispatch */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Settlement Review</Text>
            <Text style={styles.stepSubtitle}>Review the dynamically calculated settlement.</Text>
            
            <Card style={styles.settlementCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Base Total Amount:</Text>
                <Text style={styles.summaryValue}>₹{booking?.total_amount || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount Paid by Customer:</Text>
                <Text style={styles.summaryValue}>₹{booking?.paid_amount || 0}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Extra Charges Added:</Text>
                <Text style={styles.summaryValue}>₹{extraCharges || 0}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabelBold}>Final Settlement:</Text>
                <Text style={[styles.summaryValueBold, settlementAmount > 0 ? styles.positiveText : styles.negativeText]}>
                  {settlementAmount > 0 
                    ? `Collect ₹${settlementAmount}` 
                    : `Refund ₹${Math.abs(settlementAmount)}`}
                </Text>
              </View>
            </Card>

            <Button 
              title="Confirm Return" 
              onPress={submitReturn} 
              loading={submitting}
              style={styles.actionBtn} 
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.heavy, color: colors.text, marginBottom: spacing.sm },
  stepSubtitle: { fontSize: typography.sizes.md, color: colors.textSecondary, marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md },
  
  formCard: { marginBottom: spacing.lg, padding: spacing.md },
  label: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  helperText: { fontSize: typography.sizes.xs, color: colors.textMuted, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: touchTargets.min,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    flex: 1,
  },

  comparisonGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  comparisonColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  columnTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  photoThumbLarge: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  noPhotoBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  noPhotoText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  addPhotoBtnLarge: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoIcon: {
    fontSize: 40,
    color: colors.primary,
  },
  addPhotoText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  settlementCard: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  summaryLabelBold: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  summaryValueBold: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
  },
  positiveText: {
    color: colors.danger, // Collect money
  },
  negativeText: {
    color: colors.success, // Refund money
  },

  actionBtn: {
    marginTop: spacing.xl,
  },
});
