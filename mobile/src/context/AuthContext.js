import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiClient, setAuthToken } from '../api/client.js';

export const AuthContext = createContext({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    assignedStores: [],
    currentStore: null,
    login: async () => {},
    loginWithOtp: async () => {},
    requestOtp: async () => {},
    logout: async () => {},
    selectStore: () => {},
});

export const ALLOWED_ROLES = ['staff', 'store_manager', 'super_admin', 'admin'];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setTokenState] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assignedStores, setAssignedStores] = useState([]);
    const [currentStore, setCurrentStore] = useState(null);

    const handleAuthSuccess = useCallback((userData, authToken) => {
        // Enforce staff/store manager access control
        const userRole = userData?.role?.value || userData?.role || '';
        if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
            throw new Error('Access denied. This app is restricted to store staff and managers.');
        }

        setTokenState(authToken);
        setAuthToken(authToken);
        setUser(userData);

        const stores = userData.stores || [];
        setAssignedStores(stores);

        // Per 01-REQUIREMENTS-AND-FEATURES.md Section 12.1:
        // If staff is assigned to exactly 1 store, auto-select it.
        // If staff is assigned to >1 stores, keep currentStore null so Store Switcher is shown.
        if (stores.length === 1) {
            setCurrentStore(stores[0]);
        } else {
            setCurrentStore(null);
        }

        setError(null);
    }, []);

    const login = useCallback(
        async (identifier, password) => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.post('/auth/login', {
                    login: identifier,
                    password,
                });

                const data = response.data || response;
                const userData = data.user;
                const authToken = data.token;

                handleAuthSuccess(userData, authToken);
                return { success: true, user: userData, stores: userData.stores || [] };
            } catch (err) {
                const message = err.message || err.response?.data?.message || 'Login failed';
                setError(message);
                throw new Error(message);
            } finally {
                setIsLoading(false);
            }
        },
        [handleAuthSuccess]
    );

    const requestOtp = useCallback(async (email) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/auth/otp/request', { email });
            return response.data || response;
        } catch (err) {
            const message = err.message || err.response?.data?.message || 'Failed to request OTP';
            setError(message);
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithOtp = useCallback(
        async (email, otp) => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiClient.post('/auth/otp/verify', { email, otp });
                const data = response.data || response;
                const userData = data.user;
                const authToken = data.token;

                handleAuthSuccess(userData, authToken);
                return { success: true, user: userData, stores: userData.stores || [] };
            } catch (err) {
                const message = err.message || err.response?.data?.message || 'OTP verification failed';
                setError(message);
                throw new Error(message);
            } finally {
                setIsLoading(false);
            }
        },
        [handleAuthSuccess]
    );

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await apiClient.post('/auth/logout');
        } catch {
            // Swallow logout error if offline or already expired
        } finally {
            setAuthToken(null);
            setTokenState(null);
            setUser(null);
            setAssignedStores([]);
            setCurrentStore(null);
            setError(null);
            setIsLoading(false);
        }
    }, []);

    const selectStore = useCallback((store) => {
        setCurrentStore(store);
    }, []);

    return React.createElement(
        AuthContext.Provider,
        {
            value: {
                user,
                token,
                isAuthenticated: Boolean(token && user),
                isLoading,
                error,
                assignedStores,
                currentStore,
                login,
                loginWithOtp,
                requestOtp,
                logout,
                selectStore,
            },
        },
        children
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export default AuthContext;
