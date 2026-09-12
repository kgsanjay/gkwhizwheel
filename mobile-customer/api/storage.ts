import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'gkwhizwheel_customer_token';
const USER_CACHE_KEY = 'gkwhizwheel_customer_user';
const ONBOARDING_COMPLETED_KEY = 'gkwhizwheel_onboarding_completed';

// In-memory fallback for environments where SecureStore is unavailable
let memoryToken: string | null = null;
let memoryOnboardingCompleted: boolean = false;

export const storage = {
  /**
   * Retrieves the stored Sanctum API bearer token securely.
   */
  async getAuthToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return memoryToken;
    }
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      return token || memoryToken;
    } catch (error) {
      console.warn('[SecureStore] Failed to read auth token, using fallback', error);
      return memoryToken;
    }
  },

  /**
   * Securely saves the Sanctum API bearer token.
   */
  async setAuthToken(token: string | null): Promise<void> {
    memoryToken = token;
    if (Platform.OS === 'web') return;

    try {
      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      }
    } catch (error) {
      console.warn('[SecureStore] Failed to write auth token', error);
    }
  },

  /**
   * Deletes the stored auth token on logout.
   */
  async clearAuthToken(): Promise<void> {
    memoryToken = null;
    if (Platform.OS === 'web') return;

    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
      console.warn('[SecureStore] Failed to delete auth token', error);
    }
  },

  /**
   * Check whether the user has completed the first-launch onboarding flow.
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return memoryOnboardingCompleted;
    }
    try {
      const val = await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY);
      return val === 'true' || memoryOnboardingCompleted;
    } catch (error) {
      return memoryOnboardingCompleted;
    }
  },

  /**
   * Mark the onboarding flow as completed so it is never shown again on subsequent launches.
   */
  async setOnboardingCompleted(completed: boolean = true): Promise<void> {
    memoryOnboardingCompleted = completed;
    if (Platform.OS === 'web') return;

    try {
      if (completed) {
        await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true', {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        await SecureStore.deleteItemAsync(ONBOARDING_COMPLETED_KEY);
      }
    } catch (error) {
      console.warn('[SecureStore] Failed to write onboarding completion', error);
    }
  },
};
