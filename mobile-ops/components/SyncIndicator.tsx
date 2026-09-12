import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { syncManager, SyncManagerEvent } from '../services/SyncManager';
import { syncQueue } from '../services/SyncQueue';
import { colors, spacing, typography, borderRadius } from '../theme';

export const SyncIndicator: React.FC = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Initial fetch
    updateQueueCount();

    const unsubscribe = syncManager.addListener((event: SyncManagerEvent, data?: any) => {
      switch (event) {
        case 'queue_updated':
          updateQueueCount();
          break;
        case 'sync_started':
          setIsSyncing(true);
          setHasError(false);
          break;
        case 'sync_completed':
          setIsSyncing(false);
          setHasError(false);
          updateQueueCount();
          break;
        case 'sync_failed':
          setIsSyncing(false);
          setHasError(true);
          updateQueueCount();
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateQueueCount = async () => {
    const pending = await syncQueue.getPendingActions();
    setPendingCount(pending.length);
    if (pending.length === 0) {
      setHasError(false);
    }
  };

  const handleSyncNow = () => {
    syncManager.triggerSync();
  };

  if (pendingCount === 0 && !isSyncing) {
    return null; // Don't show if there's nothing to sync
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.icon} />
        ) : hasError ? (
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
        ) : (
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        )}
        <Text style={styles.text}>
          {isSyncing 
            ? 'Syncing actions...' 
            : `${pendingCount} action${pendingCount > 1 ? 's' : ''} pending sync`}
        </Text>
      </View>
      {!isSyncing && (
        <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow}>
          <Text style={styles.syncBtnText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  syncBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  syncBtnText: {
    color: '#fff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
});
