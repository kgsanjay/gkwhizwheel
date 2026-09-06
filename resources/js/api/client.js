import axios from 'axios';

/**
 * Centralized Axios API client instance per 04-CODING-STANDARDS-AND-STRUCTURE.md Section 3.
 */
const apiClient = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
});

/**
 * Request interceptor: injects Bearer auth token and CSRF token.
 */
apiClient.interceptors.request.use(
    (config) => {
        // Read token from localStorage if available
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Read CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            config.headers['X-CSRF-TOKEN'] = csrfToken;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response interceptor: handles 401 unauthorized and normalizes API error envelopes.
 */
apiClient.interceptors.response.use(
    (response) => {
        // Returns the payload from the standard API envelope: { success, data, message }
        return response.data;
    },
    (error) => {
        const status = error.response?.status;
        const responseData = error.response?.data;

        if (status === 401) {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            // If on a protected page, dispatch custom event or allow Inertia to handle
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }

        // Normalize error shape to always have message and optional validation errors
        const normalizedError = {
            status: status || 500,
            message: responseData?.message || error.message || 'An unexpected error occurred.',
            errors: responseData?.errors || null,
            raw: error,
        };

        return Promise.reject(normalizedError);
    }
);

/**
 * Helper to store and apply Bearer token.
 */
export function setAuthToken(token) {
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
}

/**
 * Helper to clear auth token.
 */
export function clearAuthToken() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
}

export default apiClient;
