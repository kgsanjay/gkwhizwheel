import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'ops' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
}) => {
  return (
    <View style={[styles.badge, styles[variant], style]} accessible={true} accessibilityLabel={`Status: ${label}`}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  neutral: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
  },
  success: {
    backgroundColor: colors.successLight,
    borderWidth: 1.5,
    borderColor: colors.successBorder,
  },
  warning: {
    backgroundColor: colors.warningLight,
    borderWidth: 1.5,
    borderColor: colors.warningBorder,
  },
  danger: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
  },
  info: {
    backgroundColor: colors.infoLight,
    borderWidth: 1.5,
    borderColor: colors.info,
  },
  ops: {
    backgroundColor: colors.opsBadgeLight,
    borderWidth: 1.5,
    borderColor: colors.opsBadge,
  },
  text: {
    fontSize: typography.sizes.xs, // 13px (stepped up from 11px for sunlight legibility)
    fontWeight: typography.weights.heavy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text_neutral: {
    color: colors.textSecondary,
  },
  text_success: {
    color: colors.successDark,
  },
  text_warning: {
    color: colors.warningDark,
  },
  text_danger: {
    color: colors.dangerDark,
  },
  text_info: {
    color: colors.infoDark,
  },
  text_ops: {
    color: colors.opsBadge,
  },
});
