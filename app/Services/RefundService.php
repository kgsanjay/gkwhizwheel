<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RefundStatus;
use App\Models\Booking;
use App\Models\Refund;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RefundService
{
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
     * Stub payment gateway call until Phase 6 gateway integration.
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
            $gatewayReference = $this->stubGatewayRefundCall(
                booking: $booking,
                amount: $calculation['refund_amount']
            );

            return Refund::create([
                'booking_id' => $booking->id,
                'payment_id' => $paymentId ?? $booking->payments()->latest()->value('id'),
                'amount' => $calculation['refund_amount'],
                'reason' => $reason,
                'processed_by' => $processedBy ?? $booking->user_id,
                'gateway_reference' => $gatewayReference,
                'status' => RefundStatus::COMPLETED,
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
            $gatewayReference = $this->stubGatewayRefundCall(
                booking: $booking,
                amount: $refundAmount
            );

            return Refund::create([
                'booking_id' => $booking->id,
                'payment_id' => $paymentId ?? $booking->payments()->latest()->value('id'),
                'amount' => $refundAmount,
                'reason' => $reason,
                'processed_by' => $processedBy ?? $booking->completed_by ?? $booking->user_id,
                'gateway_reference' => $gatewayReference,
                'status' => RefundStatus::COMPLETED,
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
            $gatewayReference = $this->stubGatewayRefundCall(
                booking: $booking,
                amount: $amount
            );

            return Refund::create([
                'booking_id' => $booking->id,
                'payment_id' => $paymentId ?? $booking->payments()->latest()->value('id'),
                'amount' => $amount,
                'reason' => $reason,
                'processed_by' => $processedBy ?? $booking->user_id,
                'gateway_reference' => $gatewayReference,
                'status' => RefundStatus::COMPLETED,
            ]);
        });
    }

    /**
     * Stubbed payment gateway call (to be wired to Razorpay/PhonePe in Phase 6).
     */
    protected function stubGatewayRefundCall(Booking $booking, float $amount): string
    {
        return 'stub_rfnd_' . strtolower(Str::random(16));
    }
}
