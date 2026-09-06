<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\StoreStatus;
use App\Models\Store;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage', Store::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:150'],
            'address_line' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:100'],
            'state' => ['sometimes', 'string', 'max:100'],
            'pincode' => ['sometimes', 'string', 'max:10'],
            'latitude' => ['sometimes', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'numeric', 'between:-180,180'],
            'phone' => ['nullable', 'string', 'max:20'],
            'operating_hours' => ['nullable', 'array'],
            'status' => ['sometimes', new Enum(StoreStatus::class)],
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
