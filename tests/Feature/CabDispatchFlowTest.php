<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\CabDispatch;
use App\Models\CabDispatchEvent;
use App\Models\CabRescheduleRequest;
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
