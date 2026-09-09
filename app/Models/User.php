<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use HasRoles;
    use Notifiable;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'whatsapp_opt_in',
        'status',
        'blacklist_reason',
        'google_id',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'whatsapp_opt_in' => 'boolean',
        ];
    }

    /**
     * Customer bookings.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'user_id');
    }

    /**
     * Bookings created by this staff member.
     */
    public function createdBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'created_by');
    }

    /**
     * Bookings completed/returned by this staff member.
     */
    public function completedBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'completed_by');
    }

    /**
     * Stores where this user is assigned as staff.
     */
    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class, 'staff_store', 'user_id', 'store_id')
            ->using(StaffStore::class)
            ->withTimestamps();
    }

    /**
     * KYC documents uploaded for this user.
     */
    public function kycDocuments(): HasMany
    {
        return $this->hasMany(KycDocument::class, 'user_id');
    }

    /**
     * KYC documents verified by this user.
     */
    public function verifiedKycDocuments(): HasMany
    {
        return $this->hasMany(KycDocument::class, 'verified_by');
    }

    /**
     * Bike documents uploaded by this user.
     */
    public function uploadedBikeDocuments(): HasMany
    {
        return $this->hasMany(BikeDocument::class, 'uploaded_by');
    }

    /**
     * Coupons used by this user.
     */
    public function couponUsages(): HasMany
    {
        return $this->hasMany(CouponUsage::class, 'user_id');
    }

    /**
     * Payments collected by this staff member.
     */
    public function collectedPayments(): HasMany
    {
        return $this->hasMany(Payment::class, 'collected_by');
    }

    /**
     * Refunds processed by this staff member.
     */
    public function processedRefunds(): HasMany
    {
        return $this->hasMany(Refund::class, 'processed_by');
    }

    /**
     * Customer reviews written by this user.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'user_id');
    }

    /**
     * Condition logs recorded by this user.
     */
    public function bikeConditionLogs(): HasMany
    {
        return $this->hasMany(BikeConditionLog::class, 'logged_by');
    }

    /**
     * Activity logs recorded for this user.
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }

    /**
     * Notification logs sent to this user.
     */
    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class, 'user_id');
    }

    /**
     * Offline sync queue actions queued by this user.
     */
    public function syncQueueItems(): HasMany
    {
        return $this->hasMany(SyncQueue::class, 'user_id');
    }

    /**
     * Route notifications for the WhatsApp channel.
     */
    public function routeNotificationForWhatsapp(): ?string
    {
        return $this->phone;
    }

    /**
     * Services this staff member or manager is assigned to.
     * Table: service_user (user_id, service_type)
     *
     * @return array<string>
     */
    public function assignedServicesList(): array
    {
        if ($this->role === UserRole::SUPER_ADMIN) {
            return ['two_wheelers', 'taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours'];
        }

        $assigned = \Illuminate\Support\Facades\DB::table('service_user')
            ->where('user_id', $this->id)
            ->pluck('service_type')
            ->toArray();

        // If no services explicitly assigned, fallback to two_wheelers for legacy store staff
        if (empty($assigned) && in_array($this->role, [UserRole::STORE_MANAGER, UserRole::STAFF], true)) {
            return ['two_wheelers'];
        }

        return $assigned;
    }

    /**
     * Check if user can manage a specific service.
     */
    public function canManageService(string $serviceType): bool
    {
        if ($this->role === UserRole::SUPER_ADMIN) {
            return true;
        }

        if (! in_array($this->role, [UserRole::STORE_MANAGER, UserRole::STAFF], true)) {
            return false;
        }

        return in_array($serviceType, $this->assignedServicesList(), true);
    }

    /**
     * Sync assigned services for this staff/manager.
     *
     * @param array<string> $serviceTypes
     */
    public function syncAssignedServices(array $serviceTypes): void
    {
        \Illuminate\Support\Facades\DB::table('service_user')->where('user_id', $this->id)->delete();

        $validServices = ['two_wheelers', 'taxi', 'boating', 'scuba', 'homestay', 'guide', 'tours'];
        $inserts = [];
        $now = now();

        foreach ($serviceTypes as $st) {
            if (in_array($st, $validServices, true)) {
                $inserts[] = [
                    'user_id' => $this->id,
                    'service_type' => $st,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if (! empty($inserts)) {
            \Illuminate\Support\Facades\DB::table('service_user')->insert($inserts);
        }
    }
}

