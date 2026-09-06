import axios from 'axios';
import { generateIdempotencyKey } from './idempotency.js';

// Default Android emulator loopback to host machine Laravel server
const DEFAULT_BASE_URL = 'http://10.0.2.2:8000/api/v1';

let currentAuthToken = null;
let currentBaseUrl = DEFAULT_BASE_URL;

export const apiClient = axios.create({
    baseURL: currentBaseUrl,
    timeout: 15000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

/**
 * Configure active Sanctum Bearer token.
 * @param {string|null} token
 */
export function setAuthToken(token) {
    currentAuthToken = token;
}

/**
 * Get active Sanctum Bearer token.
 * @returns {string|null}
 */
export function getAuthToken() {
    return currentAuthToken;
}

/**
 * Update the active Base URL (e.g., switching between staging, local LAN IP, or production).
 * @param {string} url
 */
export function setBaseUrl(url) {
    currentBaseUrl = url;
    apiClient.defaults.baseURL = url;
}

/**
 * Request Interceptor:
 * 1. Attaches Bearer authentication header if authenticated.
 * 2. Injects client-side Idempotency-Key on mutating HTTP calls (POST, PUT, PATCH, DELETE)
 *    unless an idempotency key was already attached (e.g. replaying an offline action).
 */
apiClient.interceptors.request.use(
    (config) => {
        // 1. Attach Auth Token
        if (currentAuthToken) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${currentAuthToken}`;
        }

        // 2. Attach Idempotency-Key on mutating HTTP methods
        const method = (config.method || 'get').toUpperCase();
        const isMutatingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

        if (isMutatingMethod) {
            config.headers = config.headers || {};
            const existingKey = config.headers['Idempotency-Key'] || config.headers['idempotency-key'];
            if (!existingKey) {
                config.headers['Idempotency-Key'] = generateIdempotencyKey();
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor:
 * Normalizes API response contract matching 03-API-SPECIFICATION.md:
 * { success: boolean, data: any, message: string, errors?: object }
 */
apiClient.interceptors.response.use(
    (response) => {
        // Return standard data wrapper
        return response.data;
    },
    (error) => {
        // Handle network unreachable / offline errors
        if (!error.response) {
            return Promise.reject({
                success: false,
                isNetworkError: true,
                message: error.message || 'Network unreachable. App is offline.',
                data: null,
                originalError: error,
            });
        }

        // Return server structured error response
        const serverData = error.response.data;
        if (serverData && typeof serverData === 'object') {
            return Promise.reject({
                success: false,
                status: error.response.status,
                isNetworkError: false,
                message: serverData.message || `Request failed with status ${error.response.status}`,
                data: serverData.data ?? null,
                errors: serverData.errors ?? {},
            });
        }

        return Promise.reject({
            success: false,
            status: error.response.status,
            isNetworkError: false,
            message: `Request failed with status ${error.response.status}`,
            data: null,
            errors: {},
        });
    }
);

export default apiClient;
