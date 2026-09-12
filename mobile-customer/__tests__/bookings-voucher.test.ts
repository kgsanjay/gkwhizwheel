import {
  filterBookingsByTab,
  BookingTab,
} from '../screens/BookingsScreen';
import {
  buildVoucherShareText,
  formatVoucherDate,
  formatVoucherTime,
} from '../screens/BookingDetailScreen';
import { Booking } from '../api/types';

describe('My Bookings & Voucher Flow (F11)', () => {
  const sampleBookings: Booking[] = [
    {
      id: 201,
      booking_number: 'GKW-2026-A101',
      customer_id: 1,
      bike_id: 1,
      pickup_store_id: 1,
      return_store_id: 1,
      start_date: '2026-09-15 10:00:00',
      end_date: '2026-09-17 10:00:00',
      total_amount: 2100,
      deposit_amount: 1000,
      status: 'confirmed',
      bike: {
        id: 1,
        category_id: 1,
        current_store_id: 1,
        brand: 'Honda',
        model_name: 'Activa 6G',
        registration_number: 'KA-47-E-8421',
        daily_rate: 499,
        status: 'available',
        home_store_id: 1,
        fuel_type: 'petrol',
        transmission: 'automatic',
      },
      pickup_store: {
        id: 1,
        name: 'Honnavar Railway Station Hub',
        city: 'Honnavar',
        address_line: 'Exit Platform 1, Railway Station Road',
        phone: '+91 94801 23456',
        latitude: 14.2831,
        longitude: 74.4534,
      },
      created_at: '2026-09-12 10:00:00',
    },
    {
      id: 202,
      booking_number: 'GKW-2026-A102',
      customer_id: 1,
      bike_id: 2,
      pickup_store_id: 1,
      return_store_id: 1,
      start_date: '2026-09-18 09:00:00',
      end_date: '2026-09-19 09:00:00',
      total_amount: 1250,
      deposit_amount: 1000,
      status: 'held',
      created_at: '2026-09-12 11:00:00',
    },
    {
      id: 203,
      booking_number: 'GKW-2026-A103',
      customer_id: 1,
      bike_id: 3,
      pickup_store_id: 1,
      return_store_id: 2,
      start_date: '2026-08-01 10:00:00',
      end_date: '2026-08-03 10:00:00',
      total_amount: 3200,
      deposit_amount: 1000,
      status: 'returned',
      created_at: '2026-07-30 10:00:00',
    },
    {
      id: 204,
      booking_number: 'GKW-2026-A104',
      customer_id: 1,
      bike_id: 4,
      pickup_store_id: 2,
      return_store_id: 2,
      start_date: '2026-07-10 10:00:00',
      end_date: '2026-07-11 10:00:00',
      total_amount: 999,
      deposit_amount: 1000,
      status: 'cancelled',
      created_at: '2026-07-09 10:00:00',
    },
  ];

  describe('filterBookingsByTab (Segmented Control)', () => {
    it('filters upcoming bookings including confirmed and held', () => {
      const upcoming = filterBookingsByTab(sampleBookings, 'upcoming');
      expect(upcoming).toHaveLength(2);
      expect(upcoming.map((b) => b.status)).toEqual(['confirmed', 'held']);
    });

    it('filters past completed bookings with returned status', () => {
      const past = filterBookingsByTab(sampleBookings, 'past');
      expect(past).toHaveLength(1);
      expect(past[0].status).toBe('returned');
      expect(past[0].booking_number).toBe('GKW-2026-A103');
    });

    it('filters cancelled bookings accurately', () => {
      const cancelled = filterBookingsByTab(sampleBookings, 'cancelled');
      expect(cancelled).toHaveLength(1);
      expect(cancelled[0].status).toBe('cancelled');
      expect(cancelled[0].booking_number).toBe('GKW-2026-A104');
    });
  });

  describe('formatVoucherDate & formatVoucherTime', () => {
    it('formats ISO date string into readable Indian locale format', () => {
      const formatted = formatVoucherDate('2026-09-15 10:00:00');
      expect(formatted).toContain('Sep');
      expect(formatted).toContain('2026');
    });

    it('formats time string with AM/PM meridian', () => {
      const formatted = formatVoucherTime('2026-09-15 14:30:00');
      expect(formatted).toMatch(/(am|pm)/i);
    });
  });

  describe('buildVoucherShareText (Expo-Sharing Payload)', () => {
    const booking = sampleBookings[0];

    it('generates complete voucher text matching web blade voucher template fields', () => {
      const shareText = buildVoucherShareText(booking);

      // Brand and Voucher Header
      expect(shareText).toContain('GK WHIZWHEELS RENTAL VOUCHER');
      expect(shareText).toContain('VOUCHER #: GKW-2026-A101');
      expect(shareText).toContain('STATUS: CONFIRMED');

      // Vehicle Information
      expect(shareText).toContain('Model: Honda Activa 6G');
      expect(shareText).toContain('Registration: KA-47-E-8421');

      // Schedule & Hubs
      expect(shareText).toContain('Honnavar Railway Station Hub');
      expect(shareText).toContain('Exit Platform 1');

      // Financial & Security Deposit
      expect(shareText).toContain('Total Tariff: ₹2100');
      expect(shareText).toContain('Refundable Deposit: ₹1000');

      // Safety Rules & 24/7 Helpline
      expect(shareText).toContain('2 sanitized ISI safety helmets');
      expect(shareText).toContain('+91 94801 23456');
    });
  });
});
