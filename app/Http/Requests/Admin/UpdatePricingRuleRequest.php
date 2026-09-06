<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdatePricingRuleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage', \App\Models\PricingRule::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'bike_id' => ['nullable', 'integer', 'exists:bikes,id'],
            'category_id' => ['nullable', 'integer', 'exists:bike_categories,id'],
            'rule_type' => ['sometimes', new Enum(PricingRuleType::class)],
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:6'],
            'date_start' => ['nullable', 'date'],
            'date_end' => ['nullable', 'date', 'after_or_equal:date_start'],
            'from_store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'to_store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'rate_type' => ['sometimes', new Enum(PricingRateType::class)],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
