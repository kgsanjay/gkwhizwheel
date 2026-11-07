<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HoldBikeModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->hasHeader('Idempotency-Key')) {
            $this->merge(['idempotency_key' => (string) $this->header('Idempotency-Key')]);
        }
    }

    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'max:255'],
            'bike_model_id' => ['required', 'integer', 'exists:bike_models,id'],
            'pickup_store_id' => ['required', 'integer', 'exists:stores,id'],
            'return_store_id' => ['required', 'integer', 'exists:stores,id'],
            'pickup_point_id' => ['nullable', 'integer', 'exists:pickup_points,id'],
            'return_point_id' => ['nullable', 'integer', 'exists:pickup_points,id'],
            'pickup_location_details' => ['nullable', 'string', 'max:255'],
            'return_location_details' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'end_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'addons' => ['nullable', 'array'],
            'addons.*.addon_type' => ['required_with:addons', 'string', Rule::in(array_keys(\App\Services\PricingService::ADDON_RATES))],
            'addons.*.quantity' => ['required_with:addons', 'integer', 'min:1'],
        ];
    }
}
