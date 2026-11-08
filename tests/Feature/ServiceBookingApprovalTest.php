<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceResource;
use App\Models\ServiceResourceAllocation;
use App\Models\Store;
use App\Models\User;
use App\Services\ServiceBookingApproval;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    Notification::fake();
    Http::preventStrayRequests();
    $this->branch = Store::create([
        'name' => 'Approval test branch', 'address_line' => 'Test road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'phone' => '9876543210', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->manager = User::factory()->create(['role' => UserRole::STORE_MANAGER, 'status' => UserStatus::ACTIVE]);
    $this->manager->stores()->attach($this->branch);
    $this->manager->syncAssignedServices(['boating']);
    $this->worker = User::factory()->create(['role' => UserRole::STAFF, 'status' => UserStatus::ACTIVE]);
    $this->worker->stores()->attach($this->branch);
    $this->worker->syncAssignedServices(['boating']);
    $this->item = ServiceItem::create([
        'store_id' => $this->branch->id, 'service_type' => 'boating', 'name' => 'Proposal test boat',
        'price_base' => 1000, 'price_unit' => 'per_person', 'status' => 'available',
    ]);
    $this->resource = ServiceResource::create([
        'store_id' => $this->branch->id, 'service_item_id' => $this->item->id,
        'resource_type' => 'boat', 'code' => 'APPROVAL-BOAT', 'name' => 'Approved boat',
        'capacity_units' => 2, 'status' => 'available',
    ]);
    $this->proposal = ServiceBooking::create([
        'booking_number' => 'APPROVAL-TEST', 'store_id' => $this->branch->id,
        'service_type' => 'boating', 'service_item_id' => $this->item->id,
        'customer_name' => 'Synthetic Guest', 'customer_phone' => '9876543210',
        'start_datetime' => now()->addDays(3)->startOfHour(), 'end_datetime' => now()->addDays(3)->startOfHour()->addHours(2),
        'quantity' => 2, 'base_amount' => 2000, 'total_amount' => 2000,
        'advance_paid' => 0, 'balance_due' => 2000, 'payment_status' => 'pending',
        'payment_method' => 'cash', 'booking_channel' => 'offline_walkin', 'status' => 'held',
        'held_until' => now()->addMinutes(10),
    ]);
    $this->approval = [
        'expected_total_paise' => 200000,
        'expected_starts_at' => $this->proposal->start_datetime->toDateTimeString(),
        'expected_ends_at' => $this->proposal->end_datetime->toDateTimeString(),
        'resource_ids' => [$this->resource->id], 'approval_notes' => 'Reviewed schedule and proposed amount',
    ];
});

test('manager approval atomically allocates an unpaid proposal and identical replay is idempotent', function (): void {
    Sanctum::actingAs($this->manager);
    $url = "/api/v1/staff/service-bookings/{$this->proposal->id}/approve";
    $this->postJson($url, $this->approval)->assertOk()->assertJsonPath('data.status', 'confirmed');
    $this->postJson($url, $this->approval)->assertOk();
    expect($this->proposal->fresh()->held_until)->toBeNull()
        ->and((float) $this->proposal->fresh()->advance_paid)->toBe(0.0)
        ->and((float) $this->proposal->fresh()->balance_due)->toBe(2000.0)
        ->and(ServiceResourceAllocation::where('status', 'confirmed')->count())->toBe(1)
        ->and(ActivityLog::where('action', 'service_booking.approved')->count())->toBe(1)
        ->and(ActivityLog::where('action', 'service_booking.approved')->first()->old_values)->toBe(['status' => 'held']);
    $this->postJson($url, array_replace($this->approval, ['approval_notes' => 'A different approval']))->assertUnprocessable();
    Notification::assertNothingSent();
    Http::assertNothingSent();
});

test('web approval enforces branch service and manager authorization', function (): void {
    $url = "/admin/services/boating/bookings/{$this->proposal->id}/approve";
    $this->actingAs($this->worker)->postJson($url, $this->approval)->assertForbidden();
    $this->manager->stores()->detach();
    $this->actingAs($this->manager)->postJson($url, $this->approval)->assertForbidden();
    expect($this->proposal->fresh()->status)->toBe('held')->and(ServiceResourceAllocation::count())->toBe(0);
});

test('stale expired paid online closed or malformed proposals cannot be approved', function (array $changes): void {
    $this->proposal->update($changes);
    Sanctum::actingAs($this->manager);
    $this->postJson("/api/v1/staff/service-bookings/{$this->proposal->id}/approve", $this->approval)->assertUnprocessable();
    expect(ServiceResourceAllocation::count())->toBe(0)
        ->and(ActivityLog::where('action', 'service_booking.approved')->count())->toBe(0);
})->with([
    'amount changed' => [['total_amount' => 2100]],
    'schedule changed' => [['end_datetime' => '2030-01-01 12:00:00']],
    'expired' => [['held_until' => '2020-01-01 00:00:00']],
    'advance recorded' => [['advance_paid' => 100, 'balance_due' => 1900, 'payment_status' => 'partial']],
    'online' => [['booking_channel' => 'online']],
    'cancelled' => [['status' => 'cancelled']],
    'legacy confirmed' => [['status' => 'confirmed']],
    'missing schedule' => [['end_datetime' => null]],
]);

test('wrong resource type branch or unavailable capacity rolls approval back', function (string $field, mixed $value): void {
    $this->resource->update([$field => $value]);
    Sanctum::actingAs($this->manager);
    $this->postJson("/api/v1/staff/service-bookings/{$this->proposal->id}/approve", $this->approval)->assertUnprocessable();
    expect($this->proposal->fresh()->status)->toBe('held')->and($this->proposal->fresh()->held_until)->not->toBeNull()
        ->and(ServiceResourceAllocation::count())->toBe(0)->and(ActivityLog::where('action', 'service_booking.approved')->count())->toBe(0);
})->with([
    ['resource_type', 'stay_room'], ['store_id', null], ['status', 'maintenance'], ['capacity_units', 1],
]);

test('a second overlapping proposal cannot consume the same capacity', function (): void {
    app(ServiceBookingApproval::class)->approve($this->proposal->id, $this->manager, $this->approval);
    $other = $this->proposal->replicate();
    $other->booking_number = 'APPROVAL-CONFLICT';
    $other->save();
    expect(fn () => app(ServiceBookingApproval::class)->approve($other->id, $this->manager, $this->approval))->toThrow(ValidationException::class);
    expect($other->fresh()->status)->toBe('held')->and(ServiceResourceAllocation::count())->toBe(1);
});

test('approval audit failure rolls back confirmation and resource insertion', function (): void {
    $dispatcher = ActivityLog::getEventDispatcher();
    ActivityLog::setEventDispatcher(clone $dispatcher);
    ActivityLog::creating(function (ActivityLog $log): void {
        if ($log->action === 'service_booking.approved') {
            throw new RuntimeException('Synthetic approval audit failure');
        }
    });
    try {
        expect(fn () => app(ServiceBookingApproval::class)->approve($this->proposal->id, $this->manager, $this->approval))
            ->toThrow(RuntimeException::class, 'Synthetic approval audit failure');
    } finally {
        ActivityLog::setEventDispatcher($dispatcher);
    }
    expect($this->proposal->fresh()->status)->toBe('held')->and($this->proposal->fresh()->held_until)->not->toBeNull()
        ->and(ServiceResourceAllocation::count())->toBe(0)->and(ActivityLog::where('action', 'service_booking.approved')->count())->toBe(0);
});

test('staff lifecycle cannot confirm or skip approval and completion releases allocation exactly once', function (): void {
    $workflow = app(ServiceBookingApproval::class);
    expect(fn () => $workflow->transition($this->proposal->id, $this->worker, 'confirmed'))->toThrow(ValidationException::class);
    expect(fn () => $workflow->transition($this->proposal->id, $this->worker, 'in_progress'))->toThrow(ValidationException::class);
    $workflow->approve($this->proposal->id, $this->manager, $this->approval);
    expect(fn () => $workflow->transition($this->proposal->id, $this->worker, 'completed'))->toThrow(ValidationException::class);
    $workflow->transition($this->proposal->id, $this->worker, 'in_progress');
    $workflow->transition($this->proposal->id, $this->worker, 'completed');
    $workflow->transition($this->proposal->id, $this->worker, 'completed');
    expect($this->proposal->fresh()->status)->toBe('completed')
        ->and(ServiceResourceAllocation::where('status', 'released')->count())->toBe(1)
        ->and(ActivityLog::where('action', 'service_booking.status_updated')->count())->toBe(2);
});
