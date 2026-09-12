<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreBikeRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Bike::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:bike_categories,id'],
            'current_store_id' => ['required', 'integer', 'exists:stores,id'],
            'home_store_id' => ['required', 'integer', 'exists:stores,id'],
            'brand' => ['required', 'string', 'max:100'],
            'model_name' => ['required', 'string', 'max:100'],
            'registration_number' => ['required', 'string', 'max:30', 'unique:bikes,registration_number'],
            'fuel_type' => ['required', new Enum(FuelType::class)],
            'transmission' => ['required', new Enum(Transmission::class)],
            'base_daily_rate_override' => ['nullable', 'numeric', 'min:0'],
            'deposit_amount_override' => ['nullable', 'numeric', 'min:0'],
            'odometer_reading' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', new Enum(BikeStatus::class)],
            'next_service_due_date' => ['nullable', 'date'],
            'primary_image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'images' => ['nullable', 'array'],
            'images.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
            'documents' => ['nullable', 'array'],
            'documents.*.document_type' => ['required_with:documents', new Enum(BikeDocumentType::class)],
            'documents.*.file' => ['required_with:documents', 'file', 'mimes:pdf,jpg,jpeg,png', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:10240'],
            'documents.*.issue_date' => ['nullable', 'date'],
            'documents.*.expiry_date' => ['nullable', 'date'],
            'documents.*.verified' => ['nullable', 'boolean'],
        ];
    }
}
