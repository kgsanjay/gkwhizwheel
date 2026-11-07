<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class HoldBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->hasHeader('Idempotency-Key')) {
            $this->merge([
                'idempotency_key' => (string) $this->header('Idempotency-Key'),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'idempotency_key' => ['required', 'string', 'max:255'],
            'bike_id' => ['required', 'integer', 'exists:bikes,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_store_id' => ['required', 'integer', 'exists:stores,id'],
            'return_store_id' => ['required', 'integer', 'exists:stores,id'],
            'pickup_point_id' => ['nullable', 'integer', 'exists:pickup_points,id'],
            'return_point_id' => ['nullable', 'integer', 'exists:pickup_points,id'],
            'pickup_location_details' => ['nullable', 'string', 'max:255'],
            'return_location_details' => ['nullable', 'string', 'max:255'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'addons' => ['nullable', 'array'],
            'addons.*.addon_type' => ['required_with:addons', 'string', 'max:50', \Illuminate\Validation\Rule::in(array_keys(\App\Services\PricingService::ADDON_RATES))],
            'addons.*.quantity' => ['required_with:addons', 'integer', 'min:1'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'idempotency_key.required' => 'The Idempotency-Key header is required for booking requests.',
        ];
    }
}
