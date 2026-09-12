import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { storage } from './storage';
import {
  ApiResponse,
  StaffUser,
  AdminRevenueReport,
  AdminUtilizationReport,
  OpsServiceBooking,
  OpsRefund,
} from './types';
import { syncQueue } from '../services/SyncQueue';
import { syncManager } from '../services/SyncManager';

// Default backend URLs: Android emulator maps 10.0.2.2 to host, iOS simulator uses localhost
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach Bearer token and active store context
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const storeId = await storage.getActiveStoreId();
    if (storeId && config.headers && !config.headers['X-Store-Id']) {
      config.headers['X-Store-Id'] = String(storeId);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract errors and handle 401 unauthenticated
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearSession();
    }
    return Promise.reject(error);
  }
);

// Ops API Service functions
export const opsApi = {
  // Push Token
  async registerPushToken(token: string): Promise<any> {
    // Assuming we fallback to the customer endpoint if there isn't a dedicated staff one
    // as both are User models and push tokens are tied to the user.
    const res = await apiClient.post<ApiResponse<any>>('/customer/push-token', { token });
    return res.data.data;
  },

  // Authentication
  async login(credentials: { email?: string; phone?: string; password: string }): Promise<{
    token: string;
    user: StaffUser;
  }> {
    const res = await apiClient.post<ApiResponse<{ token: string; user: StaffUser }>>('/auth/login', credentials);
    const { token, user } = res.data.data;
    await storage.setToken(token);
    await storage.setUser(user);
    if (user.store_id) {
      await storage.setActiveStoreId(user.store_id);
    }
    return { token, user };
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      await storage.clearSession();
    }
  },

  async getProfile(): Promise<StaffUser> {
    const res = await apiClient.get<ApiResponse<StaffUser>>('/auth/user');
    return res.data.data;
  },

  // Staff Store Scoping & Stores
  async getStores(): Promise<any[]> {
    const res = await apiClient.get<ApiResponse<any[]>>('/stores');
    return res.data.data;
  },

  // Fleet & Bikes
  async getStaffBikes(storeId?: number): Promise<any[]> {
    const params = storeId ? { store_id: storeId } : undefined;
    const res = await apiClient.get<ApiResponse<any[]>>('/staff/bikes', { params });
    return res.data.data;
  },

  async updateBikeMaintenance(bikeId: number, data: { status: string; notes?: string }): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(`/staff/bikes/${bikeId}/maintenance`, data);
    return res.data.data;
  },

  // Bookings & Dispatch
  async getActiveBookings(
    filters?: number | { store_id?: number; status?: string; search?: string; per_page?: number }
  ): Promise<any[]> {
    const params = typeof filters === 'number' ? { store_id: filters } : filters;
    const res = await apiClient.get<ApiResponse<any[]>>('/staff/bookings/active', { params });
    return res.data.data;
  },

  async getBookingByCode(code: string): Promise<any> {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/staff/bookings/active', { params: { search: code } });
      const items = res.data.data;
      if (Array.isArray(items) && items.length > 0) {
        return items[0];
      }
      return null;
    } catch {
      return null;
    }
  },

  async getBookingById(bookingId: number): Promise<any> {
    try {
      const res = await apiClient.get<ApiResponse<any>>(`/staff/bookings/${bookingId}`);
      return res.data.data;
    } catch {
      return null;
    }
  },

  async confirmBooking(bookingId: number): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(`/staff/bookings/${bookingId}/confirm`);
    return res.data.data;
  },

  async cancelBooking(bookingId: number, data?: { reason: string }): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(`/staff/bookings/${bookingId}/cancel`, data);
    return res.data.data;
  },

  async handoverBike(bookingId: number, data: {
    odometer_start: number;
    fuel_start: number;
    helmets_provided: number;
    notes?: string;
    photos?: string[];
    signature?: string;
  }): Promise<any> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      await syncQueue.enqueueAction('handover', bookingId, data);
      await syncManager.notifyQueueUpdated();
      return { _offline: true, message: 'Action queued for offline sync' };
    }
    const res = await apiClient.post<ApiResponse<any>>(`/staff/bookings/${bookingId}/handover`, data);
    return res.data.data;
  },

  async returnBike(bookingId: number, data: {
    odometer_end: number;
    fuel_end: number;
    helmets_returned: number;
    damage_notes?: string;
    extra_charges?: number;
    return_photos?: string[];
  }): Promise<any> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      await syncQueue.enqueueAction('return', bookingId, data);
      await syncManager.notifyQueueUpdated();
      return { _offline: true, message: 'Action queued for offline sync' };
    }
    const res = await apiClient.post<ApiResponse<any>>(`/staff/bookings/${bookingId}/return`, data);
    return res.data.data;
  },

  async collectPayment(bookingId: number, data: {
    amount: number;
    payment_method: 'cash' | 'upi' | 'card';
    notes?: string;
  }): Promise<any> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
      await syncQueue.enqueueAction('collect_payment', bookingId, data);
      await syncManager.notifyQueueUpdated();
      return { _offline: true, message: 'Action queued for offline sync' };
    }
    const res = await apiClient.post<ApiResponse<any>>(`/staff/bookings/${bookingId}/collect-payment`, data);
    return res.data.data;
  },
};

export const adminApi = {
  async getRevenueReport(params?: {
    start_date?: string;
    end_date?: string;
    group_by?: 'store' | 'channel' | 'bike';
  }): Promise<AdminRevenueReport> {
    const res = await apiClient.get<ApiResponse<AdminRevenueReport>>('/admin/reports/revenue', { params });
    return res.data.data;
  },

  async getUtilizationReport(params?: {
    start_date?: string;
    end_date?: string;
    store_id?: number;
    category_id?: number;
  }): Promise<AdminUtilizationReport> {
    const res = await apiClient.get<ApiResponse<AdminUtilizationReport>>('/admin/reports/utilization', { params });
    return res.data.data;
  },

  async getStaff(params?: {
    role?: 'store_manager' | 'staff';
    store_id?: number;
  }): Promise<StaffUser[]> {
    const res = await apiClient.get<ApiResponse<StaffUser[]>>('/admin/staff', { params });
    return res.data.data;
  },

  async processRefund(bookingId: number, data: { amount: number; reason: string; payment_id?: number }): Promise<OpsRefund> {
    const res = await apiClient.post<ApiResponse<OpsRefund>>(`/admin/bookings/${bookingId}/refund`, data);
    return res.data.data;
  },
};

export const serviceBookingsApi = {
  async getTodayBookings(store_id?: number): Promise<OpsServiceBooking[]> {
    const params: any = { date: new Date().toISOString().split('T')[0] };
    if (store_id) params.store_id = store_id;
    const res = await apiClient.get<ApiResponse<OpsServiceBooking[]>>('/staff/service-bookings', { params });
    return res.data.data;
  },

  async getBookingDetails(id: number): Promise<OpsServiceBooking> {
    const res = await apiClient.get<ApiResponse<OpsServiceBooking>>(`/staff/service-bookings/${id}`);
    return res.data.data;
  },

  async getBookingByCode(search: string): Promise<OpsServiceBooking | null> {
    try {
      const res = await apiClient.get<ApiResponse<OpsServiceBooking[]>>('/staff/service-bookings', { params: { search } });
      const items = res.data.data;
      if (Array.isArray(items) && items.length > 0) {
        return items[0];
      }
      return null;
    } catch {
      return null;
    }
  },

  async markInProgress(id: number): Promise<OpsServiceBooking> {
    const res = await apiClient.post<ApiResponse<OpsServiceBooking>>(`/staff/service-bookings/${id}/mark-in-progress`);
    return res.data.data;
  },

  async markCompleted(id: number): Promise<OpsServiceBooking> {
    const res = await apiClient.post<ApiResponse<OpsServiceBooking>>(`/staff/service-bookings/${id}/mark-completed`);
    return res.data.data;
  },
};
