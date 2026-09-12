<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateBikeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage', \App\Models\Bike::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $bikeId = $this->route('id') ?? $this->route('bike');

        return [
            'category_id' => ['sometimes', 'integer', 'exists:bike_categories,id'],
            'current_store_id' => ['sometimes', 'integer', 'exists:stores,id'],
            'home_store_id' => ['sometimes', 'integer', 'exists:stores,id'],
            'brand' => ['sometimes', 'string', 'max:100'],
            'model_name' => ['sometimes', 'string', 'max:100'],
            'registration_number' => [
                'sometimes',
                'string',
                'max:30',
                Rule::unique('bikes', 'registration_number')->ignore($bikeId),
            ],
            'fuel_type' => ['sometimes', new Enum(FuelType::class)],
            'transmission' => ['sometimes', new Enum(Transmission::class)],
            'base_daily_rate_override' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount_override' => ['nullable', 'numeric', 'min:0'],
            'odometer_reading' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', new Enum(BikeStatus::class)],
            'next_service_due_date' => ['nullable', 'date'],
            'primary_image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'documents' => ['nullable', 'array'],
            'documents.*.document_type' => ['required_with:documents', new Enum(\App\Enums\BikeDocumentType::class)],
            'documents.*.file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:10240'],
            'documents.*.issue_date' => ['nullable', 'date'],
            'documents.*.expiry_date' => ['nullable', 'date'],
            'documents.*.verified' => ['nullable', 'boolean'],
        ];
    }
}
