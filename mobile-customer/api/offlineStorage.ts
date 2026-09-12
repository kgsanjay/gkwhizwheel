import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking } from './types';

const CACHED_BOOKINGS_KEY = 'gkwhizwheel_cached_bookings';
const CACHED_BOOKING_DETAIL_PREFIX = 'gkwhizwheel_cached_booking_';

export interface CachedBookingsData {
  bookings: Booking[];
  cachedAt: number; // Unix timestamp in ms
}

// In-memory fallback for testing or non-persistent environments
let memoryBookingsCache: CachedBookingsData | null = null;
const memoryDetailCache = new Map<number, Booking>();

export const offlineStorage = {
  /**
   * Cache the customer's last-fetched bookings list with a timestamp.
   */
  async saveCachedBookings(bookings: Booking[]): Promise<void> {
    const data: CachedBookingsData = {
      bookings,
      cachedAt: Date.now(),
    };

    memoryBookingsCache = data;

    try {
      await AsyncStorage.setItem(CACHED_BOOKINGS_KEY, JSON.stringify(data));
      // Also cache individual items for fast offline detail retrieval
      for (const b of bookings) {
        await this.saveCachedBookingDetail(b);
      }
    } catch (err) {
      console.warn('[OfflineStorage] Failed to cache bookings:', err);
    }
  },

  /**
   * Retrieve cached bookings list and cache timestamp.
   */
  async getCachedBookings(): Promise<CachedBookingsData | null> {
    try {
      const json = await AsyncStorage.getItem(CACHED_BOOKINGS_KEY);
      if (json) {
        return JSON.parse(json) as CachedBookingsData;
      }
      return memoryBookingsCache;
    } catch (err) {
      console.warn('[OfflineStorage] Failed to read cached bookings:', err);
      return memoryBookingsCache;
    }
  },

  /**
   * Cache single booking for offline QR voucher and detail display.
   */
  async saveCachedBookingDetail(booking: Booking): Promise<void> {
    if (!booking || !booking.id) return;

    memoryDetailCache.set(booking.id, booking);

    try {
      const key = `${CACHED_BOOKING_DETAIL_PREFIX}${booking.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(booking));
    } catch (err) {
      console.warn(`[OfflineStorage] Failed to cache booking ${booking.id}:`, err);
    }
  },

  /**
   * Retrieve a single cached booking for offline presentation.
   */
  async getCachedBookingDetail(id: number): Promise<Booking | null> {
    try {
      const key = `${CACHED_BOOKING_DETAIL_PREFIX}${id}`;
      const json = await AsyncStorage.getItem(key);
      if (json) {
        return JSON.parse(json) as Booking;
      }
      return memoryDetailCache.get(id) || null;
    } catch (err) {
      return memoryDetailCache.get(id) || null;
    }
  },

  /**
   * Clear offline cache (e.g. on user logout).
   */
  async clearOfflineCache(): Promise<void> {
    memoryBookingsCache = null;
    memoryDetailCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const relevantKeys = keys.filter(
        (k) => k === CACHED_BOOKINGS_KEY || k.startsWith(CACHED_BOOKING_DETAIL_PREFIX)
      );
      if (relevantKeys.length > 0) {
        await AsyncStorage.multiRemove(relevantKeys);
      }
    } catch (err) {
      console.warn('[OfflineStorage] Failed to clear offline cache:', err);
    }
  },
};
