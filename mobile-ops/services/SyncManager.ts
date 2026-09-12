import NetInfo from '@react-native-community/netinfo';
import { syncQueue, OfflineAction } from './SyncQueue';
import { apiClient } from '../api/client';
import { NotificationManager } from './NotificationManager';

export type SyncManagerEvent = 'sync_started' | 'sync_completed' | 'sync_failed' | 'queue_updated';

type SyncListener = (event: SyncManagerEvent, data?: any) => void;

class SyncManagerService {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private networkUnsubscribe: (() => void) | null = null;

  init() {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) {
        this.triggerSync();
      }
    });
    // Trigger an initial check
    this.notify('queue_updated');
  }

  destroy() {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
    this.listeners.clear();
  }

  addListener(listener: SyncListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: SyncManagerEvent, data?: any) {
    this.listeners.forEach(l => l(event, data));
  }

  async notifyQueueUpdated() {
    this.notify('queue_updated');
  }

  async triggerSync() {
    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      const pendingActions = await syncQueue.getPendingActions();
      
      if (pendingActions.length === 0) {
        this.isSyncing = false;
        return;
      }

      this.notify('sync_started');

      // Prepare payload
      const actionsPayload = pendingActions.map(action => ({
        idempotency_key: action.idempotency_key,
        action_type: action.action_type,
        payload: {
          ...action.payload,
          booking_id: action.booking_id, // Injecting booking_id into payload
        },
      }));

      // Send to backend
      const res = await apiClient.post('/staff/sync', {
        actions: actionsPayload,
      });

      const results = res.data?.data || [];
      const statusUpdates: { idempotency_key: string; status: any; error?: string }[] = [];

      // Process results
      for (const result of results) {
        if (result.status === 'success') {
          statusUpdates.push({ idempotency_key: result.idempotency_key, status: 'synced' });
        } else {
          statusUpdates.push({ idempotency_key: result.idempotency_key, status: 'failed', error: result.message || 'Unknown error' });
          const failedAction = pendingActions.find(a => a.idempotency_key === result.idempotency_key);
          if (failedAction) {
            NotificationManager.scheduleSyncFailureAlert(failedAction.action_type, failedAction.booking_id);
          }
        }
      }

      // If any actions didn't get a response, leave them pending/failed
      const respondedKeys = new Set(results.map((r: any) => r.idempotency_key));
      for (const action of pendingActions) {
        if (!respondedKeys.has(action.idempotency_key)) {
           statusUpdates.push({ idempotency_key: action.idempotency_key, status: 'failed', error: 'No response from server' });
           NotificationManager.scheduleSyncFailureAlert(action.action_type, action.booking_id);
        }
      }

      await syncQueue.updateActionStatuses(statusUpdates);
      await syncQueue.removeSyncedActions();

      this.notify('sync_completed', results);
      this.notify('queue_updated');

    } catch (error: any) {
      console.error('Sync failed', error);
      this.notify('sync_failed', error.message || 'Network error during sync');
      
      // Update all to failed if network error
      const pendingActions = await syncQueue.getPendingActions();
      const updates = pendingActions.map(a => ({
        idempotency_key: a.idempotency_key,
        status: 'failed' as const,
        error: error.message || 'Network error',
      }));
      await syncQueue.updateActionStatuses(updates);
      this.notify('queue_updated');
    } finally {
      this.isSyncing = false;
    }
  }

}

export const syncManager = new SyncManagerService();
