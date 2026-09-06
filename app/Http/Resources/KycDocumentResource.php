<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\KycDocumentType;
use App\Models\KycDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin KycDocument
 */
class KycDocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'document_type' => $this->document_type instanceof KycDocumentType
                ? $this->document_type->value
                : (string) $this->document_type,
            'file_path' => $this->file_path,
            'file_url' => $this->file_path && $this->id
                ? \Illuminate\Support\Facades\URL::temporarySignedRoute(
                    'kyc-documents.download',
                    now()->addMinutes(15),
                    ['id' => $this->id]
                )
                : null,
            'temporary_url' => $this->file_path && $this->id
                ? \Illuminate\Support\Facades\URL::temporarySignedRoute(
                    'kyc-documents.download',
                    now()->addMinutes(15),
                    ['id' => $this->id]
                )
                : null,
            'verified' => (bool) $this->verified,
            'verified_by' => $this->verified_by,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
