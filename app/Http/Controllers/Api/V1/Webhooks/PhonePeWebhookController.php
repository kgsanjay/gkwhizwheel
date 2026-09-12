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
use App\Services\PhonePeService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PhonePeWebhookController extends Controller
{
    /**
     * Handle incoming server-to-server PhonePe payment webhooks.
     * Validates X-VERIFY signature and flips booking to confirmed status.
     */
    public function handle(
        Request $request,
        PhonePeService $phonePeService,
        BookingService $bookingService
    ): JsonResponse {
        $signature = $request->header('X-VERIFY');
        $base64Response = (string) $request->input('response');

        if (! $phonePeService->verifyWebhookSignature($base64Response, $signature)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid webhook signature.',
                'errors' => null,
            ], 400);
        }

        $payload = $phonePeService->decodeWebhookResponse($base64Response);
        if ($payload === null) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid webhook payload encoding.',
                'errors' => null,
            ], 400);
        }

        $code = (string) ($payload['code'] ?? '');
        if ($code !== 'PAYMENT_SUCCESS') {
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'Ignored payment status: '.$code,
            ]);
        }

        $data = $payload['data'] ?? [];
        $merchantTransactionId = (string) ($data['merchantTransactionId'] ?? '');
        $gatewayTransactionId = (string) ($data['transactionId'] ?? $merchantTransactionId);
        $amountPaise = (int) ($data['amount'] ?? 0);
        $amount = round($amountPaise / 100, 2);

        try {
            return DB::transaction(function () use (
                $merchantTransactionId,
                $gatewayTransactionId,
                $amount,
                $code,
                $bookingService
            ) {
                $booking = null;
                if (preg_match('/^TXN_BK_(\d+)_/', $merchantTransactionId, $matches)) {
                    $booking = Booking::where('id', (int) $matches[1])->lockForUpdate()->first();
                }

                if (! $booking) {
                    $booking = Booking::where('price_breakdown_json->phonepe_transaction_id', $merchantTransactionId)
                        ->lockForUpdate()
                        ->first();
                }

                if (! $booking) {
                    return response()->json([
                        'success' => false,
                        'data' => null,
                        'message' => 'Booking not found for PhonePe payment webhook.',
                        'errors' => null,
                    ], 404);
                }

                // Idempotency: return 200 if already processed
                $existingPayment = Payment::where('gateway_reference', $gatewayTransactionId)->lockForUpdate()->first();
                if ($existingPayment && $booking->status === BookingStatus::CONFIRMED) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'booking_id' => $booking->id,
                            'booking_reference' => $booking->booking_reference,
                            'status' => $booking->status->value,
                            'gateway_reference' => $gatewayTransactionId,
                        ],
                        'message' => 'Webhook already processed.',
                    ]);
                }

                // Record successful payment atomically via firstOrCreate guarded by unique constraint
                $payment = $existingPayment ?? Payment::firstOrCreate(
                    ['gateway_reference' => $gatewayTransactionId],
                    [
                        'booking_id' => $booking->id,
                        'type' => PaymentType::ADVANCE,
                        'amount' => $amount > 0 ? $amount : (float) $booking->total_amount,
                        'method' => PaymentMethod::PHONEPE,
                        'status' => PaymentStatus::SUCCESS,
                        'collected_by' => null,
                        'notes' => 'PhonePe online advance + deposit payment via webhook',
                    ]
                );

                // Transition booking status to CONFIRMED
                if (in_array($booking->status, [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT], true)) {
                    $bookingService->confirmPayment($booking, $gatewayTransactionId);
                }

                ActivityLog::create([
                    'user_id' => $booking->user_id,
                    'store_id' => $booking->pickup_store_id,
                    'action' => 'payment.phonepe_webhook_confirmed',
                    'subject_type' => Booking::class,
                    'subject_id' => $booking->id,
                    'new_values' => [
                        'code' => $code,
                        'gateway_reference' => $gatewayTransactionId,
                        'merchant_transaction_id' => $merchantTransactionId,
                        'amount' => $amount,
                    ],
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'booking_id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'status' => $booking->fresh()->status->value,
                        'gateway_reference' => $gatewayTransactionId,
                    ],
                    'message' => 'PhonePe payment webhook processed and booking confirmed.',
                ]);
            });
        } catch (UniqueConstraintViolationException $e) {
            Log::warning('PhonePe webhook duplicate delivery caught by unique constraint', [
                'gateway_reference' => $gatewayTransactionId,
                'merchant_transaction_id' => $merchantTransactionId,
                'error' => $e->getMessage(),
            ]);

            $existingBooking = Booking::whereHas('payments', function ($q) use ($gatewayTransactionId) {
                $q->where('gateway_reference', $gatewayTransactionId);
            })->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'booking_id' => $existingBooking?->id,
                    'booking_reference' => $existingBooking?->booking_reference,
                    'status' => $existingBooking?->status?->value ?? BookingStatus::CONFIRMED->value,
                    'gateway_reference' => $gatewayTransactionId,
                ],
                'message' => 'Duplicate webhook delivery acknowledged.',
            ], 200);
        }
    }
}
