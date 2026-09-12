import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Header, Card, Badge, Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { NotificationManager } from '../services/NotificationManager';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, isManager } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the Station Operations portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={isManager ? 'Manager Profile' : 'Crew Profile'}
        subtitle="Shift & station assignment"
        rightBadge={user?.role?.replace('_', ' ').toUpperCase()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Staff Member'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'staff@gkwhizwheel.com'}</Text>
          <View style={styles.badgeRow}>
            <Badge
              label={user?.role ? user.role.replace('_', ' ').toUpperCase() : 'STAFF'}
              variant={isManager ? 'warning' : 'ops'}
            />
          </View>
        </Card>

        {/* Assigned Hub Details */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Station Assignment</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Hub</Text>
            <Text style={styles.infoValue}>{user?.store_name || 'Honnavar Platform 1 Hub'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Operational Zone</Text>
            <Text style={styles.infoValue}>Coastal Karnataka (Zone A)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Station Lead</Text>
            <Text style={styles.infoValue}>Sanjay Bhat</Text>
          </View>
        </Card>

        {/* Station Operating Protocols */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Standard Operating Guidelines</Text>
          <Text style={styles.bulletPoint}>• Mandatory helmet inspection prior to key dispatch.</Text>
          <Text style={styles.bulletPoint}>• Mandatory 4-angle vehicle condition photos on handover.</Text>
          <Text style={styles.bulletPoint}>• Prompt offline-sync queue clearance before shift handoff.</Text>
        </Card>

        {/* Testing / Debug Actions */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notification Tests</Text>
          <View style={{ gap: spacing.md }}>
            <Button
              title="Simulate New Booking Push"
              onPress={() => NotificationManager.simulateNewBookingAlert(Math.floor(Math.random() * 1000) + 1000)}
              variant="secondary"
            />
            <Button
              title="Simulate Sync Failure"
              onPress={() => NotificationManager.scheduleSyncFailureAlert('handover', Math.floor(Math.random() * 1000) + 1000)}
              variant="secondary"
            />
          </View>
        </Card>

        {/* Sign Out Action */}
        <Button
          title="Sign Out of Station"
          variant="outline"
          size="lg"
          loading={loggingOut}
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  userCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.primaryContrast,
  },
  userName: {
    fontSize: typography.sizes.xxl, // 28px
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  userEmail: {
    fontSize: typography.sizes.base, // 18px
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    marginTop: spacing.xs,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg, // 20px
    fontWeight: typography.weights.heavy,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sizes.base, // 18px
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.sizes.base, // 18px
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  bulletPoint: {
    fontSize: typography.sizes.md, // 17px
    color: colors.text,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  logoutBtn: {
    borderColor: colors.dangerBorder,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
