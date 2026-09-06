<?php

declare(strict_types=1);

namespace App\Http\Requests\Staff;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class StoreStaffBookingRequest extends FormRequest
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

        if (in_array($user->role, [UserRole::STAFF, UserRole::STORE_MANAGER, UserRole::SUPER_ADMIN], true)) {
            return true;
        }

        try {
            return $user->hasAnyRole(['staff', 'store_manager', 'super_admin', 'admin']);
        } catch (\Throwable) {
            return false;
        }
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

        if ($this->has('customer_id') && ! $this->has('user_id')) {
            $this->merge([
                'user_id' => $this->input('customer_id'),
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
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'bike_id' => ['required', 'integer', 'exists:bikes,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_store_id' => ['required', 'integer', 'exists:stores,id'],
            'return_store_id' => ['required', 'integer', 'exists:stores,id'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
            'addons' => ['nullable', 'array'],
            'addons.*.addon_type' => ['required_with:addons', 'string'],
            'addons.*.quantity' => ['required_with:addons', 'integer', 'min:1'],
            'addons.*.unit_price' => ['nullable', 'numeric', 'min:0'],
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
            'idempotency_key.required' => 'The Idempotency-Key header is required for creating an offline booking hold.',
            'user_id.required' => 'The customer ID is required.',
            'user_id.exists' => 'The selected customer does not exist.',
        ];
    }
}
