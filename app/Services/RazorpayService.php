<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class RazorpayService
{
    /**
     * Create a Razorpay order for combined advance + security deposit (Option A).
     *
     * @return array<string, mixed>
     */
    public function createOrder(Booking $booking): array
    {
        $keyId = (string) config('services.razorpay.key_id', 'rzp_test_placeholder');
        $keySecret = (string) config('services.razorpay.key_secret', 'test_secret_placeholder');

        // Option A: Advance rental + security deposit charged together in a single order
        $amountPaise = (int) round(BikeBookingPayments::expectedGatewayAmount($booking) * 100);

        $payload = [
            'amount' => $amountPaise,
            'currency' => 'INR',
            'receipt' => $booking->booking_reference,
            'notes' => [
                'booking_id' => (string) $booking->id,
                'booking_reference' => (string) $booking->booking_reference,
                'user_id' => (string) $booking->user_id,
            ],
        ];

        try {
            $response = Http::withBasicAuth($keyId, $keySecret)
                ->timeout(5)
                ->post('https://api.razorpay.com/v1/orders', $payload);

            if ($response->successful()) {
                /** @var array<string, mixed> $data */
                $data = $response->json();
                $data['key_id'] = $keyId;

                return $data;
            }
        } catch (\Throwable) {
            // fall through to synthetic order in local/testing environment
        }

        if (app()->environment('local', 'testing')) {
            // ponytail: synthetic order generation for local dev & testing when sandbox/placeholder keys are unauthenticated
            return [
                'id' => 'order_'.strtolower(Str::random(14)),
                'entity' => 'order',
                'amount' => $amountPaise,
                'currency' => 'INR',
                'receipt' => $booking->booking_reference,
                'status' => 'created',
                'key_id' => $keyId,
                'notes' => $payload['notes'],
            ];
        }

        throw new \RuntimeException('Razorpay order creation failed: '.($response->body() ?? 'unknown error'));
    }

    /**
     * Create a Razorpay order for a multi-service booking (advance or full balance).
     *
     * @return array<string, mixed>
     */
    public function createServiceOrder(\App\Models\ServiceBooking $booking, ?float $amount = null): array
    {
        $keyId = (string) config('services.razorpay.key_id', 'rzp_test_placeholder');
        $keySecret = (string) config('services.razorpay.key_secret', 'test_secret_placeholder');

        $chargeAmount = $amount ?? (float) $booking->balance_due;
        if ($chargeAmount <= 0) {
            $chargeAmount = (float) $booking->total_amount;
        }
        $amountPaise = (int) round($chargeAmount * 100);

        $payload = [
            'amount' => $amountPaise,
            'currency' => 'INR',
            'receipt' => $booking->booking_number,
            'notes' => [
                'booking_id' => (string) $booking->id,
                'booking_number' => (string) $booking->booking_number,
                'service_type' => (string) $booking->service_type,
                'user_id' => (string) $booking->user_id,
            ],
        ];

        try {
            $response = Http::withBasicAuth($keyId, $keySecret)
                ->timeout(5)
                ->post('https://api.razorpay.com/v1/orders', $payload);

            if ($response->successful()) {
                /** @var array<string, mixed> $data */
                $data = $response->json();
                $data['key_id'] = $keyId;

                return $data;
            }
        } catch (\Throwable) {
            // fall through to synthetic order in local/testing environment
        }

        if (app()->environment('local', 'testing')) {
            return [
                'id' => 'order_'.strtolower(Str::random(14)),
                'entity' => 'order',
                'amount' => $amountPaise,
                'currency' => 'INR',
                'receipt' => $booking->booking_number,
                'status' => 'created',
                'key_id' => $keyId,
                'notes' => $payload['notes'],
            ];
        }

        throw new \RuntimeException('Razorpay order creation failed: '.($response->body() ?? 'unknown error'));
    }

    /**
     * Verify a captured multi-service payment directly with Razorpay.
     *
     * Never trust a browser-provided paid amount or order-to-booking association.
     * Returns the authoritative amount in paise, or null on any mismatch.
     */
    public function verifiedServicePaymentAmountPaise(
        \App\Models\ServiceBooking $booking,
        string $orderId,
        string $paymentId
    ): ?int {
        $keyId = (string) config('services.razorpay.key_id', '');
        $keySecret = (string) config('services.razorpay.key_secret', '');
        if ($keyId === '' || $keySecret === '') {
            return null;
        }

        try {
            $paymentResponse = Http::withBasicAuth($keyId, $keySecret)
                ->timeout(8)
                ->get('https://api.razorpay.com/v1/payments/'.rawurlencode($paymentId));
            $orderResponse = Http::withBasicAuth($keyId, $keySecret)
                ->timeout(8)
                ->get('https://api.razorpay.com/v1/orders/'.rawurlencode($orderId));
            if (! $paymentResponse->successful() || ! $orderResponse->successful()) {
                return null;
            }

            $payment = $paymentResponse->json();
            $order = $orderResponse->json();
            $amountPaise = (int) ($payment['amount'] ?? 0);
            if (($payment['id'] ?? null) !== $paymentId
                || ($payment['order_id'] ?? null) !== $orderId
                || ($payment['status'] ?? null) !== 'captured'
                || ($payment['currency'] ?? null) !== 'INR'
                || $amountPaise <= 0
                || ($order['id'] ?? null) !== $orderId
                || ($order['receipt'] ?? null) !== $booking->booking_number
                || ($order['currency'] ?? null) !== 'INR'
                || (int) ($order['amount'] ?? 0) !== $amountPaise) {
                return null;
            }

            return $amountPaise;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Verify payment signature from checkout callback.
     */
    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool
    {
        $keySecret = (string) config('services.razorpay.key_secret', 'test_secret_placeholder');
        $expectedSignature = hash_hmac('sha256', $orderId.'|'.$paymentId, $keySecret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Verify the HMAC SHA-256 signature on an incoming Razorpay webhook.
     */
    public function verifyWebhookSignature(string $rawPayload, ?string $signature, ?string $secret = null): bool
    {
        if ($signature === null || $signature === '') {
            return false;
        }

        $webhookSecret = $secret ?? (string) config('services.razorpay.webhook_secret', '');
        if ($webhookSecret === '') {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', $rawPayload, $webhookSecret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Issue a refund via Razorpay Refunds API (POST /v1/payments/{id}/refund).
     *
     * @param array<string, mixed> $notes
     * @return array{success: bool, refund_id: ?string, status: string, error: ?string, data?: array<string, mixed>}
     */
    public function createRefund(string $paymentId, float $amount, array $notes = []): array
    {
        $keyId = (string) config('services.razorpay.key_id', '');
        $keySecret = (string) config('services.razorpay.key_secret', '');
        $amountPaise = (int) round($amount * 100);

        // Reject invalid amounts before making any external request.
        if (! is_finite($amount) || $amountPaise < 1 || $amountPaise > 1000000000) {
            return ['success' => false, 'refund_id' => null, 'status' => 'failed', 'error' => 'Invalid refund amount.'];
        }
        if ($paymentId === '' || ! preg_match('/^pay_[A-Za-z0-9_]+$/', $paymentId)) {
            return ['success' => false, 'refund_id' => null, 'status' => 'failed', 'error' => 'Invalid payment reference.'];
        }
        if ($keyId === '' || $keySecret === '' || str_contains($keyId, 'placeholder') || str_contains($keySecret, 'placeholder')) {
            return ['success' => false, 'refund_id' => null, 'status' => 'failed', 'error' => 'Payment gateway is not configured.'];
        }

        $payload = [
            'amount' => $amountPaise,
            'notes' => $notes,
        ];

        try {
            $response = Http::withBasicAuth($keyId, $keySecret)
                ->timeout(5)
                ->post("https://api.razorpay.com/v1/payments/{$paymentId}/refund", $payload);

            if ($response->successful()) {
                /** @var array<string, mixed> $data */
                $data = $response->json();
                if (! is_array($data)
                    || ! is_string($data['id'] ?? null)
                    || ! str_starts_with($data['id'], 'rfnd_')
                    || (int) ($data['amount'] ?? 0) !== $amountPaise
                    || ($data['payment_id'] ?? null) !== $paymentId
                    || ! in_array($data['status'] ?? null, ['processed', 'pending', 'created'], true)) {
                    return ['success' => false, 'refund_id' => null, 'status' => 'failed', 'error' => 'Invalid refund gateway response.'];
                }
                $isProcessed = $data['status'] === 'processed';

                return [
                    'success' => true,
                    'refund_id' => $data['id'] ?? null,
                    'status' => $isProcessed ? 'completed' : 'pending',
                    'error' => null,
                    'data' => $data,
                ];
            }

            \Illuminate\Support\Facades\Log::warning('Razorpay refund API call unauthenticated or rejected', [
                'payment_id' => $paymentId,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Razorpay refund network exception', [
                'payment_id' => $paymentId,
                'message' => $e->getMessage(),
            ]);
        }


        return [
            'success' => false,
            'refund_id' => null,
            'status' => 'failed',
            'error' => isset($response) ? ($response->json('error.description') ?? 'Gateway refund rejected') : 'Gateway connection error',
        ];
    }
}
