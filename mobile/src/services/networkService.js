/**
 * Network Connectivity Service.
 * Tracks online/offline status, manages connection state listeners,
 * and triggers automated sync flushes when connectivity is restored.
 */

let _isOnline = true;
const listeners = new Set();

/**
 * Check if the mobile app currently has network connectivity.
 * @returns {boolean}
 */
export function isOnline() {
    return _isOnline;
}

/**
 * Subscribe to network connectivity state changes.
 *
 * @param {Function} callback - Called with (isOnline: boolean)
 * @returns {Function} Unsubscribe function
 */
export function addConnectivityListener(callback) {
    if (typeof callback === 'function') {
        listeners.add(callback);
    }
    return () => {
        listeners.delete(callback);
    };
}

/**
 * Manually update network connectivity state.
 * Triggers all registered listeners and optionally triggers auto-sync on reconnect.
 *
 * @param {boolean} status - New online state
 * @returns {boolean} Whether state actually changed
 */
export function setOnlineStatus(status) {
    const nextStatus = Boolean(status);
    const hasChanged = _isOnline !== nextStatus;
    _isOnline = nextStatus;

    if (hasChanged) {
        for (const listener of listeners) {
            try {
                listener(_isOnline);
            } catch (err) {
                console.error('Error in connectivity listener:', err);
            }
        }
    }

    return hasChanged;
}

/**
 * Active ping to verify backend reachability.
 * Useful for checking real connectivity beyond device WiFi link state.
 *
 * @param {string} [pingUrl='/public/bikes?limit=1']
 * @returns {Promise<boolean>}
 */
export async function checkConnectivity(pingUrl = '/public/bikes?limit=1') {
    try {
        // If simulated offline, return false immediately
        if (!_isOnline) {
            return false;
        }

        // Dynamically import apiClient to prevent circular deps
        const { apiClient } = await import('../api/client.js');
        const response = await apiClient.get(pingUrl, { timeout: 4000 });
        const reachable = response && (response.status === 200 || response.data?.success !== undefined);
        setOnlineStatus(reachable);
        return reachable;
    } catch {
        setOnlineStatus(false);
        return false;
    }
}

export default {
    isOnline,
    addConnectivityListener,
    setOnlineStatus,
    checkConnectivity,
};
