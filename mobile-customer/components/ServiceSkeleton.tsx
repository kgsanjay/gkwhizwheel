import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

interface ServiceSkeletonProps {
  viewMode?: 'list' | 'grid';
  count?: number;
}

export const ServiceSkeleton: React.FC<ServiceSkeletonProps> = ({
  viewMode = 'list',
  count = 6,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  const items = Array.from({ length: count });

  if (viewMode === 'grid') {
    return (
      <View style={styles.gridContainer}>
        {items.map((_, i) => (
          <View key={i} style={styles.gridCard}>
            <Animated.View style={[styles.gridIconPlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.gridTitlePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.gridSubtitlePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.gridPricePlaceholder, { opacity: pulseAnim }]} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {items.map((_, i) => (
        <View key={i} style={styles.listCard}>
          <Animated.View style={[styles.listIconPlaceholder, { opacity: pulseAnim }]} />
          <View style={styles.listContentWrap}>
            <Animated.View style={[styles.listTagPlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.listTitlePlaceholder, { opacity: pulseAnim }]} />
            <Animated.View style={[styles.listDescPlaceholder, { opacity: pulseAnim }]} />
            <View style={styles.listFooterWrap}>
              <Animated.View style={[styles.listPricePlaceholder, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.listButtonPlaceholder, { opacity: pulseAnim }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  listIconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  listContentWrap: {
    flex: 1,
  },
  listTagPlaceholder: {
    width: 80,
    height: 12,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  listTitlePlaceholder: {
    width: '85%',
    height: 16,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  listDescPlaceholder: {
    width: '60%',
    height: 12,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  listFooterWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listPricePlaceholder: {
    width: 90,
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.border,
  },
  listButtonPlaceholder: {
    width: 60,
    height: 24,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  gridCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gridIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  gridTitlePlaceholder: {
    width: '80%',
    height: 16,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },
  gridSubtitlePlaceholder: {
    width: '60%',
    height: 12,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  gridPricePlaceholder: {
    width: '70%',
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.border,
  },
});
