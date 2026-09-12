import { Platform } from 'react-native';
import { monitoringService } from './monitoringService';

export interface AppOpenPayload {
  platform: string;
  timestamp: number;
  environment: string;
}

export interface ServiceViewedPayload {
  serviceId?: string;
  serviceSlug?: string;
  title: string;
  category: string;
  startingPrice?: string;
}

export interface BookingStartedPayload {
  bikeId: number;
  bikeName: string;
  dailyRate: number;
  storeId?: number;
  storeName?: string;
}

export interface PaymentInitiatedPayload {
  bookingId?: number;
  amount: number;
  gateway: 'phonepe' | 'razorpay' | 'cash';
  itemType?: string;
}

export interface BookingConfirmedPayload {
  bookingId: number;
  bookingCode?: string;
  bikeId?: number;
  totalAmount: number;
  paymentId?: string;
  paymentMethod?: string;
}

export interface ScreenViewPayload {
  screenName: string;
  params?: Record<string, any>;
}

export type FunnelEventName =
  | 'app_open'
  | 'service_viewed'
  | 'booking_started'
  | 'payment_initiated'
  | 'booking_confirmed'
  | 'screen_view';

export interface AnalyticsEventRecord {
  id: string;
  event: FunnelEventName;
  timestamp: number;
  payload: Record<string, any>;
}

class AnalyticsService {
  private events: AnalyticsEventRecord[] = [];
  private currentScreen: string = 'App';

  public trackAppOpen(): AnalyticsEventRecord {
    const payload: AppOpenPayload = {
      platform: Platform.OS,
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'production',
    };
    return this.track('app_open', payload);
  }

  public trackServiceViewed(payload: ServiceViewedPayload): AnalyticsEventRecord {
    return this.track('service_viewed', payload);
  }

  public trackBookingStarted(payload: BookingStartedPayload): AnalyticsEventRecord {
    return this.track('booking_started', payload);
  }

  public trackPaymentInitiated(payload: PaymentInitiatedPayload): AnalyticsEventRecord {
    return this.track('payment_initiated', payload);
  }

  public trackBookingConfirmed(payload: BookingConfirmedPayload): AnalyticsEventRecord {
    return this.track('booking_confirmed', payload);
  }

  public trackScreenView(screenName: string, params?: Record<string, any>): AnalyticsEventRecord {
    this.currentScreen = screenName;
    return this.track('screen_view', { screenName, params });
  }

  public getCurrentScreen(): string {
    return this.currentScreen;
  }

  public track(event: FunnelEventName, payload: Record<string, any> = {}): AnalyticsEventRecord {
    const record: AnalyticsEventRecord = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      event,
      timestamp: Date.now(),
      payload,
    };

    this.events.push(record);

    // Keep last 100 events in memory
    if (this.events.length > 100) {
      this.events.shift();
    }

    // Attach breadcrumb to Sentry monitoring
    monitoringService.addBreadcrumb({
      message: `Analytics [${event}]`,
      category: 'analytics',
      level: 'info',
      data: payload,
    });

    if (__DEV__) {
      console.log(`[Analytics] ${event}:`, payload);
    }

    return record;
  }

  public getEvents(): AnalyticsEventRecord[] {
    return [...this.events];
  }

  public getEventsByName(name: FunnelEventName): AnalyticsEventRecord[] {
    return this.events.filter((e) => e.event === name);
  }

  public clear(): void {
    this.events = [];
  }
}

export const analyticsService = new AnalyticsService();
