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
use App\Models\ServiceBooking;
use App\Models\ServicePaymentReceipt;
use App\Notifications\ServicePaymentReceivedNotification;
use App\Services\BookingService;
use App\Services\BikeBookingPayments;
use App\Services\PhonePeService;
use App\Services\ServicePaymentEligibility;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

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

        if (preg_match('/^TXN_SRV_(\d+)_/', $merchantTransactionId, $srvMatches)) {
            return $this->handleServiceBookingWebhook(
                (int) $srvMatches[1],
                $merchantTransactionId,
                $gatewayTransactionId,
                $amountPaise,
                $amount,
                $code
            );
        }

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

                $breakdown = is_array($booking->price_breakdown_json) ? $booking->price_breakdown_json : [];
                if ($gatewayTransactionId === '' || $merchantTransactionId === '' ||
                    ! hash_equals((string) ($breakdown['phonepe_transaction_id'] ?? ''), $merchantTransactionId) ||
                    (int) round($amount * 100) !== (int) round(BikeBookingPayments::expectedGatewayAmount($booking) * 100)) {
                    return response()->json(['success' => false, 'message' => 'Payment does not match the checkout transaction.'], 422);
                }

                // Idempotency: return 200 if already processed
                $existingPayment = Payment::where('gateway_reference', $gatewayTransactionId)->lockForUpdate()->first();
                if ($existingPayment && (int) $existingPayment->booking_id !== (int) $booking->id) {
                    return response()->json(['success' => false, 'message' => 'Payment reference belongs to another booking.'], 409);
                }
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
                        'amount' => $amount,
                        'method' => PaymentMethod::PHONEPE,
                        'status' => PaymentStatus::SUCCESS,
                        'collected_by' => null,
                        'notes' => 'PhonePe online bike rental '.(($breakdown['checkout_payment_option'] ?? 'full') === 'advance' ? 'advance' : 'full').' payment via webhook',
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

    /**
     * Process PhonePe payments for travel service bookings.
     */
    protected function handleServiceBookingWebhook(
        int $serviceBookingId,
        string $merchantTransactionId,
        string $gatewayTransactionId,
        int $amountPaise,
        float $amount,
        string $code
    ): JsonResponse {
        try {
            return DB::transaction(function () use (
                $serviceBookingId,
                $merchantTransactionId,
                $gatewayTransactionId,
                $amountPaise,
                $amount,
                $code
            ) {
                $booking = ServiceBooking::where('id', $serviceBookingId)->lockForUpdate()->first();
                if (! $booking) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Service booking not found for PhonePe payment webhook.',
                    ], 404);
                }

                if (ServicePaymentReceipt::where('provider', 'phonepe')->where('payment_id', $gatewayTransactionId)->exists()) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'booking_number' => $booking->booking_number,
                            'status' => $booking->status,
                            'gateway_reference' => $gatewayTransactionId,
                        ],
                        'message' => 'Service payment webhook already processed.',
                    ]);
                }

                ServicePaymentReceipt::create([
                    'service_booking_id' => $booking->id,
                    'provider' => 'phonepe',
                    'payment_id' => $gatewayTransactionId,
                    'order_id' => $merchantTransactionId,
                    'amount_paise' => $amountPaise,
                ]);

                $newAdvance = round((float) $booking->advance_paid + $amount, 2);
                $newBalance = max(0.0, round((float) $booking->total_amount - $newAdvance, 2));
                $newPaymentStatus = $newBalance <= 0.01 ? 'paid' : 'partial';

                $booking->update([
                    'advance_paid' => $newAdvance,
                    'balance_due' => $newBalance,
                    'payment_status' => $newPaymentStatus,
                    'payment_method' => 'online',
                ]);

                ActivityLog::create([
                    'user_id' => $booking->user_id,
                    'store_id' => $booking->store_id,
                    'action' => 'service_booking.phonepe_payment_received',
                    'subject_type' => ServiceBooking::class,
                    'subject_id' => (string) $booking->id,
                    'new_values' => [
                        'code' => $code,
                        'payment_id' => $gatewayTransactionId,
                        'merchant_transaction_id' => $merchantTransactionId,
                        'amount' => $amount,
                        'balance_due' => $newBalance,
                        'payment_status' => $newPaymentStatus,
                    ],
                ]);

                // Send payment receipt
                $receiptNotification = new ServicePaymentReceivedNotification($booking, $gatewayTransactionId, $amountPaise);
                if ($booking->user && filter_var($booking->user->email, FILTER_VALIDATE_EMAIL)) {
                    $booking->user->notify($receiptNotification);
                } elseif ($booking->customer_email && filter_var($booking->customer_email, FILTER_VALIDATE_EMAIL)) {
                    Notification::route('mail', $booking->customer_email)->notify($receiptNotification);
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'booking_number' => $booking->booking_number,
                        'status' => $booking->status,
                        'gateway_reference' => $gatewayTransactionId,
                    ],
                    'message' => 'PhonePe payment for service booking verified successfully.',
                ]);
            });
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'success' => true,
                'message' => 'Duplicate service payment delivery acknowledged.',
            ]);
        }
    }
}
