import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from './AuthContext';

export interface SecurityContextType {
  isLocked: boolean;
  unlockApp: () => Promise<boolean>;
  requireLock: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

// 5 minutes in milliseconds
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const appState = useRef(AppState.currentState);
  const backgroundTimestamp = useRef<number | null>(null);

  // We want to lock on cold boot IF they are already authenticated.
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isLoading && isInitialMount.current) {
       isInitialMount.current = false;
       if (user) {
          setIsLocked(true); // Cold boot with an active session -> LOCK
       }
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!user) {
      setIsLocked(false);
      backgroundTimestamp.current = null;
    }
  }, [user]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App went to background
        backgroundTimestamp.current = Date.now();
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground
        if (backgroundTimestamp.current) {
          const elapsed = Date.now() - backgroundTimestamp.current;
          if (elapsed > IDLE_TIMEOUT_MS && user) {
            setIsLocked(true);
          }
        }
        backgroundTimestamp.current = null;
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  const unlockApp = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If device has no biometrics/PIN set up, allow bypassing 
        // to avoid soft-locking the device if it's not capable.
        setIsLocked(false);
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Operations',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const requireLock = () => {
    if (user) {
      setIsLocked(true);
    }
  };

  return (
    <SecurityContext.Provider value={{ isLocked, unlockApp, requireLock }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
