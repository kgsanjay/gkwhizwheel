import { apiClient, opsApi, API_BASE_URL } from '../api/client';
import { storage } from '../api/storage';

describe('Operations API Client & Services', () => {
  beforeEach(async () => {
    await storage.clearSession();
    jest.clearAllMocks();
  });

  test('apiClient has correct default headers and timeout', () => {
    expect(apiClient.defaults.headers['Accept']).toBe('application/json');
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    expect(apiClient.defaults.timeout).toBe(15000);
    expect(API_BASE_URL).toBeDefined();
  });

  test('opsApi exposes all operations workflows', () => {
    expect(typeof opsApi.login).toBe('function');
    expect(typeof opsApi.logout).toBe('function');
    expect(typeof opsApi.getProfile).toBe('function');
    expect(typeof opsApi.getStores).toBe('function');
    expect(typeof opsApi.getStaffBikes).toBe('function');
    expect(typeof opsApi.updateBikeMaintenance).toBe('function');
    expect(typeof opsApi.getActiveBookings).toBe('function');
    expect(typeof opsApi.getBookingByCode).toBe('function');
    expect(typeof opsApi.handoverBike).toBe('function');
    expect(typeof opsApi.returnBike).toBe('function');
    expect(typeof opsApi.collectPayment).toBe('function');
  });

  test('logout clears secure storage session', async () => {
    await storage.setToken('auth-session-key');
    await storage.setUser({
      id: 1,
      name: 'Manager',
      email: 'mgr@gkwhizwheel.com',
      role: 'store_manager',
    });

    jest.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true } });

    await opsApi.logout();

    expect(await storage.getToken()).toBeNull();
    expect(await storage.getUser()).toBeNull();
  });
});
