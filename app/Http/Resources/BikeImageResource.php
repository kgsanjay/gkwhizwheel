<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\BikeImage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BikeImage
 */
class BikeImageResource extends JsonResource
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
            'file_path' => $this->file_path,
            'sort_order' => $this->sort_order,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
