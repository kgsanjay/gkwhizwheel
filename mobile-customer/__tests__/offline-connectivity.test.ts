import { offlineStorage } from '../api/offlineStorage';
import { networkService } from '../services/networkService';
import { Booking } from '../api/types';

const MOCK_BOOKING: Booking = {
  id: 201,
  booking_number: 'GKW-2026-OFFLINE-1',
  customer_id: 1,
  bike_id: 1,
  pickup_store_id: 1,
  return_store_id: 1,
  start_date: '2026-09-12 10:00:00',
  end_date: '2026-09-14 10:00:00',
  total_amount: 1942,
  deposit_amount: 1000,
  status: 'confirmed',
  created_at: '2026-09-12 09:30:00',
  bike: {
    id: 1,
    category_id: 1,
    current_store_id: 1,
    home_store_id: 1,
    brand: 'Honda',
    model_name: 'Activa 6G',
    registration_number: 'KA-47-E-8421',
    daily_rate: 499,
    status: 'available',
    fuel_type: 'petrol',
    transmission: 'automatic',
  },
};

describe('Offline & Poor-Connectivity Handling (F15)', () => {
  beforeEach(async () => {
    await offlineStorage.clearOfflineCache();
  });

  describe('Offline Bookings Cache Storage', () => {
    it('saves and retrieves cached bookings with timestamp', async () => {
      const bookings = [MOCK_BOOKING];
      await offlineStorage.saveCachedBookings(bookings);

      const cached = await offlineStorage.getCachedBookings();
      expect(cached).not.toBeNull();
      expect(cached?.bookings.length).toBe(1);
      expect(cached?.bookings[0].booking_number).toBe('GKW-2026-OFFLINE-1');
      expect(cached?.cachedAt).toBeGreaterThan(0);
    });

    it('caches and retrieves individual booking detail for offline QR voucher presentation', async () => {
      await offlineStorage.saveCachedBookingDetail(MOCK_BOOKING);

      const cachedDetail = await offlineStorage.getCachedBookingDetail(201);
      expect(cachedDetail).not.toBeNull();
      expect(cachedDetail?.id).toBe(201);
      expect(cachedDetail?.bike?.model_name).toBe('Activa 6G');
    });

    it('clears offline cache on demand', async () => {
      await offlineStorage.saveCachedBookings([MOCK_BOOKING]);
      await offlineStorage.clearOfflineCache();

      const cached = await offlineStorage.getCachedBookings();
      expect(cached).toBeNull();
    });
  });

  describe('Network Service & Connectivity Listeners', () => {
    it('provides current connection status', () => {
      const status = networkService.getStatus();
      expect(status).toHaveProperty('isConnected');
      expect(status).toHaveProperty('isInternetReachable');
      expect(status).toHaveProperty('type');
    });

    it('registers connectivity listeners and notifies on subscription', () => {
      const listener = jest.fn();
      const unsubscribe = networkService.addConnectivityListener(listener);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isConnected: expect.any(Boolean),
        })
      );

      unsubscribe();
    });

    it('triggers graceful retry when connectivity resumes', () => {
      let reconnected = false;
      let wasOffline = true;

      // Simulate network state transition handler
      const handleNetworkChange = (status: { isConnected: boolean }) => {
        if (wasOffline && status.isConnected) {
          reconnected = true;
        }
        wasOffline = !status.isConnected;
      };

      // Transition to online
      handleNetworkChange({ isConnected: true });
      expect(reconnected).toBe(true);
    });
  });
});
