import { Platform } from 'react-native';
export { ErrorBoundary } from '../components/ErrorBoundary';

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface Breadcrumb {
  message: string;
  category?: string;
  level?: SeverityLevel;
  timestamp?: number;
  data?: Record<string, any>;
}

export interface UserContext {
  id?: string | number;
  email?: string;
  name?: string;
}

export interface MonitoringConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  enableInDev?: boolean;
}

class MonitoringService {
  private dsn: string | null = null;
  private environment: string = 'production';
  private release: string = '1.0.0';
  private user: UserContext | null = null;
  private tags: Record<string, string> = {};
  private breadcrumbs: Breadcrumb[] = [];
  private isInitialized: boolean = false;

  public init(config?: MonitoringConfig): void {
    this.dsn =
      config?.dsn ||
      process.env.EXPO_PUBLIC_SENTRY_DSN ||
      'https://public@sentry.io/gkwhizwheel-customer';
    this.environment = config?.environment || process.env.NODE_ENV || 'production';
    this.release = config?.release || '1.0.0';
    this.isInitialized = true;

    this.setTag('platform', Platform.OS);
    this.setTag('app_name', 'GK WhizWheel');

    // Register React Native global unhandled exception handler if available
    if (typeof (globalThis as any).ErrorUtils !== 'undefined') {
      const originalHandler = (globalThis as any).ErrorUtils.getGlobalHandler();
      (globalThis as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        this.captureException(error, { isFatal });
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    this.addBreadcrumb({
      message: 'Monitoring initialized',
      category: 'lifecycle',
      level: 'info',
    });
  }

  public captureException(error: Error | any, context?: Record<string, any>): string {
    const eventId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorMessage = error?.message || String(error);
    const stack = error?.stack || '';

    this.addBreadcrumb({
      message: `Exception captured: ${errorMessage}`,
      category: 'error',
      level: 'error',
      data: { stack, ...context },
    });

    if (__DEV__) {
      console.warn(`[Sentry/Monitoring] Event ID: ${eventId} - ${errorMessage}`, context);
    }

    // If a live remote Sentry DSN is configured in production, telemetry would be dispatched here
    return eventId;
  }

  public captureMessage(message: string, level: SeverityLevel = 'info'): string {
    const eventId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.addBreadcrumb({
      message,
      category: 'message',
      level,
    });

    return eventId;
  }

  public addBreadcrumb(breadcrumb: Breadcrumb): void {
    const item: Breadcrumb = {
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
    };
    this.breadcrumbs.push(item);
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }
  }

  public getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  public setUser(user: UserContext | null): void {
    this.user = user;
    if (user) {
      this.addBreadcrumb({
        message: `User session set: ${user.id || user.email}`,
        category: 'auth',
        level: 'info',
      });
    }
  }

  public getUser(): UserContext | null {
    return this.user;
  }

  public setTag(key: string, value: string): void {
    this.tags[key] = value;
  }

  public getTags(): Record<string, string> {
    return { ...this.tags };
  }

  public clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

export const monitoringService = new MonitoringService();

// Sentry-compatible alias for standard sentry API surface
export const Sentry = {
  init: (config?: MonitoringConfig) => monitoringService.init(config),
  captureException: (error: any, context?: Record<string, any>) =>
    monitoringService.captureException(error, context),
  captureMessage: (message: string, level?: SeverityLevel) =>
    monitoringService.captureMessage(message, level),
  addBreadcrumb: (breadcrumb: Breadcrumb) => monitoringService.addBreadcrumb(breadcrumb),
  setUser: (user: UserContext | null) => monitoringService.setUser(user),
  setTag: (key: string, value: string) => monitoringService.setTag(key, value),
};
