<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CabEnquiryDetail extends Model
{
    protected $fillable = [
        'service_enquiry_id', 'service_item_id', 'store_id',
        'trip_type', 'vehicle_class', 'passengers', 'bags',
        'travel_reference', 'stops_json', 'special_requests',
        'fare_state', 'terms_acknowledged',
    ];

    protected function casts(): array
    {
        return ['passengers' => 'integer', 'bags' => 'integer', 'terms_acknowledged' => 'boolean'];
    }

    public function enquiry(): BelongsTo { return $this->belongsTo(ServiceEnquiry::class, 'service_enquiry_id'); }
    public function serviceItem(): BelongsTo { return $this->belongsTo(ServiceItem::class); }
    public function store(): BelongsTo { return $this->belongsTo(Store::class); }
}
