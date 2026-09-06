<?php

declare(strict_types=1);

namespace App\Http\Requests\Customer;

use App\Enums\KycDocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadKycDocumentRequest extends FormRequest
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
            'document_type' => ['required', 'string', Rule::in(KycDocumentType::values())],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // 5MB max
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
            'document_type.required' => 'The KYC document type is required.',
            'document_type.in' => 'Please select a valid document type (driving license, national ID, or passport).',
            'file.required' => 'Please select a document file to upload.',
            'file.mimes' => 'Document must be a PDF, JPEG, or PNG file.',
            'file.max' => 'Document file size must not exceed 5MB.',
        ];
    }
}
