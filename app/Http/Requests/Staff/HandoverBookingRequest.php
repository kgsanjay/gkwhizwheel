<?php

declare(strict_types=1);

namespace App\Http\Requests\Staff;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class HandoverBookingRequest extends FormRequest
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
            'condition_photos.*' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:10240'],
            'signature' => [
                'required',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value instanceof \Illuminate\Http\UploadedFile) {
                        if ($value->getSize() > 10240 * 1024) {
                            $fail('The signature file must not exceed 10MB.');
                        }
                        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
                        if (! in_array($value->getMimeType(), $allowedMimes, true)) {
                            $fail('The signature must be a valid image (JPEG, PNG, WEBP).');
                        }
                    } elseif (is_string($value)) {
                        if (strlen($value) > 500000) {
                            $fail('The signature string must not exceed 500KB.');
                        }
                    } else {
                        $fail('The signature must be a valid file or string.');
                    }
                },
            ],
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
            'condition_photos.required' => 'At least one condition photo is required for bike handover.',
            'signature.required' => 'The customer digital agreement signature is required for bike handover.',
        ];
    }
}
