import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, borderRadius, typography, touchTargets } from '../theme';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle[] => {
    const s: ViewStyle[] = [styles.base, styles[variant], styles[`size_${size}`]];
    if (isDisabled) s.push(styles.disabled);
    if (style) s.push(style);
    return s;
  };

  const getTextStyle = (): TextStyle[] => {
    const s: TextStyle[] = [styles.textBase, styles[`text_${variant}`], styles[`textSize_${size}`]];
    if (isDisabled) s.push(styles.textDisabled);
    if (textStyle) s.push(textStyle);
    return s;
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      disabled={isDisabled}
      activeOpacity={0.75}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.primaryContrast : colors.textInverse}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    minHeight: touchTargets.default, // 56dp: Oversized one-handed tap target
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.borderDark,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  size_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.min, // 48dp: Minimum tap target for field use
  },
  size_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTargets.default, // 56dp: Standard thumb target
  },
  size_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: touchTargets.large, // 64dp: Primary outdoor hero CTA
  },
  textBase: {
    fontWeight: typography.weights.heavy,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  text_primary: {
    color: colors.primaryContrast,
  },
  text_secondary: {
    color: colors.secondaryContrast,
  },
  text_outline: {
    color: colors.text,
  },
  text_danger: {
    color: colors.textInverse,
  },
  textDisabled: {
    color: colors.textMuted,
  },
  textSize_sm: {
    fontSize: typography.sizes.sm, // 15px (stepped up from 12px)
  },
  textSize_md: {
    fontSize: typography.sizes.base, // 18px (stepped up from 14px)
  },
  textSize_lg: {
    fontSize: typography.sizes.lg, // 20px (stepped up from 16px)
  },
});
