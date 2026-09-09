<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BookingStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->admin = User::create([
        'name' => 'Chief Administrator',
        'email' => 'admin_voucher@gkwhizwheel.com',
        'phone' => '9845110001',
        'password' => bcrypt('Secret123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Ananya Hegde',
        'email' => 'ananya@example.com',
        'phone' => '9845120002',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->store = Store::create([
        'name' => 'Palya Main Rd Hub',
        'address_line' => 'Opp. Sharavathi Bridge, Palya',
        'city' => 'Honnavar',
        'state' => 'Karnataka',
        'pincode' => '581334',
        'latitude' => 14.2810,
        'longitude' => 74.4442,
        'phone' => '9481512340',
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Gearless Scooter',
        'base_daily_rate' => 450.00,
        'default_deposit_amount' => 1000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'home_store_id' => $this->store->id,
        'current_store_id' => $this->store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-47-E-1008',
        'fuel_type' => 'petrol',
        'transmission' => 'automatic',
        'status' => 'available',
        'odometer_reading' => 3500,
    ]);

    $this->serviceItem = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Sharavathi Riverfront Shikara Cruise',
        'category' => 'Mangrove Safari',
        'price_base' => 1500.00,
        'price_unit' => 'per_ride',
        'status' => 'available',
    ]);

    $this->serviceBooking = ServiceBooking::create([
        'booking_number' => 'GKW-BT-260910-TEST',
        'service_type' => 'boating',
        'service_item_id' => $this->serviceItem->id,
        'user_id' => $this->customer->id,
        'customer_name' => 'Ananya Hegde',
        'customer_phone' => '9845120002',
        'customer_email' => 'ananya@example.com',
        'booking_channel' => 'online',
        'start_datetime' => '2026-09-12 16:30:00',
        'pickup_location' => 'Honnavar Sharavathi River Jetty',
        'quantity' => 2,
        'base_amount' => 1500.00,
        'tax_amount' => 0.00,
        'discount_amount' => 0.00,
        'total_amount' => 1500.00,
        'advance_paid' => 0.00,
        'balance_due' => 1500.00,
        'payment_status' => 'pending',
        'payment_method' => 'pay_on_arrival',
        'status' => 'confirmed',
    ]);

    $this->bikeBooking = Booking::create([
        'booking_number' => 'GKW-BK-260910-TEST',
        'booking_reference' => 'REF-BK-260910',
        'user_id' => $this->customer->id,
        'bike_id' => $this->bike->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'start_datetime' => '2026-09-12 09:00:00',
        'end_datetime' => '2026-09-14 18:00:00',
        'start_date' => '2026-09-12',
        'end_date' => '2026-09-14',
        'rental_days' => 2,
        'base_amount' => 900.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 1900.00,
        'status' => BookingStatus::CONFIRMED,
        'channel' => 'online',
        'payment_status' => 'paid',
        'customer_name' => 'Ananya Hegde',
        'customer_phone' => '9845120002',
        'price_breakdown_json' => ['daily_rate' => 450, 'days' => 2],
        'idempotency_key' => 'idem-test-voucher-key-01',
    ]);
});

test('customer can download service booking pdf voucher with correct headers', function (): void {
    $response = $this->get("/services/bookings/{$this->serviceBooking->booking_number}/voucher");

    $response->assertOk();
    expect($response->headers->get('content-type'))->toBe('application/pdf');
    expect($response->headers->get('content-disposition'))->toContain("{$this->serviceBooking->booking_number}_voucher.pdf");
});

test('customer can view print-optimized service pass in browser', function (): void {
    $response = $this->get("/services/bookings/{$this->serviceBooking->booking_number}/print");

    $response->assertOk()
        ->assertSee($this->serviceBooking->booking_number)
        ->assertSee('Sharavathi Riverfront Shikara Cruise')
        ->assertSee('Ananya Hegde')
        ->assertSee('Captain Boating Desk');
});

test('customer can download bike rental pdf voucher with correct headers', function (): void {
    $response = $this->actingAs($this->customer)->get("/bookings/{$this->bikeBooking->id}/voucher");

    $response->assertOk();
    expect($response->headers->get('content-type'))->toBe('application/pdf');
    expect($response->headers->get('content-disposition'))->toContain("{$this->bikeBooking->booking_number}_rental_agreement.pdf");
});

test('customer can view print-optimized bike rental pass in browser', function (): void {
    $response = $this->actingAs($this->customer)->get("/bookings/{$this->bikeBooking->id}/print");

    $response->assertOk()
        ->assertSee($this->bikeBooking->booking_number)
        ->assertSee('Honda Activa 6G')
        ->assertSee('KA-47-E-1008')
        ->assertSee('Palya Main Rd Hub');
});

test('admin can download service booking voucher from admin endpoint', function (): void {
    $response = $this->actingAs($this->admin)->get("/admin/services/boating/bookings/{$this->serviceBooking->id}/voucher");

    $response->assertOk();
    expect($response->headers->get('content-type'))->toBe('application/pdf');
});

test('admin can download bike rental voucher from admin endpoint', function (): void {
    $response = $this->actingAs($this->admin)->get("/admin/bookings/{$this->bikeBooking->id}/voucher");

    $response->assertOk();
    expect($response->headers->get('content-type'))->toBe('application/pdf');
});
