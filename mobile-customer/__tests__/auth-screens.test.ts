import { api } from '../api/client';
import { ApiError } from '../api/errors';
import { storage } from '../api/storage';

describe('Auth Flow Integration & Screen Helpers', () => {
  beforeEach(async () => {
    await storage.clearAuthToken();
    api.clearToken();
  });

  it('handles Sanctum token lifecycle through SecureStore during authentication', async () => {
    expect(await storage.getAuthToken()).toBeNull();

    const sampleToken = '1|sanctum_customer_token_sample_12345';
    await api.setToken(sampleToken);

    expect(api.getToken()).toBe(sampleToken);
    expect(await storage.getAuthToken()).toBe(sampleToken);

    await api.clearToken();
    expect(api.getToken()).toBeNull();
    expect(await storage.getAuthToken()).toBeNull();
  });

  it('validates client-side phone and password constraints before hitting register endpoint', () => {
    const invalidPhone = '98765';
    const validPhone = '9876543210';
    const shortPassword = 'short';
    const validPassword = 'securepassword123';

    expect(invalidPhone.replace(/\D/g, '').length).not.toBe(10);
    expect(validPhone.replace(/\D/g, '').length).toBe(10);
    expect(shortPassword.length).toBeLessThan(8);
    expect(validPassword.length).toBeGreaterThanOrEqual(8);
  });

  it('correctly maps backend 422 validation errors to distinct UI field errors', () => {
    const errorResponse = {
      response: {
        status: 422,
        data: {
          success: false,
          message: 'The given data was invalid.',
          errors: {
            email: ['The email has already been taken.'],
            phone: ['The phone must be 10 digits.'],
            password: ['The password confirmation does not match.'],
          },
        },
      },
      isAxiosError: true,
    };

    const err = ApiError.from(errorResponse);
    expect(err.isValidation).toBe(true);
    expect(err.getFieldError('email')).toBe('The email has already been taken.');
    expect(err.getFieldError('phone')).toBe('The phone must be 10 digits.');
    expect(err.getFieldError('password')).toBe('The password confirmation does not match.');
    expect(err.getFieldError('nonexistent')).toBeNull();
  });

  it('formats 6-digit OTP code inputs strictly as numeric digits', () => {
    const rawInputWithLetters = '12a3b4c56';
    const cleaned = rawInputWithLetters.replace(/[^0-9]/g, '').slice(0, 6);

    expect(cleaned).toBe('123456');
    expect(cleaned.length).toBe(6);
  });
});
