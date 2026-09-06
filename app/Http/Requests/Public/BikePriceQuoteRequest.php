<?php

declare(strict_types=1);

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class BikePriceQuoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_store_id' => ['required', 'integer', 'exists:stores,id'],
            'return_store_id' => ['required', 'integer', 'exists:stores,id'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'addons' => ['nullable', 'array'],
            'addons.*.addon_type' => ['required_with:addons', 'string'],
            'addons.*.quantity' => ['required_with:addons', 'integer', 'min:1'],
            'addons.*.unit_price' => ['required_with:addons', 'numeric', 'min:0'],
        ];
    }
}
