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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../api/client';
import { ApiError } from '../../api/errors';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSendRecoveryOtp = async () => {
    setFieldError(null);
    setGeneralError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError('Please enter your registered email address.');
      return;
    }
    if (!trimmed.includes('@')) {
      setFieldError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.authApi.requestOtp({ email: trimmed });
      if (res.success) {
        Keyboard.dismiss();
        navigation.navigate('OtpVerification', { email: trimmed });
      }
    } catch (err: unknown) {
      const apiErr = ApiError.from(err);
      if (apiErr.isValidation) {
        setFieldError(apiErr.getFieldError('email') || apiErr.firstValidationError);
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
            title="Reset Password"
            subtitle="Account Recovery"
            onBack={() => navigation.goBack()}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🔐</Text>
            </View>

            <Text style={styles.heading}>Forgot your password?</Text>
            <Text style={styles.subheading}>
              Enter your registered email address below. We'll send a 6-digit verification code to instantly recover your account.
            </Text>

            {generalError && (
              <View style={styles.errorBanner} accessible={true} accessibilityRole="alert">
                <Text style={styles.errorBannerIcon}>⚠️</Text>
                <Text style={styles.errorBannerText}>{generalError}</Text>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Registered Email</Text>
                <TextInput
                  style={[styles.textInput, fieldError && styles.inputErrorBorder]}
                  placeholder="e.g. rahul@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (fieldError) setFieldError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={handleSendRecoveryOtp}
                  accessible={true}
                  accessibilityLabel="Registered Email"
                  accessibilityHint="Enter your email address to receive an account recovery code"
                />
                {fieldError ? <Text style={styles.inlineError} accessibilityRole="alert">{fieldError}</Text> : null}
              </View>

              <Button
                title={loading ? 'Sending Code...' : 'Send Recovery Code →'}
                onPress={handleSendRecoveryOtp}
                loading={loading}
                accessibilityLabel="Send recovery code"
                accessibilityHint="Sends an OTP verification code to your email address"
                style={styles.submitBtn}
              />
            </View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backLink}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Back to Sign In"
              accessibilityHint="Navigates back to the login screen"
            >
              <Text style={styles.backLinkText}>← Back to Sign In</Text>
            </TouchableOpacity>
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
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  iconEmoji: {
    fontSize: 36,
  },
  heading: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  errorBanner: {
    width: '100%',
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
    width: '100%',
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
  },
  backLink: {
    marginTop: spacing.xxl,
    padding: spacing.sm,
  },
  backLinkText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
});
