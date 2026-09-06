<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Exceptions\BikeNotAvailableException;
use App\Models\Bike;
use App\Models\Booking;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AvailabilityService
{
    public function __construct(
        protected PricingService $pricingService
    ) {
    }

    /**
     * Check if a bike is available for a given date range.
     */
    public function checkAvailability(
        int|Bike $bike,
        CarbonInterface|string $startDate,
        CarbonInterface|string $endDate,
        ?int $excludeBookingId = null
    ): bool {
        $bikeModel = $bike instanceof Bike ? $bike : Bike::findOrFail($bike);

        $start = Carbon::parse($startDate)->startOfDay()->toDateTimeString();
        $end = Carbon::parse($endDate)->endOfDay()->toDateTimeString();

        $query = Booking::where('bike_id', $bikeModel->id)
            ->where(function ($query): void {
                $query->whereIn('status', [
                    BookingStatus::CONFIRMED->value,
                    BookingStatus::HANDED_OVER->value,
                ])->orWhere(function ($q): void {
                    $q->where('status', BookingStatus::HELD->value)
                        ->where(function ($hq): void {
                            $hq->whereNull('held_until')
                                ->orWhere('held_until', '>', now());
                        });
                });
            })
            ->where('start_date', '<=', $end)
            ->where('end_date', '>=', $start);

        if ($excludeBookingId !== null) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return ! $query->exists();
    }

    /**
     * Get unavailable date ranges for a given bike in a specific month (e.g. 2026-09).
     *
     * @return array<int, array{start_date: string, end_date: string, status: string}>
     */
    public function getUnavailableDateRanges(int|Bike $bike, CarbonInterface|string $month): array
    {
        $bikeModel = $bike instanceof Bike ? $bike : Bike::findOrFail($bike);

        $monthCarbon = Carbon::parse($month);
        $startOfMonth = $monthCarbon->copy()->startOfMonth()->toDateString();
        $endOfMonth = $monthCarbon->copy()->endOfMonth()->toDateString();

        $bookings = Booking::where('bike_id', $bikeModel->id)
            ->where(function ($query): void {
                $query->whereIn('status', [
                    BookingStatus::CONFIRMED->value,
                    BookingStatus::HANDED_OVER->value,
                ])->orWhere(function ($q): void {
                    $q->where('status', BookingStatus::HELD->value)
                        ->where(function ($hq): void {
                            $hq->whereNull('held_until')
                                ->orWhere('held_until', '>', now());
                        });
                });
            })
            ->where('start_date', '<=', $endOfMonth)
            ->where('end_date', '>=', $startOfMonth)
            ->orderBy('start_date')
            ->get();

        return $bookings->map(fn (Booking $b): array => [
            'start_date' => Carbon::parse($b->start_date)->toDateString(),
            'end_date' => Carbon::parse($b->end_date)->toDateString(),
            'status' => $b->status->value,
        ])->values()->all();
    }

    /**
     * Create a concurrency-safe booking hold with row-level locking.
     *
     * @param  array{
     *     bike_id: int,
     *     user_id: int,
     *     pickup_store_id: int,
     *     return_store_id: int,
     *     start_date: CarbonInterface|string,
     *     end_date: CarbonInterface|string,
     *     channel: BookingChannel|string,
     *     idempotency_key: string,
     *     coupon_code?: string|null,
     *     addons?: array<int, array<string, mixed>>,
     *     created_by?: int|null
     * }  $params
     */
    public function holdBooking(array $params): Booking
    {
        $idempotencyKey = $params['idempotency_key'];

        // If a booking with this idempotency key already exists, return it
        $existing = Booking::where('idempotency_key', $idempotencyKey)->first();
        if ($existing !== null) {
            return $existing;
        }

        $bikeId = (int) $params['bike_id'];
        $userId = (int) $params['user_id'];
        $pickupStoreId = (int) $params['pickup_store_id'];
        $returnStoreId = (int) $params['return_store_id'];
        $channel = $params['channel'] instanceof BookingChannel
            ? $params['channel']
            : BookingChannel::from((string) $params['channel']);
        $couponCode = $params['coupon_code'] ?? null;
        $addons = $params['addons'] ?? [];
        $createdBy = $params['created_by'] ?? null;

        $start = Carbon::parse($params['start_date'])->startOfDay()->toDateString();
        $end = Carbon::parse($params['end_date'])->startOfDay()->toDateString();
        $startBoundary = Carbon::parse($params['start_date'])->startOfDay()->toDateTimeString();
        $endBoundary = Carbon::parse($params['end_date'])->endOfDay()->toDateTimeString();

        return DB::transaction(function () use (
            $bikeId,
            $userId,
            $pickupStoreId,
            $returnStoreId,
            $start,
            $end,
            $startBoundary,
            $endBoundary,
            $channel,
            $idempotencyKey,
            $couponCode,
            $addons,
            $createdBy
        ): Booking {
            // 1. Acquire row-level lock on the bike
            $bike = Bike::where('id', $bikeId)->lockForUpdate()->firstOrFail();

            // 2. Check overlapping bookings in held/confirmed/handed_over
            $hasConflict = Booking::where('bike_id', $bike->id)
                ->where(function ($query): void {
                    $query->whereIn('status', [
                        BookingStatus::CONFIRMED->value,
                        BookingStatus::HANDED_OVER->value,
                    ])->orWhere(function ($q): void {
                        $q->where('status', BookingStatus::HELD->value)
                            ->where(function ($hq): void {
                                $hq->whereNull('held_until')
                                    ->orWhere('held_until', '>', now());
                            });
                    });
                })
                ->where('start_date', '<=', $endBoundary)
                ->where('end_date', '>=', $startBoundary)
                ->exists();

            if ($hasConflict) {
                throw new BikeNotAvailableException('Bike is not available for the requested dates.');
            }

            // 3. Compute itemized price quote
            $quote = $this->pricingService->calculateQuote(
                bike: $bike,
                startDate: $start,
                endDate: $end,
                pickupStore: $pickupStoreId,
                returnStore: $returnStoreId,
                couponCode: $couponCode,
                addons: $addons,
                userId: $userId
            );

            // 4. Create the 'held' booking with held_until = 10 minutes from now
            $booking = Booking::create([
                'booking_reference' => $this->generateBookingReference(),
                'bike_id' => $bike->id,
                'user_id' => $userId,
                'pickup_store_id' => $pickupStoreId,
                'return_store_id' => $returnStoreId,
                'channel' => $channel,
                'status' => BookingStatus::HELD,
                'start_date' => $start,
                'end_date' => $end,
                'base_amount' => $quote['base_amount'],
                'pricing_adjustments_amount' => $quote['pricing_adjustments_amount'],
                'one_way_fee_amount' => $quote['one_way_fee_amount'],
                'addon_amount' => $quote['addon_amount'],
                'discount_amount' => $quote['discount_amount'],
                'deposit_amount' => $quote['deposit_amount'],
                'total_amount' => $quote['total_amount'],
                'price_breakdown_json' => $quote['price_breakdown_json'],
                'held_until' => now()->addMinutes(10),
                'created_by' => $createdBy,
                'idempotency_key' => $idempotencyKey,
            ]);

            // 5. Store addons if any
            foreach ($addons as $addon) {
                $booking->addons()->create([
                    'addon_type' => $addon['addon_type'],
                    'quantity' => (int) ($addon['quantity'] ?? 1),
                    'unit_price' => (float) ($addon['unit_price'] ?? 0.0),
                ]);
            }

            return $booking;
        });
    }

    /**
     * Release expired held bookings back to available.
     */
    public function releaseExpiredHolds(): int
    {
        return Booking::where('status', BookingStatus::HELD->value)
            ->where('held_until', '<', now())
            ->update(['status' => BookingStatus::EXPIRED->value]);
    }

    /**
     * Generate a unique human-readable booking reference (e.g. BK-2026-XXXXX).
     */
    protected function generateBookingReference(): string
    {
        do {
            $reference = 'BK-' . date('Y') . '-' . strtoupper(Str::random(6));
        } while (Booking::where('booking_reference', $reference)->exists());

        return $reference;
    }
}
