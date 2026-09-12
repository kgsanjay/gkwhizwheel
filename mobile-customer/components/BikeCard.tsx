import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Bike } from '../api/types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Badge } from './Badge';

interface BikeCardProps {
  bike: Bike;
  onPress: () => void;
}

export const BikeCard: React.FC<BikeCardProps> = ({ bike, onPress }) => {
  const isAvailable = bike.status === 'available';
  const dailyRate = bike.daily_rate || bike.category?.base_daily_rate || 500;
  const a11yLabel = `${bike.brand} ${bike.model_name}, ${bike.category?.name || 'Bike'}, ${
    isAvailable ? 'Available' : 'Booked'
  }, ${dailyRate} rupees per day${bike.store ? `, at ${bike.store.city}` : ''}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Double tap to view full bike details and reserve"
    >
      <View style={styles.imageContainer} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
        {/* Placeholder or real image */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderIcon}>🛵</Text>
        </View>
        <View style={styles.badgeContainer}>
          <Badge
            label={isAvailable ? 'Available' : 'Booked'}
            variant={isAvailable ? 'success' : 'neutral'}
          />
        </View>
      </View>

      <View style={styles.content} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>{bike.brand}</Text>
          <Text style={styles.category}>{bike.category?.name || 'Scooter'}</Text>
        </View>
        <Text style={styles.modelName} numberOfLines={1}>
          {bike.model_name}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>⚡ {bike.transmission}</Text>
          <Text style={styles.metaItem}>⛽ {bike.fuel_type}</Text>
          {bike.store && <Text style={styles.metaItem}>📍 {bike.store.city}</Text>}
        </View>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Daily Rate</Text>
            <Text style={styles.priceValue}>
              ₹{dailyRate}
              <Text style={styles.perDay}> / day</Text>
            </Text>
          </View>

          <View style={styles.bookAction}>
            <Text style={styles.bookActionText}>View Details →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  imageContainer: {
    height: 140,
    backgroundColor: colors.divider,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 56,
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  content: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brand: {
    fontSize: typography.sizes.xs,
    color: colors.primaryDark,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  category: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  modelName: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaItem: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    textTransform: 'capitalize',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  priceLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.heavy,
    color: colors.text,
  },
  perDay: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
  },
  bookAction: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  bookActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
});
