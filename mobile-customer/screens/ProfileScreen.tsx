import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/types';
import { User, KycDocument, SavedPaymentMethod } from '../api/types';
import { api, APP_VERSION } from '../api/client';
import { notificationService } from '../services/notificationService';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';

type KycDocType = 'driving_license' | 'national_id' | 'passport';

const DEFAULT_SAVED_PAYMENTS: SavedPaymentMethod[] = [
  {
    id: 'pay-1',
    type: 'upi',
    title: 'Google Pay / BHIM UPI',
    subtitle: 'customer@okaxis',
    icon: '⚡',
    isDefault: true,
  },
  {
    id: 'pay-2',
    type: 'upi',
    title: 'PhonePe UPI',
    subtitle: 'customer@ybl',
    icon: '📱',
    isDefault: false,
  },
  {
    id: 'pay-3',
    type: 'card',
    title: 'HDFC Bank Credit Card',
    subtitle: '•••• 4242 (Expires 12/28)',
    icon: '💳',
    isDefault: false,
  },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsappOptIn, setWhatsappOptIn] = useState<boolean>(true);

  // KYC State
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<KycDocType>('driving_license');
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [uploadingKyc, setUploadingKyc] = useState<boolean>(false);

  // Saved Payment Methods
  const [savedPayments, setSavedPayments] = useState<SavedPaymentMethod[]>(DEFAULT_SAVED_PAYMENTS);
  const [showAddUpiModal, setShowAddUpiModal] = useState<boolean>(false);
  const [newUpiId, setNewUpiId] = useState<string>('');

  const isAuthenticated = !!api.getToken();

  const loadUserData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const meRes = await api.get<any>('/auth/me');
      if (meRes.success && meRes.data?.user) {
        const u = meRes.data.user;
        setUser(u);
        setName(u.name || '');
        setPhone(u.phone || '');
        setWhatsappOptIn(u.whatsapp_opt_in ?? true);
      }

      const kycRes = await api.customerApi.getKycDocuments();
      if (kycRes.success && Array.isArray(kycRes.data)) {
        setKycDocuments(kycRes.data);
      }
    } catch {
      // Offline / guest preview fallback
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Profile Save
  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.customerApi.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        whatsapp_opt_in: whatsappOptIn,
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        Alert.alert('Profile Updated', 'Your profile details have been updated successfully.');
      } else {
        Alert.alert('Notice', res.message || 'Profile saved.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Image Picker with In-App Cropping
  const handlePickImage = async (useCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true, // In-app image cropping before upload
        aspect: [4, 3], // Standard ID / Driving License card aspect ratio
        quality: 0.85,
      };

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to photograph your ID document.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Photo library permission is required to choose your document.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPendingImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Could not open camera or gallery.');
    }
  };

  // KYC Upload
  const handleUploadKyc = async () => {
    if (!pendingImageUri) return;
    setUploadingKyc(true);
    try {
      const formData = new FormData();
      formData.append('document_type', selectedDocType);

      const filename = pendingImageUri.split('/').pop() || `kyc_${selectedDocType}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: pendingImageUri,
        name: filename,
        type: fileType,
      } as any);

      const res = await api.customerApi.uploadKycDocument(formData);
      if (res.success) {
        Alert.alert(
          'Document Uploaded! ✓',
          'Your document has been submitted for fast verification. Our team verifies credentials in 5-10 minutes.'
        );
        setPendingImageUri(null);
        loadUserData();
      } else {
        Alert.alert('Upload Failed', res.message || 'Could not upload document.');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Error submitting document.');
    } finally {
      setUploadingKyc(false);
    }
  };

  // Saved Payment Methods Handlers
  const handleAddUpi = () => {
    if (!newUpiId.trim() || !newUpiId.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI Virtual Payment Address (e.g. yourname@okaxis).');
      return;
    }
    const newMethod: SavedPaymentMethod = {
      id: `pay-${Date.now()}`,
      type: 'upi',
      title: 'Instant UPI ID',
      subtitle: newUpiId.trim().toLowerCase(),
      icon: '⚡',
      isDefault: false,
    };
    setSavedPayments((prev) => [newMethod, ...prev]);
    setNewUpiId('');
    setShowAddUpiModal(false);
    Alert.alert('UPI Added', `${newMethod.subtitle} is saved for fast 1-tap checkout.`);
  };

  const handleRemovePayment = (id: string, title: string) => {
    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSavedPayments((prev) => prev.filter((p) => p.id !== id));
          },
        },
      ]
    );
  };

  // Logout Handler
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of GK WhizWheel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/auth/logout');
            } catch {
              // ignore
            }
            // Deregister push token from user account
            await notificationService.unregisterPushTokenAsync();
            // Clear Sanctum token from secure storage
            api.setToken(null);
            setUser(null);
            Alert.alert('Signed Out', 'You have been signed out successfully.');
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account & Profile</Text>
        </View>

        <View style={styles.loginBanner}>
          <Text style={styles.bannerEmoji}>🛵</Text>
          <Text style={styles.bannerTitle}>Welcome to GK WhizWheel</Text>
          <Text style={styles.bannerSubtitle}>
            Sign in to manage your bookings, complete fast KYC document verification, and enjoy instant 3-minute station handover.
          </Text>
          <Button
            title="Sign In / Register"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginBtn}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Details & Support</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Client Version</Text>
            <Text style={styles.rowValue}>v{APP_VERSION} (Mobile Native)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>24/7 Helpline</Text>
            <Text style={styles.rowValue}>+91 94801 23456</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Station Hub</Text>
            <Text style={styles.rowValue}>Honnavar Railway Station (Platform 1)</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const kycStatus = user?.kyc_status || 'not_submitted';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Member Dashboard</Text>
        <Text style={styles.headerTitle}>Account & Profile</Text>
      </View>

      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || 'Valued Customer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'customer@gkwhizwheel.com'}</Text>
          <View style={styles.kycStatusRow}>
            <Badge
              label={
                kycStatus === 'verified'
                  ? 'KYC Verified ✓'
                  : kycStatus === 'pending'
                  ? 'Verification Pending ⏳'
                  : 'KYC Action Required ⚠️'
              }
              variant={
                kycStatus === 'verified'
                  ? 'success'
                  : kycStatus === 'pending'
                  ? 'warning'
                  : 'danger'
              }
            />
          </View>
        </View>
      </View>

      {/* Editable Profile Information Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Your full legal name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Registered Email (Account ID)</Text>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>{user?.email}</Text>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTextCol}>
            <Text style={styles.switchTitle}>WhatsApp Trip Updates</Text>
            <Text style={styles.switchSubtitle}>
              Receive booking vouchers, reminders & vehicle documents on WhatsApp
            </Text>
          </View>
          <Switch
            value={whatsappOptIn}
            onValueChange={setWhatsappOptIn}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={Platform.OS === 'android' ? colors.card : ''}
          />
        </View>

        <Button
          title={savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
          onPress={handleSaveProfile}
          loading={savingProfile}
          style={styles.saveBtn}
        />
      </View>

      {/* KYC Document Upload Center with In-App Cropping */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>KYC Document Verification</Text>
          <Text style={styles.badgeNote}>RTO Required</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Commercial two-wheeler rental requires a valid Driving License (MCWG) and Government ID.
        </Text>

        {/* Document Type Selector */}
        <View style={styles.docTypeTabs} accessible={true} accessibilityRole="tablist">
          <TouchableOpacity
            style={[
              styles.docTypeBtn,
              selectedDocType === 'driving_license' && styles.docTypeBtnActive,
            ]}
            onPress={() => setSelectedDocType('driving_license')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel="Driving License, required"
            accessibilityState={{ selected: selectedDocType === 'driving_license' }}
          >
            <Text
              style={[
                styles.docTypeText,
                selectedDocType === 'driving_license' && styles.docTypeTextActive,
              ]}
            >
              Driving License *
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.docTypeBtn,
              selectedDocType === 'national_id' && styles.docTypeBtnActive,
            ]}
            onPress={() => setSelectedDocType('national_id')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel="Aadhaar or National ID"
            accessibilityState={{ selected: selectedDocType === 'national_id' }}
          >
            <Text
              style={[
                styles.docTypeText,
                selectedDocType === 'national_id' && styles.docTypeTextActive,
              ]}
            >
              Aadhaar / ID
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.docTypeBtn,
              selectedDocType === 'passport' && styles.docTypeBtnActive,
            ]}
            onPress={() => setSelectedDocType('passport')}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="tab"
            accessibilityLabel="Passport"
            accessibilityState={{ selected: selectedDocType === 'passport' }}
          >
            <Text
              style={[
                styles.docTypeText,
                selectedDocType === 'passport' && styles.docTypeTextActive,
              ]}
            >
              Passport
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pending Image Preview or Action Triggers */}
        {pendingImageUri ? (
          <View style={styles.previewBox}>
            <Image source={{ uri: pendingImageUri }} style={styles.previewImage} />
            <Text style={styles.cropSuccessNote}>✓ Image cropped to card ratio (4:3)</Text>
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.cancelPreviewBtn}
                onPress={() => setPendingImageUri(null)}
                disabled={uploadingKyc}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Retake photo"
              >
                <Text style={styles.cancelPreviewText}>Retake</Text>
              </TouchableOpacity>
              <Button
                title={uploadingKyc ? 'Uploading...' : 'Confirm & Upload'}
                onPress={handleUploadKyc}
                loading={uploadingKyc}
                accessibilityLabel="Confirm and upload document"
                style={styles.confirmUploadBtn}
              />
            </View>
          </View>
        ) : (
          <View style={styles.pickerActionsRow}>
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => handlePickImage(true)}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Take photo with camera"
              accessibilityHint="Opens device camera to snap your ID card"
            >
              <Text style={styles.pickerBtnIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>📸</Text>
              <Text style={styles.pickerBtnTitle}>Camera</Text>
              <Text style={styles.pickerBtnSubtitle}>Crop & align card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => handlePickImage(false)}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Choose from photo gallery"
              accessibilityHint="Select an existing document photo from your device"
            >
              <Text style={styles.pickerBtnIcon} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>🖼️</Text>
              <Text style={styles.pickerBtnTitle}>Photo Gallery</Text>
              <Text style={styles.pickerBtnSubtitle}>Choose from device</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Uploaded Documents List */}
        {kycDocuments.length > 0 && (
          <View style={styles.uploadedDocsList}>
            <Text style={styles.uploadedDocsTitle}>Uploaded Documents:</Text>
            {kycDocuments.map((doc) => (
              <View key={doc.id} style={styles.uploadedDocItem}>
                <View>
                  <Text style={styles.uploadedDocName}>
                    {doc.document_type === 'driving_license'
                      ? 'Driving License'
                      : doc.document_type === 'national_id'
                      ? 'Aadhaar / National ID'
                      : 'Passport'}
                  </Text>
                  <Text style={styles.uploadedDocDate}>
                    Submitted on{' '}
                    {doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString('en-IN')
                      : 'Recently'}
                  </Text>
                </View>
                <Badge
                  label={doc.verified ? 'Verified ✓' : 'Under Review ⏳'}
                  variant={doc.verified ? 'success' : 'warning'}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Saved Payment Methods */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle} accessible={true} accessibilityRole="header">Saved Payment Methods</Text>
          <TouchableOpacity
            onPress={() => setShowAddUpiModal(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add new UPI ID"
          >
            <Text style={styles.addPaymentLink}>+ Add UPI</Text>
          </TouchableOpacity>
        </View>

        {savedPayments.map((method) => (
          <View key={method.id} style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodLeft}>
              <View style={styles.paymentMethodIconWrap}>
                <Text style={styles.paymentMethodEmoji}>{method.icon}</Text>
              </View>
              <View>
                <Text style={styles.paymentMethodTitle}>{method.title}</Text>
                <Text style={styles.paymentMethodSubtitle}>{method.subtitle}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deletePaymentBtn}
              onPress={() => handleRemovePayment(method.id, method.title)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Remove payment method ${method.title}, ${method.subtitle}`}
            >
              <Text style={styles.deletePaymentText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* App & Version Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessible={true} accessibilityRole="header">App Details & 24/7 Helpline</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Client Version</Text>
          <Text style={styles.rowValue}>v{APP_VERSION} (Mobile Native)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Helpline & Rescue</Text>
          <Text style={styles.rowValue}>+91 94801 23456</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Store Location</Text>
          <Text style={styles.rowValue}>Honnavar Railway Station Hub</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <Button
        title="Sign Out of Account"
        variant="outline"
        onPress={handleLogout}
        accessibilityLabel="Sign Out of GK WhizWheel account"
        style={styles.logoutBtn}
      />

      {/* Add UPI Modal */}
      <Modal
        visible={showAddUpiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddUpiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle} accessible={true} accessibilityRole="header">Save Fast UPI Handle</Text>
            <Text style={styles.modalSubtitle}>
              Enter your UPI ID (VPA) for seamless 1-tap checkout on future rentals.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. yourname@okaxis or yourname@ybl"
              placeholderTextColor={colors.textSecondary}
              value={newUpiId}
              onChangeText={setNewUpiId}
              autoCapitalize="none"
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="UPI ID input"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddUpiModal(false)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cancel adding UPI"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Button
                title="Save UPI ID"
                onPress={handleAddUpi}
                accessibilityLabel="Save UPI ID"
                style={styles.modalSaveBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.md,
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

  // User Header Card
  userCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.primaryContrast,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userEmail: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  kycStatusRow: {
    marginTop: 6,
    flexDirection: 'row',
  },

  // Sections
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeNote: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  sectionDescription: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },

  // Form Inputs
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    height: 46,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  readOnlyInput: {
    height: 46,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  lockIcon: {
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  switchTextCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  switchSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: spacing.xs,
  },

  // KYC Center
  docTypeTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  docTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  docTypeBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  docTypeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  docTypeTextActive: {
    color: colors.textInverted,
  },
  pickerActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.md,
    alignItems: 'center',
  },
  pickerBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  pickerBtnTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  pickerBtnSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  previewBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.sm,
    resizeMode: 'cover',
  },
  cropSuccessNote: {
    fontSize: 11,
    color: colors.accentDark,
    fontWeight: typography.weights.bold,
    marginTop: 6,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  cancelPreviewBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  cancelPreviewText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.danger,
  },
  confirmUploadBtn: {
    flex: 1,
  },
  uploadedDocsList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  uploadedDocsTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  uploadedDocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  uploadedDocName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  uploadedDocDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // Saved Payments
  addPaymentLink: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paymentMethodEmoji: {
    fontSize: 18,
  },
  paymentMethodTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  paymentMethodSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  deletePaymentBtn: {
    padding: spacing.sm,
  },
  deletePaymentText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  // App Details Rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },

  // Logout
  logoutBtn: {
    marginTop: spacing.md,
  },

  // Unauthenticated Banner
  loginBanner: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  bannerEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  bannerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  loginBtn: {
    width: '100%',
  },

  // Add UPI Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.modal,
  },
  modalTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  modalInput: {
    height: 48,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  modalCancelText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    minWidth: 120,
  },
});
