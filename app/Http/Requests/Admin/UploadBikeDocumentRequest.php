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
        $user = $this->user();
        if (! $user) {
            return false;
        }

        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return true;
        }

        if ($user->isManager()) {
            $bikeId = $this->route('id') ?? $this->route('bike');
            if ($bikeId) {
                $bike = $bikeId instanceof \App\Models\Bike ? $bikeId : \App\Models\Bike::find($bikeId);
                if ($bike) {
                    return $user->can('uploadDocuments', $bike);
                }
            }

            return count($user->accessibleStoreIds()) > 0;
        }

        return false;
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
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'mimetypes:application/pdf,image/jpeg,image/png', 'max:10240'],
            'issue_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'verified' => ['nullable', 'boolean'],
        ];
    }
}
