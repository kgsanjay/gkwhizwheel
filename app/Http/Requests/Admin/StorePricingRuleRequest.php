<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StorePricingRuleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\PricingRule::class) ?? false;
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
            'rule_type' => ['required', new Enum(PricingRuleType::class)],
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:6', 'required_if:rule_type,weekend'],
            'date_start' => ['nullable', 'date', 'required_if:rule_type,holiday,seasonal'],
            'date_end' => ['nullable', 'date', 'after_or_equal:date_start', 'required_if:rule_type,seasonal'],
            'from_store_id' => ['nullable', 'integer', 'exists:stores,id', 'required_if:rule_type,one_way_fee'],
            'to_store_id' => ['nullable', 'integer', 'exists:stores,id', 'required_if:rule_type,one_way_fee'],
            'rate_type' => ['required', new Enum(PricingRateType::class)],
            'value' => ['required', 'numeric', 'min:0'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
