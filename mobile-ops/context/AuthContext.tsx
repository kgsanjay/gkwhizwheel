import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StaffUser } from '../api/types';
import { storage } from '../api/storage';
import { opsApi } from '../api/client';
import { NotificationManager } from '../services/NotificationManager';

export interface AuthContextType {
  user: StaffUser | null;
  token: string | null;
  role: 'staff' | 'store_manager' | 'super_admin' | null;
  isManager: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<StaffUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    try {
      const storedToken = await storage.getToken();
      const storedUser = await storage.getUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (user) {
      // Register for push notifications once the user is authenticated
      NotificationManager.registerForPushNotificationsAsync();
    }
  }, [user]);

  const login = async (credentials: { email?: string; phone?: string; password: string }): Promise<StaffUser> => {
    const res = await opsApi.login(credentials);
    const { token: receivedToken, user: receivedUser } = res;

    // Validate that the role is allowed
    const allowedRoles = ['super_admin', 'store_manager', 'staff'];
    if (!allowedRoles.includes(receivedUser.role)) {
      await opsApi.logout();
      throw new Error('Customer accounts cannot access the Operations portal.');
    }

    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await opsApi.logout();
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const updatedUser = await opsApi.getProfile();
      await storage.setUser(updatedUser);
      setUser(updatedUser);
    } catch {
      // Keep existing cached user
    }
  };

  const role = user?.role as 'staff' | 'store_manager' | 'super_admin' | null;
  const isManager = role === 'store_manager' || role === 'super_admin';
  const isStaff = role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isManager,
        isStaff,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
