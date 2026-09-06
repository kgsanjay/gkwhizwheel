<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStaffRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8'],
            'role' => [
                'required',
                'string',
                Rule::in([UserRole::STAFF->value, UserRole::STORE_MANAGER->value]),
            ],
            'store_ids' => ['nullable', 'array'],
            'store_ids.*' => ['integer', 'exists:stores,id'],
        ];
    }
}
