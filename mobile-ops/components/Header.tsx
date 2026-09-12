import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius, touchTargets } from '../theme';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  storeBadge?: string;
  rightBadge?: string;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  storeBadge,
  rightBadge,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftRow}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightRow}>
        {storeBadge ? (
          <View style={styles.storeBadge} accessible={true} accessibilityLabel={`Active Hub: ${storeBadge}`}>
            <Text style={styles.storeBadgeText} numberOfLines={1}>
              📍 {storeBadge}
            </Text>
          </View>
        ) : null}
        {rightBadge ? (
          <View style={styles.rightBadge} accessible={true} accessibilityLabel={`Role: ${rightBadge}`}>
            <Text style={styles.rightBadgeText} numberOfLines={1}>
              {rightBadge}
            </Text>
          </View>
        ) : null}
        {rightAction ? rightAction : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 2, // High-contrast border against bright sun
    borderBottomColor: colors.border,
    minHeight: 64, // Generous header for field scanning
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: touchTargets.min, // 48dp single-thumb tap target
    height: touchTargets.min,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backIcon: {
    fontSize: 28,
    color: colors.text,
    lineHeight: 30,
    marginTop: -2,
    fontWeight: typography.weights.bold,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.xl, // 24px bold header
    fontWeight: typography.weights.heavy,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.sizes.sm, // 15px subtext
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: typography.weights.medium,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  storeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    maxWidth: 150,
  },
  storeBadgeText: {
    fontSize: typography.sizes.xs, // 13px
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  rightBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.secondaryDark,
  },
  rightBadgeText: {
    fontSize: 12,
    fontWeight: typography.weights.heavy,
    color: colors.textInverse,
    letterSpacing: 0.6,
  },
});
