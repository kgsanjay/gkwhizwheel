<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\NotificationChannel;
use App\Enums\NotificationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationLog extends Model
{
    use HasFactory;

    /**
     * Disable default created_at / updated_at timestamps.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'booking_id',
        'channel',
        'template',
        'status',
        'error_message',
        'sent_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'channel' => NotificationChannel::class,
            'status' => NotificationStatus::class,
            'sent_at' => 'datetime',
        ];
    }

    /**
     * User/recipient of the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Booking this notification is associated with, if any.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
