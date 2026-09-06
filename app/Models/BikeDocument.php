<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BikeDocumentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BikeDocument extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'bike_id',
        'document_type',
        'file_path',
        'issue_date',
        'expiry_date',
        'uploaded_by',
        'verified',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'document_type' => BikeDocumentType::class,
            'issue_date' => 'date',
            'expiry_date' => 'date',
            'verified' => 'boolean',
        ];
    }

    /**
     * Bike this document belongs to.
     */
    public function bike(): BelongsTo
    {
        return $this->belongsTo(Bike::class, 'bike_id');
    }

    /**
     * Staff member who uploaded this document.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
