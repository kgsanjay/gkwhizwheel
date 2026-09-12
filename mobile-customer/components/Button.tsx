import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    if (disabled) return styles.disabledContainer;
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    if (disabled) return styles.disabledText;
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getIndicatorColor = () => {
    switch (variant) {
      case 'outline':
        return colors.primaryDark;
      case 'primary':
        return colors.primaryContrast;
      default:
        return colors.textInverted;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.base, getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator color={getIndicatorColor()} size="small" />
      ) : (
        <Text style={[styles.textBase, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // 48dp minimum accessible touch target per WCAG 2.5.5
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  primaryContainer: {
    backgroundColor: colors.primary, // Amber 500
  },
  secondaryContainer: {
    backgroundColor: colors.secondary, // Slate 900
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
  },
  dangerContainer: {
    backgroundColor: colors.danger,
  },
  disabledContainer: {
    backgroundColor: colors.border,
  },
  textBase: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  primaryText: {
    color: colors.primaryContrast, // Slate 900 on Amber (8.8:1 contrast, passes WCAG AAA)
  },
  secondaryText: {
    color: colors.textInverted, // Pure white on Slate 900 (16:1 contrast, passes WCAG AAA)
  },
  dangerText: {
    color: colors.textInverted, // Pure white on Red 500 (4.54:1 contrast, passes WCAG AA)
  },
  outlineText: {
    color: colors.primaryDark, // Amber 700 / Dark amber on light surface (passes WCAG AA 4.5:1)
  },
  disabledText: {
    color: colors.textSecondary,
  },
});
