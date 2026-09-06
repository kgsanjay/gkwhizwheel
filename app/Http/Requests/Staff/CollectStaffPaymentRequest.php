<?php

declare(strict_types=1);

namespace App\Http\Requests\Staff;

use App\Enums\PaymentMethod;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CollectStaffPaymentRequest extends FormRequest
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
     * Prepare data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('method') && ! $this->has('payment_method')) {
            $this->merge([
                'payment_method' => $this->input('method'),
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
            'payment_method' => [
                'required',
                'string',
                Rule::in(PaymentMethod::values()),
            ],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'gateway_reference' => ['nullable', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
