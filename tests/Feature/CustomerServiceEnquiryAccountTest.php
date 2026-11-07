<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use App\Models\ServiceItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->customer = User::create([
        'name' => 'Status Customer', 'email' => 'status-customer@example.test',
        'phone' => '9000009941', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->anotherCustomer = User::create([
        'name' => 'Other Customer', 'email' => 'status-other@example.test',
        'phone' => '9000009942', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
});

function accountStatusEnquiry(User $user, string $ref, string $status): ServiceEnquiry
{
    return ServiceEnquiry::create([
        'user_id' => $user->id,
        'reference' => $ref,
        'service_type' => 'taxi',
        'customer_name' => $user->name,
        'customer_phone' => $user->phone,
        'start_datetime' => now()->addWeek(),
        'pickup_location' => 'Honnavar Railway Station',
        'quantity' => 2,
        'status' => $status,
    ]);
}

test('customer account lists owned enquiries separately from confirmed bookings', function (): void {
    accountStatusEnquiry($this->customer, 'ENQ-OWN-100', 'requested');
    accountStatusEnquiry($this->customer, 'ENQ-OWN-101', 'reviewing');
    accountStatusEnquiry($this->anotherCustomer, 'ENQ-PRIVATE-999', 'requested');

    $this->actingAs($this->customer)->get('/account/bookings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Account/Bookings')
            ->has('serviceEnquiries', 2)
            ->where('stats.total_count', 2)
            ->where('stats.active_count', 2)
            ->has('serviceBookings', 0)
            ->etc());
    expect(ServiceBooking::count())->toBe(0);
});

test('service booking account never exposes records owned by another customer even with matching contact', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Approved Cab',
        'price_base' => 1000,
        'price_unit' => 'per_trip',
        'status' => 'available',
    ]);
    ServiceBooking::create([
        'booking_number' => 'GKW-PRIVATE-STATUS-50',
        'user_id' => $this->anotherCustomer->id,
        'service_type' => 'taxi',
        'service_item_id' => $item->id,
        'customer_name' => 'Status Customer',
        'customer_phone' => $this->customer->phone,
        'customer_email' => $this->customer->email,
        'start_datetime' => now()->addDays(8),
        'quantity' => 1,
        'status' => 'confirmed',
        'total_amount' => 1000,
    ]);
    $this->actingAs($this->customer)->get('/account/bookings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Account/Bookings')
            ->has('serviceBookings', 0)
            ->where('stats.total_count', 0)
            ->etc());
});

test('enquiry closed status is never treated as a confirmed service reservation', function (): void {
    accountStatusEnquiry($this->customer, 'ENQ-OWN-102', 'closed');
    $this->actingAs($this->customer)->get('/account/bookings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Account/Bookings')
            ->has('serviceEnquiries', 1)
            ->where('serviceEnquiries.0.status', 'closed')
            ->has('serviceBookings', 0)
            ->where('stats.active_count', 0)
            ->etc());
});

test('a held or payment-pending service booking counts as active but not confirmed', function (): void {
    $item = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Test Vessel Seats',
        'price_base' => 800,
        'price_unit' => 'per_person',
        'status' => 'available',
    ]);
    foreach (['held', 'pending_payment'] as $i => $status) {
        ServiceBooking::create([
            'booking_number' => 'GKW-STATUS-HOLD-'.$i,
            'user_id' => $this->customer->id,
            'service_type' => 'boating',
            'service_item_id' => $item->id,
            'customer_name' => $this->customer->name,
            'customer_phone' => $this->customer->phone,
            'start_datetime' => now()->addWeek(),
            'quantity' => 1,
            'status' => $status,
            'total_amount' => 800,
        ]);
    }
    $this->actingAs($this->customer)->get('/account/bookings')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Account/Bookings')
            ->has('serviceBookings', 2)
            ->where('stats.active_count', 2)
            ->etc());
});
