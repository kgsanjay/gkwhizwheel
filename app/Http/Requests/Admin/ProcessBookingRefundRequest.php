<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProcessBookingRefundRequest extends FormRequest
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

        if ($user->role === UserRole::SUPER_ADMIN || $user->role === UserRole::STORE_MANAGER) {
            return true;
        }

        try {
            return $user->hasRole('super_admin') || $user->hasRole('store_manager');
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
            'reason' => ['required', 'string', 'max:500'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'type' => ['nullable', 'string', Rule::in(['full', 'partial'])],
            'payment_id' => ['nullable', 'integer', 'exists:payments,id'],
        ];
    }
}
