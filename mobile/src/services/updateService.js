/**
 * In-App Version Update Checker Service.
 * Periodically or on launch calls /staff/app-version.
 * If a newer APK is available on the server, surfaces direct download link.
 */

import { apiClient } from '../api/client.js';
import { CURRENT_APP_VERSION } from '../config/version.js';

/**
 * Compare two semver strings (e.g. '1.2.0' vs '1.0.0').
 *
 * @param {string} v1 - Version string A
 * @param {string} v2 - Version string B
 * @returns {number} 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareSemver(v1, v2) {
    if (!v1 || !v2) return 0;

    const parse = (v) =>
        String(v)
            .trim()
            .replace(/^v/i, '')
            .split('.')
            .map((num) => parseInt(num, 10) || 0);

    const parts1 = parse(v1);
    const parts2 = parse(v2);
    const maxLength = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < maxLength; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    return 0;
}

/**
 * Check if the latest available version is strictly newer than current version.
 *
 * @param {string} latestVersion
 * @param {string} [currentVersion=CURRENT_APP_VERSION]
 * @returns {boolean}
 */
export function isUpdateAvailable(latestVersion, currentVersion = CURRENT_APP_VERSION) {
    return compareSemver(latestVersion, currentVersion) > 0;
}

/**
 * Fetch latest APK release information from the server.
 *
 * @param {string} [currentVersion=CURRENT_APP_VERSION]
 * @returns {Promise<{
 *   hasUpdate: boolean,
 *   currentVersion: string,
 *   latestVersion?: string,
 *   apkUrl?: string,
 *   releaseNotes?: string,
 *   minRequiredVersion?: string,
 *   isMandatory?: boolean,
 *   error?: string
 * }>}
 */
export async function checkAppVersion(currentVersion = CURRENT_APP_VERSION) {
    try {
        const response = await apiClient.get('/staff/app-version');
        const data = response?.data?.data || response?.data || {};
        const latestVersion = data.latest_version || currentVersion;
        const hasUpdate = isUpdateAvailable(latestVersion, currentVersion);
        const minVersion = data.min_required_version || '1.0.0';
        const isMandatory = compareSemver(minVersion, currentVersion) > 0;

        return {
            hasUpdate,
            currentVersion,
            latestVersion,
            apkUrl: data.apk_url || '',
            releaseNotes: data.release_notes || 'New stability improvements and features.',
            minRequiredVersion: minVersion,
            isMandatory,
        };
    } catch (error) {
        // Network offline or endpoint unreachable: don't block staff work
        return {
            hasUpdate: false,
            currentVersion,
            error: error.message || 'Unable to check for updates.',
        };
    }
}

export default {
    compareSemver,
    isUpdateAvailable,
    checkAppVersion,
};
