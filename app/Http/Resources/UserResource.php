<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role?->value ?? (string) $this->role,
            'status' => $this->status?->value ?? (string) $this->status,
            'blacklist_reason' => $this->blacklist_reason,
            'whatsapp_opt_in' => (bool) $this->whatsapp_opt_in,
            'stores' => StoreResource::collection($this->whenLoaded('stores')),
            'kyc_documents' => KycDocumentResource::collection($this->whenLoaded('kycDocuments')),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
