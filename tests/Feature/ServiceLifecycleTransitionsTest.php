<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use App\Models\User;
use App\Services\ServiceBookingLifecycle;
use App\Services\ServiceEnquiryLifecycle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

function lifecycleBooking(string $status, ?int $serviceItemId = null, float $amount = 500): ServiceBooking
{
    $booking = new ServiceBooking();
    $booking->status = $status;
    $booking->service_item_id = $serviceItemId;
    $booking->total_amount = $amount;
    return $booking;
}

test('enquiry lifecycle permits review then closure, never booking confirmation', function (): void {
    $flow = app(ServiceEnquiryLifecycle::class);
    $enquiry = new ServiceEnquiry(['status' => 'requested']);

    $flow->assertTransition($enquiry, 'reviewing');
    $enquiry->status = 'reviewing';
    $flow->assertTransition($enquiry, 'closed');
    expect(fn () => $flow->assertTransition($enquiry, 'confirmed'))->toThrow(ValidationException::class);
    $enquiry->status = 'closed';
    expect(fn () => $flow->assertTransition($enquiry, 'requested'))->toThrow(ValidationException::class);
});

test('booking transition policy rejects skipping stages and reopening final bookings', function (): void {
    $flow = app(ServiceBookingLifecycle::class);

    expect(fn () => $flow->assertTransition(lifecycleBooking('held', 123), 'completed'))->toThrow(ValidationException::class)
        ->and(fn () => $flow->assertTransition(lifecycleBooking('cancelled', 123), 'confirmed'))->toThrow(ValidationException::class)
        ->and(fn () => $flow->assertTransition(lifecycleBooking('completed', 123), 'in_progress'))->toThrow(ValidationException::class);
    $flow->assertTransition(lifecycleBooking('confirmed', 123), 'in_progress');
    $flow->assertTransition(lifecycleBooking('in_progress', 123), 'completed');
});

test('confirming a service requires inventory, approved price and unexpired hold', function (): void {
    $flow = app(ServiceBookingLifecycle::class);

    expect(fn () => $flow->assertTransition(lifecycleBooking('held'), 'confirmed'))->toThrow(ValidationException::class)
        ->and(fn () => $flow->assertTransition(lifecycleBooking('held', 111, 0), 'confirmed'))->toThrow(ValidationException::class);
    $expired = lifecycleBooking('held', 111);
    $expired->held_until = now()->subMinute();
    expect(fn () => $flow->assertTransition($expired, 'confirmed'))->toThrow(ValidationException::class);

    $flow->assertTransition(lifecycleBooking('held', 111), 'confirmed');
});

test('unallocated service cannot be created as a confirmed paid booking', function (): void {
    $flow = app(ServiceBookingLifecycle::class);
    expect(fn () => $flow->assertCreation([
        'service_type' => 'taxi', 'status' => 'confirmed',
        'service_item_id' => null, 'total_amount' => 1000,
    ]))->toThrow(ValidationException::class);
    $flow->assertCreation([
        'service_type' => 'taxi', 'status' => 'held',
        'service_item_id' => null, 'total_amount' => 0,
    ]);
});

test('only Super Admin may change enquiry review states', function (): void {
    $customer = User::create([
        'name' => 'Customer', 'email' => 'lifecycle-customer@example.test',
        'phone' => '9000009841', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $admin = User::create([
        'name' => 'Admin', 'email' => 'lifecycle-admin@example.test',
        'phone' => '9000009842', 'password' => 'Password123!',
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $enquiry = ServiceEnquiry::create([
        'user_id' => $customer->id, 'reference' => 'ENQ-TEST-41',
        'service_type' => 'taxi', 'customer_name' => 'Customer',
        'customer_phone' => '9000009841', 'start_datetime' => now()->addDay(),
        'pickup_location' => 'Honnavar', 'quantity' => 1, 'status' => 'requested',
    ]);

    $this->actingAs($customer)->post("/admin/service-enquiries/{$enquiry->id}/status", [
        'status' => 'reviewing',
    ])->assertForbidden();
    $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/status", [
        'status' => 'reviewing',
    ])->assertRedirect();
    expect($enquiry->fresh()->status)->toBe('reviewing');
    $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/status", [
        'status' => 'confirmed',
    ])->assertSessionHasErrors('status');
    expect($enquiry->fresh()->status)->toBe('reviewing');
    $this->actingAs($admin)->post("/admin/service-enquiries/{$enquiry->id}/status", [
        'status' => 'closed',
    ])->assertRedirect();
    expect($enquiry->fresh()->status)->toBe('closed');
});
