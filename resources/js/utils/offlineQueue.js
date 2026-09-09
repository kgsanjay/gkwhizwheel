/**
 * Offline Pass Verification Queue using native browser IndexedDB.
 * Designed for ground coordinators at remote jetties (Mavinkurve, Sharavathi, Netrani).
 * Zero external dependencies.
 */

const DB_NAME = 'GKWhizWheelOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'checkin_queue';

function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            reject(new Error('IndexedDB is not supported in this environment'));
            return;
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'client_id' });
                store.createIndex('created_at', 'created_at', { unique: false });
                store.createIndex('booking_number', 'booking_number', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    });
}

/**
 * Queue an offline check-in action.
 * @param {Object} item
 * @returns {Promise<Object>} The saved queue record
 */
export async function saveOfflineAction(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const clientId = item.client_id || `offline-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const record = {
            ...item,
            client_id: clientId,
            queued_at: item.queued_at || new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }),
            created_at: item.created_at || Date.now(),
        };

        const request = store.put(record);

        request.onsuccess = () => resolve(record);
        request.onerror = () => reject(request.error || new Error('Failed to save to offline queue'));
    });
}

/**
 * Retrieve all pending offline check-in actions sorted by created_at.
 * @returns {Promise<Array>}
 */
export async function getPendingOfflineActions() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const items = request.result || [];
            items.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
            resolve(items);
        };
        request.onerror = () => reject(request.error || new Error('Failed to read offline queue'));
    });
}

/**
 * Remove an item from the queue after successful sync.
 * @param {string} clientId
 * @returns {Promise<void>}
 */
export async function removeOfflineAction(clientId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(clientId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Failed to delete offline item'));
    });
}

/**
 * Remove multiple items from the queue.
 * @param {Array<string>} clientIds
 * @returns {Promise<void>}
 */
export async function removeOfflineActions(clientIds) {
    if (!clientIds || clientIds.length === 0) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        clientIds.forEach((id) => {
            store.delete(id);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('Failed to delete batch items'));
    });
}

/**
 * Clear all pending actions.
 * @returns {Promise<void>}
 */
export async function clearOfflineActions() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error || new Error('Failed to clear queue'));
    });
}

/**
 * Get count of pending queued actions.
 * @returns {Promise<number>}
 */
export async function getPendingCount() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.count();

            request.onsuccess = () => resolve(request.result || 0);
            request.onerror = () => reject(request.error || new Error('Failed to count queue'));
        });
    } catch {
        return 0;
    }
}
