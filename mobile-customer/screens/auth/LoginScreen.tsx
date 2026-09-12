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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../api/client';
import { ApiError } from '../../api/errors';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Mode: 'password' or 'otp'
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');

  // Form Fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const clearErrors = () => {
    setFieldErrors({});
    setGeneralError(null);
  };

  const handlePasswordLogin = async () => {
    clearErrors();

    const errors: Record<string, string> = {};
    if (!emailOrPhone.trim()) {
      errors.emailOrPhone = 'Please enter your email or phone number.';
    }
    if (!password) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const isEmail = emailOrPhone.includes('@');
      const payload = isEmail
        ? { email: emailOrPhone.trim(), password }
        : { phone: emailOrPhone.trim(), password };

      const res = await api.authApi.login(payload);

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

  const handleSendOtp = async () => {
    clearErrors();

    if (!emailOrPhone.trim()) {
      setFieldErrors({ emailOrPhone: 'Please enter your registered email address.' });
      return;
    }
    if (!emailOrPhone.includes('@')) {
      setFieldErrors({ emailOrPhone: 'Please enter a valid email address for OTP delivery.' });
      return;
    }

    setLoading(true);
    try {
      const email = emailOrPhone.trim();
      const res = await api.authApi.requestOtp({ email });
      if (res.success) {
        Keyboard.dismiss();
        navigation.navigate('OtpVerification', { email });
      }
    } catch (err: unknown) {
      const apiErr = ApiError.from(err);
      if (apiErr.isValidation) {
        setFieldErrors({
          emailOrPhone: apiErr.getFieldError('email') || apiErr.firstValidationError,
        });
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
            title="Sign In"
            subtitle="Access your bookings & KYC"
            onBack={() => navigation.goBack()}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Brand Logo */}
            <View style={styles.brandHero}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoIcon}>🛵</Text>
              </View>
              <Text style={styles.brandTitle}>GK WhizWheel</Text>
              <Text style={styles.brandSubtitle}>Karnataka Coastal Bike Rentals</Text>
            </View>

            {/* General Error Banner */}
            {generalError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerIcon}>⚠️</Text>
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            )}

            {/* Mode Switcher */}
            <View style={styles.toggleContainer} accessible={true} accessibilityRole="tablist">
              <TouchableOpacity
                style={[styles.toggleBtn, authMode === 'password' && styles.toggleBtnActive]}
                onPress={() => {
                  setAuthMode('password');
                  clearErrors();
                }}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel="Password sign in mode"
                accessibilityState={{ selected: authMode === 'password' }}
              >
                <Text style={[styles.toggleText, authMode === 'password' && styles.toggleTextActive]}>
                  Password 🔑
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, authMode === 'otp' && styles.toggleBtnActive]}
                onPress={() => {
                  setAuthMode('otp');
                  clearErrors();
                }}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel="Instant OTP sign in mode"
                accessibilityState={{ selected: authMode === 'otp' }}
              >
                <Text style={[styles.toggleText, authMode === 'otp' && styles.toggleTextActive]}>
                  Instant OTP ⚡
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card Form */}
            <View style={styles.card}>
              {/* Email / Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {authMode === 'password' ? 'Email or Phone Number' : 'Registered Email Address'}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    fieldErrors.emailOrPhone && styles.inputErrorBorder,
                  ]}
                  placeholder={
                    authMode === 'password'
                      ? 'e.g. rahul@example.com or 9876543210'
                      : 'e.g. rahul@example.com'
                  }
                  placeholderTextColor={colors.textSecondary}
                  value={emailOrPhone}
                  onChangeText={(text) => {
                    setEmailOrPhone(text);
                    if (fieldErrors.emailOrPhone) {
                      setFieldErrors((prev) => ({ ...prev, emailOrPhone: '' }));
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={authMode === 'otp' ? 'email-address' : 'default'}
                  textContentType="username"
                  returnKeyType={authMode === 'password' ? 'next' : 'done'}
                  accessible={true}
                  accessibilityLabel={authMode === 'password' ? 'Email or phone number' : 'Registered email address'}
                  accessibilityHint="Enter your email or 10-digit mobile number"
                />
                {fieldErrors.emailOrPhone ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">{fieldErrors.emailOrPhone}</Text>
                ) : null}
              </View>

              {/* Password Field (Only in password mode) */}
              {authMode === 'password' && (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ForgotPassword')}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      accessible={true}
                      accessibilityRole="link"
                      accessibilityLabel="Forgot password"
                      accessibilityHint="Navigates to the password recovery screen"
                    >
                      <Text style={styles.forgotLink}>Forgot?</Text>
                    </TouchableOpacity>
                  </View>

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
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: '' }));
                        }
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      textContentType="password"
                      returnKeyType="done"
                      onSubmitEditing={handlePasswordLogin}
                      accessible={true}
                      accessibilityLabel="Password"
                      accessibilityHint="Enter your account password"
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
              )}

              {/* Submit CTA */}
              <Button
                title={
                  loading
                    ? 'Signing In...'
                    : authMode === 'password'
                    ? 'Sign In with Password'
                    : 'Send Verification Code →'
                }
                onPress={authMode === 'password' ? handlePasswordLogin : handleSendOtp}
                loading={loading}
                accessibilityLabel={
                  authMode === 'password' ? 'Sign in with password' : 'Send verification code via email'
                }
                accessibilityHint="Authenticates and logs you into GK WhizWheel"
                style={styles.submitBtn}
              />
            </View>

            {/* Bottom Register Prompt */}
            <View style={styles.footerPrompt}>
              <Text style={styles.footerPromptText}>Don't have an account yet?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                style={styles.createAccountBtn}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Create Free Account"
                accessibilityHint="Navigates to new user registration screen"
              >
                <Text style={styles.createAccountText}>Create Free Account</Text>
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
  brandHero: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoIcon: {
    fontSize: 34,
  },
  brandTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.secondary,
  },
  brandSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.divider,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  toggleBtnActive: {
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  toggleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotLink: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primaryDark,
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
  submitBtn: {
    height: 50,
    marginTop: spacing.sm,
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
  createAccountBtn: {
    paddingVertical: spacing.xs,
  },
  createAccountText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
});
