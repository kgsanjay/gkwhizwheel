<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateBookingOverrideRequest extends FormRequest
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

        if ($user->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        try {
            return $user->hasRole('super_admin') || $user->hasRole('admin');
        } catch (\Throwable) {
            return false;
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
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
            'status' => ['sometimes', new Enum(BookingStatus::class)],
            'total_amount' => ['sometimes', 'numeric', 'min:0'],
            'base_amount' => ['sometimes', 'numeric', 'min:0'],
            'deposit_amount' => ['sometimes', 'numeric', 'min:0'],
            'discount_amount' => ['sometimes', 'numeric', 'min:0'],
            'late_fee_amount' => ['sometimes', 'numeric', 'min:0'],
            'damage_fee_amount' => ['sometimes', 'numeric', 'min:0'],
            'pickup_store_id' => ['sometimes', 'integer', 'exists:stores,id'],
            'return_store_id' => ['sometimes', 'integer', 'exists:stores,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
