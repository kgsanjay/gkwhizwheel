import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext.js';
import LoginScreen from './src/screens/LoginScreen.js';
import StoreSwitcherModal from './src/components/StoreSwitcherModal.js';
import WalkInFlowScreen from './src/screens/WalkInFlowScreen.js';
import ReturnFlowScreen from './src/screens/ReturnFlowScreen.js';
import {
    enqueueAction,
    getPendingActions,
    getFailedActions,
    retryFailedAction,
    dismissFailedAction,
    getQueueStats,
    clearSynced,
} from './src/storage/queue.js';
import { flushOfflineQueue, initAutoSync, stopAutoSync } from './src/services/syncService.js';
import { isOnline, setOnlineStatus, addConnectivityListener } from './src/services/networkService.js';
import { checkAppVersion } from './src/services/updateService.js';
import { CURRENT_APP_VERSION } from './src/config/version.js';
import UpdatePromptModal from './src/components/UpdatePromptModal.js';
import { generateIdempotencyKey } from './src/api/idempotency.js';

function MainStaffApp() {
    const { user, isAuthenticated, assignedStores, currentStore, selectStore, logout } = useAuth();

    const [stats, setStats] = useState({ pending: 0, syncing: 0, synced: 0, failed: 0, conflict: 0, total: 0 });
    const [pendingList, setPendingList] = useState([]);
    const [failedList, setFailedList] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [networkOnline, setNetworkOnline] = useState(isOnline());
    const [updateInfo, setUpdateInfo] = useState(null);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isStoreSwitcherOpen, setIsStoreSwitcherOpen] = useState(false);
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'walkin' | 'return'

    const refreshQueue = useCallback(async () => {
        try {
            const currentStats = await getQueueStats();
            setStats(currentStats);
            const items = await getPendingActions(20);
            setPendingList(items);
            const failed = await getFailedActions(3);
            setFailedList(failed);
        } catch (e) {
            console.error('Failed to load queue status', e);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            refreshQueue();

            // Subscribe to network connectivity changes
            const unsubNet = addConnectivityListener((status) => {
                setNetworkOnline(status);
                refreshQueue();
            });

            // Initialize auto-sync on reconnect and periodic flush
            initAutoSync({
                onSyncComplete: () => {
                    refreshQueue();
                },
                pollIntervalMs: 25000,
            });

            return () => {
                unsubNet();
                stopAutoSync();
            };
        }
    }, [isAuthenticated, refreshQueue]);

    // On app launch: check /staff/app-version for newer APK releases
    useEffect(() => {
        const runUpdateCheck = async () => {
            const res = await checkAppVersion(CURRENT_APP_VERSION);
            if (res && res.hasUpdate) {
                setUpdateInfo(res);
                setIsUpdateModalOpen(true);
            }
        };
        runUpdateCheck();
    }, []);

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    if (viewMode === 'walkin') {
        return (
            <WalkInFlowScreen
                onFinish={() => {
                    setViewMode('dashboard');
                    refreshQueue();
                }}
                onCancel={() => setViewMode('dashboard')}
            />
        );
    }

    if (viewMode === 'return') {
        return (
            <ReturnFlowScreen
                onFinish={() => {
                    setViewMode('dashboard');
                    refreshQueue();
                }}
                onCancel={() => setViewMode('dashboard')}
            />
        );
    }

    // If staff has multiple stores assigned and none selected yet, force store selection
    const mustPickStore = assignedStores.length > 1 && !currentStore;

    const handleCreateOfflineBooking = async () => {
        if (!currentStore) {
            Alert.alert('Store Required', 'Please select a store before creating a booking.');
            return;
        }

        const dummyKey = generateIdempotencyKey();
        await enqueueAction({
            actionType: 'create_booking',
            endpoint: '/staff/bookings',
            payload: {
                bike_id: 1,
                customer_phone: '+919876543210',
                start_date: '2026-09-07',
                end_date: '2026-09-09',
                pickup_store_id: currentStore.id,
                return_store_id: currentStore.id,
                channel: 'offline',
            },
            idempotencyKey: dummyKey,
        });

        await refreshQueue();
        Alert.alert(
            'Queued Locally',
            `Walk-in booking for ${currentStore.name} queued with key:\n${dummyKey}`
        );
    };

    const handleCreateOfflineHandover = async () => {
        if (!currentStore) {
            Alert.alert('Store Required', 'Please select a store before initiating handover.');
            return;
        }

        const dummyKey = generateIdempotencyKey();
        await enqueueAction({
            actionType: 'handover',
            endpoint: '/staff/bookings/1/handover',
            payload: {
                booking_id: 1,
                store_id: currentStore.id,
                odometer_reading: 14250,
                condition_notes: `Handover at ${currentStore.name}`,
                customer_signed: true,
            },
            idempotencyKey: dummyKey,
        });

        await refreshQueue();
        Alert.alert(
            'Queued Locally',
            `Handover at ${currentStore.name} queued with key:\n${dummyKey}`
        );
    };

    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            const res = await flushOfflineQueue();
            await refreshQueue();
            Alert.alert(
                'Sync Complete',
                `Synced: ${res.synced}, Retrying: ${res.failed}, Conflicts: ${res.conflicts || 0}, Total: ${res.total}`
            );
        } catch (err) {
            Alert.alert('Sync Failed', err.message || 'Unable to sync with server');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRetryFailedAction = async (idempotencyKey) => {
        try {
            await retryFailedAction(idempotencyKey);
            await refreshQueue();
            if (networkOnline) {
                setIsSyncing(true);
                await flushOfflineQueue();
                await refreshQueue();
            }
            Alert.alert('Retrying Action', 'Action reset and queued for immediate sync.');
        } catch (err) {
            Alert.alert('Retry Failed', err.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDismissFailedAction = async (idempotencyKey) => {
        Alert.alert(
            'Discard Action?',
            'This offline action had a server conflict and will be permanently removed from the device queue.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: async () => {
                        await dismissFailedAction(idempotencyKey);
                        await refreshQueue();
                    },
                },
            ]
        );
    };

    const handleClearSynced = async () => {
        await clearSynced(0);
        await refreshQueue();
        Alert.alert('Queue Cleaned', 'Synchronized actions cleared.');
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.title}>GK Whizwheel Staff</Text>
                            <Text style={styles.versionBadge}>v{CURRENT_APP_VERSION}</Text>
                            {updateInfo?.hasUpdate && (
                                <TouchableOpacity
                                    style={styles.updateAvailablePill}
                                    onPress={() => setIsUpdateModalOpen(true)}
                                >
                                    <Text style={styles.updateAvailablePillText}>
                                        🚀 v{updateInfo.latestVersion} Available
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.staffName}>
                            {user?.name || 'Store Staff'} •{' '}
                            <Text style={styles.roleTag}>
                                {String(user?.role?.value || user?.role || 'staff').toUpperCase()}
                            </Text>
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutBtnText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Scoped Operating Store Bar */}
                <View style={styles.storeBanner}>
                    <View style={styles.storeInfo}>
                        <Text style={styles.storeLabel}>OPERATING STORE</Text>
                        <Text style={styles.storeNameText}>
                            {currentStore ? currentStore.name : 'No Store Selected'}
                        </Text>
                        {currentStore?.city && (
                            <Text style={styles.storeCityText}>{currentStore.city}</Text>
                        )}
                    </View>

                    {assignedStores.length > 1 && (
                        <TouchableOpacity
                            style={styles.switchBtn}
                            onPress={() => setIsStoreSwitcherOpen(true)}
                        >
                            <Text style={styles.switchBtnText}>Switch Store ▾</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Prominent Pending Sync & Network Status Banner */}
                {!networkOnline ? (
                    <View style={styles.offlineBanner}>
                        <View style={styles.bannerTextRow}>
                            <Text style={styles.offlineBannerIcon}>📶</Text>
                            <Text style={styles.offlineBannerText}>
                                OFFLINE MODE — Actions are saved locally to SQLite (Pending Sync: {stats.pending}).
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.simToggleBtn}
                            onPress={() => setOnlineStatus(true)}
                        >
                            <Text style={styles.simToggleText}>Simulate Online</Text>
                        </TouchableOpacity>
                    </View>
                ) : isSyncing ? (
                    <View style={styles.syncingBanner}>
                        <ActivityIndicator size="small" color="#1d4ed8" style={{ marginRight: 8 }} />
                        <Text style={styles.syncingBannerText}>
                            🔄 Auto-Syncing {stats.syncing || stats.pending} queued action(s) with central server...
                        </Text>
                    </View>
                ) : stats.pending > 0 ? (
                    <View style={styles.pendingSyncBanner}>
                        <View style={styles.bannerTextRow}>
                            <Text style={styles.pendingSyncIcon}>⏳</Text>
                            <Text style={styles.pendingSyncText}>
                                PENDING SYNC: {stats.pending} action(s) queued locally
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.syncNowSmallBtn}
                            onPress={handleManualSync}
                        >
                            <Text style={styles.syncNowSmallBtnText}>Flush Queue</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.onlineBanner}>
                        <Text style={styles.onlineBannerText}>
                            🟢 ONLINE — Local queue synchronized with central database.
                        </Text>
                        <TouchableOpacity
                            style={styles.simToggleBtnDark}
                            onPress={() => setOnlineStatus(false)}
                        >
                            <Text style={styles.simToggleTextDark}>Simulate Offline</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView style={styles.content}>
                {/* Stats Dashboard */}
                <View style={styles.statsCard}>
                    <Text style={styles.sectionHeading}>Offline Action Queue</Text>
                    <View style={styles.statGrid}>
                        <View style={[styles.statBox, { backgroundColor: '#fff7ed' }]}>
                            <Text style={[styles.statNumber, { color: '#c2410c' }]}>
                                {stats.pending}
                            </Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: '#eff6ff' }]}>
                            <Text style={[styles.statNumber, { color: '#1d4ed8' }]}>
                                {stats.syncing}
                            </Text>
                            <Text style={styles.statLabel}>Syncing</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: '#f0fdf4' }]}>
                            <Text style={[styles.statNumber, { color: '#15803d' }]}>
                                {stats.synced}
                            </Text>
                            <Text style={styles.statLabel}>Synced</Text>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: '#fef2f2' }]}>
                            <Text style={[styles.statNumber, { color: '#b91c1c' }]}>
                                {stats.failed + (stats.conflict || 0)}
                            </Text>
                            <Text style={styles.statLabel}>Errors</Text>
                        </View>
                    </View>
                </View>

                {/* Sync Conflicts & Error Resolutions Section (Shown when errors require staff attention) */}
                {failedList.length > 0 && (
                    <View style={styles.conflictSection}>
                        <View style={styles.conflictHeaderRow}>
                            <Text style={styles.conflictHeading}>
                                ⚠️ Sync Attention Needed ({failedList.length})
                            </Text>
                            <Text style={styles.conflictSubtitle}>
                                Server reported conflicts on these offline items. Review and resolve:
                            </Text>
                        </View>
                        {failedList.map((item) => (
                            <View key={item.id} style={styles.conflictCard}>
                                <View style={styles.conflictTop}>
                                    <Text style={styles.conflictType}>
                                        {item.action_type.toUpperCase().replace('_', ' ')}
                                    </Text>
                                    <Text style={styles.conflictBadge}>
                                        {item.status === 'conflict_error' ? 'PERMANENT CONFLICT' : 'RETRY EXCEEDED'}
                                    </Text>
                                </View>
                                <Text style={styles.conflictKey}>Key: {item.idempotency_key}</Text>
                                <View style={styles.conflictErrorBox}>
                                    <Text style={styles.conflictErrorText}>
                                        {item.error_message || 'Action rejected by server business rules.'}
                                    </Text>
                                </View>
                                <View style={styles.conflictButtonRow}>
                                    <TouchableOpacity
                                        style={styles.retryBtn}
                                        onPress={() => handleRetryFailedAction(item.idempotency_key)}
                                    >
                                        <Text style={styles.retryBtnText}>🔄 Retry Action</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.discardBtn}
                                        onPress={() => handleDismissFailedAction(item.idempotency_key)}
                                    >
                                        <Text style={styles.discardBtnText}>✕ Discard</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Scoped Store Quick Actions */}
                <View style={styles.actionSection}>
                    <Text style={styles.sectionHeading}>
                        {currentStore?.name || 'Store'} Operations
                    </Text>

                    <TouchableOpacity
                        style={[styles.btnPrimary, { backgroundColor: '#059669', marginBottom: 8 }]}
                        onPress={() => setViewMode('walkin')}
                    >
                        <Text style={styles.btnPrimaryText}>⚡ Start Walk-in Booking Flow (7 Steps)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btnPrimary, { backgroundColor: '#d97706', marginBottom: 12 }]}
                        onPress={() => setViewMode('return')}
                    >
                        <Text style={styles.btnPrimaryText}>🔄 Process Bike Return (Inspection & Refund)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={handleCreateOfflineBooking}
                    >
                        <Text style={styles.btnSecondaryText}>
                            + Queue Walk-in Booking (Scoped to {currentStore?.name || 'Store'})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={handleCreateOfflineHandover}
                    >
                        <Text style={styles.btnSecondaryText}>
                            + Queue Bike Handover (Scoped to {currentStore?.name || 'Store'})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btnPrimary, isSyncing && { opacity: 0.7 }]}
                        onPress={handleManualSync}
                        disabled={isSyncing}
                    >
                        {isSyncing ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.btnPrimaryText}>Flush Offline Queue to Server</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnOutline} onPress={handleClearSynced}>
                        <Text style={styles.btnOutlineText}>Clear Synced Records</Text>
                    </TouchableOpacity>
                </View>

                {/* Pending Actions List */}
                <View style={styles.listSection}>
                    <Text style={styles.sectionHeading}>
                        Pending Actions ({pendingList.length})
                    </Text>
                    {pendingList.length === 0 ? (
                        <Text style={styles.emptyText}>No pending actions. All synced!</Text>
                    ) : (
                        pendingList.map((item) => (
                            <View key={item.id} style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemType}>{item.action_type}</Text>
                                    <Text
                                        style={[
                                            styles.itemStatus,
                                            item.status === 'failed' && { color: '#b91c1c' },
                                            item.status === 'conflict_error' && { color: '#dc2626' },
                                        ]}
                                    >
                                        {item.status.toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.itemKey} numberOfLines={1}>
                                    Key: {item.idempotency_key}
                                </Text>
                                <Text style={styles.itemEndpoint}>Endpoint: {item.endpoint}</Text>
                                <Text style={styles.itemTime}>Created: {item.created_at}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Store Switcher Modal */}
            <StoreSwitcherModal
                visible={mustPickStore || isStoreSwitcherOpen}
                stores={assignedStores}
                currentStore={currentStore}
                canDismiss={!mustPickStore}
                onSelectStore={(store) => {
                    selectStore(store);
                    setIsStoreSwitcherOpen(false);
                }}
                onClose={() => setIsStoreSwitcherOpen(false)}
            />

            {/* In-App Update Prompt Modal */}
            <UpdatePromptModal
                visible={isUpdateModalOpen}
                updateInfo={updateInfo}
                onDismiss={() => setIsUpdateModalOpen(false)}
            />
        </SafeAreaView>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <MainStaffApp />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#0f172a',
        padding: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    staffName: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 2,
    },
    roleTag: {
        color: '#38bdf8',
        fontWeight: 'bold',
    },
    logoutBtn: {
        backgroundColor: '#1e293b',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#334155',
    },
    logoutBtnText: {
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: '600',
    },
    storeBanner: {
        backgroundColor: '#1e293b',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    storeInfo: {
        flex: 1,
    },
    storeLabel: {
        color: '#38bdf8',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    storeNameText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
        marginTop: 1,
    },
    storeCityText: {
        color: '#94a3b8',
        fontSize: 11,
    },
    switchBtn: {
        backgroundColor: '#0284c7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    switchBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 12,
    },
    statGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4,
    },
    actionSection: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    btnPrimary: {
        backgroundColor: '#0284c7',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    btnPrimaryText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
    btnSecondary: {
        backgroundColor: '#f1f5f9',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        alignItems: 'center',
    },
    btnSecondaryText: {
        color: '#334155',
        fontWeight: '600',
        fontSize: 14,
    },
    btnOutline: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        padding: 10,
        borderRadius: 6,
        marginTop: 8,
        alignItems: 'center',
    },
    btnOutlineText: {
        color: '#64748b',
        fontSize: 13,
    },
    listSection: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    emptyText: {
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 16,
    },
    itemCard: {
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemType: {
        fontWeight: 'bold',
        color: '#0f172a',
        fontSize: 13,
    },
    itemStatus: {
        fontSize: 11,
        fontWeight: '600',
        color: '#d97706',
    },
    itemKey: {
        fontSize: 11,
        color: '#64748b',
        fontFamily: 'monospace',
    },
    itemEndpoint: {
        fontSize: 11,
        color: '#475569',
        marginTop: 2,
    },
    itemTime: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 2,
    },
    // Offline and Pending Sync Banner Styles
    bannerTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    offlineBanner: {
        backgroundColor: '#fff7ed',
        borderTopWidth: 1,
        borderColor: '#fed7aa',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    offlineBannerIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    offlineBannerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#c2410c',
        flex: 1,
    },
    simToggleBtn: {
        backgroundColor: '#ea580c',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    simToggleText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    syncingBanner: {
        backgroundColor: '#eff6ff',
        borderTopWidth: 1,
        borderColor: '#bfdbfe',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncingBannerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1d4ed8',
    },
    pendingSyncBanner: {
        backgroundColor: '#fefce8',
        borderTopWidth: 1,
        borderColor: '#fef08a',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pendingSyncIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    pendingSyncText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#a16207',
        flex: 1,
    },
    syncNowSmallBtn: {
        backgroundColor: '#ca8a04',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    syncNowSmallBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    onlineBanner: {
        backgroundColor: '#0f172a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    onlineBannerText: {
        fontSize: 11,
        color: '#94a3b8',
    },
    simToggleBtnDark: {
        backgroundColor: '#334155',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    simToggleTextDark: {
        color: '#cbd5e1',
        fontSize: 10,
        fontWeight: '600',
    },
    // Conflict Section Styles
    conflictSection: {
        backgroundColor: '#fff1f2',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fecdd3',
    },
    conflictHeaderRow: {
        marginBottom: 12,
    },
    conflictHeading: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#be123c',
    },
    conflictSubtitle: {
        fontSize: 12,
        color: '#9f1239',
        marginTop: 2,
    },
    conflictCard: {
        backgroundColor: '#ffffff',
        borderRadius: 6,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#fda4af',
    },
    conflictTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    conflictType: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#881337',
    },
    conflictBadge: {
        fontSize: 10,
        fontWeight: '800',
        color: '#be123c',
        backgroundColor: '#ffe4e6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    conflictKey: {
        fontSize: 10,
        color: '#64748b',
        fontFamily: 'monospace',
    },
    conflictErrorBox: {
        backgroundColor: '#fff1f2',
        borderRadius: 4,
        padding: 8,
        marginTop: 6,
        marginBottom: 8,
    },
    conflictErrorText: {
        fontSize: 12,
        color: '#9f1239',
        fontWeight: '500',
    },
    conflictButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    retryBtn: {
        flex: 1,
        backgroundColor: '#0284c7',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
    },
    retryBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    discardBtn: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
    },
    discardBtnText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
    },
    versionBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#94a3b8',
        backgroundColor: '#1e293b',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    updateAvailablePill: {
        backgroundColor: '#047857',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    updateAvailablePillText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
