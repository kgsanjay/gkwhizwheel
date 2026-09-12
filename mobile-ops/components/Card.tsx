import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps, StyleProp } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padded = true,
  ...rest
}) => {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5, // Crisp 1.5px border keeps cards demarcated in direct sun glare
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  padded: {
    padding: spacing.lg,
  },
});
