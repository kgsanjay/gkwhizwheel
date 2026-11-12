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
            'bike_id' => ['required_without:bike_model_id', 'prohibited_with:bike_model_id', 'integer', 'exists:bikes,id'],
            'bike_model_id' => ['required_without:bike_id', 'prohibited_with:bike_id', 'integer', 'exists:bike_models,id'],
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'pickup_store_id' => ['required', 'integer', 'exists:stores,id'],
            'return_store_id' => ['required', 'integer', 'exists:stores,id'],
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

        $bikeModelId = $params['bike_model_id'] ?? null;
        if ($bikeModelId !== null) {
            $model = BikeModel::query()->where('is_active', true)
                ->withCount('bikes')->findOrFail((int) $bikeModelId);
            abort_if($model->bikes_count === 0, 404, 'No bike units are listed for this model.');
            $bike = [
                'brand' => $model->brand,
                'model_name' => $model->name,
                'primary_image_url' => null,
            ];
            $backUrl = '/services/bikes/models/'.$model->id.'/'.\Illuminate\Support\Str::slug($model->brand.' '.$model->name);
        } else {
            $unit = Bike::with(['category', 'images'])->findOrFail((int) $params['bike_id']);
            $bike = (new BikeResource($unit))->resolve();
            $backUrl = '/services/bikes/'.$unit->id;
        }

        return Inertia::render('Bikes/Checkout', [
            'bike' => $bike,
            'bikeModelId' => $bikeModelId !== null ? (int) $bikeModelId : null,
            'pickupStore' => $pickup->only(['id', 'name', 'city']),
            'returnStore' => $return->only(['id', 'name', 'city']),
            'startDate' => $params['start_date'],
            'endDate' => $params['end_date'],
            'couponCode' => $params['coupon_code'] ?? '',
            'selectedAddons' => array_map(fn (array $addon) => [
                'addon_type' => $addon['addon_type'],
                'quantity' => (int) $addon['quantity'],
            ], $addons),
            'backUrl' => $backUrl,
        ]);
    }
}
