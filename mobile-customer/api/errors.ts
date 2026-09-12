import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  success: boolean;
  data?: any;
  message: string;
  errors?: Record<string, string[]> | {
    code?: string;
    retry_after?: number;
    client_version?: string;
    min_supported_version?: string;
    is_deprecated_client?: boolean;
    [key: string]: any;
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly validationErrors: Record<string, string[]>;
  public readonly retryAfter?: number;
  public readonly isRateLimited: boolean;
  public readonly isUnauthenticated: boolean;
  public readonly isForbidden: boolean;
  public readonly isValidation: boolean;
  public readonly isNetworkError: boolean;
  public readonly isDeprecated: boolean;
  public readonly rawResponse?: any;

  constructor(
    message: string,
    status: number = 500,
    validationErrors: Record<string, string[]> = {},
    options?: {
      retryAfter?: number;
      isNetworkError?: boolean;
      isDeprecated?: boolean;
      rawResponse?: any;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
    this.retryAfter = options?.retryAfter;
    this.isNetworkError = options?.isNetworkError ?? false;
    this.isDeprecated = options?.isDeprecated ?? false;
    this.isRateLimited = status === 429;
    this.isUnauthenticated = status === 401;
    this.isForbidden = status === 403;
    this.isValidation = status === 422;
    this.rawResponse = options?.rawResponse;

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Returns the first human-readable validation error, or the top-level error message.
   * Convenient for single-line alerts or toast messages in the UI.
   */
  public get firstValidationError(): string {
    const keys = Object.keys(this.validationErrors);
    if (keys.length > 0) {
      const firstField = keys[0];
      const errors = this.validationErrors[firstField];
      if (Array.isArray(errors) && errors.length > 0) {
        return errors[0];
      }
    }
    return this.message;
  }

  /**
   * Returns the validation error message for a specific field name.
   */
  public getFieldError(field: string): string | null {
    const fieldErrors = this.validationErrors[field];
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors[0];
    }
    return null;
  }

  /**
   * Factory method to convert Axios or generic error to an ApiError.
   */
  public static from(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Network error (no response received)
    if (axiosError.isAxiosError && !axiosError.response) {
      const msg =
        !axiosError.message || axiosError.message === 'Network Error'
          ? 'Unable to connect to server. Please check your internet connection.'
          : axiosError.message;

      return new ApiError(
        msg,
        0,
        {},
        { isNetworkError: true }
      );
    }

    if (axiosError.response) {
      const { status, data, headers } = axiosError.response;
      const responseData = data as ApiErrorResponse | undefined;

      // Extract validation errors from Laravel format (HTTP 422)
      const validationErrors: Record<string, string[]> = {};
      if (status === 422 && responseData?.errors && typeof responseData.errors === 'object') {
        for (const [key, value] of Object.entries(responseData.errors)) {
          if (Array.isArray(value)) {
            validationErrors[key] = value.map(String);
          } else if (typeof value === 'string') {
            validationErrors[key] = [value];
          }
        }
      }

      // Extract retry-after on 429
      let retryAfter: number | undefined;
      const retryHeader = headers?.['retry-after'];
      if (retryHeader) {
        retryAfter = parseInt(retryHeader, 10);
      } else if (responseData?.errors && typeof responseData.errors === 'object' && 'retry_after' in responseData.errors) {
        retryAfter = Number(responseData.errors.retry_after);
      }

      const isDeprecated = headers?.['x-api-deprecated'] === 'true';

      const message =
        responseData?.message ||
        (status === 429
          ? 'Too many requests. Please slow down and try again.'
          : status === 401
          ? 'Session expired. Please sign in again.'
          : status === 403
          ? 'You do not have permission to perform this action.'
          : status === 404
          ? 'Requested resource was not found.'
          : 'An unexpected server error occurred.');

      return new ApiError(message, status, validationErrors, {
        retryAfter,
        isDeprecated,
        rawResponse: responseData,
      });
    }

    return new ApiError(
      (error as Error)?.message || 'An unexpected error occurred.',
      500
    );
  }
}
