import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useNetworkStatus, networkService } from '../services/networkService';
import { colors, spacing, borderRadius, typography } from '../theme';

export const OfflineBanner: React.FC = () => {
  const status = useNetworkStatus();
  const [retrying, setRetrying] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const prevConnectedRef = useRef<boolean>(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isOffline = !status.isConnected || status.isInternetReachable === false;

  useEffect(() => {
    // Detect reconnection from offline to online
    if (!prevConnectedRef.current && !isOffline) {
      setShowReconnected(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowReconnected(false));
      }, 3500);

      return () => clearTimeout(timer);
    }

    prevConnectedRef.current = !isOffline;
  }, [isOffline, fadeAnim]);

  const handleManualRetry = async () => {
    setRetrying(true);
    try {
      await networkService.checkConnectionAsync();
    } catch {
      // Ignore
    } finally {
      setRetrying(false);
    }
  };

  if (showReconnected && !isOffline) {
    return (
      <Animated.View
        style={[styles.onlineContainer, { opacity: fadeAnim }]}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel="Back Online. Connection restored and synchronized."
      >
        <Text style={styles.onlineEmoji}>✓</Text>
        <Text style={styles.onlineText}>
          Back Online • Connection restored and synchronized.
        </Text>
      </Animated.View>
    );
  }

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={styles.offlineContainer}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel="Offline Mode. Showing cached bookings and offline vouchers."
    >
      <View style={styles.contentRow}>
        <View style={styles.textWrap} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden={true}>
          <Text style={styles.offlineTitle}>📡 Offline Mode (Coastal / Jetty Area)</Text>
          <Text style={styles.offlineSubtitle}>
            Showing cached bookings & offline vouchers.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={handleManualRetry}
          disabled={retrying}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Retry internet connection"
          accessibilityHint="Attempts to re-establish connection with GK WhizWheel servers"
          accessibilityState={{ disabled: retrying, busy: retrying }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {retrying ? (
            <ActivityIndicator size="small" color={colors.secondary} />
          ) : (
            <Text style={styles.retryBtnText}>Retry</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  offlineContainer: {
    backgroundColor: colors.warningLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.warningDark,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  offlineTitle: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.warningText,
  },
  offlineSubtitle: {
    fontSize: 10,
    color: colors.warningText,
    marginTop: 1,
  },
  retryBtn: {
    backgroundColor: colors.card,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warningDark,
  },
  retryBtnText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.secondary,
  },
  onlineContainer: {
    backgroundColor: colors.successLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineEmoji: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.successText,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: colors.successText,
  },
});
