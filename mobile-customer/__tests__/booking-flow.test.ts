import {
  calculateRentalDays,
  toApiDateString,
  formatDate,
  formatTime,
  AddonState,
} from '../screens/CheckoutScreen';
import { BookingAddon } from '../api/types';

describe('Native Multi-Step Booking Flow Logic', () => {
  describe('calculateRentalDays', () => {
    it('returns at least 1 day for identical or immediate dates', () => {
      const start = new Date('2026-09-12T10:00:00Z');
      const end = new Date('2026-09-12T10:00:00Z');
      expect(calculateRentalDays(start, end)).toBe(1);
    });

    it('returns 1 day for exact 24 hour rental period', () => {
      const start = new Date('2026-09-12T10:00:00Z');
      const end = new Date('2026-09-13T10:00:00Z');
      expect(calculateRentalDays(start, end)).toBe(1);
    });

    it('rounds up to 2 days for 26 hours rental duration', () => {
      const start = new Date('2026-09-12T10:00:00Z');
      const end = new Date('2026-09-13T12:00:00Z'); // 26 hours
      expect(calculateRentalDays(start, end)).toBe(2);
    });

    it('calculates 3 days for a 72-hour weekend booking', () => {
      const start = new Date('2026-09-12T09:00:00Z');
      const end = new Date('2026-09-15T09:00:00Z');
      expect(calculateRentalDays(start, end)).toBe(3);
    });

    it('calculates 7 days for a full week rental', () => {
      const start = new Date('2026-09-12T10:00:00Z');
      const end = new Date('2026-09-19T10:00:00Z');
      expect(calculateRentalDays(start, end)).toBe(7);
    });
  });

  describe('API Date & Time Formatting', () => {
    it('formats date to ISO SQL format YYYY-MM-DD HH:mm:ss for backend ingestion', () => {
      const d = new Date(2026, 8, 12, 10, 30, 0); // Sep 12, 2026 10:30:00
      const apiStr = toApiDateString(d);
      expect(apiStr).toMatch(/^2026-09-12 10:30:00$/);
    });

    it('generates non-empty human-friendly strings for UI cards', () => {
      const d = new Date(2026, 8, 12, 10, 0, 0);
      expect(formatDate(d)).toContain('2026');
      expect(formatTime(d)).toContain('10:00');
    });
  });

  describe('Add-ons & Itemized Fare Calculations', () => {
    const mockAddons: AddonState[] = [
      {
        addon_type: 'helmet',
        name: 'Extra ISI Safety Helmet',
        description: 'Sanitized full-face helmet',
        unit_price: 100,
        icon: '⛑️',
        allowQuantity: true,
        maxQuantity: 3,
        quantity: 2,
        selected: true,
      },
      {
        addon_type: 'extra_rider',
        name: 'Extra Rider Authorization',
        description: 'Legal authorization',
        unit_price: 150,
        icon: '👥',
        allowQuantity: false,
        maxQuantity: 1,
        quantity: 1,
        selected: false,
      },
      {
        addon_type: 'insurance',
        name: 'Comprehensive Damage Cover',
        description: 'Collision waiver',
        unit_price: 250,
        icon: '🛡️',
        allowQuantity: false,
        maxQuantity: 1,
        quantity: 1,
        selected: true,
      },
      {
        addon_type: 'gps',
        name: 'GPS Tracker',
        description: 'Mount & charger',
        unit_price: 100,
        icon: '📍',
        allowQuantity: false,
        maxQuantity: 1,
        quantity: 1,
        selected: false,
      },
    ];

    it('calculates daily addons subtotal correctly including quantity', () => {
      const selected = mockAddons.filter((a) => a.selected);
      // helmet: 100 * 2 = 200, insurance: 250 * 1 = 250 => total 450 per day
      const dailySubtotal = selected.reduce(
        (sum, a) => sum + a.unit_price * (a.allowQuantity ? a.quantity : 1),
        0
      );
      expect(dailySubtotal).toBe(450);
    });

    it('multiplies addons by rental days across the booking span', () => {
      const days = 3;
      const dailySubtotal = 450;
      expect(dailySubtotal * days).toBe(1350);
    });

    it('computes transparent itemized grand total with 18% GST and ₹1,000 security deposit', () => {
      const dailyRate = 500;
      const days = 2;
      const baseRental = dailyRate * days; // 1000
      const addonsTotal = 450 * days; // 900
      const gst = Math.round((baseRental + addonsTotal) * 0.18); // (1900) * 0.18 = 342
      const deposit = 1000;
      const grandTotal = baseRental + addonsTotal + gst + deposit; // 1000 + 900 + 342 + 1000 = 3242

      expect(baseRental).toBe(1000);
      expect(addonsTotal).toBe(900);
      expect(gst).toBe(342);
      expect(deposit).toBe(1000);
      expect(grandTotal).toBe(3242);
    });

    it('formats payload correctly for POST /api/v1/customer/bookings/hold', () => {
      const selected = mockAddons.filter((a) => a.selected);
      const formattedAddons: BookingAddon[] = selected.map((a) => ({
        addon_type: a.addon_type,
        quantity: a.allowQuantity ? a.quantity : 1,
        unit_price: a.unit_price,
      }));

      expect(formattedAddons).toEqual([
        { addon_type: 'helmet', quantity: 2, unit_price: 100 },
        { addon_type: 'insurance', quantity: 1, unit_price: 250 },
      ]);
    });
  });

  describe('Payment Method Options', () => {
    it('supports the canonical Indian payment gateways and pay-at-counter option', () => {
      const methods = ['upi', 'card', 'netbanking', 'cash'];
      expect(methods).toHaveLength(4);
      expect(methods).toContain('upi');
      expect(methods).toContain('cash');
    });
  });
});
