<?php

declare(strict_types=1);

namespace App\Http\Requests\Staff;

use App\Enums\KycDocumentType;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreCustomerRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'email' => ['nullable', 'string', 'email', 'max:150', 'unique:users,email'],
            'whatsapp_opt_in' => ['nullable', 'boolean'],

            // Structured documents array
            'documents' => ['nullable', 'array'],
            'documents.*.document_type' => ['required_with:documents', 'string', Rule::in(KycDocumentType::values())],
            'documents.*.file' => ['required_with:documents', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'documents.*.verified' => ['nullable', 'boolean'],

            // Shortcut direct file fields
            'driving_license' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'national_id' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'passport' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $hasDirectDoc = $this->hasFile('driving_license')
                || $this->hasFile('national_id')
                || $this->hasFile('passport');

            $hasArrayDoc = false;
            if ($this->has('documents') && is_array($this->documents)) {
                foreach ($this->documents as $doc) {
                    if (isset($doc['file']) && $doc['file'] instanceof UploadedFile) {
                        $hasArrayDoc = true;
                        break;
                    }
                }
            }

            if (! $hasDirectDoc && ! $hasArrayDoc) {
                $v->errors()->add(
                    'documents',
                    'At least one KYC document (driving license, national ID, or passport) is required for walk-in customer creation.'
                );
            }
        });
    }
}
