<?php

declare(strict_types=1);

namespace App\Http\Requests\Staff;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class ReturnBookingRequest extends FormRequest
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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'odometer_reading' => ['required', 'integer', 'min:0'],
            'condition_photos' => ['required', 'array', 'min:1'],
            'condition_photos.*' => ['required', 'file', 'image', 'max:10240'],
            'late_fee_override' => ['nullable', 'numeric', 'min:0'],
            'damage_fee' => ['nullable', 'numeric', 'min:0'],
            'deposit_refund_amount' => ['nullable', 'numeric', 'min:0'],
            'return_store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
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
            'condition_photos.required' => 'At least one condition photo is required for bike return inspection.',
            'odometer_reading.required' => 'The return odometer reading is required.',
        ];
    }
}
