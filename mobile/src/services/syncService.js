/**
 * Offline Sync Service.
 * Orchestrates flushing queued actions from local SQLite to backend POST /api/v1/staff/sync.
 * Handles per-item success/failure matching the SyncController contract:
 * - Transient errors (network, timeout, 5xx, lock wait) -> auto-retried with retry_count increment.
 * - Permanent business conflicts (422, already booked, invalid status) -> escalated to conflict_error for staff review.
 * - Auto-flushes queue immediately when connectivity transitions from offline to online.
 */

import { apiClient } from '../api/client.js';
import {
    getPendingActions,
    markSyncing,
    markSynced,
    markRetryableFailure,
    markPermanentFailure,
    getQueueStats,
    ActionStatus,
} from '../storage/queue.js';
import { isOnline, addConnectivityListener } from './networkService.js';

let isSyncInProgress = false;
let autoSyncUnsubscribe = null;
let periodicSyncInterval = null;

/**
 * Determine whether an error from the backend is transient (retryable)
 * or a permanent business conflict (requires staff review/resolution).
 *
 * @param {string} errorMessage
 * @returns {'transient' | 'permanent'}
 */
export function classifySyncError(errorMessage = '') {
    if (!errorMessage || typeof errorMessage !== 'string') {
        return 'transient';
    }

    const lower = errorMessage.toLowerCase();

    // Permanent business validation / domain conflict errors
    const permanentPatterns = [
        'already booked',
        'not available for the requested dates',
        'unsupported action type',
        'not found',
        'not in confirmed status',
        'not in handed_over status',
        'invalid status',
        'cannot be less than',
        'validation error',
        'the given data was invalid',
        'already synchronized',
        'customer kyc rejected',
        'unauthorized',
        '403',
        '422',
        '400',
    ];

    for (const pattern of permanentPatterns) {
        if (lower.includes(pattern)) {
            return 'permanent';
        }
    }

    // Default to transient (network drops, 500/502/503/504, timeout, lock contention)
    return 'transient';
}

/**
 * Trigger sync of all pending offline actions to backend POST /api/v1/staff/sync.
 *
 * @param {object} options
 * @param {string} [options.deviceId='android_device']
 * @param {number} [options.batchSize=50]
 * @param {number} [options.maxRetries=3]
 * @param {Function} [options.onProgress]
 * @returns {Promise<{ synced: number, failed: number, conflicts: number, total: number, inProgress: boolean, error?: string }>}
 */
export async function flushOfflineQueue({
    deviceId = 'android_device',
    batchSize = 50,
    maxRetries = 3,
    onProgress = null,
} = {}) {
    if (isSyncInProgress) {
        return { synced: 0, failed: 0, conflicts: 0, total: 0, inProgress: true };
    }

    // Don't attempt network calls if we know we're offline
    if (!isOnline()) {
        const stats = await getQueueStats();
        return {
            synced: 0,
            failed: 0,
            conflicts: stats.conflict,
            total: stats.pending,
            inProgress: false,
            error: 'Offline mode active. Actions queued locally.',
        };
    }

    isSyncInProgress = true;

    try {
        const pendingActions = await getPendingActions(batchSize, maxRetries);

        if (!pendingActions || pendingActions.length === 0) {
            isSyncInProgress = false;
            return { synced: 0, failed: 0, conflicts: 0, total: 0, inProgress: false };
        }

        // 1. Mark in-flight in local SQLite
        const actionIds = pendingActions.map((a) => a.id);
        await markSyncing(actionIds);

        // 2. Prepare batch payload matching POST /api/v1/staff/sync
        const batchPayload = {
            device_id: deviceId,
            actions: pendingActions.map((action) => ({
                idempotency_key: action.idempotency_key,
                action_type: action.action_type,
                payload: action.payload,
            })),
        };

        // 3. Dispatch to server
        const response = await apiClient.post('/staff/sync', batchPayload);

        // 4. Process per-item results from SyncController
        // Supports response.data.data.items, response.data.items, and response.data.results
        const results =
            response?.data?.data?.items ||
            response?.data?.items ||
            response?.data?.results ||
            [];

        let syncedCount = 0;
        let failedCount = 0;
        let conflictCount = 0;

        for (const itemResult of results) {
            const key = itemResult.idempotency_key;
            if (itemResult.status === 'success') {
                await markSynced(key);
                syncedCount++;
            } else {
                const errMsg = itemResult.error || itemResult.message || 'Sync processing failed';
                const classification = classifySyncError(errMsg);

                if (classification === 'permanent') {
                    await markPermanentFailure(key, errMsg);
                    conflictCount++;
                } else {
                    await markRetryableFailure(key, errMsg, maxRetries);
                    failedCount++;
                }
            }
        }

        // If server returned empty results array but batch succeeded, fallback check
        if (results.length === 0 && response?.data?.success) {
            for (const action of pendingActions) {
                await markSynced(action.idempotency_key);
                syncedCount++;
            }
        }

        if (typeof onProgress === 'function') {
            onProgress({
                synced: syncedCount,
                failed: failedCount,
                conflicts: conflictCount,
                total: pendingActions.length,
            });
        }

        return {
            synced: syncedCount,
            failed: failedCount,
            conflicts: conflictCount,
            total: pendingActions.length,
            inProgress: false,
        };
    } catch (error) {
        // Entire HTTP batch request failed (network drop or server error)
        const pending = await getPendingActions(batchSize, maxRetries);
        const errMsg = error.message || 'Network error during sync';

        for (const item of pending) {
            await markRetryableFailure(item.idempotency_key, errMsg, maxRetries);
        }

        return {
            synced: 0,
            failed: pending.length,
            conflicts: 0,
            total: pending.length,
            error: errMsg,
            inProgress: false,
        };
    } finally {
        isSyncInProgress = false;
    }
}

/**
 * Initialize automatic background sync on reconnect and periodic intervals.
 *
 * @param {object} [options]
 * @param {Function} [options.onSyncComplete]
 * @param {number} [options.pollIntervalMs=30000]
 */
export function initAutoSync({ onSyncComplete = null, pollIntervalMs = 30000 } = {}) {
    // Clean up existing listeners if any
    stopAutoSync();

    // 1. Auto-flush immediately when network status transitions to online
    autoSyncUnsubscribe = addConnectivityListener(async (online) => {
        if (online && !isSyncInProgress) {
            try {
                const result = await flushOfflineQueue();
                if (typeof onSyncComplete === 'function') {
                    onSyncComplete(result);
                }
            } catch (err) {
                console.error('Auto-sync on reconnect failed:', err);
            }
        }
    });

    // 2. Periodic background flush if online and pending items exist
    if (pollIntervalMs > 0) {
        periodicSyncInterval = setInterval(async () => {
            if (isOnline() && !isSyncInProgress) {
                try {
                    const stats = await getQueueStats();
                    if (stats.pending > 0 || stats.failed > 0) {
                        const result = await flushOfflineQueue();
                        if (typeof onSyncComplete === 'function') {
                            onSyncComplete(result);
                        }
                    }
                } catch (err) {
                    console.error('Periodic background sync failed:', err);
                }
            }
        }, pollIntervalMs);
    }
}

/**
 * Stop automatic sync listeners and intervals.
 */
export function stopAutoSync() {
    if (typeof autoSyncUnsubscribe === 'function') {
        autoSyncUnsubscribe();
        autoSyncUnsubscribe = null;
    }
    if (periodicSyncInterval) {
        clearInterval(periodicSyncInterval);
        periodicSyncInterval = null;
    }
}

export default {
    flushOfflineQueue,
    classifySyncError,
    initAutoSync,
    stopAutoSync,
    getQueueStats,
};
