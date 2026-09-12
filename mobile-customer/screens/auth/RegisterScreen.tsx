import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../api/client';
import { ApiError } from '../../api/errors';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const clearErrors = () => {
    setFieldErrors({});
    setGeneralError(null);
  };

  const validateLocal = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Full name is required.';
    if (!email.trim() || !email.includes('@')) errors.email = 'Valid email address is required.';
    if (!phone.trim() || phone.replace(/\D/g, '').length !== 10) {
      errors.phone = 'Valid 10-digit mobile number is required.';
    }
    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (password !== passwordConfirmation) {
      errors.password_confirmation = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    clearErrors();

    if (!validateLocal()) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.authApi.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim().replace(/\D/g, ''),
        password,
        password_confirmation: passwordConfirmation,
      });

      if (res.success && res.data?.token) {
        await api.setToken(res.data.token);
        Keyboard.dismiss();
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (err: unknown) {
      const apiErr = ApiError.from(err);
      if (apiErr.isValidation) {
        const extracted: Record<string, string> = {};
        for (const [k, v] of Object.entries(apiErr.validationErrors)) {
          if (v.length > 0) extracted[k] = v[0];
        }
        setFieldErrors(extracted);
      } else {
        setGeneralError(apiErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Header
            title="Create Account"
            subtitle="Join GK WhizWheel in seconds"
            onBack={() => navigation.goBack()}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* General Error Banner */}
            {generalError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerIcon}>⚠️</Text>
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            )}

            <View style={styles.card}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={[styles.textInput, fieldErrors.name && styles.inputErrorBorder]}
                  placeholder="e.g. Rahul Hegde"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  autoCapitalize="words"
                  textContentType="name"
                  accessible={true}
                  accessibilityLabel="Full Name"
                  accessibilityHint="Enter your full legal name"
                />
                {fieldErrors.name ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">{fieldErrors.name}</Text>
                ) : null}
              </View>

              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={[styles.textInput, fieldErrors.email && styles.inputErrorBorder]}
                  placeholder="e.g. rahul@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  accessible={true}
                  accessibilityLabel="Email Address"
                  accessibilityHint="Enter your email for booking vouchers"
                />
                {fieldErrors.email ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">{fieldErrors.email}</Text>
                ) : null}
              </View>

              {/* Mobile Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone Number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCodeBadge} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.phoneInput,
                      fieldErrors.phone && styles.inputErrorBorder,
                    ]}
                    placeholder="9876543210"
                    placeholderTextColor={colors.textSecondary}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    keyboardType="phone-pad"
                    maxLength={10}
                    textContentType="telephoneNumber"
                    accessible={true}
                    accessibilityLabel="Mobile Phone Number (India +91)"
                    accessibilityHint="Enter your 10-digit mobile number"
                  />
                </View>
                {fieldErrors.phone ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">{fieldErrors.phone}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password (Min 8 characters)</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      fieldErrors.password && styles.inputErrorBorder,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="newPassword"
                    accessible={true}
                    accessibilityLabel="Password"
                    accessibilityHint="Enter at least 8 characters"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    accessibilityHint="Toggles password visibility"
                  >
                    <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {fieldErrors.password ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">{fieldErrors.password}</Text>
                ) : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    fieldErrors.password_confirmation && styles.inputErrorBorder,
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  value={passwordConfirmation}
                  onChangeText={(text) => {
                    setPasswordConfirmation(text);
                    if (fieldErrors.password_confirmation) {
                      setFieldErrors((prev) => ({ ...prev, password_confirmation: '' }));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  accessible={true}
                  accessibilityLabel="Confirm Password"
                  accessibilityHint="Re-enter your password to confirm"
                />
                {fieldErrors.password_confirmation ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">{fieldErrors.password_confirmation}</Text>
                ) : null}
              </View>

              {/* WhatsApp Opt-in Switch */}
              <View
                style={styles.switchRow}
                accessible={true}
                accessibilityRole="switch"
                accessibilityLabel="Receive booking vouchers and pickup reminders on WhatsApp"
                accessibilityState={{ checked: whatsappOptIn }}
              >
                <Switch
                  value={whatsappOptIn}
                  onValueChange={setWhatsappOptIn}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={Platform.OS === 'android' ? colors.card : undefined}
                />
                <Text style={styles.switchLabel}>
                  Receive booking vouchers & pickup reminders on WhatsApp 💬
                </Text>
              </View>

              {/* Submit CTA */}
              <Button
                title={loading ? 'Creating Account...' : 'Agree & Create Account'}
                onPress={handleRegister}
                loading={loading}
                accessibilityLabel="Agree and Create Account"
                accessibilityHint="Submits registration and creates your GK WhizWheel account"
                style={styles.submitBtn}
              />
            </View>

            {/* Bottom Login Prompt */}
            <View style={styles.footerPrompt}>
              <Text style={styles.footerPromptText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginBtnLink}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Sign In"
                accessibilityHint="Navigates to the sign in screen"
              >
                <Text style={styles.loginBtnText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.lg,
  },
  errorBannerIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.dangerText,
    fontWeight: typography.weights.medium,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  textInput: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countryCodeBadge: {
    height: 50,
    backgroundColor: colors.divider,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryCodeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingRight: 60,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.lg,
    paddingVertical: spacing.xs,
  },
  eyeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  inputErrorBorder: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  inlineError: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  switchLabel: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  submitBtn: {
    height: 50,
  },
  footerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerPromptText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  loginBtnLink: {
    paddingVertical: spacing.xs,
  },
  loginBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
});
