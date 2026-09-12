import { ApiError } from '../api/errors';
import { ApiClient } from '../api/client';
import { config, API_BASE_URL, APP_VERSION, CLIENT_TYPE } from '../api/config';
import { storage } from '../api/storage';

describe('API Client Configuration & Environment', () => {
  it('defines app version, client type, and default API base URL', () => {
    expect(APP_VERSION).toBe('1.0.0');
    expect(CLIENT_TYPE).toBe('customer_app');
    expect(API_BASE_URL).toContain('/api/v1');
    expect(['development', 'staging', 'production']).toContain(config.env);
  });
});

describe('Secure Storage Token Management', () => {
  it('sets, gets, and clears bearer token with fallback safety', async () => {
    await storage.setAuthToken('test-sanctum-token-12345');
    const token = await storage.getAuthToken();
    expect(token).toBe('test-sanctum-token-12345');

    await storage.clearAuthToken();
    const cleared = await storage.getAuthToken();
    expect(cleared).toBeNull();
  });
});

describe('Centralized API Error Handling', () => {
  it('surfaces Laravel 422 validation errors to the UI', () => {
    const laravelValidationResponse = {
      response: {
        status: 422,
        data: {
          success: false,
          message: 'The given data was invalid.',
          errors: {
            email: ['The email has already been taken.'],
            phone: ['The phone number must be 10 digits.'],
          },
        },
        headers: {},
      },
      isAxiosError: true,
    };

    const error = ApiError.from(laravelValidationResponse);

    expect(error.status).toBe(422);
    expect(error.isValidation).toBe(true);
    expect(error.message).toBe('The given data was invalid.');
    expect(error.firstValidationError).toBe('The email has already been taken.');
    expect(error.getFieldError('phone')).toBe('The phone number must be 10 digits.');
    expect(error.getFieldError('password')).toBeNull();
  });

  it('surfaces HTTP 429 mobile rate limit errors with retry-after', () => {
    const rateLimitResponse = {
      response: {
        status: 429,
        data: {
          success: false,
          message: 'Too many mobile API requests. Please slow down and try again later.',
          errors: {
            code: 'MOBILE_RATE_LIMIT_EXCEEDED',
            retry_after: 60,
            client_version: '1.0.0',
          },
        },
        headers: {
          'retry-after': '60',
          'x-api-deprecated': 'true',
          'x-api-minimum-version': '1.0.0',
        },
      },
      isAxiosError: true,
    };

    const error = ApiError.from(rateLimitResponse);

    expect(error.status).toBe(429);
    expect(error.isRateLimited).toBe(true);
    expect(error.retryAfter).toBe(60);
    expect(error.isDeprecated).toBe(true);
    expect(error.message).toContain('Too many');
  });

  it('handles network connectivity failures gracefully', () => {
    const networkError = {
      message: 'Network Error',
      isAxiosError: true,
      response: undefined,
    };

    const error = ApiError.from(networkError);

    expect(error.isNetworkError).toBe(true);
    expect(error.status).toBe(0);
    expect(error.message).toContain('internet connection');
  });
});

describe('ApiClient Endpoints & Request Interceptors', () => {
  it('exports typed customer and public API namespaces and supports token lifecycle', async () => {
    const client = new ApiClient('http://localhost:8000/api/v1');

    // Public discovery endpoints
    expect(typeof client.publicApi.getBikes).toBe('function');
    expect(typeof client.publicApi.getBike).toBe('function');
    expect(typeof client.publicApi.getPriceQuote).toBe('function');
    expect(typeof client.publicApi.getStores).toBe('function');

    // Auth endpoints
    expect(typeof client.authApi.login).toBe('function');
    expect(typeof client.authApi.register).toBe('function');
    expect(typeof client.authApi.logout).toBe('function');

    // Customer booking & KYC endpoints
    expect(typeof client.customerApi.holdBooking).toBe('function');
    expect(typeof client.customerApi.getBookings).toBe('function');
    expect(typeof client.customerApi.checkout).toBe('function');
    expect(typeof client.customerApi.uploadKycDocument).toBe('function');

    // Token management
    await client.setToken('auth-token-xyz');
    expect(client.getToken()).toBe('auth-token-xyz');

    await client.clearToken();
    expect(client.getToken()).toBeNull();
  });
});
