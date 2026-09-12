import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

export interface BookingStep {
  id: number;
  label: string;
  icon: string;
}

export const BOOKING_STEPS: BookingStep[] = [
  { id: 1, label: 'Dates', icon: '📅' },
  { id: 2, label: 'Location', icon: '📍' },
  { id: 3, label: 'Add-ons', icon: '🛡️' },
  { id: 4, label: 'Review', icon: '📋' },
  { id: 5, label: 'Payment', icon: '💳' },
];

interface BookingStepIndicatorProps {
  currentStep: number; // 1 to 5
}

export const BookingStepIndicator: React.FC<BookingStepIndicatorProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {BOOKING_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    isCompleted && styles.connectorLineCompleted,
                    isActive && styles.connectorLineActive,
                  ]}
                />
              )}
              <View
                style={styles.stepItem}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Step ${step.id} of ${BOOKING_STEPS.length}: ${step.label}, ${
                  isCompleted ? 'Completed' : isActive ? 'Current step' : 'Upcoming step'
                }`}
              >
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                  ]}
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden={true}
                >
                  {isCompleted ? (
                    <Text style={styles.checkmarkText}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.circleText,
                        isActive && styles.circleTextActive,
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isActive || isCompleted) && styles.stepLabelActive,
                  ]}
                  numberOfLines={1}
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden={true}
                >
                  {step.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectorLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.divider,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  connectorLineCompleted: {
    backgroundColor: colors.accent,
  },
  connectorLineActive: {
    backgroundColor: colors.primary,
  },
  stepItem: {
    alignItems: 'center',
    width: 54,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circleCompleted: {
    backgroundColor: colors.accent,
  },
  circleActive: {
    backgroundColor: colors.primary,
  },
  checkmarkText: {
    color: colors.primaryContrast,
    fontSize: 13,
    fontWeight: typography.weights.bold,
  },
  circleText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold,
  },
  circleTextActive: {
    color: colors.primaryContrast,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
});
