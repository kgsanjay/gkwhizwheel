/**
 * Self-Check Test Script for Mobile Offline-Resilience & Auto-Sync:
 * 1. Network connectivity detection, listener hooks, and offline state tracking
 * 2. Local action queueing with client-side UUID v4 idempotency keys when offline
 * 3. Automatic flush via /staff/sync when connectivity returns
 * 4. Per-item success response handling
 * 5. Per-item transient error classification and automated retry with backoff/retry count
 * 6. Per-item permanent business conflict classification (showing error to staff without infinite loops)
 * 7. Staff manual resolution actions: "Retry Action" and "Discard Action"
 * 8. Queue stats accuracy for "Pending Sync" indicators
 */

import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { generateIdempotencyKey } from '../src/api/idempotency.js';
import { apiClient } from '../src/api/client.js';
import { setDatabaseDriver } from '../src/storage/database.js';
import {
    enqueueAction,
    getPendingActions,
    getFailedActions,
    markSyncing,
    markSynced,
    markRetryableFailure,
    markPermanentFailure,
    retryFailedAction,
    dismissFailedAction,
    getQueueStats,
    clearSynced,
    truncateQueue,
    ActionStatus,
} from '../src/storage/queue.js';
import {
    isOnline,
    setOnlineStatus,
    addConnectivityListener,
} from '../src/services/networkService.js';
import {
    flushOfflineQueue,
    classifySyncError,
    initAutoSync,
    stopAutoSync,
} from '../src/services/syncService.js';

async function runOfflineResilienceChecks() {
    console.log('🚀 Starting GK Whizwheel Mobile Offline-Resilience & Auto-Sync Self-Check...\n');

    // Setup in-memory SQLite storage
    const memoryDb = new DatabaseSync(':memory:');
    setDatabaseDriver({
        open: async () => ({
            executeSql: async (sql, params = []) => {
                const cleanSql = sql.trim();
                if (cleanSql.toUpperCase().startsWith('SELECT') || cleanSql.toUpperCase().startsWith('PRAGMA')) {
                    const stmt = memoryDb.prepare(sql);
                    const rows = stmt.all(...params);
                    return [{
                        rows: {
                            length: rows.length,
                            item: (i) => rows[i],
                            raw: () => rows,
                        },
                    }];
                } else {
                    const stmt = memoryDb.prepare(sql);
                    const info = stmt.run(...params);
                    return [{
                        insertId: Number(info.lastInsertRowid),
                        rowsAffected: info.changes,
                        rows: { length: 0, item: () => null, raw: () => [] },
                    }];
                }
            },
        }),
    });

    await truncateQueue();

    // -------------------------------------------------------------
    // Check 1: Network Connectivity State & Listener Subscriptions
    // -------------------------------------------------------------
    console.log('▶ [1/8] Verifying Network Connectivity state and listener dispatch...');
    setOnlineStatus(true);
    assert.strictEqual(isOnline(), true, 'Initial state should be online');

    let listenerFiredCount = 0;
    let latestOnlineStatus = null;

    const unsubscribe = addConnectivityListener((status) => {
        listenerFiredCount++;
        latestOnlineStatus = status;
    });

    // Simulate going offline
    setOnlineStatus(false);
    assert.strictEqual(isOnline(), false);
    assert.strictEqual(latestOnlineStatus, false);
    assert.strictEqual(listenerFiredCount, 1);

    // Re-verify no change when set to same status
    setOnlineStatus(false);
    assert.strictEqual(listenerFiredCount, 1, 'Listeners must not fire if status did not change');

    // Simulate going online
    setOnlineStatus(true);
    assert.strictEqual(isOnline(), true);
    assert.strictEqual(latestOnlineStatus, true);
    assert.strictEqual(listenerFiredCount, 2);

    unsubscribe();
    console.log('  ✓ Network state tracking and listener notifications verified');

    // -------------------------------------------------------------
    // Check 2: Error Classification Engine (Transient vs Permanent)
    // -------------------------------------------------------------
    console.log('▶ [2/8] Verifying Per-Item Error Classification (Transient vs Permanent)...');
    // Transient errors
    assert.strictEqual(classifySyncError('Network timeout while connecting to host'), 'transient');
    assert.strictEqual(classifySyncError('504 Gateway Time-out'), 'transient');
    assert.strictEqual(classifySyncError('Deadlock found when trying to get lock; try restarting transaction'), 'transient');
    assert.strictEqual(classifySyncError('Connection refused'), 'transient');

    // Permanent business conflicts
    assert.strictEqual(classifySyncError('Bike is not available for the requested dates'), 'permanent');
    assert.strictEqual(classifySyncError('The bike is already booked by another customer.'), 'permanent');
    assert.strictEqual(classifySyncError('Booking is not in confirmed status for handover.'), 'permanent');
    assert.strictEqual(classifySyncError('Return odometer cannot be less than handover odometer.'), 'permanent');
    assert.strictEqual(classifySyncError('Unprocessable Entity 422 validation error'), 'permanent');

    console.log('  ✓ Transient vs permanent domain errors correctly classified');

    // -------------------------------------------------------------
    // Check 3: Queueing Actions Locally While Offline with "Pending Sync"
    // -------------------------------------------------------------
    console.log('▶ [3/8] Simulating Offline Store: Queueing walk-in actions locally...');
    setOnlineStatus(false); // Simulate offline store environment

    const keyHold = generateIdempotencyKey();
    const actionHold = await enqueueAction({
        actionType: 'create_booking',
        endpoint: '/staff/bookings',
        payload: {
            bike_id: 10,
            customer_phone: '+919876543210',
            start_date: '2026-09-10',
            end_date: '2026-09-12',
            pickup_store_id: 1,
            return_store_id: 1,
        },
        idempotencyKey: keyHold,
    });

    const keyHandover = generateIdempotencyKey();
    const actionHandover = await enqueueAction({
        actionType: 'handover',
        endpoint: '/staff/bookings/10/handover',
        payload: {
            booking_id: 10,
            odometer_reading: 14500,
        },
        idempotencyKey: keyHandover,
    });

    const keyReturn = generateIdempotencyKey();
    const actionReturn = await enqueueAction({
        actionType: 'return',
        endpoint: '/staff/bookings/10/return',
        payload: {
            booking_id: 10,
            odometer_reading: 14750,
            damage_fee: 0,
        },
        idempotencyKey: keyReturn,
    });

    let stats = await getQueueStats();
    assert.strictEqual(stats.pending, 3, 'All 3 actions must have Pending Sync status');
    assert.strictEqual(stats.conflict, 0);

    // Flush should safely no-op when offline
    const offlineFlush = await flushOfflineQueue();
    assert.strictEqual(offlineFlush.synced, 0);
    assert.strictEqual(offlineFlush.total, 3);
    assert.ok(offlineFlush.error.includes('Offline mode active'));
    console.log('  ✓ 3 actions queued locally in SQLite with client-side UUID keys; flush safely paused offline');

    // -------------------------------------------------------------
    // Check 4: Auto-Flush when Connectivity Returns (Offline -> Online)
    // -------------------------------------------------------------
    console.log('▶ [4/8] Testing Automatic Flush when Connectivity Returns...');
    let autoFlushReceived = false;

    // Mock apiClient.post for /staff/sync
    const originalPost = apiClient.post;
    let syncRequestBody = null;

    apiClient.post = async (url, data) => {
        if (url === '/staff/sync') {
            syncRequestBody = data;
            return {
                data: {
                    success: true,
                    data: {
                        total: data.actions.length,
                        synced_count: data.actions.length,
                        failed_count: 0,
                        items: data.actions.map((act) => ({
                            idempotency_key: act.idempotency_key,
                            action_type: act.action_type,
                            status: 'success',
                            data: { processed: true },
                        })),
                    },
                },
            };
        }
        return originalPost(url, data);
    };

    // Register auto-sync
    initAutoSync({
        onSyncComplete: (res) => {
            autoFlushReceived = true;
        },
        pollIntervalMs: 0,
    });

    // Toggle connectivity online: should trigger auto-flush immediately!
    setOnlineStatus(true);

    // Wait a tick for async auto-sync to execute
    await new Promise((r) => setTimeout(r, 50));

    assert.ok(autoFlushReceived, 'Auto-sync must trigger automatically on reconnect');
    assert.strictEqual(syncRequestBody.actions.length, 3, 'All 3 queued actions flushed in batch');

    stats = await getQueueStats();
    assert.strictEqual(stats.synced, 3, 'All 3 actions successfully marked synced');
    assert.strictEqual(stats.pending, 0);

    stopAutoSync();
    console.log('  ✓ Auto-sync flushed queue seamlessly upon network reconnect');

    // -------------------------------------------------------------
    // Check 5: Mixed Batch Response with Transient vs Permanent Failures
    // -------------------------------------------------------------
    console.log('▶ [5/8] Testing Per-Item Response: 1 Success, 1 Transient Failure, 1 Permanent Conflict...');
    await truncateQueue();

    // Enqueue 3 new items
    const kSuccess = generateIdempotencyKey();
    await enqueueAction({
        actionType: 'create_booking',
        endpoint: '/staff/bookings',
        payload: { bike_id: 1 },
        idempotencyKey: kSuccess,
    });

    const kTransient = generateIdempotencyKey();
    await enqueueAction({
        actionType: 'collect_payment',
        endpoint: '/staff/bookings/1/payment',
        payload: { amount: 2000 },
        idempotencyKey: kTransient,
    });

    const kConflict = generateIdempotencyKey();
    await enqueueAction({
        actionType: 'create_booking',
        endpoint: '/staff/bookings',
        payload: { bike_id: 99 },
        idempotencyKey: kConflict,
    });

    // Mock response with mixed statuses
    apiClient.post = async (url, data) => {
        return {
            data: {
                success: true,
                data: {
                    items: [
                        {
                            idempotency_key: kSuccess,
                            action_type: 'create_booking',
                            status: 'success',
                            data: { booking_id: 101 },
                        },
                        {
                            idempotency_key: kTransient,
                            action_type: 'collect_payment',
                            status: 'failed',
                            error: 'Lock wait timeout exceeded; try restarting transaction',
                        },
                        {
                            idempotency_key: kConflict,
                            action_type: 'create_booking',
                            status: 'failed',
                            error: 'Bike is not available for the requested dates (Already Booked)',
                        },
                    ],
                },
            },
        };
    };

    const batchResult = await flushOfflineQueue({ maxRetries: 3 });
    assert.strictEqual(batchResult.synced, 1);
    assert.strictEqual(batchResult.failed, 1);
    assert.strictEqual(batchResult.conflicts, 1);

    stats = await getQueueStats();
    assert.strictEqual(stats.synced, 1);
    assert.strictEqual(stats.failed, 1, 'Transient error kept in failed retry state');
    assert.strictEqual(stats.conflict, 1, 'Permanent domain error escalated to conflict_error');

    // Only the transient item should remain in pending actions for next automated retry!
    const remainingPending = await getPendingActions();
    assert.strictEqual(remainingPending.length, 1);
    assert.strictEqual(remainingPending[0].idempotency_key, kTransient, 'Only retryable actions retried');
    console.log('  ✓ Mixed batch: Succeeded marked synced, transient kept for retry, conflict surfaced to staff');

    // -------------------------------------------------------------
    // Check 6: Retry Limit Escalation (Transient -> Conflict after maxRetries)
    // -------------------------------------------------------------
    console.log('▶ [6/8] Verifying Retry Limit Escalation to Conflict Error...');
    // Retry transient item 2 more times to exceed maxRetries (3)
    await markRetryableFailure(kTransient, 'Network timeout', 3); // retry_count -> 2
    await markRetryableFailure(kTransient, 'Network timeout', 3); // retry_count -> 3 (exceeded maxRetries)

    stats = await getQueueStats();
    assert.strictEqual(stats.conflict, 2, 'Both conflict items require staff attention');
    assert.strictEqual(stats.failed, 0, 'No more automatic retry candidates remaining');

    const failedItems = await getFailedActions(3);
    assert.strictEqual(failedItems.length, 2);
    console.log('  ✓ Repeated transient failures escalated to conflict_error after 3 attempts');

    // -------------------------------------------------------------
    // Check 7: Staff Resolution Actions (Retry vs Discard)
    // -------------------------------------------------------------
    console.log('▶ [7/8] Testing Staff Resolution Actions: "Retry Action" and "Discard Action"...');
    // Staff decides to retry kTransient
    await retryFailedAction(kTransient);
    stats = await getQueueStats();
    assert.strictEqual(stats.pending, 1, 'kTransient reset back to pending for immediate sync');
    assert.strictEqual(stats.conflict, 1);

    // Staff decides to discard unresolvable conflict kConflict
    await dismissFailedAction(kConflict);
    stats = await getQueueStats();
    assert.strictEqual(stats.conflict, 0, 'kConflict removed from queue upon staff discard');
    console.log('  ✓ Staff actions "Retry Action" and "Discard Action" work as expected');

    // -------------------------------------------------------------
    // Check 8: Restore API client and cleanup
    // -------------------------------------------------------------
    console.log('▶ [8/8] Verifying Queue Cleaning & Database State...');
    apiClient.post = originalPost;
    await clearSynced(0);
    await truncateQueue();
    stats = await getQueueStats();
    assert.strictEqual(stats.total, 0);
    console.log('  ✓ Queue cleaned and test state restored');

    console.log('\n🎉 ALL 8 OFFLINE-RESILIENCE CHECKS PASSED!');
    console.log('   Pending Sync indicator, auto-sync on reconnect, and retry vs conflict handling are fully verified.\n');
}

runOfflineResilienceChecks().catch((err) => {
    console.error('\n❌ OFFLINE-RESILIENCE CHECK FAILED:', err);
    process.exit(1);
});
