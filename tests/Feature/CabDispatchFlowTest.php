<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\CabDispatch;
use App\Models\CabDispatchEvent;
use App\Models\CabRescheduleRequest;
use App\Models\CabRefundReview;
use App\Models\ServicePaymentReceipt;
use App\Models\CabDriver;
use App\Models\CabVehicle;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceResource;
use App\Models\ServiceResourceAllocation;
use App\Models\Store;
use App\Models\User;
use App\Services\CabDispatchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honn = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->muru = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand',
        'city' => 'Murudeshwar', 'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->item = ServiceItem::create([
        'store_id' => $this->honn->id, 'service_type' => 'taxi',
        'name' => 'Verified Sedan Fleet', 'price_base' => 1000,
        'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $this->otherItem = ServiceItem::create([
        'store_id' => $this->muru->id, 'service_type' => 'taxi',
        'name' => 'Other Branch Cab', 'price_base' => 1000,
        'price_unit' => 'per_trip', 'status' => 'available',
    ]);
    $this->admin = User::create([
        'name' => 'Cab Admin', 'email' => 'dispatch55-admin@example.test',
        'phone' => '9000005551', 'password' => 'Password123!',
        'role' => UserRole::SUPER_ADMIN, 'status' => UserStatus::ACTIVE,
    ]);
    $this->staff = User::create([
        'name' => 'Cab Staff', 'email' => 'dispatch55-staff@example.test',
        'phone' => '9000005552', 'password' => 'Password123!',
        'role' => UserRole::STAFF, 'status' => UserStatus::ACTIVE,
    ]);
    $this->staff->stores()->attach($this->honn->id);
    $this->staff->syncAssignedServices(['taxi']);
    $this->outsider = User::create([
        'name' => 'Outsider', 'email' => 'dispatch55-out@example.test',
        'phone' => '9000005553', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);

    $vehicleResource = ServiceResource::create([
        'store_id' => $this->honn->id,
        'service_item_id' => $this->item->id,
        'resource_type' => 'cab_vehicle', 'code' => 'CAB55-VEHICLE',
        'name' => 'Test Sedan', 'capacity_units' => 1, 'status' => 'available',
    ]);
    $driverResource = ServiceResource::create([
        'store_id' => $this->honn->id,
        'service_item_id' => $this->item->id,
        'resource_type' => 'cab_driver', 'code' => 'CAB55-DRIVER',
        'name' => 'Test Licensed Driver', 'capacity_units' => 1, 'status' => 'available',
    ]);
    $this->cab = CabVehicle::create([
        'store_id' => $this->honn->id, 'service_item_id' => $this->item->id,
        'service_resource_id' => $vehicleResource->id,
        'registration_number' => 'KA47A5555',
        'vehicle_class' => 'sedan', 'make' => 'Maruti', 'model_name' => 'Dzire',
        'ownership_type' => 'owned', 'seats' => 4, 'luggage_capacity' => 2,
        'documents_verified' => true, 'status' => 'available',
        'insurance_expires_on' => now()->addYear(),
        'permit_expires_on' => now()->addYear(),
        'fitness_expires_on' => now()->addYear(),
        'last_inspected_on' => now(),
    ]);
    $this->driver = CabDriver::create([
        'store_id' => $this->honn->id, 'service_item_id' => $this->item->id,
        'service_resource_id' => $driverResource->id,
        'name' => 'Test Driver', 'license_fingerprint' => hash('sha256', 'cab55-licence'),
        'license_last_four' => '5555',
        'license_expires_on' => now()->addYear(),
        'last_verified_on' => now(),
        'documents_verified' => true, 'status' => 'available',
    ]);
});

function cab55Booking($test, string $ref, int $offsetDays = 5, int $startHour = 9, int $endHour = 13, int $quantity = 2): ServiceBooking
{
    $day = now()->addDays($offsetDays)->startOfDay();
    return ServiceBooking::create([
        'booking_number' => $ref,
        'store_id' => $test->honn->id, 'service_type' => 'taxi',
        'service_item_id' => $test->item->id, 'booking_channel' => 'offline_walkin',
        'customer_name' => 'Dispatch Test', 'customer_phone' => '9000005554',
        'start_datetime' => $day->copy()->addHours($startHour),
        'end_datetime' => $day->copy()->addHours($endHour),
        'quantity' => $quantity, 'total_amount' => 2000,
        'advance_paid' => 0, 'balance_due' => 2000,
        'status' => 'confirmed',
    ]);
}

test('authorized staff atomically assigns documented cab and driver with audit trail', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB55-001');
    $this->actingAs($this->staff)->postJson('/admin/cab-dispatches', [
        'service_booking_id' => $booking->id,
        'cab_vehicle_id' => $this->cab->id,
        'cab_driver_id' => $this->driver->id,
        'operations_notes' => 'Meet at reception',
    ])->assertCreated()->assertJsonPath('data.status', 'assigned');

    expect(CabDispatch::count())->toBe(1)
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)->count())->toBe(2)
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)
            ->where('status', 'confirmed')->count())->toBe(2)
        ->and(CabDispatchEvent::count())->toBe(1)
        ->and(CabDispatchEvent::first()->to_status)->toBe('assigned');
});

test('overlapping vehicle or driver assignment rolls back BOTH allocations', function (): void {
    $first = cab55Booking($this, 'GKW-CAB55-011');
    $second = cab55Booking($this, 'GKW-CAB55-012', 5, 10, 14);

    $service = app(CabDispatchService::class);
    $service->assign($first, $this->cab, $this->driver, $this->admin);
    expect(fn () => $service->assign($second, $this->cab, $this->driver, $this->admin))
        ->toThrow(ValidationException::class);
    expect(CabDispatch::count())->toBe(1)
        ->and(ServiceResourceAllocation::where('service_booking_id', $second->id)->count())->toBe(0);
});

test('double assignment and wrong capacity cannot create additional allocations', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB55-021', quantity: 5);
    $service = app(CabDispatchService::class);
    expect(fn () => $service->assign($booking, $this->cab, $this->driver, $this->admin))
        ->toThrow(ValidationException::class);
    $booking->update(['quantity' => 3]);
    $service->assign($booking, $this->cab, $this->driver, $this->admin);
    expect(fn () => $service->assign($booking, $this->cab, $this->driver, $this->admin))
        ->toThrow(ValidationException::class);
    expect(CabDispatch::count())->toBe(1);
});

test('verified driver and vehicle must be active with current compliance', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB55-031');
    $this->driver->update(['license_expires_on' => now()->subDay()]);
    expect(fn () => app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin))
        ->toThrow(ValidationException::class);
    $this->driver->update(['license_expires_on' => now()->addYear()]);
    $this->cab->update(['documents_verified' => false]);
    expect(fn () => app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin))
        ->toThrow(ValidationException::class);
    expect(CabDispatch::count())->toBe(0);
});

test('trip timeline start and completion release allocated capacity and preserve event history', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB55-041');
    $service = app(CabDispatchService::class);
    $dispatch = $service->assign($booking, $this->cab, $this->driver, $this->admin);

    $service->start($dispatch, $this->admin, 10000);
    expect($booking->fresh()->status)->toBe('in_progress');
    expect(fn () => $service->start($dispatch, $this->admin, 10005))
        ->toThrow(ValidationException::class);
    expect(fn () => $service->complete($dispatch, $this->admin, 9000))
        ->toThrow(ValidationException::class);
    $service->complete($dispatch, $this->admin, 10200);
    expect($booking->fresh()->status)->toBe('completed')
        ->and(CabDispatch::first()->status)->toBe('completed')
        ->and(ServiceResourceAllocation::where('status', 'released')->count())->toBe(2)
        ->and(CabDispatchEvent::count())->toBe(3);
});

test('cancel assigned trip releases both resources and does not allow duplicate cancellation', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB55-051');
    $service = app(CabDispatchService::class);
    $dispatch = $service->assign($booking, $this->cab, $this->driver, $this->admin);
    $service->cancel($dispatch, $this->admin);
    expect($booking->fresh()->status)->toBe('cancelled')
        ->and(ServiceResourceAllocation::where('status', 'released')->count())->toBe(2);
    expect(fn () => $service->cancel($dispatch, $this->admin))
        ->toThrow(ValidationException::class);
});

test('customer and staff from other branch cannot assign or inspect dispatches', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB55-061');
    $data = [
        'service_booking_id' => $booking->id,
        'cab_vehicle_id' => $this->cab->id,
        'cab_driver_id' => $this->driver->id,
    ];
    $this->actingAs($this->outsider)->postJson('/admin/cab-dispatches', $data)->assertForbidden();

    $this->staff->stores()->detach($this->honn->id);
    $this->staff->stores()->attach($this->muru->id);
    $this->actingAs($this->staff)
        ->postJson('/admin/cab-dispatches', $data)->assertForbidden();
    $this->getJson('/admin/cab-dispatches')->assertOk()->assertJsonCount(0, 'data');
});

test('missing future return time and enquiry-only request cannot be dispatched', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB55-071');
    $booking->update(['end_datetime' => null]);
    expect(fn () => app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin))
        ->toThrow(ValidationException::class);
    expect(CabDispatch::count())->toBe(0);
});


test('HTTP cab cancellation requires a reason and stores immutable audit context', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-001');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);

    $this->actingAs($this->staff)->postJson("/admin/cab-dispatches/{$dispatch->id}/cancel", [])
        ->assertUnprocessable()->assertJsonValidationErrors(['reason']);
    expect($dispatch->fresh()->status)->toBe('assigned');

    $this->actingAs($this->staff)->postJson("/admin/cab-dispatches/{$dispatch->id}/cancel", [
        'reason' => 'Customer requested cancellation before departure',
    ])->assertOk()->assertJsonPath('data.status', 'cancelled');

    expect(CabDispatchEvent::where('cab_dispatch_id', $dispatch->id)->latest('id')->first()->reason)
        ->toBe('Customer requested cancellation before departure')
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)->where('status', 'released')->count())->toBe(2);

    $this->actingAs($this->staff)->postJson("/admin/cab-dispatches/{$dispatch->id}/cancel", [
        'reason' => 'Attempt to cancel again',
    ])->assertUnprocessable();
    expect(CabDispatchEvent::where('cab_dispatch_id', $dispatch->id)->count())->toBe(2);
});


test('authorized cab staff can propose but not immediately execute rescheduling', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-020');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);
    $oldStart = $booking->start_datetime->toDateTimeString();
    $oldEnd = $booking->end_datetime->toDateTimeString();
    $proposedStart = $booking->start_datetime->copy()->addDay();
    $proposedEnd = $booking->end_datetime->copy()->addDay();
    $url = "/admin/cab-dispatches/{$dispatch->id}/reschedule-requests";

    $this->actingAs($this->staff)->postJson($url, [
        'proposed_starts_at' => $proposedStart->toDateTimeString(),
        'proposed_ends_at' => $proposedEnd->toDateTimeString(),
        'reason' => 'Customer requested one-day postponement',
    ])->assertCreated()->assertJsonPath('data.status', 'pending');

    expect(CabRescheduleRequest::count())->toBe(1)
        ->and($booking->fresh()->start_datetime->toDateTimeString())->toBe($oldStart)
        ->and($booking->fresh()->end_datetime->toDateTimeString())->toBe($oldEnd)
        ->and($dispatch->fresh()->starts_at->toDateTimeString())->toBe($oldStart)
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)->where('status', 'confirmed')->count())->toBe(2);

    $this->actingAs($this->staff)->postJson($url, [
        'proposed_starts_at' => $proposedStart->toDateTimeString(),
        'proposed_ends_at' => $proposedEnd->toDateTimeString(),
        'reason' => 'Repeated postponement',
    ])->assertUnprocessable();
});

test('reschedule proposal blocks wrong branch, invalid period and started trips', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-021');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);
    $url = "/admin/cab-dispatches/{$dispatch->id}/reschedule-requests";
    $payload = [
        'proposed_starts_at' => now()->addDays(7)->toDateTimeString(),
        'proposed_ends_at' => now()->addDays(8)->toDateTimeString(),
        'reason' => 'Requested schedule adjustment',
    ];
    $this->actingAs($this->outsider)->postJson($url, $payload)->assertForbidden();
    $this->staff->stores()->detach($this->honn->id);
    $this->staff->stores()->attach($this->muru->id);
    $this->actingAs($this->staff)->postJson($url, $payload)->assertForbidden();
    $this->actingAs($this->admin)->postJson($url, array_merge($payload, [
        'proposed_ends_at' => now()->addDays(6)->toDateTimeString(),
    ]))->assertUnprocessable()->assertJsonValidationErrors(['proposed_ends_at']);
    expect(CabRescheduleRequest::count())->toBe(0);
    app(CabDispatchService::class)->start($dispatch, $this->admin);
    $this->actingAs($this->admin)->postJson($url, $payload)->assertUnprocessable();
    expect(CabRescheduleRequest::count())->toBe(0);
});


test('unpaid offline cab reschedule approval moves paired allocations and booking atomically', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-030');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);
    $start = $booking->start_datetime->copy()->addDay();
    $end = $booking->end_datetime->copy()->addDay();
    $this->actingAs($this->staff)->postJson("/admin/cab-dispatches/{$dispatch->id}/reschedule-requests", [
        'proposed_starts_at' => $start->toDateTimeString(),
        'proposed_ends_at' => $end->toDateTimeString(),
        'reason' => 'Customer confirmed later departure',
    ])->assertCreated();
    $proposal = CabRescheduleRequest::firstOrFail();
    $this->actingAs($this->staff)->postJson("/admin/cab-reschedule-requests/{$proposal->id}/resolve", [
        'decision' => 'approved',
        'customer_consent_confirmed' => true,
        'unchanged_fare_approved' => true,
    ])->assertOk()->assertJsonPath('data.status', 'approved');
    expect($booking->fresh()->start_datetime->toDateTimeString())->toBe($start->toDateTimeString())
        ->and($dispatch->fresh()->ends_at->toDateTimeString())->toBe($end->toDateTimeString())
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)
            ->where('starts_at', $start->toDateTimeString())->where('status', 'confirmed')->count())->toBe(2);
    $this->actingAs($this->staff)->postJson("/admin/cab-reschedule-requests/{$proposal->id}/resolve", [
        'decision' => 'approved', 'customer_consent_confirmed' => true, 'unchanged_fare_approved' => true,
    ])->assertUnprocessable();
});

test('reschedule approval with conflicting driver or vehicle preserves old allocations', function (): void {
    $first = cab55Booking($this, 'GKW-CAB56-031');
    $dispatch = app(CabDispatchService::class)->assign($first, $this->cab, $this->driver, $this->admin);
    $other = cab55Booking($this, 'GKW-CAB56-032', offsetDays: 6);
    $old = $dispatch->starts_at->toDateTimeString();
    $this->actingAs($this->admin)->postJson("/admin/cab-dispatches/{$dispatch->id}/reschedule-requests", [
        'proposed_starts_at' => $other->start_datetime->toDateTimeString(),
        'proposed_ends_at' => $other->end_datetime->toDateTimeString(),
        'reason' => 'Move to next date',
    ])->assertCreated();
    // Simulate a separately reserved vehicle for another legitimate booking.
    ServiceResourceAllocation::create([
        'service_resource_id' => $this->cab->service_resource_id,
        'service_booking_id' => $other->id,
        'starts_at' => $other->start_datetime,
        'ends_at' => $other->end_datetime,
        'quantity' => 1, 'status' => 'confirmed',
    ]);
    $proposal = CabRescheduleRequest::firstOrFail();
    $this->actingAs($this->admin)->postJson("/admin/cab-reschedule-requests/{$proposal->id}/resolve", [
        'decision' => 'approved', 'customer_consent_confirmed' => true, 'unchanged_fare_approved' => true,
    ])->assertUnprocessable();
    expect($first->fresh()->start_datetime->toDateTimeString())->toBe($old)
        ->and($dispatch->fresh()->starts_at->toDateTimeString())->toBe($old)
        ->and($proposal->fresh()->status)->toBe('pending')
        ->and(ServiceResourceAllocation::where('service_booking_id', $first->id)
            ->where('starts_at', $old)->where('status', 'confirmed')->count())->toBe(2);
});

test('paid and online cab reservations cannot use unchanged-fare reschedule approval', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-033');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);
    $this->actingAs($this->admin)->postJson("/admin/cab-dispatches/{$dispatch->id}/reschedule-requests", [
        'proposed_starts_at' => $booking->start_datetime->copy()->addDay()->toDateTimeString(),
        'proposed_ends_at' => $booking->end_datetime->copy()->addDay()->toDateTimeString(),
        'reason' => 'Customer requested change',
    ])->assertCreated();
    $booking->update(['advance_paid' => 100, 'payment_status' => 'partial']);
    $proposal = CabRescheduleRequest::firstOrFail();
    $this->actingAs($this->admin)->postJson("/admin/cab-reschedule-requests/{$proposal->id}/resolve", [
        'decision' => 'approved', 'customer_consent_confirmed' => true, 'unchanged_fare_approved' => true,
    ])->assertUnprocessable();
    expect($proposal->fresh()->status)->toBe('pending');
});

test('cancelled cab refund review records receipt evidence once without issuing any refund', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-040');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);
    $this->actingAs($this->admin)->postJson("/admin/cab-dispatches/{$dispatch->id}/cancel", [
        'reason' => 'Customer cancelled before pickup',
    ])->assertOk();
    ServicePaymentReceipt::create([
        'service_booking_id' => $booking->id, 'provider' => 'razorpay',
        'payment_id' => 'pay_cab56_verified', 'amount_paise' => 50000,
    ]);
    $booking->update(['advance_paid' => 500]);
    $url = "/admin/cab-bookings/{$booking->id}/refund-reviews";
    $this->actingAs($this->staff)->postJson($url, [
        'reason' => 'Customer requested payment reconciliation',
    ])->assertOk()->assertJsonPath('data.status', 'requires_policy_review')
        ->assertJsonPath('data.verified_receipts_paise', 50000)
        ->assertJsonPath('data.reconciliation_required', false);
    $this->actingAs($this->staff)->postJson($url, [
        'reason' => 'Repeated request must not create another review',
    ])->assertOk();
    expect(CabRefundReview::count())->toBe(1)
        ->and(CabRefundReview::first()->verified_receipts_paise)->toBe(50000)
        ->and($booking->fresh()->payment_status)->toBe('pending');
});

test('cab refund review denies noncancelled bookings and cross-branch staff', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-041');
    $url = "/admin/cab-bookings/{$booking->id}/refund-reviews";
    $this->actingAs($this->admin)->postJson($url, [
        'reason' => 'Must be cancelled before refund review',
    ])->assertUnprocessable();
    $booking->update(['status' => 'cancelled']);
    $this->actingAs($this->outsider)->postJson($url, [
        'reason' => 'Should be denied',
    ])->assertForbidden();
    $this->staff->stores()->detach($this->honn->id);
    $this->staff->stores()->attach($this->muru->id);
    $this->actingAs($this->staff)->postJson($url, [
        'reason' => 'Should be denied',
    ])->assertForbidden();
    expect(CabRefundReview::count())->toBe(0);
});

test('cab review explicitly flags receipt and recorded advance mismatch', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-042');
    $booking->update(['status' => 'cancelled', 'advance_paid' => 200]);
    $this->actingAs($this->admin)->postJson("/admin/cab-bookings/{$booking->id}/refund-reviews", [
        'reason' => 'Review unmatched customer payment',
    ])->assertOk()->assertJsonPath('data.reconciliation_required', true)
        ->assertJsonPath('data.verified_receipts_paise', 0)
        ->assertJsonPath('data.recorded_advance_paise', 20000);
});

test('cab operations desk is permission-scoped and only renders authorized branch rows', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-050');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);

    $this->actingAs($this->outsider)->get('/admin/cab-operations')->assertForbidden();
    $this->actingAs($this->staff)->get('/admin/cab-operations')
        ->assertOk()->assertInertia(fn ($page) => $page
            ->component('Admin/Cabs/Operations')
            ->has('dispatches', 1)
            ->where('dispatches.0.id', $dispatch->id)
        );

    $this->staff->stores()->detach($this->honn->id);
    $this->staff->stores()->attach($this->muru->id);
    $this->actingAs($this->staff)->get('/admin/cab-operations')
        ->assertOk()->assertInertia(fn ($page) => $page
            ->component('Admin/Cabs/Operations')
            ->has('dispatches', 0)
            ->has('bookings', 0)
        );
});


test('cab dispute intake is branch scoped, audit only and does not change payment state', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-060');
    $url = "/admin/cab-bookings/{$booking->id}/disputes";
    $this->actingAs($this->outsider)->postJson($url, [
        'category' => 'billing', 'description' => 'Customer questioned an invoice item',
    ])->assertForbidden();

    $this->actingAs($this->staff)->postJson($url, [
        'category' => 'billing', 'description' => 'Customer questioned an invoice item',
    ])->assertCreated()->assertJsonPath('data.status', 'open');

    expect(\App\Models\CabDispute::count())->toBe(1)
        ->and(\App\Models\CabDispute::first()->store_id)->toBe($this->honn->id)
        ->and($booking->fresh()->status)->toBe('confirmed')
        ->and($booking->fresh()->payment_status)->toBe('pending');

    $this->staff->stores()->detach($this->honn->id);
    $this->staff->stores()->attach($this->muru->id);
    $this->actingAs($this->staff)->postJson($url, [
        'category' => 'refund', 'description' => 'Cannot log cross branch financial dispute',
    ])->assertForbidden();
    $this->actingAs($this->staff)->get('/admin/cab-operations')
        ->assertOk()->assertInertia(fn ($page) => $page
            ->component('Admin/Cabs/Operations')
            ->has('disputes', 0)
        );
});

test('cab dispute intake rejects unknown category and blank incident narrative', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-061');
    $url = "/admin/cab-bookings/{$booking->id}/disputes";
    $this->actingAs($this->admin)->postJson($url, [
        'category' => 'refund_execute', 'description' => 'Not an allowed incident category',
    ])->assertUnprocessable()->assertJsonValidationErrors(['category']);
    $this->actingAs($this->admin)->postJson($url, [
        'category' => 'billing', 'description' => '   ',
    ])->assertUnprocessable()->assertJsonValidationErrors(['description']);
    expect(\App\Models\CabDispute::count())->toBe(0);
});


test('authorized staff reviews and internally closes a non-financial cab dispute with event history', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-070');
    $this->actingAs($this->staff)->postJson("/admin/cab-bookings/{$booking->id}/disputes", [
        'category' => 'service_quality', 'description' => 'Passenger reports a dispatch communication concern',
    ])->assertCreated();
    $dispute = \App\Models\CabDispute::firstOrFail();
    $url = "/admin/cab-disputes/{$dispute->id}/transition";

    $this->actingAs($this->staff)->postJson($url, [
        'status' => 'closed_internal', 'review_notes' => 'Attempt to skip review',
    ])->assertUnprocessable();

    $this->actingAs($this->staff)->postJson($url, [
        'status' => 'reviewing', 'review_notes' => 'Assigning the issue for internal investigation',
    ])->assertOk()->assertJsonPath('data.status', 'reviewing');

    $this->actingAs($this->admin)->postJson($url, [
        'status' => 'closed_internal', 'review_notes' => 'Operations investigation completed, no money was refunded',
    ])->assertOk()->assertJsonPath('data.status', 'closed_internal');

    expect($dispute->fresh()->status)->toBe('closed_internal')
        ->and(\App\Models\CabDisputeEvent::where('cab_dispute_id', $dispute->id)->count())->toBe(2)
        ->and(\App\Models\CabDisputeEvent::where('cab_dispute_id', $dispute->id)->orderBy('id')->first()->from_status)->toBe('open')
        ->and($booking->fresh()->status)->toBe('confirmed')
        ->and($booking->fresh()->payment_status)->toBe('pending');

    $this->actingAs($this->staff)->postJson($url, [
        'status' => 'reviewing', 'review_notes' => 'Cannot reopen a closed incident',
    ])->assertUnprocessable();
    expect(\App\Models\CabDisputeEvent::count())->toBe(2);
});

test('financial cab disputes cannot be internally closed and role branch checks hold', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-071');
    $this->actingAs($this->admin)->postJson("/admin/cab-bookings/{$booking->id}/disputes", [
        'category' => 'refund', 'description' => 'Customer asks for payment reconciliation',
    ])->assertCreated();
    $dispute = \App\Models\CabDispute::firstOrFail();
    $url = "/admin/cab-disputes/{$dispute->id}/transition";
    $this->actingAs($this->outsider)->postJson($url, [
        'status' => 'reviewing', 'review_notes' => 'Not an authorized operator',
    ])->assertForbidden();
    $this->staff->stores()->detach($this->honn->id);
    $this->staff->stores()->attach($this->muru->id);
    $this->actingAs($this->staff)->postJson($url, [
        'status' => 'reviewing', 'review_notes' => 'Not permitted across branch',
    ])->assertForbidden();

    $this->actingAs($this->admin)->postJson($url, [
        'status' => 'reviewing', 'review_notes' => 'Review financial receipt ledger',
    ])->assertOk();
    $this->actingAs($this->admin)->postJson($url, [
        'status' => 'closed_internal', 'review_notes' => 'Premature closure of refund case',
    ])->assertUnprocessable();
    expect($dispute->fresh()->status)->toBe('reviewing')
        ->and(\App\Models\CabDisputeEvent::where('cab_dispute_id', $dispute->id)->count())->toBe(1);
});

test('cab dispute review requires substantive notes', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-072');
    $this->actingAs($this->admin)->postJson("/admin/cab-bookings/{$booking->id}/disputes", [
        'category' => 'schedule', 'description' => 'Unexpected travel time changed pickup',
    ])->assertCreated();
    $dispute = \App\Models\CabDispute::firstOrFail();
    $this->actingAs($this->admin)->postJson("/admin/cab-disputes/{$dispute->id}/transition", [
        'status' => 'reviewing', 'review_notes' => '    ',
    ])->assertUnprocessable()->assertJsonValidationErrors(['review_notes']);
    expect($dispute->fresh()->status)->toBe('open')
        ->and(\App\Models\CabDisputeEvent::count())->toBe(0);
});


test('cab confirmation contact uses its actual branch rather than placeholder taxi coordinator', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-080');
    $this->honn->update(['phone' => '8660989586']);
    $booking->update(['pickup_location' => 'Confirmed railway station pickup']);
    $notification = new \App\Notifications\ServiceBookingConfirmedNotification($booking->fresh());
    $details = $notification->getCoordinatorDetails();
    expect($details['phone'])->toBe('8660989586')
        ->and($details['spot'])->toBe('Confirmed railway station pickup')
        ->and($details['name'])->toContain('Honnavar');
    $message = $notification->toMail($this->staff);
    expect(implode(' ', $message->introLines))->toContain('8660989586')
        ->not->toContain('94815 12341');
});

test('cab confirmation with missing branch phone does not invent a coordinator number', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-081');
    $this->honn->update(['phone' => null]);
    $booking->update(['pickup_location' => null]);
    $notification = new \App\Notifications\ServiceBookingConfirmedNotification($booking->fresh());
    $details = $notification->getCoordinatorDetails();
    expect($details['phone'])->toBe('')
        ->and($details['spot'])->toBe('Pickup point to be confirmed by staff');
    $message = $notification->toMail($this->staff);
    expect(implode(' ', $message->introLines))->toContain('contact details pending verification')
        ->not->toContain('94815 12341');
});


test('cab cancellation records one unsent notification intent and no actual delivery', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-090');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);
    $this->actingAs($this->admin)->postJson("/admin/cab-dispatches/{$dispatch->id}/cancel", [
        'reason' => 'Customer requested cancellation',
    ])->assertOk();
    $event = \App\Models\CabNotificationEvent::firstOrFail();
    expect($event->event_type)->toBe('dispatch_cancelled')
        ->and($event->status)->toBe('pending_approval')
        ->and($event->event_key)->toBe("dispatch_cancelled:{$dispatch->id}")
        ->and(\App\Models\CabNotificationEvent::count())->toBe(1);
    app(\App\Services\CabNotificationEventRecorder::class)->record($booking->fresh(), 'dispatch_cancelled', $dispatch->id);
    expect(\App\Models\CabNotificationEvent::count())->toBe(1);
});

test('cab notification intent recorder rejects non-taxi bookings and unsupported events', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-091');
    $recorder = app(\App\Services\CabNotificationEventRecorder::class);
    expect(fn () => $recorder->record($booking, 'refund_sent', 1))->toThrow(\Illuminate\Validation\ValidationException::class);
    $booking->update(['service_type' => 'boating']);
    expect(fn () => $recorder->record($booking->fresh(), 'dispatch_cancelled', 1))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
    expect(\App\Models\CabNotificationEvent::count())->toBe(0);
});


test('cab finance preview is read only, arithmetic based, and never assumes refund entitlement', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-100');
    $booking->update(['advance_paid' => 500, 'balance_due' => 1500, 'payment_status' => 'partial']);
    ServicePaymentReceipt::create([
        'service_booking_id' => $booking->id, 'provider' => 'razorpay',
        'payment_id' => 'pay_56_preview_1', 'amount_paise' => 50000,
    ]);
    $url = "/admin/cab-bookings/{$booking->id}/settlement-preview";
    $this->actingAs($this->staff)->getJson($url)->assertOk()
        ->assertJsonPath('data.booking_total_paise', 200000)
        ->assertJsonPath('data.recorded_advance_paise', 50000)
        ->assertJsonPath('data.recorded_balance_paise', 150000)
        ->assertJsonPath('data.gateway_receipts_recorded_paise', 50000)
        ->assertJsonPath('data.gateway_receipt_count', 1)
        ->assertJsonPath('data.refund_eligible', null)
        ->assertJsonPath('data.refund_amount_paise', null)
        ->assertJsonPath('data.payout_status', 'not_supported')
        ->assertJsonPath('data.requires_manual_reconciliation', false);
    expect($booking->fresh()->status)->toBe('confirmed')
        ->and($booking->fresh()->payment_status)->toBe('partial')
        ->and(CabRefundReview::count())->toBe(0);
});

test('cab finance preview flags missing receipts and cancellation review without claiming payout', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-101');
    $booking->update(['status' => 'cancelled', 'advance_paid' => 500, 'balance_due' => 1500]);
    $url = "/admin/cab-bookings/{$booking->id}/settlement-preview";
    $result = $this->actingAs($this->admin)->getJson($url)->assertOk();
    $issues = $result->json('data.issues');
    expect($issues)->toContain('receipt_advance_mismatch')
        ->toContain('recorded_advance_without_gateway_receipt');
    $result->assertJsonPath('data.refund_eligible', null);
    ServicePaymentReceipt::create([
        'service_booking_id' => $booking->id, 'provider' => 'razorpay',
        'payment_id' => 'pay_56_preview_2', 'amount_paise' => 50000,
    ]);
    $result = $this->actingAs($this->admin)->getJson($url)->assertOk();
    expect($result->json('data.issues'))->toContain('cancelled_paid_booking_requires_refund_review');
    $result->assertJsonPath('data.payout_status', 'not_supported');
});

test('cab finance preview does not disclose another branch or non taxi booking', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-102');
    $url = "/admin/cab-bookings/{$booking->id}/settlement-preview";
    $this->actingAs($this->outsider)->getJson($url)->assertForbidden();
    $this->staff->stores()->detach($this->honn->id);
    $this->staff->stores()->attach($this->muru->id);
    $this->actingAs($this->staff)->getJson($url)->assertForbidden();
    $booking->update(['service_type' => 'boating']);
    $this->actingAs($this->admin)->getJson($url)->assertForbidden();
});


test('cab reschedule approval refuses receipt-backed booking even with zero cached advance', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-110');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);
    $start = $booking->start_datetime->copy()->addDay()->toDateTimeString();
    $end = $booking->end_datetime->copy()->addDay()->toDateTimeString();
    $this->actingAs($this->admin)->postJson("/admin/cab-dispatches/{$dispatch->id}/reschedule-requests", [
        'proposed_starts_at' => $start,
        'proposed_ends_at' => $end,
        'reason' => 'Customer requested adjusted cab time',
    ])->assertCreated();

    ServicePaymentReceipt::create([
        'service_booking_id' => $booking->id,
        'provider' => 'razorpay',
        'payment_id' => 'pay_cab56_cached_zero',
        'amount_paise' => 25000,
    ]);
    $proposal = CabRescheduleRequest::firstOrFail();
    $oldStart = $booking->start_datetime->toDateTimeString();
    $this->actingAs($this->admin)->postJson("/admin/cab-reschedule-requests/{$proposal->id}/resolve", [
        'decision' => 'approved',
        'customer_consent_confirmed' => true,
        'unchanged_fare_approved' => true,
    ])->assertUnprocessable();

    expect($booking->fresh()->start_datetime->toDateTimeString())->toBe($oldStart)
        ->and($dispatch->fresh()->starts_at->toDateTimeString())->toBe($oldStart)
        ->and($proposal->fresh()->status)->toBe('pending')
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)
            ->where('status', 'confirmed')->where('starts_at', $oldStart)->count())->toBe(2)
        ->and(\App\Models\CabNotificationEvent::count())->toBe(0);
});

test('driver-only reschedule overlap rolls back cab allocation change and notification intent', function (): void {
    $booking = cab55Booking($this, 'GKW-CAB56-111');
    $dispatch = app(CabDispatchService::class)->assign($booking, $this->cab, $this->driver, $this->admin);
    $other = cab55Booking($this, 'GKW-CAB56-112', offsetDays: 6);
    $this->actingAs($this->admin)->postJson("/admin/cab-dispatches/{$dispatch->id}/reschedule-requests", [
        'proposed_starts_at' => $other->start_datetime->toDateTimeString(),
        'proposed_ends_at' => $other->end_datetime->toDateTimeString(),
        'reason' => 'Travel moved to following day',
    ])->assertCreated();
    ServiceResourceAllocation::create([
        'service_resource_id' => $this->driver->service_resource_id,
        'service_booking_id' => $other->id,
        'starts_at' => $other->start_datetime,
        'ends_at' => $other->end_datetime,
        'quantity' => 1,
        'status' => 'confirmed',
    ]);
    $proposal = CabRescheduleRequest::firstOrFail();
    $oldStart = $booking->start_datetime->toDateTimeString();
    $this->actingAs($this->admin)->postJson("/admin/cab-reschedule-requests/{$proposal->id}/resolve", [
        'decision' => 'approved', 'customer_consent_confirmed' => true,
        'unchanged_fare_approved' => true,
    ])->assertUnprocessable();

    expect($proposal->fresh()->status)->toBe('pending')
        ->and($dispatch->fresh()->starts_at->toDateTimeString())->toBe($oldStart)
        ->and($booking->fresh()->start_datetime->toDateTimeString())->toBe($oldStart)
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)
            ->where('starts_at', $oldStart)->where('status', 'confirmed')->count())->toBe(2)
        ->and(\App\Models\CabNotificationEvent::count())->toBe(0);
});


test('cancellation rolls back paired resources and audit when durable recording fails', function (string $failureModel): void {
    $booking = cab55Booking($this, 'GKW-CAB56-CANCEL-ROLLBACK');
    $service = app(CabDispatchService::class);
    $dispatch = $service->assign($booking, $this->cab, $this->driver, $this->admin);
    $fail = true;
    $failureModel::creating(function () use (&$fail): void {
        if ($fail) {
            throw new RuntimeException('Injected durable cancellation recording failure');
        }
    });

    expect(fn () => $service->cancel($dispatch, $this->admin, 'Customer requested cancellation'))
        ->toThrow(RuntimeException::class, 'Injected durable cancellation recording failure');
    expect($booking->fresh()->status)->toBe('confirmed')
        ->and($dispatch->fresh()->status)->toBe('assigned')
        ->and($dispatch->fresh()->closed_by)->toBeNull()
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)
            ->where('status', 'confirmed')->count())->toBe(2)
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)
            ->where('status', 'released')->count())->toBe(0)
        ->and(CabDispatchEvent::where('cab_dispatch_id', $dispatch->id)->count())->toBe(1)
        ->and(\App\Models\CabNotificationEvent::where('service_booking_id', $booking->id)->count())->toBe(0);

    // A retry after the failed transaction must produce one complete cancellation.
    $fail = false;
    $service->cancel($dispatch, $this->admin, 'Customer requested cancellation');
    expect($booking->fresh()->status)->toBe('cancelled')
        ->and($dispatch->fresh()->status)->toBe('cancelled')
        ->and(ServiceResourceAllocation::where('service_booking_id', $booking->id)
            ->where('status', 'released')->count())->toBe(2)
        ->and(CabDispatchEvent::where('cab_dispatch_id', $dispatch->id)
            ->where('to_status', 'cancelled')->count())->toBe(1)
        ->and(\App\Models\CabNotificationEvent::where('service_booking_id', $booking->id)->sole()->status)
            ->toBe('pending_approval');
})->with([
    'audit insert failure' => [CabDispatchEvent::class],
    'notification intent insert failure' => [\App\Models\CabNotificationEvent::class],
]);
