<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\KycDocumentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KycDocument extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'document_type',
        'file_path',
        'verified',
        'verified_by',
        'verified_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'document_type' => KycDocumentType::class,
            'verified' => 'boolean',
            'verified_at' => 'datetime',
        ];
    }

    /**
     * Customer who owns this KYC document.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Staff member who verified this document.
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
