<?php

declare(strict_types=1);

namespace App\Http\Requests\Staff;

use App\Enums\BikeStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ToggleBikeMaintenanceRequest extends FormRequest
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
            'status' => [
                'nullable',
                'string',
                Rule::in([BikeStatus::AVAILABLE->value, BikeStatus::MAINTENANCE->value]),
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
