<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceQuoteSnapshot;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ServiceQuoteSnapshots
{
    /**
     * An approved, active ServiceItem's admin rate is the sole unit-price source.
     * Quote totals and applied rule IDs are persisted and cannot be edited by the customer.
     */
    public function issue(int $userId, ServiceItem $item, string $start, int $quantity): ServiceQuoteSnapshot
    {
        if (! $item->isAvailable() || (float) $item->price_base <= 0 || $quantity < 1 || $quantity > 50) {
            throw ValidationException::withMessages(['service_item_id' => 'This service does not have a published, approved positive rate.']);
        }

        $quote = app(PricingService::class)->calculateServiceQuote(
            $item->service_type, $item, $start, $quantity
        );
        if (! is_finite((float) $quote['total_amount']) || (float) $quote['total_amount'] <= 0) {
            throw ValidationException::withMessages(['service_item_id' => 'The calculated amount is unavailable. Ask the branch for a quotation.']);
        }

        return ServiceQuoteSnapshot::create([
            'public_id' => (string) Str::uuid(),
            'user_id' => $userId,
            'service_item_id' => $item->id,
            'service_type' => $item->service_type,
            'start_datetime' => $start,
            'quantity' => $quantity,
            'base_amount' => round((float) $quote['base_amount'], 2),
            'discount_amount' => round((float) $quote['discount_amount'], 2),
            'total_amount' => round((float) $quote['total_amount'], 2),
            'breakdown_json' => $quote,
            'expires_at' => now()->addMinutes(15),
        ]);
    }

    public function assertValidForBooking(
        ServiceQuoteSnapshot $snapshot,
        int $userId,
        ServiceItem $item,
        string $start,
        int $quantity
    ): void {
        if ($snapshot->user_id !== $userId
            || $snapshot->service_item_id !== $item->id
            || $snapshot->service_type !== $item->service_type
            || ! $snapshot->start_datetime->equalTo(\Carbon\Carbon::parse($start))
            || $snapshot->quantity !== $quantity
            || $snapshot->service_booking_id !== null
            || $snapshot->expires_at->isPast()
            || ! $item->isAvailable()) {
            throw ValidationException::withMessages([
                'quote_id' => 'The quotation is expired, already used or does not match your service selection. Request a fresh quote.',
            ]);
        }
    }
}
