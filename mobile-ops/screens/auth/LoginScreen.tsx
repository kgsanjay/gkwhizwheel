import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Button, Input, Card, Badge } from '../../components';
import { useAuth } from '../../context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Please enter your staff email or mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your staff password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const isEmail = trimmed.includes('@');
      const credentials = isEmail
        ? { email: trimmed, password }
        : { phone: trimmed, password };

      // Role-aware login consuming Api/V1/AuthController.php via AuthContext
      // Stores token securely via expo-secure-store and validates operational role
      const user = await login(credentials);

      // Successfully authenticated with operational credentials (store_manager / staff)
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.login?.[0] ||
        err.response?.data?.errors?.email?.[0] ||
        err.message ||
        'Authentication failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Logo */}
          <View style={styles.heroSection}>
            <View style={styles.brandBadgeRow}>
              <Badge label="Operations Portal" variant="ops" />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              GK WhizWheel
            </Text>
            <Text style={styles.subtitle}>
              Ground Staff & Station Manager App
            </Text>
          </View>

          {/* Login Card */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Station Sign In</Text>
            <Text style={styles.cardDesc}>
              Use your registered credentials to access dispatch, handover, and station fleet controls.
            </Text>

            {error ? (
              <View style={styles.errorBanner} accessible={true} accessibilityRole="alert">
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Staff Email or Mobile"
              placeholder="e.g. staff.honnavar@gkwhizwheel.com"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              accessibilityLabel="Staff email or mobile number input"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              accessibilityLabel="Staff password input"
            />

            <Button
              title="Sign In to Station"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={styles.loginButton}
            />
          </Card>

          {/* Station Support Footer */}
          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              Station hub manager access issue? Contact Central Fleet Control: +91 99000 00000
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brandBadgeRow: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.heavy,
    color: colors.textInverse,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
  },
  cardTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
    fontWeight: typography.weights.semibold,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  footerNote: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
