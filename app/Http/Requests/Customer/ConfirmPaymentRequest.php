<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'gateway_reference' => ['required', 'string', 'max:255'],
            'payment_method' => ['nullable', 'string'],
        ];
    }
}
