<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RefundService
{
    public function __construct(
        protected RazorpayService $razorpayService,
        protected PhonePeService $phonePeService
    ) {}

    /**
     * Calculate policy-based refund amounts according to cancellation timing.
     *
     * @return array{
     *     refund_amount: float,
     *     rental_refund_amount: float,
     *     deposit_refund_amount: float,
     *     is_full_refund: bool,
     *     refund_percentage: float,
     *     hours_until_pickup: float
     * }
     */
    public function calculateRefundAmount(
        Booking $booking,
        CarbonInterface|string|null $cancellationTime = null,
        ?int $fullRefundHours = null,
        ?float $partialRefundPercentage = null
    ): array {
        $thresholdHours = $fullRefundHours ?? (int) config('booking.cancellation.full_refund_hours', 24);
        $partialPercentage = $partialRefundPercentage ?? (float) config('booking.cancellation.partial_refund_percentage', 50.0);

        $pickupTime = Carbon::parse($booking->start_date)->startOfDay();
        $currentTime = $cancellationTime !== null ? Carbon::parse($cancellationTime) : now();

        $hoursUntilPickup = (float) $currentTime->diffInRealHours($pickupTime, false);

        $depositAmount = (float) $booking->deposit_amount;
        $rentalAmount = max(0.0, (float) $booking->total_amount - $depositAmount);

        if ($hoursUntilPickup >= $thresholdHours) {
            $refundPercentage = 100.0;
            $rentalRefund = $rentalAmount;
            $isFullRefund = true;
        } elseif ($hoursUntilPickup > 0) {
            $refundPercentage = $partialPercentage;
            $rentalRefund = round($rentalAmount * ($partialPercentage / 100), 2);
            $isFullRefund = false;
        } else {
            $refundPercentage = 0.0;
            $rentalRefund = 0.0;
            $isFullRefund = false;
        }

        $depositRefund = $depositAmount;
        $totalRefund = round($rentalRefund + $depositRefund, 2);

        return [
            'refund_amount' => $totalRefund,
            'rental_refund_amount' => round($rentalRefund, 2),
            'deposit_refund_amount' => round($depositRefund, 2),
            'is_full_refund' => $isFullRefund,
            'refund_percentage' => $refundPercentage,
            'hours_until_pickup' => $hoursUntilPickup,
        ];
    }

    /**
     * Calculate and record a cancellation refund in the database.
     * Real gateway refund call with status starting as PENDING awaiting confirmation
     * or COMPLETED if gateway confirms immediate settlement.
     */
    public function processCancellationRefund(
        Booking $booking,
        string $reason,
        ?int $processedBy = null,
        ?int $paymentId = null,
        CarbonInterface|string|null $cancellationTime = null,
        ?int $fullRefundHours = null,
        ?float $partialRefundPercentage = null
    ): Refund {
        $calculation = $this->calculateRefundAmount(
            booking: $booking,
            cancellationTime: $cancellationTime,
            fullRefundHours: $fullRefundHours,
            partialRefundPercentage: $partialRefundPercentage
        );

        return DB::transaction(function () use (
            $booking,
            $calculation,
            $reason,
            $processedBy,
            $paymentId
        ): Refund {
            $targetPayment = $this->resolveTargetPayment($booking, $paymentId);

            $gatewayResult = $this->dispatchGatewayRefund(
                payment: $targetPayment,
                booking: $booking,
                amount: $calculation['refund_amount'],
                reason: $reason
            );

            return Refund::create([
                'booking_id' => $booking->id,
                'payment_id' => $targetPayment?->id,
                'amount' => $calculation['refund_amount'],
                'reason' => $reason,
                'processed_by' => $processedBy ?? $booking->user_id,
                'gateway_reference' => $gatewayResult['refund_id'],
                'status' => $gatewayResult['status'],
            ]);
        });
    }

    /**
     * Create a security deposit refund record at post-trip return inspection.
     */
    public function createDepositRefund(
        Booking $booking,
        float $damageDeductions = 0.0,
        float $lateFeeDeductions = 0.0,
        string $reason = 'Deposit return after bike inspection',
        ?int $processedBy = null,
        ?int $paymentId = null
    ): Refund {
        $depositAmount = (float) $booking->deposit_amount;
        $refundAmount = max(0.0, round($depositAmount - $damageDeductions - $lateFeeDeductions, 2));

        return DB::transaction(function () use (
            $booking,
            $refundAmount,
            $reason,
            $processedBy,
            $paymentId
        ): Refund {
            $targetPayment = $this->resolveTargetPayment($booking, $paymentId);

            $gatewayResult = $this->dispatchGatewayRefund(
                payment: $targetPayment,
                booking: $booking,
                amount: $refundAmount,
                reason: $reason
            );

            return Refund::create([
                'booking_id' => $booking->id,
                'payment_id' => $targetPayment?->id,
                'amount' => $refundAmount,
                'reason' => $reason,
                'processed_by' => $processedBy ?? $booking->completed_by ?? $booking->user_id,
                'gateway_reference' => $gatewayResult['refund_id'],
                'status' => $gatewayResult['status'],
            ]);
        });
    }

    /**
     * Process a manual full or partial refund authorized by an administrator.
     */
    public function processManualRefund(
        Booking $booking,
        float $amount,
        string $reason,
        ?int $processedBy = null,
        ?int $paymentId = null
    ): Refund {
        return DB::transaction(function () use (
            $booking,
            $amount,
            $reason,
            $processedBy,
            $paymentId
        ): Refund {
            $targetPayment = $this->resolveTargetPayment($booking, $paymentId);

            $gatewayResult = $this->dispatchGatewayRefund(
                payment: $targetPayment,
                booking: $booking,
                amount: $amount,
                reason: $reason
            );

            return Refund::create([
                'booking_id' => $booking->id,
                'payment_id' => $targetPayment?->id,
                'amount' => $amount,
                'reason' => $reason,
                'processed_by' => $processedBy ?? $booking->user_id,
                'gateway_reference' => $gatewayResult['refund_id'],
                'status' => $gatewayResult['status'],
            ]);
        });
    }

    /**
     * Resolve the target payment record against which a refund should be credited.
     */
    protected function resolveTargetPayment(Booking $booking, ?int $paymentId): ?Payment
    {
        if ($paymentId) {
            return Payment::find($paymentId);
        }

        return $booking->payments()
            ->where('status', PaymentStatus::SUCCESS)
            ->latest('id')
            ->first() ?? $booking->payments()->latest('id')->first();
    }

    /**
     * Dispatch refund to payment gateway (Razorpay / PhonePe) or handle offline payment.
     *
     * @return array{success: bool, refund_id: ?string, status: RefundStatus, error: ?string}
     */
    protected function dispatchGatewayRefund(?Payment $payment, Booking $booking, float $amount, string $reason): array
    {
        if ($amount <= 0.0) {
            return [
                'success' => true,
                'refund_id' => null,
                'status' => RefundStatus::COMPLETED,
                'error' => null,
            ];
        }

        if (! $payment) {
            return [
                'success' => true,
                'refund_id' => 'pending_manual_'.strtolower(Str::random(12)),
                'status' => RefundStatus::PENDING,
                'error' => null,
            ];
        }

        $method = $payment->method;

        if ($method === PaymentMethod::RAZORPAY) {
            $gatewayPaymentId = (string) $payment->gateway_reference;
            $res = $this->razorpayService->createRefund($gatewayPaymentId, $amount, [
                'booking_id' => (string) $booking->id,
                'booking_reference' => (string) $booking->booking_reference,
                'reason' => $reason,
            ]);

            if (! $res['success']) {
                Log::error('Razorpay refund failed', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'amount' => $amount,
                    'error' => $res['error'] ?? 'Unknown error',
                ]);
            }

            $status = match ($res['status']) {
                'completed' => RefundStatus::COMPLETED,
                'failed' => RefundStatus::FAILED,
                default => RefundStatus::PENDING,
            };

            return [
                'success' => $res['success'],
                'refund_id' => $res['refund_id'],
                'status' => $status,
                'error' => $res['error'],
            ];
        }

        if ($method === PaymentMethod::PHONEPE) {
            $originalTxnId = (string) $payment->gateway_reference;
            $res = $this->phonePeService->createRefund(
                originalTransactionId: $originalTxnId,
                amount: $amount,
                userId: (string) $booking->user_id
            );

            if (! $res['success']) {
                Log::error('PhonePe refund failed', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'amount' => $amount,
                    'error' => $res['error'] ?? 'Unknown error',
                ]);
            }

            $status = match ($res['status']) {
                'completed' => RefundStatus::COMPLETED,
                'failed' => RefundStatus::FAILED,
                default => RefundStatus::PENDING,
            };

            return [
                'success' => $res['success'],
                'refund_id' => $res['refund_id'],
                'status' => $status,
                'error' => $res['error'],
            ];
        }

        // Offline payment methods: CASH or CARD_POS (Pending manual processing)
        return [
            'success' => true,
            'refund_id' => 'cash_manual_'.strtolower(Str::random(12)),
            'status' => RefundStatus::PENDING,
            'error' => null,
        ];
    }
}
