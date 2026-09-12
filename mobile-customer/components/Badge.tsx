import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.accentLight, text: colors.successText };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warningText };
      case 'danger':
        return { bg: colors.dangerLight, text: colors.dangerText };
      case 'primary':
        return { bg: colors.primaryLight, text: colors.warningText };
      case 'neutral':
      default:
        return { bg: colors.divider, text: colors.secondaryMuted }; // Slate 700 on Slate 100 (>7:1 contrast)
    }
  };

  const style = getColors();

  return (
    <View
      style={[styles.container, { backgroundColor: style.bg }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
  },
});
