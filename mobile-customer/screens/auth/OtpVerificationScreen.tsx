import React, { useState, useEffect, useRef } from 'react';
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
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../api/client';
import { ApiError } from '../../api/errors';
import { colors, spacing, borderRadius, typography, shadows } from '../../theme';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';

type OtpRouteProp = RouteProp<RootStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen: React.FC = () => {
  const route = useRoute<OtpRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { email } = route.params;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);

  // Resend cooldown timer countdown
  useEffect(() => {
    let timer: any = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otp).trim();
    setErrorMessage(null);

    if (code.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.authApi.verifyOtp({ email, otp: code });
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
        setErrorMessage(apiErr.getFieldError('otp') || apiErr.firstValidationError);
      } else {
        setErrorMessage(apiErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setErrorMessage(null);
    try {
      const res = await api.authApi.requestOtp({ email });
      if (res.success) {
        setResendCooldown(45);
        setOtp('');
        inputRef.current?.focus();
      }
    } catch (err: unknown) {
      const apiErr = ApiError.from(err);
      setErrorMessage(apiErr.message);
    } finally {
      setResending(false);
    }
  };

  const onOtpTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(cleaned);
    setErrorMessage(null);

    // Auto-submit when user finishes typing 6 digits
    if (cleaned.length === 6) {
      handleVerifyOtp(cleaned);
    }
  };

  // Render 6 visual boxes
  const renderDigitBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const digit = otp[i] || '';
      const isCurrent = i === otp.length;
      const isFilled = digit !== '';

      boxes.push(
        <View
          key={i}
          style={[
            styles.digitBox,
            isCurrent && styles.digitBoxActive,
            isFilled && styles.digitBoxFilled,
            errorMessage ? styles.digitBoxError : null,
          ]}
        >
          <Text style={styles.digitText}>{digit}</Text>
        </View>
      );
    }
    return boxes;
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View style={styles.container}>
          <Header
            title="Verification"
            subtitle="Enter 6-Digit Code"
            onBack={() => navigation.goBack()}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>✉️</Text>
            </View>

            <Text style={styles.heading}>Verify Your Email</Text>
            <Text style={styles.subheading}>
              We sent a 6-digit verification code to:
            </Text>
            <Text style={styles.emailHighlight}>{email}</Text>

            {/* Visual Digit Boxes */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              style={styles.digitBoxesRow}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              {renderDigitBoxes()}
            </TouchableOpacity>

            {/* Input capturing numeric keypad */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={otp}
              onChangeText={onOtpTextChange}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              textContentType="oneTimeCode"
              accessible={true}
              accessibilityLabel="6-digit verification code"
              accessibilityHint="Enter the 6-digit one-time password sent to your email"
              accessibilityValue={{ text: otp.length ? otp.split('').join(' ') : 'Empty' }}
            />

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorRow} accessible={true} accessibilityRole="alert">
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <Button
              title={loading ? 'Verifying Code...' : 'Verify & Continue'}
              onPress={() => handleVerifyOtp()}
              loading={loading}
              disabled={otp.length !== 6}
              accessibilityLabel="Verify and Continue"
              accessibilityHint="Submits your 6-digit code and logs you in"
              style={styles.verifyBtn}
            />

            {/* Resend Timer / CTA */}
            <View style={styles.resendRow}>
              <Text style={styles.resendPrompt}>Didn't receive the code?</Text>
              {resendCooldown > 0 ? (
                <Text
                  style={styles.cooldownText}
                  accessible={true}
                  accessibilityLabel={`Resend code available in ${resendCooldown} seconds`}
                >
                  Resend in {resendCooldown}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resending}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Resend code"
                  accessibilityHint="Sends a new 6-digit code to your email"
                  accessibilityState={{ disabled: resending, busy: resending }}
                >
                  <Text style={styles.resendLinkText}>
                    {resending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}
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
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subheading: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emailHighlight: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.xxl,
  },
  digitBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  digitBox: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  digitBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  digitBoxFilled: {
    borderColor: colors.secondary,
  },
  digitBoxError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  digitText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorRow: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: colors.dangerText,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  verifyBtn: {
    width: '100%',
    height: 50,
    marginTop: spacing.md,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
  resendPrompt: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  cooldownText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  resendLinkText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
});
