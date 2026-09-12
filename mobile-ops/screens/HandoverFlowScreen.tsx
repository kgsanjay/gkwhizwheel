import React, { useState, useRef } from 'react';
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
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius, touchTargets } from '../theme';
import { Header, Button, Card } from '../components';
import { opsApi } from '../api/client';
import { OpsBooking } from '../api/types';

type HandoverRouteProp = RouteProp<RootStackParamList, 'HandoverFlow'>;

export const HandoverFlowScreen: React.FC = () => {
  const route = useRoute<HandoverRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bookingId = route.params?.bookingId;

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Checklist
  const [odometer, setOdometer] = useState<string>('');
  const [fuel, setFuel] = useState<string>('');
  const [helmets, setHelmets] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  
  // Custom checklist items
  const [damageChecked, setDamageChecked] = useState(false);
  const [documentsHanded, setDocumentsHanded] = useState(false);

  // Step 2: Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Step 3: Signature
  const [signature, setSignature] = useState<string | null>(null);
  const signatureRef = useRef<SignatureViewRef>(null);

  if (!bookingId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Error" onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No Booking ID provided.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleNext = () => {
    if (step === 1) {
      if (!odometer || !fuel) {
        Alert.alert('Validation Error', 'Odometer and Fuel level are required.');
        return;
      }
      if (!damageChecked || !documentsHanded) {
        Alert.alert('Incomplete Checklist', 'Please ensure all checklist items are verified before proceeding.');
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
      Alert.alert('Permission Denied', 'Camera access is required to take condition photos.');
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
        setPhotos([...photos, `data:image/jpeg;base64,${asset.base64}`]);
      } else {
        setPhotos([...photos, asset.uri]);
      }
    }
  };

  const handleSignature = (sig: string) => {
    setSignature(sig);
    setStep(4);
  };

  const handleClearSignature = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirmSignature = () => {
    signatureRef.current?.readSignature();
  };

  const submitHandover = async () => {
    setLoading(true);
    try {
      await opsApi.handoverBike(bookingId, {
        odometer_start: parseInt(odometer, 10),
        fuel_start: parseInt(fuel, 10),
        helmets_provided: parseInt(helmets, 10),
        notes: notes,
        photos: photos,
        signature: signature || undefined,
      });
      Alert.alert('Success', 'Bike handover completed successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Dashboard' }) }
      ]);
    } catch (err: any) {
      console.error('Handover Error:', err);
      Alert.alert('Error', err.message || 'Failed to complete handover.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title={`Handover (Step ${step}/4)`} onBack={handleBack} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Condition & Checklist</Text>
            
            <Card style={styles.formCard}>
              <Text style={styles.label}>Odometer Start (km)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={odometer}
                onChangeText={setOdometer}
                placeholder="e.g. 15400"
              />

              <Text style={styles.label}>Fuel Level (%)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={fuel}
                onChangeText={setFuel}
                placeholder="e.g. 100"
              />

              <Text style={styles.label}>Helmets Provided</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={helmets}
                onChangeText={setHelmets}
              />
              
              <Text style={styles.label}>Handover Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholder="Any existing scratches, issues?"
              />
            </Card>

            <Card style={styles.formCard}>
              <Text style={styles.label}>Verification Checklist</Text>
              
              <TouchableOpacity 
                style={styles.checkItem}
                onPress={() => setDamageChecked(!damageChecked)}
              >
                <View style={[styles.checkbox, damageChecked && styles.checkboxActive]} />
                <Text style={styles.checkText}>Vehicle damage checked with customer?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.checkItem}
                onPress={() => setDocumentsHanded(!documentsHanded)}
              >
                <View style={[styles.checkbox, documentsHanded && styles.checkboxActive]} />
                <Text style={styles.checkText}>Original documents handed over / verified?</Text>
              </TouchableOpacity>
            </Card>

            <Button title="Next: Photos" onPress={handleNext} style={styles.actionBtn} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Condition Photos</Text>
            <Text style={styles.stepSubtitle}>Take clear photos of the vehicle (front, sides, back, fuel gauge).</Text>
            
            <View style={styles.photoGrid}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoWrapper}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                </View>
              ))}
              <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
                <Text style={styles.addPhotoIcon}>+</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            </View>

            <Button title={`Next: Customer Signature (${photos.length} photos)`} onPress={handleNext} style={styles.actionBtn} />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Customer Signature</Text>
            <Text style={styles.stepSubtitle}>Customer must sign to acknowledge the vehicle condition and terms.</Text>
            
            <View style={styles.signatureContainer}>
              <SignatureScreen
                ref={signatureRef}
                onOK={handleSignature}
                onEmpty={() => Alert.alert('Error', 'Please provide a signature.')}
                descriptionText="Sign Here"
                clearText="Clear"
                confirmText="Save"
                webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
              />
            </View>
            <View style={styles.signatureActions}>
              <Button title="Clear" variant="secondary" onPress={handleClearSignature} style={{flex: 1, marginRight: spacing.sm}} />
              <Button title="Save Signature" onPress={handleConfirmSignature} style={{flex: 1, marginLeft: spacing.sm}} />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Final Review & Dispatch</Text>
            
            <Card style={styles.formCard}>
              <Text style={styles.summaryText}>Booking ID: {bookingId}</Text>
              <Text style={styles.summaryText}>Odometer: {odometer} km</Text>
              <Text style={styles.summaryText}>Fuel Level: {fuel}%</Text>
              <Text style={styles.summaryText}>Helmets: {helmets}</Text>
              <Text style={styles.summaryText}>Photos Taken: {photos.length}</Text>
              <Text style={styles.summaryText}>Signature Collected: {signature ? 'Yes' : 'No'}</Text>
            </Card>

            <Button 
              title="Complete Handover & Dispatch" 
              onPress={submitHandover} 
              loading={loading}
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
  errorText: { color: colors.danger, fontSize: typography.sizes.md },
  
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.heavy, color: colors.text, marginBottom: spacing.sm },
  stepSubtitle: { fontSize: typography.sizes.md, color: colors.textSecondary, marginBottom: spacing.lg },
  
  formCard: { marginBottom: spacing.lg, padding: spacing.md },
  label: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
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

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  photoWrapper: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  addPhotoBtn: {
    width: '45%',
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

  signatureContainer: {
    height: 300,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actionBtn: {
    marginTop: spacing.xl,
  },
});
