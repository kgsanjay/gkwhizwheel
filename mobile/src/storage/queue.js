/**
 * Offline Action Queue Repository.
 * Handles local persistence of pending operations when connectivity is unavailable.
 * Follows 04-CODING-STANDARDS-AND-STRUCTURE.md Section 4:
 * Generates client-side UUID idempotency key at the moment an action is taken (not at sync time).
 */

import { executeSql, initDatabase } from './database.js';
import { generateIdempotencyKey } from '../api/idempotency.js';

export const ActionStatus = {
    PENDING: 'pending',
    SYNCING: 'syncing',
    SYNCED: 'synced',
    FAILED: 'failed', // Transient error, eligible for automatic retry
    CONFLICT_ERROR: 'conflict_error', // Permanent business error / exceeded retries, surfaced to staff
};

/**
 * Enqueue a new offline action to local SQLite.
 *
 * @param {object} params
 * @param {string} params.actionType - E.g. 'create_booking', 'collect_payment', 'handover', 'return'
 * @param {string} params.endpoint - Target API route, e.g. '/staff/bookings'
 * @param {object} params.payload - Action payload object
 * @param {string} [params.method='POST'] - HTTP method
 * @param {string} [params.idempotencyKey] - Optional client key, auto-generated if omitted
 * @returns {Promise<object>} Created queue record
 */
export async function enqueueAction({
    actionType,
    endpoint,
    payload = {},
    method = 'POST',
    idempotencyKey = null,
}) {
    await initDatabase();

    const key = idempotencyKey || generateIdempotencyKey();
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const createdAt = new Date().toISOString();

    const sql = `
        INSERT INTO offline_actions (
            idempotency_key, action_type, endpoint, method, payload, status, retry_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?);
    `;

    const result = await executeSql(sql, [
        key,
        actionType,
        endpoint,
        method.toUpperCase(),
        payloadStr,
        ActionStatus.PENDING,
        createdAt,
    ]);

    return {
        id: result.insertId,
        idempotency_key: key,
        action_type: actionType,
        endpoint,
        method: method.toUpperCase(),
        payload,
        status: ActionStatus.PENDING,
        retry_count: 0,
        created_at: createdAt,
    };
}

/**
 * Get all pending actions waiting to be synchronized (FIFO order).
 * Only returns pending or transient failed actions under maxRetries.
 *
 * @param {number} [limit=50]
 * @param {number} [maxRetries=3]
 * @returns {Promise<Array<object>>}
 */
export async function getPendingActions(limit = 50, maxRetries = 3) {
    await initDatabase();

    const sql = `
        SELECT * FROM offline_actions
        WHERE status = ? OR (status = ? AND retry_count < ?)
        ORDER BY id ASC
        LIMIT ?;
    `;

    const result = await executeSql(sql, [
        ActionStatus.PENDING,
        ActionStatus.FAILED,
        maxRetries,
        limit,
    ]);

    return (result.rows || []).map((row) => {
        let parsedPayload = {};
        try {
            parsedPayload = JSON.parse(row.payload);
        } catch {
            parsedPayload = row.payload;
        }

        return {
            ...row,
            payload: parsedPayload,
        };
    });
}

/**
 * Get all failed / conflict actions that require staff attention.
 *
 * @param {number} [maxRetries=3]
 * @returns {Promise<Array<object>>}
 */
export async function getFailedActions(maxRetries = 3) {
    await initDatabase();

    const sql = `
        SELECT * FROM offline_actions
        WHERE status = ? OR (status = ? AND retry_count >= ?)
        ORDER BY id DESC;
    `;

    const result = await executeSql(sql, [
        ActionStatus.CONFLICT_ERROR,
        ActionStatus.FAILED,
        maxRetries,
    ]);

    return (result.rows || []).map((row) => {
        let parsedPayload = {};
        try {
            parsedPayload = JSON.parse(row.payload);
        } catch {
            parsedPayload = row.payload;
        }

        return {
            ...row,
            payload: parsedPayload,
        };
    });
}

/**
 * Mark specified actions as in-flight / syncing.
 * @param {Array<number>} ids
 */
export async function markSyncing(ids = []) {
    if (!ids.length) return;
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE offline_actions SET status = ? WHERE id IN (${placeholders});`;
    await executeSql(sql, [ActionStatus.SYNCING, ...ids]);
}

/**
 * Mark an action as successfully synchronized.
 * @param {string} idempotencyKey
 */
export async function markSynced(idempotencyKey) {
    const syncedAt = new Date().toISOString();
    const sql = `
        UPDATE offline_actions
        SET status = ?, synced_at = ?, error_message = NULL
        WHERE idempotency_key = ?;
    `;
    await executeSql(sql, [ActionStatus.SYNCED, syncedAt, idempotencyKey]);
}

/**
 * Mark an action as failed with transient / retryable error.
 * Automatically escalates to CONFLICT_ERROR if retry limit is reached.
 *
 * @param {string} idempotencyKey
 * @param {string} errorMessage
 * @param {number} [maxRetries=3]
 */
export async function markRetryableFailure(idempotencyKey, errorMessage = '', maxRetries = 3) {
    await initDatabase();

    // Check current retry count
    const selectSql = `SELECT retry_count FROM offline_actions WHERE idempotency_key = ?;`;
    const checkRes = await executeSql(selectSql, [idempotencyKey]);
    const currentRetries = checkRes.rows?.[0]?.retry_count || 0;
    const nextRetries = currentRetries + 1;
    const nextStatus = nextRetries >= maxRetries ? ActionStatus.CONFLICT_ERROR : ActionStatus.FAILED;

    const sql = `
        UPDATE offline_actions
        SET status = ?, retry_count = ?, error_message = ?
        WHERE idempotency_key = ?;
    `;
    await executeSql(sql, [nextStatus, nextRetries, errorMessage, idempotencyKey]);
}

/**
 * Mark an action as permanent failure / conflict error (e.g. 422, bike already booked).
 * Surfaced to staff for review without endless automated retries.
 *
 * @param {string} idempotencyKey
 * @param {string} errorMessage
 */
export async function markPermanentFailure(idempotencyKey, errorMessage = '') {
    const sql = `
        UPDATE offline_actions
        SET status = ?, error_message = ?
        WHERE idempotency_key = ?;
    `;
    await executeSql(sql, [ActionStatus.CONFLICT_ERROR, errorMessage, idempotencyKey]);
}

/**
 * Backwards-compatible generic failure handler.
 * @param {string} idempotencyKey
 * @param {string} errorMessage
 */
export async function markFailed(idempotencyKey, errorMessage = '') {
    await markRetryableFailure(idempotencyKey, errorMessage, 5);
}

/**
 * Staff manual action: Reset a failed/conflict action so it can be retried immediately.
 * @param {string} idempotencyKey
 */
export async function retryFailedAction(idempotencyKey) {
    const sql = `
        UPDATE offline_actions
        SET status = ?, retry_count = 0, error_message = NULL
        WHERE idempotency_key = ?;
    `;
    await executeSql(sql, [ActionStatus.PENDING, idempotencyKey]);
}

/**
 * Staff manual action: Dismiss / discard a failed action that cannot be resolved.
 * @param {string} idempotencyKey
 */
export async function dismissFailedAction(idempotencyKey) {
    const sql = `DELETE FROM offline_actions WHERE idempotency_key = ?;`;
    await executeSql(sql, [idempotencyKey]);
}

/**
 * Get count summary of the offline queue for UI badges / alerts.
 * @returns {Promise<{ pending: number, syncing: number, synced: number, failed: number, conflict: number, total: number }>}
 */
export async function getQueueStats() {
    await initDatabase();

    const sql = `
        SELECT status, COUNT(*) as count
        FROM offline_actions
        GROUP BY status;
    `;

    const result = await executeSql(sql);
    const stats = {
        [ActionStatus.PENDING]: 0,
        [ActionStatus.SYNCING]: 0,
        [ActionStatus.SYNCED]: 0,
        [ActionStatus.FAILED]: 0,
        [ActionStatus.CONFLICT_ERROR]: 0,
        conflict: 0,
        total: 0,
    };

    for (const row of result.rows || []) {
        if (stats[row.status] !== undefined) {
            stats[row.status] = Number(row.count);
        }
        stats.total += Number(row.count);
    }

    stats.conflict = stats[ActionStatus.CONFLICT_ERROR];

    return stats;
}

/**
 * Purge synced records older than specified days.
 * @param {number} [days=7]
 */
export async function clearSynced(days = 7) {
    await initDatabase();
    const cutoffDate = new Date(Date.now() - days * 86400000 + 1000).toISOString();
    const sql = `
        DELETE FROM offline_actions
        WHERE status = ? AND synced_at <= ?;
    `;
    await executeSql(sql, [ActionStatus.SYNCED, cutoffDate]);
}

/**
 * Truncate entire offline queue (useful for testing or full resets).
 */
export async function truncateQueue() {
    await initDatabase();
    await executeSql('DELETE FROM offline_actions;');
}

export default {
    ActionStatus,
    enqueueAction,
    getPendingActions,
    getFailedActions,
    markSyncing,
    markSynced,
    markRetryableFailure,
    markPermanentFailure,
    markFailed,
    retryFailedAction,
    dismissFailedAction,
    getQueueStats,
    clearSynced,
    truncateQueue,
};
