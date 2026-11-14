<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\DiscountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreCouponRequest extends FormRequest
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
            $storeId = $this->input('store_id');
            if ($storeId === null) {
                abort(403, 'Branch Admin cannot create global coupons. Please specify your assigned branch.');
            }

            if (! in_array((int) $storeId, $user->accessibleStoreIds(), true)) {
                abort(403, 'Branch Admin cannot create coupons for an unassigned branch.');
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
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code'))),
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
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'discount_type' => ['required', new Enum(DiscountType::class)],
            'value' => ['required', 'numeric', 'min:0'],
            'max_uses_total' => ['nullable', 'integer', 'min:1'],
            'max_uses_per_user' => ['nullable', 'integer', 'min:1'],
            'valid_from' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
