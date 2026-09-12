import { Platform } from 'react-native';

export type Environment = 'development' | 'staging' | 'production';

// Derive current environment: EXPO_PUBLIC_APP_ENV > NODE_ENV > __DEV__
export const getEnvironment = (): Environment => {
  const env = process.env.EXPO_PUBLIC_APP_ENV || process.env.NODE_ENV;
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  // Default to development in React Native dev mode
  return (typeof __DEV__ !== 'undefined' && __DEV__) ? 'development' : 'production';
};

export const ENV: Environment = getEnvironment();

const ENV_CONFIGS: Record<Environment, { apiBaseUrl: string }> = {
  development: {
    // Android emulator loops back to host machine via 10.0.2.2, iOS uses localhost
    apiBaseUrl: Platform.select({
      android: 'http://10.0.2.2:8000/api/v1',
      ios: 'http://localhost:8000/api/v1',
      default: 'http://localhost:8000/api/v1',
    }),
  },
  staging: {
    apiBaseUrl: 'https://staging-api.gkwhizwheel.com/api/v1',
  },
  production: {
    apiBaseUrl: 'https://api.gkwhizwheel.com/api/v1',
  },
};

// Allow runtime override via EXPO_PUBLIC_API_URL if provided
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || ENV_CONFIGS[ENV].apiBaseUrl;

export const APP_VERSION = '1.0.0';
export const CLIENT_TYPE = 'customer_app';

export const config = {
  env: ENV,
  apiBaseUrl: API_BASE_URL,
  appVersion: APP_VERSION,
  clientType: CLIENT_TYPE,
  isDev: ENV === 'development',
  isProd: ENV === 'production',
};
