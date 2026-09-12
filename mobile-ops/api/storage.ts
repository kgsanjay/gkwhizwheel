import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StaffUser } from './types';

const TOKEN_KEY = 'gkwhizwheel_ops_token';
const USER_KEY = 'gkwhizwheel_ops_user';
const ACTIVE_STORE_KEY = 'gkwhizwheel_ops_active_store_id';

export const storage = {
  // Secure token storage via Keychain / EncryptedSharedPreferences
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      // Fallback
    }
  },

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // Fallback
    }
  },

  // Staff User profile storage
  async getUser(): Promise<StaffUser | null> {
    try {
      const data = await AsyncStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: StaffUser): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Fallback
    }
  },

  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch {
      // Fallback
    }
  },

  // Active Store ID persistence
  async getActiveStoreId(): Promise<number | null> {
    try {
      const val = await AsyncStorage.getItem(ACTIVE_STORE_KEY);
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  },

  async setActiveStoreId(storeId: number): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_STORE_KEY, String(storeId));
    } catch {
      // Fallback
    }
  },

  // Clear all ops session data on logout
  async clearSession(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
    try {
      await AsyncStorage.removeItem(ACTIVE_STORE_KEY);
    } catch {
      // Ignore
    }
  },
};
