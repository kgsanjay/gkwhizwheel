<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\BookingService;
use App\Services\RazorpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RazorpayWebhookController extends Controller
{
    /**
     * Handle incoming server-to-server Razorpay webhooks.
     * Enforces HMAC SHA-256 signature verification and is the sole authoritative
     * entry point for transitioning bookings to confirmed status online.
     */
    public function handle(
        Request $request,
        RazorpayService $razorpayService,
        BookingService $bookingService
    ): JsonResponse {
        $signature = $request->header('X-Razorpay-Signature');
        $rawPayload = (string) $request->getContent();

        if (! $razorpayService->verifyWebhookSignature($rawPayload, $signature)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid webhook signature.',
                'errors' => null,
            ], 400);
        }

        $event = json_decode($rawPayload, true);
        if (! is_array($event)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid JSON payload.',
                'errors' => null,
            ], 400);
        }

        $eventType = (string) ($event['event'] ?? '');

        // We specifically listen for payment success triggers
        if (! in_array($eventType, ['payment.captured', 'order.paid'], true)) {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Ignored event: '.$eventType,
            ]);
        }

        $paymentEntity = $event['payload']['payment']['entity'] ?? [];
        $orderEntity = $event['payload']['order']['entity'] ?? [];

        $gatewayPaymentId = (string) ($paymentEntity['id'] ?? '');
        $amountPaise = (int) ($paymentEntity['amount'] ?? $orderEntity['amount'] ?? 0);
        $amount = round($amountPaise / 100, 2);

        $notes = $paymentEntity['notes'] ?? $orderEntity['notes'] ?? [];
        $bookingId = $notes['booking_id'] ?? null;
        $bookingReference = $notes['booking_reference'] ?? $orderEntity['receipt'] ?? null;

        $booking = null;
        if ($bookingId) {
            $booking = Booking::find((int) $bookingId);
        }
        if (! $booking && $bookingReference) {
            $booking = Booking::where('booking_reference', (string) $bookingReference)->first();
        }

        if (! $booking) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Booking not found for payment webhook.',
                'errors' => null,
            ], 404);
        }

        // Idempotency: if already confirmed and payment exists, return 200
        $existingPayment = $gatewayPaymentId !== ''
            ? Payment::where('gateway_reference', $gatewayPaymentId)->first()
            : null;

        if ($existingPayment && $booking->status === BookingStatus::CONFIRMED) {
            return response()->json([
                'success' => true,
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'status' => $booking->status->value,
                    'gateway_reference' => $gatewayPaymentId,
                ],
                'message' => 'Webhook already processed.',
            ]);
        }

        // Record successful payment (Option A combined advance + deposit)
        if (! $existingPayment) {
            Payment::create([
                'booking_id' => $booking->id,
                'type' => PaymentType::ADVANCE,
                'amount' => $amount > 0 ? $amount : (float) $booking->total_amount,
                'method' => PaymentMethod::RAZORPAY,
                'gateway_reference' => $gatewayPaymentId ?: 'pay_rzp_'.uniqid(),
                'status' => PaymentStatus::SUCCESS,
                'collected_by' => null,
                'notes' => 'Razorpay online advance + deposit payment via webhook',
            ]);
        }

        // Transition booking status to CONFIRMED
        if (in_array($booking->status, [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT], true)) {
            $bookingService->confirmPayment($booking, $gatewayPaymentId);
        }

        ActivityLog::create([
            'user_id' => $booking->user_id,
            'store_id' => $booking->pickup_store_id,
            'action' => 'payment.webhook_confirmed',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'new_values' => [
                'event' => $eventType,
                'gateway_reference' => $gatewayPaymentId,
                'amount' => $amount,
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'status' => $booking->fresh()->status->value,
                'gateway_reference' => $gatewayPaymentId,
            ],
            'message' => 'Payment webhook processed and booking confirmed.',
        ]);
    }
}
