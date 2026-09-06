<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\BikeDocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UploadBikeDocumentRequest extends FormRequest
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
        return [
            'document_type' => ['required', new Enum(BikeDocumentType::class)],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'verified' => ['nullable', 'boolean'],
        ];
    }
}
