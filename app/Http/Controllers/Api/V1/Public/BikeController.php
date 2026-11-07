<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Enums\BikeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Public\BikeAvailabilityRequest;
use App\Http\Requests\Public\BikeListRequest;
use App\Http\Requests\Public\BikePriceQuoteRequest;
use App\Http\Resources\BikeResource;
use App\Models\Bike;
use App\Services\AvailabilityService;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;

class BikeController extends Controller
{
    /**
     * List bikes with optional filters and date availability check.
     */
    public function index(BikeListRequest $request, AvailabilityService $availabilityService): JsonResponse
    {
        $query = Bike::query()
            ->where('status', BikeStatus::AVAILABLE)
            ->with(['category', 'currentStore', 'homeStore', 'images']);

        $hasDates = $request->filled('start_date') && $request->filled('end_date');
        if ($request->filled('store_id') && ! $hasDates) {
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

        $bikes = $query->orderBy('id', 'asc')->get();

        if ($hasDates) {
            $pickupStoreId = $request->filled('store_id')
                ? (int) $request->validated('store_id')
                : null;

            $bikes = $bikes->filter(function (Bike $bike) use ($request, $availabilityService, $pickupStoreId): bool {
                if ($pickupStoreId !== null) {
                    return $availabilityService->checkAvailability(
                        $bike,
                        (string) $request->validated('start_date'),
                        (string) $request->validated('end_date'),
                        null,
                        $pickupStoreId,
                        $request->filled('return_store_id')
                            ? (int) $request->validated('return_store_id')
                            : $pickupStoreId
                    );
                }

                // Without an explicit pickup branch, do not promise where a bike
                // will be at a future date. Show only bikes in their current branch.
                return $availabilityService->checkAvailability(
                    $bike,
                    (string) $request->validated('start_date'),
                    (string) $request->validated('end_date'),
                    null,
                    (int) $bike->current_store_id,
                    (int) $bike->current_store_id
                );
            })->values();
        }

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
        PricingService $pricingService,
        AvailabilityService $availabilityService
    ): JsonResponse {
        $bike = Bike::with('category')->findOrFail($id);

        $pickupId = (int) $request->validated('pickup_store_id');
        $returnId = (int) $request->validated('return_store_id');

        // A price alone must never imply a vehicle is rentable at this branch.
        // The hold endpoint performs the same checks again under a bike row lock.
        $pickupStore = \App\Models\Store::findOrFail($pickupId);
        $returnStore = \App\Models\Store::findOrFail($returnId);
        if ($bike->status !== BikeStatus::AVAILABLE
            || $pickupStore->status !== \App\Enums\StoreStatus::ACTIVE
            || $returnStore->status !== \App\Enums\StoreStatus::ACTIVE
            || ! $availabilityService->checkAvailability(
                $bike,
                (string) $request->validated('start_date'),
                (string) $request->validated('end_date'),
                null,
                $pickupId,
                $returnId
            )) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'pickup_store_id' => 'This bike is not available for the selected branch and dates.',
            ]);
        }

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

        $quote = \App\Services\BikeBookingPayments::waiveDeposit($quote);

        return response()->json([
            'success' => true,
            'data' => $quote,
            'message' => '',
        ]);
    }
}
