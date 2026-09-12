import { monitoringService, Sentry, ErrorBoundary } from '../services/monitoringService';
import { analyticsService } from '../services/analyticsService';

describe('Crash Reporting & Funnel Analytics (F18)', () => {
  beforeEach(() => {
    monitoringService.clearBreadcrumbs();
    analyticsService.clear();
  });

  describe('Sentry-compatible Monitoring Service', () => {
    it('initializes with platform and app tags', () => {
      monitoringService.init({
        dsn: 'https://test@sentry.io/12345',
        environment: 'test',
        release: '1.0.0-test',
      });

      const tags = monitoringService.getTags();
      expect(tags.app_name).toBe('GK WhizWheel');
      expect(tags.platform).toBeDefined();

      const breadcrumbs = monitoringService.getBreadcrumbs();
      expect(breadcrumbs.some((b) => b.message.includes('Monitoring initialized'))).toBe(true);
    });

    it('captures exceptions and stores breadcrumbs with stack context', () => {
      const testError = new Error('Database connection failed in checkout');
      const eventId = monitoringService.captureException(testError, { screen: 'Checkout' });

      expect(eventId).toMatch(/^err_/);
      const breadcrumbs = monitoringService.getBreadcrumbs();
      const errBreadcrumb = breadcrumbs.find((b) => b.category === 'error');
      expect(errBreadcrumb).toBeDefined();
      expect(errBreadcrumb?.message).toContain('Database connection failed in checkout');
      expect(errBreadcrumb?.data?.screen).toBe('Checkout');
    });

    it('captures informational messages with custom severity', () => {
      const eventId = Sentry.captureMessage('Station hub battery swapped', 'info');
      expect(eventId).toMatch(/^msg_/);

      const breadcrumbs = monitoringService.getBreadcrumbs();
      expect(breadcrumbs.some((b) => b.message === 'Station hub battery swapped')).toBe(true);
    });

    it('manages user context and identity tags', () => {
      Sentry.setUser({
        id: 'cust_8892',
        email: 'rider@example.com',
        name: 'Arjun Kamath',
      });

      const user = monitoringService.getUser();
      expect(user?.id).toBe('cust_8892');
      expect(user?.email).toBe('rider@example.com');

      const breadcrumbs = monitoringService.getBreadcrumbs();
      expect(breadcrumbs.some((b) => b.message.includes('cust_8892'))).toBe(true);
    });

    it('exports ErrorBoundary component class', () => {
      expect(ErrorBoundary).toBeDefined();
      expect(typeof ErrorBoundary).toBe('function');
    });
  });

  describe('Booking Funnel Analytics Events', () => {
    it('tracks app_open with environment and platform telemetry', () => {
      const event = analyticsService.trackAppOpen();

      expect(event.event).toBe('app_open');
      expect(event.payload.platform).toBeDefined();
      expect(event.payload.timestamp).toBeGreaterThan(0);
      expect(analyticsService.getEventsByName('app_open').length).toBe(1);
    });

    it('tracks screen_view and updates current screen', () => {
      analyticsService.trackScreenView('BikeDetail', { bikeId: 4 });

      expect(analyticsService.getCurrentScreen()).toBe('BikeDetail');
      const events = analyticsService.getEventsByName('screen_view');
      expect(events.length).toBe(1);
      expect(events[0].payload.screenName).toBe('BikeDetail');
      expect(events[0].payload.params?.bikeId).toBe(4);
    });

    it('tracks service_viewed when user explores specialized services', () => {
      const event = analyticsService.trackServiceViewed({
        serviceId: 'tours',
        serviceSlug: 'tours',
        title: 'Vacation Packages & Sightseeing',
        category: 'Tourism & Travel',
        startingPrice: '₹1,499/person',
      });

      expect(event.event).toBe('service_viewed');
      expect(event.payload.serviceSlug).toBe('tours');
      expect(event.payload.title).toBe('Vacation Packages & Sightseeing');
    });

    it('tracks booking_started when user taps Book Now on a bike', () => {
      const event = analyticsService.trackBookingStarted({
        bikeId: 10,
        bikeName: 'Royal Enfield Classic 350',
        dailyRate: 900,
        storeId: 1,
        storeName: 'Honnavar Railway Station Hub',
      });

      expect(event.event).toBe('booking_started');
      expect(event.payload.bikeId).toBe(10);
      expect(event.payload.bikeName).toBe('Royal Enfield Classic 350');
      expect(event.payload.dailyRate).toBe(900);
    });

    it('tracks payment_initiated when user begins PG checkout', () => {
      const event = analyticsService.trackPaymentInitiated({
        bookingId: 4501,
        amount: 2800,
        gateway: 'phonepe',
        itemType: 'Royal Enfield Classic 350',
      });

      expect(event.event).toBe('payment_initiated');
      expect(event.payload.bookingId).toBe(4501);
      expect(event.payload.gateway).toBe('phonepe');
      expect(event.payload.amount).toBe(2800);
    });

    it('tracks booking_confirmed when payment transaction completes', () => {
      const event = analyticsService.trackBookingConfirmed({
        bookingId: 4501,
        bookingCode: 'GKW-889012',
        bikeId: 10,
        totalAmount: 2800,
        paymentId: 'TXN-PhonePe-99120',
        paymentMethod: 'phonepe',
      });

      expect(event.event).toBe('booking_confirmed');
      expect(event.payload.bookingId).toBe(4501);
      expect(event.payload.bookingCode).toBe('GKW-889012');
      expect(event.payload.paymentId).toBe('TXN-PhonePe-99120');
    });

    it('forwards analytics events into Sentry breadcrumb trail for post-incident debugging', () => {
      analyticsService.trackBookingStarted({
        bikeId: 2,
        bikeName: 'Honda Activa 6G',
        dailyRate: 450,
      });

      const breadcrumbs = monitoringService.getBreadcrumbs();
      const analyticsBreadcrumb = breadcrumbs.find(
        (b) => b.category === 'analytics' && b.message.includes('booking_started')
      );

      expect(analyticsBreadcrumb).toBeDefined();
      expect(analyticsBreadcrumb?.data?.bikeName).toBe('Honda Activa 6G');
    });

    it('records end-to-end full booking funnel progression', () => {
      // Step 1: App Open
      analyticsService.trackAppOpen();

      // Step 2: Screen View -> Explore
      analyticsService.trackScreenView('Explore');

      // Step 3: Service View
      analyticsService.trackServiceViewed({
        serviceSlug: 'bikes',
        title: 'Two-Wheeler Self-Drive Rentals',
        category: 'Rental',
      });

      // Step 4: Booking Started
      analyticsService.trackBookingStarted({
        bikeId: 5,
        bikeName: 'Yamaha Aerox 155',
        dailyRate: 650,
      });

      // Step 5: Screen View -> Checkout
      analyticsService.trackScreenView('Checkout', { bikeId: 5 });

      // Step 6: Payment Initiated
      analyticsService.trackPaymentInitiated({
        bookingId: 7001,
        amount: 1300,
        gateway: 'razorpay',
      });

      // Step 7: Booking Confirmed
      analyticsService.trackBookingConfirmed({
        bookingId: 7001,
        bookingCode: 'GKW-7001-A',
        totalAmount: 1300,
        paymentId: 'pay_rzp_123',
      });

      const allEvents = analyticsService.getEvents();
      const funnelEventNames = allEvents.map((e) => e.event);

      expect(funnelEventNames).toContain('app_open');
      expect(funnelEventNames).toContain('screen_view');
      expect(funnelEventNames).toContain('service_viewed');
      expect(funnelEventNames).toContain('booking_started');
      expect(funnelEventNames).toContain('payment_initiated');
      expect(funnelEventNames).toContain('booking_confirmed');
    });
  });
});
