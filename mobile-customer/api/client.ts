import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { config, API_BASE_URL, APP_VERSION, CLIENT_TYPE } from './config';
import { storage } from './storage';
import { ApiError } from './errors';
import { ApiResponse, Bike, BikeCategory, Booking, ServiceItem, Store, User } from './types';

export { API_BASE_URL, APP_VERSION, CLIENT_TYPE };

export class ApiClient {
  public readonly http: AxiosInstance;
  private tokenCache: string | null = null;
  private onUnauthorizedCallback?: () => void;
  private onDeprecatedCallback?: (minVersion: string) => void;

  constructor(baseURL: string = API_BASE_URL) {
    this.http = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configure Axios request and response interceptors.
   */
  private setupInterceptors(): void {
    // Request Interceptor: Attach Auth Token and Mobile Headers
    this.http.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        // Automatic token attachment from SecureStore (or memory cache)
        if (!this.tokenCache) {
          this.tokenCache = await storage.getAuthToken();
        }

        if (this.tokenCache) {
          requestConfig.headers.Authorization = `Bearer ${this.tokenCache}`;
        }

        // Mobile specific identification & versioning headers (Block F)
        requestConfig.headers['X-App-Platform'] = Platform.OS === 'ios' ? 'ios' : 'android';
        requestConfig.headers['X-App-Version'] = APP_VERSION;
        requestConfig.headers['X-Client-Type'] = CLIENT_TYPE;

        return requestConfig;
      },
      (error) => Promise.reject(ApiError.from(error))
    );

    // Response Interceptor: Deprecation Check and Centralized Error Surface
    this.http.interceptors.response.use(
      (response: AxiosResponse) => {
        // Detect version deprecation warning header from server
        if (response.headers['x-api-deprecated'] === 'true') {
          const minVersion = (response.headers['x-api-minimum-version'] as string) || '1.0.0';
          console.warn(`[GKWhizWheel Mobile API] App version is deprecated. Minimum required: ${minVersion}`);
          if (this.onDeprecatedCallback) {
            this.onDeprecatedCallback(minVersion);
          }
        }
        return response;
      },
      async (error) => {
        const apiError = ApiError.from(error);

        // Centralized 401 Unauthorized handling (token expired/invalid)
        if (apiError.isUnauthenticated) {
          await this.clearToken();
          if (this.onUnauthorizedCallback) {
            this.onUnauthorizedCallback();
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  // ==========================================
  // Auth Token Management
  // ==========================================

  public async setToken(token: string | null): Promise<void> {
    this.tokenCache = token;
    await storage.setAuthToken(token);
  }

  public getToken(): string | null {
    return this.tokenCache;
  }

  public async clearToken(): Promise<void> {
    this.tokenCache = null;
    await storage.clearAuthToken();
  }

  public onUnauthorized(callback: () => void): void {
    this.onUnauthorizedCallback = callback;
  }

  public onDeprecated(callback: (minVersion: string) => void): void {
    this.onDeprecatedCallback = callback;
  }

  // ==========================================
  // Generic Low-Level Helpers (Backward-Compatible)
  // ==========================================

  public async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const res = await this.http.get<ApiResponse<T>>(endpoint, { headers });
      return res.data;
    } catch (error) {
      const apiErr = error instanceof ApiError ? error : ApiError.from(error);
      return {
        success: false,
        data: null as unknown as T,
        message: apiErr.message,
        errors: apiErr.validationErrors as any,
      };
    }
  }

  public async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const res = await this.http.post<ApiResponse<T>>(endpoint, body, { headers });
      return res.data;
    } catch (error) {
      const apiErr = error instanceof ApiError ? error : ApiError.from(error);
      return {
        success: false,
        data: null as unknown as T,
        message: apiErr.message,
        errors: apiErr.validationErrors as any,
      };
    }
  }

  public async put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const res = await this.http.put<ApiResponse<T>>(endpoint, body, { headers });
      return res.data;
    } catch (error) {
      const apiErr = error instanceof ApiError ? error : ApiError.from(error);
      return {
        success: false,
        data: null as unknown as T,
        message: apiErr.message,
        errors: apiErr.validationErrors as any,
      };
    }
  }

  public async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const res = await this.http.delete<ApiResponse<T>>(endpoint, { headers });
      return res.data;
    } catch (error) {
      const apiErr = error instanceof ApiError ? error : ApiError.from(error);
      return {
        success: false,
        data: null as unknown as T,
        message: apiErr.message,
        errors: apiErr.validationErrors as any,
      };
    }
  }

  // ==========================================
  // Strongly-Typed Endpoint Methods
  // ==========================================

  public readonly publicApi = {
    getBikes: (params?: {
      store_id?: number;
      category_id?: number;
      start_date?: string;
      end_date?: string;
      search?: string;
    }) => this.http.get<ApiResponse<Bike[]>>('/bikes', { params }).then((r) => r.data),

    getBike: (id: number) =>
      this.http.get<ApiResponse<Bike>>(`/bikes/${id}`).then((r) => r.data),

    getBikeAvailability: (id: number, month?: string) =>
      this.http.get<ApiResponse<string[]>>(`/bikes/${id}/availability`, { params: { month } }).then((r) => r.data),

    getPriceQuote: (
      id: number,
      payload: {
        start_date: string;
        end_date: string;
        pickup_store_id: number;
        return_store_id: number;
        coupon_code?: string;
      }
    ) => this.http.post<ApiResponse<any>>(`/bikes/${id}/price-quote`, payload).then((r) => r.data),

    getStores: () =>
      this.http.get<ApiResponse<Store[]>>('/stores').then((r) => r.data),

    getBikeCategories: () =>
      this.http.get<ApiResponse<BikeCategory[]>>('/bike-categories').then((r) => r.data),

    getServices: (serviceType?: string) =>
      this.http.get<ApiResponse<ServiceItem[]>>('/services', { params: { service_type: serviceType } }).then((r) => r.data),

    getServiceDetail: (slug: string) =>
      this.http.get<ApiResponse<{ slug: string; service_type: string; items: ServiceItem[] }>>(`/services/${slug}`).then((r) => r.data),

    getAppVersion: () =>
      this.http.get<ApiResponse<any>>('/customer/app-version').then((r) => r.data),
  };

  public readonly authApi = {
    register: (payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
      password_confirmation: string;
    }) => this.http.post<ApiResponse<{ token: string; user: User }>>('/auth/register', payload).then((r) => r.data),

    login: (payload: { email?: string; phone?: string; login?: string; password: string }) =>
      this.http.post<ApiResponse<{ token: string; user: User }>>('/auth/login', payload).then((r) => r.data),

    requestOtp: (payload: { email: string }) =>
      this.http.post<ApiResponse<any>>('/auth/otp/request', payload).then((r) => r.data),

    verifyOtp: (payload: { email: string; otp: string }) =>
      this.http.post<ApiResponse<{ token: string; user: User }>>('/auth/otp/verify', payload).then((r) => r.data),

    logout: () =>
      this.http.post<ApiResponse<any>>('/auth/logout').then((r) => r.data),

    getMe: () =>
      this.http.get<ApiResponse<User>>('/auth/me').then((r) => r.data),
  };

  public readonly customerApi = {
    holdBooking: (
      payload: {
        bike_id: number;
        start_date: string;
        end_date: string;
        pickup_store_id: number;
        return_store_id: number;
        coupon_code?: string;
      },
      idempotencyKey?: string
    ) =>
      this.http
        .post<ApiResponse<Booking>>('/bookings/hold', payload, {
          headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
        })
        .then((r) => r.data),

    getBookings: () =>
      this.http.get<ApiResponse<Booking[]>>('/bookings').then((r) => r.data),

    getBooking: (id: number) =>
      this.http.get<ApiResponse<Booking>>(`/bookings/${id}`).then((r) => r.data),

    checkout: (id: number, payload: { gateway: 'razorpay' | 'phonepe' }) =>
      this.http.post<ApiResponse<any>>(`/bookings/${id}/checkout`, payload).then((r) => r.data),

    checkoutPhonepe: (id: number) =>
      this.http.post<ApiResponse<any>>(`/bookings/${id}/checkout/phonepe`).then((r) => r.data),

    confirmPayment: (id: number, payload: { gateway_reference: string }) =>
      this.http.post<ApiResponse<any>>(`/bookings/${id}/confirm-payment`, payload).then((r) => r.data),

    cancelBooking: (id: number, reason?: string) =>
      this.http.post<ApiResponse<any>>(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),

    extendBooking: (id: number, newEndDate: string) =>
      this.http.post<ApiResponse<any>>(`/bookings/${id}/extend`, { end_date: newEndDate }).then((r) => r.data),

    getBookingDocuments: (id: number) =>
      this.http.get<ApiResponse<any>>(`/bookings/${id}/documents`).then((r) => r.data),

    getKycDocuments: () =>
      this.http.get<ApiResponse<any[]>>('/customer/kyc-documents').then((r) => r.data),

    uploadKycDocument: (formData: FormData) =>
      this.http
        .post<ApiResponse<any>>('/customer/kyc-documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),

    updateProfile: (payload: { name?: string; phone?: string; whatsapp_opt_in?: boolean }) =>
      this.http.put<ApiResponse<{ user: User }>>('/auth/profile', payload).then((r) => r.data),
  };
}

export const api = new ApiClient();
