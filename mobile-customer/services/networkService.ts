import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

class NetworkService {
  private currentStatus: NetworkStatus = {
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  };

  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private subscription: NetInfoSubscription | null = null;

  constructor() {
    this.init();
  }

  private init() {
    this.subscription = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = !!state.isConnected;
      const isInternetReachable = state.isInternetReachable;
      const type = state.type;

      this.currentStatus = {
        isConnected,
        isInternetReachable,
        type,
      };

      this.listeners.forEach((listener) => {
        try {
          listener(this.currentStatus);
        } catch {
          // ignore
        }
      });
    });
  }

  public getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  public async checkConnectionAsync(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    this.currentStatus = {
      isConnected: !!state.isConnected,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    };
    return this.currentStatus;
  }

  public addConnectivityListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify listener of current status
    listener(this.currentStatus);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy() {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners.clear();
  }
}

export const networkService = new NetworkService();

/**
 * Custom React hook for tracking live network connectivity in screens and components
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(networkService.getStatus());

  useEffect(() => {
    const unsubscribe = networkService.addConnectivityListener((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  return status;
}
