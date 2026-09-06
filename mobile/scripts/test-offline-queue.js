/**
 * Self-check script for React Native Mobile Staff App:
 * 1. UUID v4 Idempotency Key validation
 * 2. API client request interceptors & headers
 * 3. Local SQLite offline action queue CRUD & state transitions
 * 4. Batch sync payload structure matching backend SyncController
 */

import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import { generateIdempotencyKey } from '../src/api/idempotency.js';
import { apiClient, setAuthToken, getAuthToken } from '../src/api/client.js';
import { setDatabaseDriver } from '../src/storage/database.js';
import {
    enqueueAction,
    getPendingActions,
    markSyncing,
    markSynced,
    markFailed,
    getQueueStats,
    clearSynced,
    truncateQueue,
    ActionStatus,
} from '../src/storage/queue.js';
import { flushOfflineQueue } from '../src/services/syncService.js';

async function runAllChecks() {
    console.log('🚀 Starting GK Whizwheel Mobile Offline Queue & API Client Self-Check...\n');

    // -------------------------------------------------------------
    // Check 1: Idempotency Key Format (UUID v4)
    // -------------------------------------------------------------
    console.log('▶ [1/6] Verifying Idempotency-Key RFC4122 v4 UUID generator...');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();

    assert.ok(uuidRegex.test(key1), `Generated key1 "${key1}" must match UUID v4 regex`);
    assert.ok(uuidRegex.test(key2), `Generated key2 "${key2}" must match UUID v4 regex`);
    assert.notStrictEqual(key1, key2, 'Two consecutive idempotency keys must be unique');
    console.log('  ✓ UUID v4 generated successfully:', key1);

    // -------------------------------------------------------------
    // Check 2: API Client Interceptors & Headers
    // -------------------------------------------------------------
    console.log('▶ [2/6] Verifying API client interceptors (Auth & Idempotency-Key)...');
    setAuthToken('test_sanctum_token_12345');
    assert.strictEqual(getAuthToken(), 'test_sanctum_token_12345');

    // Test mutating request interceptor behavior (POST)
    const mockPostConfig = {
        method: 'POST',
        url: '/staff/bookings',
        headers: {},
    };
    // Trigger interceptor
    const interceptedPost = await apiClient.interceptors.request.handlers[0].fulfilled(mockPostConfig);
    assert.strictEqual(interceptedPost.headers['Authorization'], 'Bearer test_sanctum_token_12345');
    assert.ok(interceptedPost.headers['Idempotency-Key'], 'Mutating POST request must have Idempotency-Key');
    assert.ok(uuidRegex.test(interceptedPost.headers['Idempotency-Key']), 'Idempotency-Key must be a valid UUID v4');

    // Test idempotency key preservation when already provided (e.g. offline queue retry)
    const customKey = 'pre-generated-uuid-v4-abc';
    const mockRetryConfig = {
        method: 'POST',
        url: '/staff/bookings',
        headers: { 'Idempotency-Key': customKey },
    };
    const interceptedRetry = await apiClient.interceptors.request.handlers[0].fulfilled(mockRetryConfig);
    assert.strictEqual(interceptedRetry.headers['Idempotency-Key'], customKey, 'Existing Idempotency-Key must not be overwritten');

    // Test non-mutating request (GET)
    const mockGetConfig = {
        method: 'GET',
        url: '/staff/bikes',
        headers: {},
    };
    const interceptedGet = await apiClient.interceptors.request.handlers[0].fulfilled(mockGetConfig);
    assert.strictEqual(interceptedGet.headers['Idempotency-Key'], undefined, 'GET requests must not have Idempotency-Key');
    console.log('  ✓ API client correctly manages Bearer token and automatic Idempotency-Key header injection');

    // -------------------------------------------------------------
    // Check 3: SQLite Storage & Table Initialization
    // -------------------------------------------------------------
    console.log('▶ [3/6] Initializing in-memory SQLite storage for offline queue...');
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

    // -------------------------------------------------------------
    // Check 4: Enqueue Offline Action with Client-Side Idempotency-Key
    // -------------------------------------------------------------
    console.log('▶ [4/6] Testing action enqueueing into local SQLite...');
    await truncateQueue();

    const action1 = await enqueueAction({
        actionType: 'create_booking',
        endpoint: '/staff/bookings',
        payload: {
            bike_id: 42,
            customer_phone: '+919999988888',
            start_date: '2026-09-10',
            end_date: '2026-09-12',
            pickup_store_id: 2,
            return_store_id: 2,
        },
    });

    assert.ok(action1.id > 0, 'Enqueued action must return auto-incremented SQLite id');
    assert.ok(uuidRegex.test(action1.idempotency_key), 'Enqueued action must have client-side UUID v4 key');
    assert.strictEqual(action1.status, ActionStatus.PENDING);
    assert.strictEqual(action1.payload.bike_id, 42);

    const action2 = await enqueueAction({
        actionType: 'handover',
        endpoint: '/staff/bookings/42/handover',
        payload: {
            booking_id: 42,
            odometer_reading: 5120,
        },
    });

    assert.ok(action2.id > action1.id);
    console.log(`  ✓ Successfully enqueued 2 actions. First key: ${action1.idempotency_key}`);

    // -------------------------------------------------------------
    // Check 5: Queue FIFO Retrieval and State Transitions
    // -------------------------------------------------------------
    console.log('▶ [5/6] Testing queue retrieval, state transitions, and stats...');
    let pending = await getPendingActions();
    assert.strictEqual(pending.length, 2);
    assert.strictEqual(pending[0].id, action1.id, 'FIFO ordering respected');
    assert.strictEqual(pending[0].action_type, 'create_booking');

    // Mark syncing
    await markSyncing([action1.id]);
    let stats = await getQueueStats();
    assert.strictEqual(stats.syncing, 1);
    assert.strictEqual(stats.pending, 1);

    // Mark action1 synced
    await markSynced(action1.idempotency_key);
    stats = await getQueueStats();
    assert.strictEqual(stats.synced, 1);
    assert.strictEqual(stats.syncing, 0);

    // Mark action2 failed
    await markFailed(action2.idempotency_key, 'Network timeout');
    stats = await getQueueStats();
    assert.strictEqual(stats.failed, 1);
    assert.strictEqual(stats.total, 2);

    // Pending should now re-fetch failed items with retry_count < 5
    pending = await getPendingActions();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].id, action2.id);
    assert.strictEqual(pending[0].retry_count, 1);
    assert.strictEqual(pending[0].error_message, 'Network timeout');
    console.log('  ✓ Queue state transitions (pending -> syncing -> synced/failed) and retry count verified');

    // -------------------------------------------------------------
    // Check 6: Sync Service Drain and Batch Response Handling
    // -------------------------------------------------------------
    console.log('▶ [6/6] Testing Sync Service flush to POST /api/v1/staff/sync...');
    // Mock apiClient.post for /staff/sync endpoint
    const originalPost = apiClient.post;
    let syncCallPayload = null;

    apiClient.post = async (url, data) => {
        if (url === '/staff/sync') {
            syncCallPayload = data;
            return {
                data: {
                    results: [
                        {
                            idempotency_key: data.actions[0].idempotency_key,
                            action_type: data.actions[0].action_type,
                            status: 'success',
                            data: { booking_id: 99 },
                        },
                    ],
                },
            };
        }
        return originalPost(url, data);
    };

    const syncResult = await flushOfflineQueue({ deviceId: 'test_pos_terminal_01' });
    assert.strictEqual(syncResult.synced, 1);
    assert.strictEqual(syncResult.failed, 0);
    assert.strictEqual(syncCallPayload.device_id, 'test_pos_terminal_01');
    assert.strictEqual(syncCallPayload.actions.length, 1);
    assert.strictEqual(syncCallPayload.actions[0].idempotency_key, action2.idempotency_key);

    // Queue stats after sync
    stats = await getQueueStats();
    assert.strictEqual(stats.synced, 2);
    assert.strictEqual(stats.pending, 0);
    assert.strictEqual(stats.failed, 0);

    // Clear synced
    await clearSynced(0);
    stats = await getQueueStats();
    assert.strictEqual(stats.total, 0, 'clearSynced should remove all processed records');

    // Restore apiClient.post
    apiClient.post = originalPost;

    console.log('  ✓ Sync Service correctly formulated batch payload and processed per-item server response');
    console.log('\n🎉 ALL 6 CHECKS PASSED! React Native Android Offline Queue and API Client are fully operational.\n');
}

runAllChecks().catch((err) => {
    console.error('\n❌ SELF-CHECK FAILED:', err);
    process.exit(1);
});
