<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\BikeStatus;
use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\BikeAvailabilityRequest;
use App\Http\Requests\Public\BikeListRequest;
use App\Http\Requests\Public\BikePriceQuoteRequest;
use App\Http\Resources\BikeResource;
use App\Models\Bike;
use App\Services\AvailabilityService;
use App\Services\PricingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class BikeController extends Controller
{
    /**
     * List bikes with optional filters and date availability check.
     */
    public function index(BikeListRequest $request): JsonResponse
    {
        $query = Bike::query()
            ->where('status', BikeStatus::AVAILABLE)
            ->with(['category', 'currentStore', 'homeStore', 'images']);

        if ($request->filled('store_id')) {
            $query->where('current_store_id', (int) $request->validated('store_id'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->validated('category_id'));
        }

        if ($request->filled('min_price')) {
            $minPrice = (float) $request->validated('min_price');
            $query->where(function ($q) use ($minPrice): void {
                $q->where('base_daily_rate_override', '>=', $minPrice)
                    ->orWhere(function ($q2) use ($minPrice): void {
                        $q2->whereNull('base_daily_rate_override')
                            ->whereHas('category', fn ($cq) => $cq->where('base_daily_rate', '>=', $minPrice));
                    });
            });
        }

        if ($request->filled('max_price')) {
            $maxPrice = (float) $request->validated('max_price');
            $query->where(function ($q) use ($maxPrice): void {
                $q->where(function ($q1) use ($maxPrice): void {
                    $q1->whereNotNull('base_daily_rate_override')
                        ->where('base_daily_rate_override', '<=', $maxPrice);
                })->orWhere(function ($q2) use ($maxPrice): void {
                    $q2->whereNull('base_daily_rate_override')
                        ->whereHas('category', fn ($cq) => $cq->where('base_daily_rate', '<=', $maxPrice));
                });
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $start = Carbon::parse($request->validated('start_date'))->startOfDay()->toDateTimeString();
            $end = Carbon::parse($request->validated('end_date'))->endOfDay()->toDateTimeString();

            $query->whereDoesntHave('bookings', function ($bq) use ($start, $end): void {
                $bq->where(function ($q): void {
                    $q->whereIn('status', [
                        BookingStatus::CONFIRMED->value,
                        BookingStatus::HANDED_OVER->value,
                    ])->orWhere(function ($hq): void {
                        $hq->where('status', BookingStatus::HELD->value)
                            ->where(function ($hqq): void {
                                $hqq->whereNull('held_until')
                                    ->orWhere('held_until', '>', now());
                            });
                    });
                })
                ->where('start_date', '<=', $end)
                ->where('end_date', '>=', $start);
            });
        }

        $bikes = $query->orderBy('id', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => BikeResource::collection($bikes),
            'message' => '',
        ]);
    }

    /**
     * Get detailed bike information including images and relations.
     */
    public function show(int $id): JsonResponse
    {
        $bike = Bike::with(['category', 'currentStore', 'homeStore', 'images'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new BikeResource($bike),
            'message' => '',
        ]);
    }

    /**
     * Get unavailable date ranges for a given bike in a specific month.
     */
    public function availability(
        int $id,
        BikeAvailabilityRequest $request,
        AvailabilityService $availabilityService
    ): JsonResponse {
        $bike = Bike::findOrFail($id);
        $month = (string) $request->validated('month');

        $unavailableDates = $availabilityService->getUnavailableDateRanges($bike, $month);

        return response()->json([
            'success' => true,
            'data' => [
                'bike_id' => $bike->id,
                'month' => $month,
                'unavailable_dates' => $unavailableDates,
            ],
            'message' => '',
        ]);
    }

    /**
     * Calculate an itemized price quote for booking dates and stores.
     */
    public function priceQuote(
        int $id,
        BikePriceQuoteRequest $request,
        PricingService $pricingService
    ): JsonResponse {
        $bike = Bike::with('category')->findOrFail($id);

        $quote = $pricingService->calculateQuote(
            bike: $bike,
            startDate: (string) $request->validated('start_date'),
            endDate: (string) $request->validated('end_date'),
            pickupStore: (int) $request->validated('pickup_store_id'),
            returnStore: (int) $request->validated('return_store_id'),
            couponCode: $request->validated('coupon_code'),
            addons: $request->validated('addons') ?? [],
            userId: $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'data' => $quote,
            'message' => '',
        ]);
    }
}
