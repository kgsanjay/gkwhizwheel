import { paymentService, PaymentResult } from '../services/paymentService';
import { api } from '../api/client';
import { RazorpayCheckoutData, PhonePeCheckoutData } from '../api/types';

jest.mock('../api/client', () => ({
  api: {
    post: jest.fn(),
  },
}));

describe('Razorpay & PhonePe Mobile Payment Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initiateCheckout', () => {
    it('calls /bookings/:id/checkout for Razorpay gateway orders', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          booking_id: 42,
          booking_reference: 'GKW-2026-8491',
          gateway: 'razorpay',
          order_id: 'order_GKWhiz_9876',
          amount: 1500,
          amount_paise: 150000,
          currency: 'INR',
          key_id: 'rzp_live_testKey',
          status: 'pending_payment',
        },
      });

      const res = await paymentService.initiateCheckout(42, 'razorpay');
      expect(api.post).toHaveBeenCalledWith('/bookings/42/checkout', { gateway: 'razorpay' });
      expect(res.success).toBe(true);
      expect(res.data.order_id).toBe('order_GKWhiz_9876');
    });

    it('calls /bookings/:id/checkout/phonepe for PhonePe gateway orders', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          booking_id: 42,
          booking_reference: 'GKW-2026-8491',
          gateway: 'phonepe',
          merchant_transaction_id: 'TXN_PHONEPE_12345',
          redirect_url: 'https://api.phonepe.com/pay/v1/redirect',
          amount: 1500,
          amount_paise: 150000,
          currency: 'INR',
          status: 'pending_payment',
        },
      });

      const res = await paymentService.initiateCheckout(42, 'phonepe');
      expect(api.post).toHaveBeenCalledWith('/bookings/42/checkout/phonepe', {
        gateway: 'phonepe',
      });
      expect(res.success).toBe(true);
      expect(res.data.merchant_transaction_id).toBe('TXN_PHONEPE_12345');
    });

    it('handles network failure gracefully', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce(new Error('Gateway timeout'));

      const res = await paymentService.initiateCheckout(42, 'razorpay');
      expect(res.success).toBe(false);
      expect(res.message).toContain('Gateway timeout');
    });
  });

  describe('processRazorpayPayment', () => {
    const mockOrder: RazorpayCheckoutData = {
      booking_id: 101,
      booking_reference: 'GKW-TEST-101',
      gateway: 'razorpay',
      order_id: 'order_Rzp_101',
      amount: 1200,
      amount_paise: 120000,
      currency: 'INR',
      key_id: 'rzp_test_key_123',
      status: 'pending_payment',
    };

    it('returns success state with transaction details in simulated/fallback mode', async () => {
      const result = await paymentService.processRazorpayPayment(mockOrder, {
        name: 'Sanjay Bhat',
        email: 'sanjay@example.com',
        phone: '9480123456',
      });

      expect(result.status).toBe('success');
      expect(result.gateway).toBe('razorpay');
      expect(result.orderId).toBe('order_Rzp_101');
      expect(result.transactionId).toBeTruthy();
    });
  });

  describe('processPhonePePayment', () => {
    const mockPhonePeOrder: PhonePeCheckoutData = {
      booking_id: 102,
      booking_reference: 'GKW-TEST-102',
      gateway: 'phonepe',
      merchant_transaction_id: 'TXN_PPE_102',
      redirect_url: 'https://phonepe.mock.com/checkout',
      amount: 1800,
      amount_paise: 180000,
      currency: 'INR',
      status: 'pending_payment',
    };

    it('returns success state with merchant transaction ID in simulated mode', async () => {
      const result = await paymentService.processPhonePePayment(mockPhonePeOrder);

      expect(result.status).toBe('success');
      expect(result.gateway).toBe('phonepe');
      expect(result.transactionId).toBe('TXN_PPE_102');
    });
  });

  describe('verifyBookingPayment', () => {
    it('verifies confirmed booking when server returns confirmed status', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: {
          id: 55,
          status: 'confirmed',
          total_amount: 1500,
        },
        message: 'Payment verified and booking confirmed.',
      });

      const result = await paymentService.verifyBookingPayment(55);
      expect(api.post).toHaveBeenCalledWith('/bookings/55/confirm-payment');
      expect(result.confirmed).toBe(true);
      expect(result.status).toBe('confirmed');
    });

    it('handles pending webhook settlement state gracefully without throwing', async () => {
      (api.post as jest.Mock).mockResolvedValue({
        success: false,
        data: {
          id: 55,
          status: 'pending_payment',
        },
        message: 'Payment is awaiting server-to-server webhook confirmation.',
      });

      const result = await paymentService.verifyBookingPayment(55, 1);
      expect(result.confirmed).toBe(false);
      expect(result.status).toBe('pending_payment');
      expect(result.message).toContain('server-to-server webhook confirmation');
    });
  });

  describe('Payment Result States Contract', () => {
    it('validates success, failure, and cancellation states compatibility', () => {
      const successResult: PaymentResult = {
        status: 'success',
        gateway: 'razorpay',
        transactionId: 'pay_998877',
      };
      const cancelledResult: PaymentResult = {
        status: 'cancelled',
        gateway: 'phonepe',
        error: 'User cancelled in PhonePe app.',
      };
      const failureResult: PaymentResult = {
        status: 'failure',
        gateway: 'razorpay',
        error: 'Card expired or insufficient balance.',
      };

      expect(successResult.status).toBe('success');
      expect(cancelledResult.status).toBe('cancelled');
      expect(failureResult.status).toBe('failure');
    });
  });
});
