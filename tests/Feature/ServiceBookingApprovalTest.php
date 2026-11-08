<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Notifications\ServiceBookingCancelledNotification;
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
    $this->withoutVite(); // Backend response/authorization tests; assets are built in standard CI.
    Notification::fake();
    Http::preventStrayRequests();
    $this->branch = Store::create([
        'latitude' => 14.28, 'longitude' => 74.45, 'name' => 'Approval test branch', 'address_line' => 'Test road', 'city' => 'Honnavar',
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

test('cancelling an approved booking releases allocation once and audits the released count', function (): void {
    $workflow = app(ServiceBookingApproval::class);
    $workflow->approve($this->proposal->id, $this->manager, $this->approval);
    expect(ServiceResourceAllocation::where('status', 'confirmed')->count())->toBe(1);
    $workflow->transition($this->proposal->id, $this->worker, 'cancelled', 'Customer cancelled');
    $workflow->transition($this->proposal->id, $this->worker, 'cancelled', 'Repeated request');
    $audit = ActivityLog::where('action', 'service_booking.status_updated')->firstOrFail();
    expect($this->proposal->fresh()->status)->toBe('cancelled')
        ->and(ServiceResourceAllocation::where('status', 'released')->count())->toBe(1)
        ->and(ActivityLog::where('action', 'service_booking.status_updated')->count())->toBe(1)
        ->and($audit->old_values['status'])->toBe('confirmed')
        ->and($audit->new_values['status'])->toBe('cancelled')
        ->and($audit->new_values['released_allocations'])->toBe(1);
});

test('cancelling an unallocated hold records zero released allocations', function (): void {
    $workflow = app(ServiceBookingApproval::class);
    $workflow->transition($this->proposal->id, $this->worker, 'cancelled', 'Proposal withdrawn');
    $audit = ActivityLog::where('action', 'service_booking.status_updated')->firstOrFail();
    expect($this->proposal->fresh()->status)->toBe('cancelled')
        ->and(ServiceResourceAllocation::count())->toBe(0)
        ->and($audit->new_values['released_allocations'])->toBe(0);
});

test('cancellation audit failure rolls back booking status and resource release', function (): void {
    $workflow = app(ServiceBookingApproval::class);
    $workflow->approve($this->proposal->id, $this->manager, $this->approval);
    $dispatcher = ActivityLog::getEventDispatcher();
    ActivityLog::setEventDispatcher(clone $dispatcher);
    ActivityLog::creating(function (ActivityLog $log): void {
        if ($log->action === 'service_booking.status_updated') {
            throw new RuntimeException('Synthetic cancellation audit failure');
        }
    });
    try {
        expect(fn () => $workflow->transition($this->proposal->id, $this->worker, 'cancelled'))
            ->toThrow(RuntimeException::class, 'Synthetic cancellation audit failure');
    } finally {
        ActivityLog::setEventDispatcher($dispatcher);
    }
    expect($this->proposal->fresh()->status)->toBe('confirmed')
        ->and(ServiceResourceAllocation::where('status', 'confirmed')->count())->toBe(1)
        ->and(ServiceResourceAllocation::where('status', 'released')->count())->toBe(0)
        ->and(ActivityLog::where('action', 'service_booking.status_updated')->count())->toBe(0);
});

test('unauthorized staff cannot cancel another branch booking or release its resources', function (): void {
    $workflow = app(ServiceBookingApproval::class);
    $workflow->approve($this->proposal->id, $this->manager, $this->approval);
    $outsider = User::factory()->create(['role' => UserRole::STAFF, 'status' => UserStatus::ACTIVE]);
    $outsider->syncAssignedServices(['boating']);
    expect(fn () => $workflow->transition($this->proposal->id, $outsider, 'cancelled'))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    expect($this->proposal->fresh()->status)->toBe('confirmed')
        ->and(ServiceResourceAllocation::where('status', 'confirmed')->count())->toBe(1)
        ->and(ActivityLog::where('action', 'service_booking.status_updated')->count())->toBe(0);
});

test('approval supports each non-cab typed reservation without changing its financial proposal', function (string $service, string $type): void {
    $this->manager->syncAssignedServices([$service]);
    $this->item->update(['service_type' => $service]);
    $this->proposal->update(['service_type' => $service]);
    $this->resource->update(['resource_type' => $type]);
    $result = app(ServiceBookingApproval::class)->approve($this->proposal->id, $this->manager, $this->approval);
    expect($result->status)->toBe('confirmed')->and((float) $result->total_amount)->toBe(2000.0)
        ->and((float) $result->advance_paid)->toBe(0.0)->and(ServiceResourceAllocation::where('status', 'confirmed')->count())->toBe(1);
})->with([
    ['boating', 'boat'], ['scuba', 'scuba_slot'], ['homestay', 'stay_room'],
    ['guide', 'tour_guide'], ['tours', 'tour_departure'],
]);

test('staff cannot inject an advance or online channel when creating an unpaid proposal', function (array $injection): void {
    Sanctum::actingAs($this->worker);
    $this->postJson('/api/v1/staff/service-bookings', array_replace([
        'service_type' => 'boating', 'service_item_id' => $this->item->id,
        'customer_name' => 'Injection test', 'customer_phone' => '9876543210',
        'start_datetime' => now()->addDays(4)->toDateTimeString(), 'total_amount' => 2000,
        'advance_paid' => 0, 'booking_channel' => 'offline_walkin', 'store_id' => $this->branch->id,
    ], $injection))->assertUnprocessable();
    expect(ServiceBooking::count())->toBe(1)->and(ServiceResourceAllocation::count())->toBe(0);
})->with([[['advance_paid' => 100]], [['booking_channel' => 'online']]]);

test('manager booking screen exposes safe branch resource candidates and exact review context', function (): void {
    $other = $this->resource->replicate();
    $other->code = 'WRONG-TYPE';
    $other->resource_type = 'stay_room';
    $other->save();
    $this->actingAs($this->manager)->get("/admin/services/boating/bookings/{$this->proposal->id}")
        ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('Admin/Services/Bookings/Show')->where('approvalReview.blocked', false)
            ->where('approvalReview.expected_total_paise', 200000)
            ->where('approvalReview.expected_starts_at', $this->approval['expected_starts_at'])
            ->has('approvalReview.resources', 1)->where('approvalReview.resources.0.id', $this->resource->id)
            ->where('allowedStatuses', ['cancelled']));
    expect(ServiceResourceAllocation::count())->toBe(0)->and($this->proposal->fresh()->status)->toBe('held');
});

test('staff booking screen offers no manager approval candidates and foreign manager cannot inspect them', function (): void {
    $this->actingAs($this->worker)->get("/admin/services/boating/bookings/{$this->proposal->id}")
        ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page->where('approvalReview', null));
    $this->manager->stores()->detach();
    $this->actingAs($this->manager)->get("/admin/services/boating/bookings/{$this->proposal->id}")->assertForbidden();
});

test('expired proposal review withholds candidates without mutating historical values', function (): void {
    $this->proposal->update(['held_until' => now()->subMinute()]);
    $review = app(ServiceBookingApproval::class)->review($this->proposal->fresh(), $this->manager);
    expect($review['blocked'])->toBeTrue()->and($review['resources'])->toBe([])
        ->and($this->proposal->fresh()->status)->toBe('held')->and(ServiceResourceAllocation::count())->toBe(0);
});

test('super admin can still inspect branchless historical booking without approval candidates', function (): void {
    $admin = User::factory()->create(['role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE]);
    $this->proposal->update(['store_id' => null]);
    $this->actingAs($admin)->get("/admin/services/boating/bookings/{$this->proposal->id}")
        ->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page->where('approvalReview', null));
});


test('cancelling a service proposal sends one distinct customer email', function (): void {
    $this->proposal->update(['customer_email' => 'guest@example.com']);
    app(ServiceBookingApproval::class)->transition($this->proposal->id, $this->worker, 'cancelled');
    Notification::assertSentOnDemand(ServiceBookingCancelledNotification::class, function ($notification, $channels, $notifiable): bool {
        return $notification->booking->status === 'cancelled'
            && $notifiable->routes['mail'] === 'guest@example.com';
    });
});

test('cancelled notification does not claim that a refund is completed', function (): void {
    $this->proposal->update(['customer_email' => 'guest@example.com', 'advance_paid' => 100]);
    $notice = new ServiceBookingCancelledNotification($this->proposal->fresh());
    $mail = $notice->toMail((object) ['name' => 'Guest']);
    expect(implode(' ', $mail->introLines))->toContain('does not mean a refund has been approved or completed');
});

test('cancellation without a verified customer email sends nothing', function (): void {
    $this->proposal->update(['customer_email' => 'not-an-email']);
    app(ServiceBookingApproval::class)->transition($this->proposal->id, $this->worker, 'cancelled');
    Notification::assertNothingSent();
});

test('cancellation without a customer email sends nothing', function (): void {
    $this->proposal->update(['customer_email' => null]);
    app(ServiceBookingApproval::class)->transition($this->proposal->id, $this->worker, 'cancelled');
    Notification::assertNothingSent();
});

test('cancelled notification uses booking number in subject', function (): void {
    $mail = (new ServiceBookingCancelledNotification($this->proposal))->toMail((object) ['name' => 'Guest']);
    expect($mail->subject)->toContain($this->proposal->booking_number);
});

test('cancelled notification includes service type', function (): void {
    $mail = (new ServiceBookingCancelledNotification($this->proposal))->toMail((object) ['name' => 'Guest']);
    expect(implode(' ', $mail->introLines))->toContain('Boating');
});

test('cancelled notification includes recorded payment without refund promise', function (): void {
    $this->proposal->update(['advance_paid' => 125]);
    $mail = (new ServiceBookingCancelledNotification($this->proposal->fresh()))->toMail((object) ['name' => 'Guest']);
    expect(implode(' ', $mail->introLines))->toContain('125.00');
});

test('cancelled notification has email-only delivery channel', function (): void {
    $notice = new ServiceBookingCancelledNotification($this->proposal);
    expect($notice->via((object) []))->toBe(['mail']);
});

test('non-cancellation transition sends no cancellation notice', function (): void {
    app(ServiceBookingApproval::class)->transition($this->proposal->id, $this->worker, 'expired');
    Notification::assertNothingSent();
    expect($this->proposal->fresh()->status)->toBe('expired');
});

test('unauthorized cancellation does not send a customer notice', function (): void {
    $this->proposal->update(['customer_email' => 'guest@example.com']);
    $outsider = User::factory()->create(['role' => UserRole::STAFF, 'status' => UserStatus::ACTIVE]);
    $outsider->syncAssignedServices(['boating']);
    expect(fn () => app(ServiceBookingApproval::class)->transition($this->proposal->id, $outsider, 'cancelled'))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
    Notification::assertNothingSent();
});

test('cancellation remains committed when customer email delivery throws', function (): void {
    $this->proposal->update(['customer_email' => 'guest@example.com']);
    // Simulate a failing notification transport at the model notifier boundary,
    // without replacing Laravel's notification facade fake with an incompatible mock.
    $notifier = \Mockery::mock(\Illuminate\Contracts\Notifications\Dispatcher::class);
    $notifier->shouldReceive('send')->andThrow(new \RuntimeException('Mail transport unavailable'));
    app()->instance(\Illuminate\Contracts\Notifications\Dispatcher::class, $notifier);
    $result = app(ServiceBookingApproval::class)->transition($this->proposal->id, $this->worker, 'cancelled');
    expect($result->status)->toBe('cancelled')
        ->and($this->proposal->fresh()->status)->toBe('cancelled');
    expect(ActivityLog::where('action', 'service_booking.status_updated')
        ->where('subject_id', (string) $this->proposal->id)->count())->toBe(1);
});

test('cancellation retry does not send a duplicate email', function (): void {
    $this->proposal->update(['customer_email' => 'guest@example.com']);
    $service = app(ServiceBookingApproval::class);
    $service->transition($this->proposal->id, $this->worker, 'cancelled');
    Notification::assertSentOnDemand(ServiceBookingCancelledNotification::class, 1);
    expect($service->transition($this->proposal->id, $this->worker, 'cancelled')->status)->toBe('cancelled');
    Notification::assertSentOnDemand(ServiceBookingCancelledNotification::class, 1);
});
