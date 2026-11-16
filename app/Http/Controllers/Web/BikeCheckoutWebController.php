<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BikeResource;
use App\Models\Bike;
use App\Models\BikeModel;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A shareable, server-validated checkout entry point.
 * No holds or payments are created by loading this GET page.
 */
final class BikeCheckoutWebController extends Controller
{
    public function show(Request $request): Response
    {
        $params = $request->validate([
            'bike_id' => ['required_without:bike_model_id', 'prohibits:bike_model_id', 'integer', 'exists:bikes,id'],
            'bike_model_id' => ['required_without:bike_id', 'prohibits:bike_id', 'integer', 'exists:bike_models,id'],
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'pickup_store_id' => ['required', 'integer', 'exists:stores,id'],
            'return_store_id' => ['required', 'integer', 'exists:stores,id'],
            'pickup_point_id' => ['nullable', 'integer', 'exists:pickup_points,id'],
            'return_point_id' => ['nullable', 'integer', 'exists:pickup_points,id'],
            'pickup_time' => ['nullable', 'string', 'max:10'],
            'return_time' => ['nullable', 'string', 'max:10'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'addons' => ['nullable', 'json', 'max:2000'],
        ]);

        $addons = json_decode($params['addons'] ?? '[]', true);
        if (! is_array($addons) || count($addons) > 10) {
            throw ValidationException::withMessages(['addons' => 'Invalid booking add-ons.']);
        }
        foreach ($addons as $addon) {
            if (! is_array($addon)
                || ! isset($addon['addon_type'], $addon['quantity'])
                || ! in_array($addon['addon_type'], array_keys(\App\Services\PricingService::ADDON_RATES), true)
                || ! is_numeric($addon['quantity'])
                || (int) $addon['quantity'] < 1
                || (int) $addon['quantity'] > 10) {
                throw ValidationException::withMessages(['addons' => 'Invalid booking add-on selection.']);
            }
        }

        $pickup = Store::query()->where('status', StoreStatus::ACTIVE)
            ->findOrFail((int) $params['pickup_store_id']);
        $return = Store::query()->where('status', StoreStatus::ACTIVE)
            ->findOrFail((int) $params['return_store_id']);

        if (! empty($params['coupon_code'])) {
            $coupon = \App\Models\Coupon::where('code', strtoupper(trim($params['coupon_code'])))
                ->where('is_active', true)
                ->first();
            if ($coupon && $coupon->store_id !== null && (int) $coupon->store_id !== (int) $pickup->id) {
                throw ValidationException::withMessages([
                    'coupon_code' => 'This coupon is not valid for the selected pickup branch.',
                ]);
            }
        }

        $bikeModelId = $params['bike_model_id'] ?? null;
        if ($bikeModelId !== null) {
            $model = BikeModel::query()->where('is_active', true)
                ->with(['category'])
                ->withCount('bikes')->findOrFail((int) $bikeModelId);
            abort_if($model->bikes_count === 0, 404, 'No bike units are listed for this model.');

            $imagePath = $model->primary_image_path;
            $imageUrl = $imagePath
                ? (str_starts_with($imagePath, 'http') || str_starts_with($imagePath, '/')
                    ? $imagePath
                    : \Illuminate\Support\Facades\Storage::disk('public')->url($imagePath))
                : '/images/bikes/honda-activa.webp';

            $branchPrice = \App\Models\BranchBikeModelPrice::where('store_id', $pickup->id)
                ->where('bike_model_id', $model->id)
                ->first();
            $weekdayRate = $branchPrice?->weekday_rate ?? $model->category?->base_daily_rate ?? 500.0;
            $weekendRate = $branchPrice?->weekend_rate ?? ($weekdayRate * 1.2);

            $bike = [
                'id' => $model->id,
                'brand' => $model->brand,
                'name' => $model->name,
                'model_name' => $model->name,
                'primary_image_url' => $imageUrl,
                'image_url' => $imageUrl,
                'category_name' => $model->category?->name ?? 'Scooter',
                'fuel_type' => $model->fuel_type->value ?? 'Petrol',
                'transmission' => $model->transmission->value ?? 'Automatic',
                'description' => $model->description,
                'weekday_rate' => (float) $weekdayRate,
                'weekend_rate' => (float) $weekendRate,
            ];
            $backUrl = '/services/bikes/models/'.$model->id.'/'.\Illuminate\Support\Str::slug($model->brand.' '.$model->name);
        } else {
            $unit = Bike::with(['category', 'images'])->findOrFail((int) $params['bike_id']);
            $bike = (new BikeResource($unit))->resolve();
            $backUrl = '/services/bikes/'.$unit->id;
        }

        // Preserve the selected route, points, dates and times if a customer edits the trip.
        $backParams = [
            'pickup_store_id' => $pickup->id,
            'return_store_id' => $return->id,
            'start_date' => $params['start_date'],
            'end_date' => $params['end_date'],
        ];
        if (! empty($params['pickup_point_id'])) $backParams['pickup_point_id'] = $params['pickup_point_id'];
        if (! empty($params['return_point_id'])) $backParams['return_point_id'] = $params['return_point_id'];
        if (! empty($params['pickup_time'])) $backParams['pickup_time'] = $params['pickup_time'];
        if (! empty($params['return_time'])) $backParams['return_time'] = $params['return_time'];

        $backUrl .= '?'.http_build_query($backParams);

        return Inertia::render('Bikes/Checkout', [
            'bike' => $bike,
            'bikeModelId' => $bikeModelId !== null ? (int) $bikeModelId : null,
            'pickupStore' => $pickup->only(['id', 'name', 'city', 'address_line', 'phone']),
            'returnStore' => $return->only(['id', 'name', 'city', 'address_line', 'phone']),
            'startDate' => $params['start_date'],
            'endDate' => $params['end_date'],
            'pickupTime' => $params['pickup_time'] ?? '09:00',
            'returnTime' => $params['return_time'] ?? '09:00',
            'pickupPointId' => ! empty($params['pickup_point_id']) ? (int) $params['pickup_point_id'] : null,
            'returnPointId' => ! empty($params['return_point_id']) ? (int) $params['return_point_id'] : null,
            'couponCode' => $params['coupon_code'] ?? '',
            'selectedAddons' => array_map(fn (array $addon) => [
                'addon_type' => $addon['addon_type'],
                'quantity' => (int) $addon['quantity'],
            ], $addons),
            'backUrl' => $backUrl,
        ]);
    }
}
