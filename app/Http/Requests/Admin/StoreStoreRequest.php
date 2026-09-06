<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\StoreStatus;
use App\Models\Store;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Store creation is strictly restricted to the super_admin role.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Store::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'address_line' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'pincode' => ['required', 'string', 'max:10'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'phone' => ['nullable', 'string', 'max:20'],
            'operating_hours' => ['nullable', 'array'],
            'status' => ['nullable', new Enum(StoreStatus::class)],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('operating_hours') && is_string($this->input('operating_hours'))) {
            $this->merge([
                'operating_hours' => ['text' => $this->input('operating_hours')],
            ]);
        }
    }
}
