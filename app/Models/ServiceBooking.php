<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceBooking extends Model
{
    use HasFactory;

    protected $table = 'service_bookings';

    protected $fillable = [
        'store_id',
        'service_enquiry_id',
        'booking_number',
        'service_type',
        'service_item_id',
        'user_id',
        'customer_name',
        'customer_phone',
        'customer_email',
        'booking_channel',
        'start_datetime',
        'end_datetime',
        'pickup_location',
        'drop_location',
        'quantity',
        'base_amount',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'advance_paid',
        'balance_due',
        'payment_status',
        'payment_method',
        'status',
        'held_until',
        'idempotency_key',
        'customer_notes',
        'admin_notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_datetime' => 'datetime',
            'end_datetime' => 'datetime',
            'held_until' => 'datetime',
            'quantity' => 'integer',
            'base_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'advance_paid' => 'decimal:2',
            'balance_due' => 'decimal:2',
        ];
    }

    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(ServiceEnquiry::class, 'service_enquiry_id');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    public function serviceItem(): BelongsTo
    {
        return $this->belongsTo(ServiceItem::class, 'service_item_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function notificationLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(NotificationLog::class, 'service_booking_id');
    }
}
