<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Webhooks;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\RefundStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use App\Services\BookingService;
use App\Services\RazorpayService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

        // Handle refund events asynchronously
        if (in_array($eventType, ['refund.processed', 'refund.failed'], true)) {
            $refundEntity = $event['payload']['refund']['entity'] ?? [];
            $gatewayRefundId = (string) ($refundEntity['id'] ?? '');
            $paymentId = (string) ($refundEntity['payment_id'] ?? '');
            $status = $eventType === 'refund.processed' ? RefundStatus::COMPLETED : RefundStatus::FAILED;

            $refundRecord = null;
            if ($gatewayRefundId !== '') {
                $refundRecord = Refund::where('gateway_reference', $gatewayRefundId)->first();
            }

            if (! $refundRecord && $paymentId !== '') {
                $payment = Payment::where('gateway_reference', $paymentId)->first();
                if ($payment) {
                    $refundRecord = Refund::where('payment_id', $payment->id)
                        ->where('status', RefundStatus::PENDING)
                        ->latest('id')
                        ->first();
                }
            }

            if ($refundRecord) {
                $refundRecord->update([
                    'status' => $status,
                    'gateway_reference' => $gatewayRefundId ?: $refundRecord->gateway_reference,
                ]);

                ActivityLog::create([
                    'user_id' => $refundRecord->processed_by,
                    'store_id' => $refundRecord->booking?->pickup_store_id,
                    'action' => 'refund.webhook_'.$status->value,
                    'subject_type' => Refund::class,
                    'subject_id' => $refundRecord->id,
                    'new_values' => [
                        'event' => $eventType,
                        'gateway_reference' => $gatewayRefundId,
                        'status' => $status->value,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'refund_id' => $refundRecord?->id,
                    'status' => $status->value,
                    'gateway_reference' => $gatewayRefundId,
                ],
                'message' => 'Refund webhook processed successfully.',
            ]);
        }

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

        try {
            return DB::transaction(function () use (
                $bookingId,
                $bookingReference,
                $gatewayPaymentId,
                $amount,
                $eventType,
                $bookingService
            ) {
                $bookingQuery = Booking::query();
                if ($bookingId) {
                    $bookingQuery->where('id', (int) $bookingId);
                } elseif ($bookingReference) {
                    $bookingQuery->where('booking_reference', (string) $bookingReference);
                }
                $booking = $bookingQuery->lockForUpdate()->first();

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
                    ? Payment::where('gateway_reference', $gatewayPaymentId)->lockForUpdate()->first()
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

                // Record successful payment atomically via firstOrCreate guarded by unique constraint
                $payment = $existingPayment ?? Payment::firstOrCreate(
                    ['gateway_reference' => $gatewayPaymentId],
                    [
                        'booking_id' => $booking->id,
                        'type' => PaymentType::ADVANCE,
                        'amount' => $amount > 0 ? $amount : (float) $booking->total_amount,
                        'method' => PaymentMethod::RAZORPAY,
                        'status' => PaymentStatus::SUCCESS,
                        'collected_by' => null,
                        'notes' => 'Razorpay online advance + deposit payment via webhook',
                    ]
                );

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
                        'payment_id' => $payment->id,
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
            });
        } catch (UniqueConstraintViolationException $e) {
            Log::warning('Razorpay webhook duplicate delivery caught by unique constraint', [
                'gateway_reference' => $gatewayPaymentId,
                'booking_id' => $bookingId,
                'error' => $e->getMessage(),
            ]);

            $existingBooking = Booking::whereHas('payments', function ($q) use ($gatewayPaymentId) {
                $q->where('gateway_reference', $gatewayPaymentId);
            })->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'booking_id' => $existingBooking?->id,
                    'booking_reference' => $existingBooking?->booking_reference,
                    'status' => $existingBooking?->status?->value ?? BookingStatus::CONFIRMED->value,
                    'gateway_reference' => $gatewayPaymentId,
                ],
                'message' => 'Duplicate webhook delivery acknowledged.',
            ], 200);
        }
    }
}
