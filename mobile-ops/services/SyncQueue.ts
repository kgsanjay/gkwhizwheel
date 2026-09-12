import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_STORAGE_KEY = '@gkwhizwheel_sync_queue';

export type SyncActionStatus = 'pending' | 'syncing' | 'failed' | 'synced';

export interface OfflineAction {
  id: string;
  idempotency_key: string;
  action_type: string;
  payload: any;
  booking_id: number;
  status: SyncActionStatus;
  timestamp: number;
  error?: string;
}

// Simple unique ID generator
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

class SyncQueueService {
  async getQueue(): Promise<OfflineAction[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to read sync queue', error);
    }
    return [];
  }

  async saveQueue(queue: OfflineAction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save sync queue', error);
    }
  }

  async enqueueAction(action_type: string, booking_id: number, payload: any): Promise<OfflineAction> {
    const queue = await this.getQueue();
    const id = generateId();
    const newAction: OfflineAction = {
      id,
      idempotency_key: id,
      action_type,
      booking_id,
      payload,
      status: 'pending',
      timestamp: Date.now(),
    };
    
    queue.push(newAction);
    await this.saveQueue(queue);
    return newAction;
  }

  async getPendingActions(): Promise<OfflineAction[]> {
    const queue = await this.getQueue();
    // Exclude synced actions. 'syncing' might be stuck from a crash, so treat them as pending.
    return queue.filter(a => a.status === 'pending' || a.status === 'failed' || a.status === 'syncing');
  }

  async updateActionStatuses(updates: { idempotency_key: string; status: SyncActionStatus; error?: string }[]): Promise<void> {
    const queue = await this.getQueue();
    let changed = false;
    
    for (const update of updates) {
      const idx = queue.findIndex(a => a.idempotency_key === update.idempotency_key);
      if (idx !== -1) {
        queue[idx].status = update.status;
        if (update.error) {
          queue[idx].error = update.error;
        }
        changed = true;
      }
    }
    
    if (changed) {
      await this.saveQueue(queue);
    }
  }

  async removeSyncedActions(): Promise<void> {
    const queue = await this.getQueue();
    const newQueue = queue.filter(a => a.status !== 'synced');
    if (newQueue.length !== queue.length) {
      await this.saveQueue(newQueue);
    }
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  }
}

export const syncQueue = new SyncQueueService();
