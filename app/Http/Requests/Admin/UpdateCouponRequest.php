<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\DiscountType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateCouponRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage', \App\Models\Coupon::class) ?? false;
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
        $couponId = $this->route('id') ?? $this->route('coupon');

        return [
            'code' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('coupons', 'code')->ignore($couponId),
            ],
            'discount_type' => ['sometimes', new Enum(DiscountType::class)],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'max_uses_total' => ['nullable', 'integer', 'min:1'],
            'max_uses_per_user' => ['nullable', 'integer', 'min:1'],
            'valid_from' => ['sometimes', 'date'],
            'valid_until' => ['sometimes', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
