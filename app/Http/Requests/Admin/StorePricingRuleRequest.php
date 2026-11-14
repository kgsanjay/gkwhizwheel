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
        $user = $this->user();
        if ($user === null) {
            return false;
        }

        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isAdmin()) {
            $storeId = $this->input('store_id') ?? $this->input('from_store_id');
            if ($storeId === null) {
                abort(403, 'Branch Admin cannot create global pricing rules. Please specify your assigned branch.');
            }

            if (! in_array((int) $storeId, $user->accessibleStoreIds(), true)) {
                abort(403, 'Branch Admin cannot create pricing rules for an unassigned branch.');
            }

            return true;
        }

        return false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('store_id') && ! $this->has('from_store_id')) {
            $this->merge(['from_store_id' => $this->input('store_id')]);
        } elseif ($this->has('from_store_id') && ! $this->has('store_id')) {
            $this->merge(['store_id' => $this->input('from_store_id')]);
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
            'name' => ['nullable', 'string', 'max:255'],
            'service_type' => ['nullable', 'string', 'in:two_wheelers,taxi,boating,scuba,homestay,guide,tours'],
            'service_item_id' => ['nullable', 'integer', 'exists:service_items,id'],
            'bike_id' => ['nullable', 'integer', 'exists:bikes,id'],
            'category_id' => ['nullable', 'integer', 'exists:bike_categories,id'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'rule_type' => ['required', new Enum(PricingRuleType::class)],
            'day_of_week' => ['nullable', 'integer', 'min:0', 'max:7', 'required_if:rule_type,weekend'],
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
