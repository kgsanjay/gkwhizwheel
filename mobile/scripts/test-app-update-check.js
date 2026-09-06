/**
 * Self-Check Test Script for In-App Version Update Checker:
 * 1. Semantic version comparison logic (major, minor, patch, prefixes)
 * 2. Update detection against server /staff/app-version endpoint
 * 3. Direct APK download link extraction and release notes
 * 4. Mandatory update threshold evaluation
 * 5. Offline resilience (graceful fallback when endpoint unreachable on launch)
 */

import assert from 'node:assert';
import { apiClient } from '../src/api/client.js';
import { CURRENT_APP_VERSION } from '../src/config/version.js';
import {
    compareSemver,
    isUpdateAvailable,
    checkAppVersion,
} from '../src/services/updateService.js';

async function runUpdateCheckTests() {
    console.log('🚀 Starting GK Whizwheel In-App Update Checker Self-Check...\n');

    // -------------------------------------------------------------
    // Check 1: Semver Comparison Engine
    // -------------------------------------------------------------
    console.log('▶ [1/5] Verifying Semver comparison algorithm and edge cases...');
    assert.strictEqual(compareSemver('1.2.0', '1.0.0'), 1, '1.2.0 should be greater than 1.0.0');
    assert.strictEqual(compareSemver('1.0.1', '1.0.0'), 1, '1.0.1 should be greater than 1.0.0');
    assert.strictEqual(compareSemver('1.0.0', '1.0.0'), 0, 'Identical versions should return 0');
    assert.strictEqual(compareSemver('0.9.8', '1.0.0'), -1, '0.9.8 should be less than 1.0.0');
    assert.strictEqual(compareSemver('2.0.0', '1.9.9'), 1, 'Major version bump takes precedence');
    assert.strictEqual(compareSemver('v1.3.0', '1.2.9'), 1, 'Prefix "v" should be handled seamlessly');
    assert.strictEqual(compareSemver('1.10.0', '1.2.0'), 1, 'Double digit minor version handled numerically');

    assert.strictEqual(isUpdateAvailable('1.2.0', '1.0.0'), true);
    assert.strictEqual(isUpdateAvailable('1.0.0', '1.0.0'), false);
    assert.strictEqual(isUpdateAvailable('0.9.9', '1.0.0'), false);
    console.log('  ✓ Semver comparison and update availability logic verified');

    // -------------------------------------------------------------
    // Check 2: Fetch and Detect Newer Version from Backend
    // -------------------------------------------------------------
    console.log('▶ [2/5] Testing Update Detection from /staff/app-version endpoint...');
    const originalGet = apiClient.get;

    // Mock apiClient.get for /staff/app-version
    apiClient.get = async (url) => {
        if (url === '/staff/app-version') {
            return {
                status: 200,
                data: {
                    success: true,
                    data: {
                        latest_version: '1.2.0',
                        min_required_version: '1.0.0',
                        apk_url: 'https://gkwhizwheel.in/downloads/gkwhizwheel-staff-v1.2.0.apk',
                        release_notes: 'Added offline resilience and instant bike return photo comparison.',
                        published_at: '2026-09-06',
                    },
                },
            };
        }
        return originalGet(url);
    };

    const updateResult = await checkAppVersion('1.0.0');
    assert.strictEqual(updateResult.hasUpdate, true, 'Should detect update from 1.0.0 to 1.2.0');
    assert.strictEqual(updateResult.latestVersion, '1.2.0');
    assert.strictEqual(
        updateResult.apkUrl,
        'https://gkwhizwheel.in/downloads/gkwhizwheel-staff-v1.2.0.apk',
        'Direct APK download URL must be extracted'
    );
    assert.ok(updateResult.releaseNotes.includes('offline resilience'));
    assert.strictEqual(updateResult.isMandatory, false);
    console.log('  ✓ Newer APK detected: v1.2.0 with direct download link and release notes');

    // -------------------------------------------------------------
    // Check 3: Current App Already on Latest Version
    // -------------------------------------------------------------
    console.log('▶ [3/5] Testing App when already up to date...');
    const upToDateResult = await checkAppVersion('1.2.0');
    assert.strictEqual(upToDateResult.hasUpdate, false, 'Should report no update when already on 1.2.0');
    assert.strictEqual(upToDateResult.latestVersion, '1.2.0');
    console.log('  ✓ No update prompt when already running v1.2.0');

    // -------------------------------------------------------------
    // Check 4: Mandatory Update Threshold Evaluation
    // -------------------------------------------------------------
    console.log('▶ [4/5] Testing Mandatory Update evaluation...');
    apiClient.get = async (url) => {
        if (url === '/staff/app-version') {
            return {
                status: 200,
                data: {
                    success: true,
                    data: {
                        latest_version: '2.0.0',
                        min_required_version: '1.5.0', // Higher than current 1.0.0
                        apk_url: 'https://gkwhizwheel.in/downloads/gkwhizwheel-staff-v2.0.0.apk',
                        release_notes: 'Critical protocol upgrade.',
                    },
                },
            };
        }
        return originalGet(url);
    };

    const mandatoryResult = await checkAppVersion('1.0.0');
    assert.strictEqual(mandatoryResult.hasUpdate, true);
    assert.strictEqual(mandatoryResult.isMandatory, true, 'Version below min_required_version must be mandatory');
    console.log('  ✓ Mandatory update flag correctly set when current version is below min_required_version');

    // -------------------------------------------------------------
    // Check 5: Offline Resilience (No Crashes if Launch is Offline)
    // -------------------------------------------------------------
    console.log('▶ [5/5] Testing Launch when Offline (Server Unreachable)...');
    apiClient.get = async (url) => {
        if (url === '/staff/app-version') {
            throw new Error('Network Error: Unable to connect to host');
        }
        return originalGet(url);
    };

    const offlineResult = await checkAppVersion('1.0.0');
    assert.strictEqual(offlineResult.hasUpdate, false, 'Must gracefully report no update when offline');
    assert.ok(offlineResult.error.includes('Network Error'));
    console.log('  ✓ Offline launch handled gracefully without throwing or blocking staff');

    // Restore apiClient
    apiClient.get = originalGet;

    console.log('\n🎉 ALL 5 IN-APP UPDATE CHECKS PASSED!');
    console.log('   In-app update check, semver comparison, and direct APK download prompt are fully verified.\n');
}

runUpdateCheckTests().catch((err) => {
    console.error('\n❌ UPDATE CHECK TEST FAILED:', err);
    process.exit(1);
});
