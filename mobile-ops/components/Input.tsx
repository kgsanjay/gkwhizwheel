import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { colors, spacing, borderRadius, typography, touchTargets } from '../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} accessible={false}>
          {label}
        </Text>
      ) : null}

      <View style={[styles.inputWrapper, !!error && styles.inputError]}>
        {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint || (error ? `Error: ${error}` : undefined)}
          {...rest}
        />
        {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.base, // 18px for clear outdoor readability
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2, // Bold 2px outline resists sunlight glare
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    minHeight: touchTargets.default, // 56dp oversized field touch target
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md, // 17px crisp input text
    color: colors.text,
    fontWeight: typography.weights.medium,
    paddingVertical: spacing.sm,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.sm, // 15px
    color: colors.dangerDark,
    marginTop: spacing.xs,
    fontWeight: typography.weights.bold,
  },
  helperText: {
    fontSize: typography.sizes.sm, // 15px
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
