<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\PaymentStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->storeA = Store::create([
        'name' => 'Store Alpha',
        'address_line' => '100 Feet Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'phone' => '+919876500010',
    ]);

    $this->storeB = Store::create([
        'name' => 'Store Beta',
        'address_line' => 'Outer Ring Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560103',
        'latitude' => 12.9279,
        'longitude' => 77.6271,
        'phone' => '+919876500020',
    ]);

    $this->customerA = User::create([
        'name' => 'Customer Alpha',
        'email' => 'customer.a@example.com',
        'phone' => '+919999000001',
        'password' => 'secret123',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customerB = User::create([
        'name' => 'Customer Beta',
        'email' => 'customer.b@example.com',
        'phone' => '+919999000002',
        'password' => 'secret123',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staffStoreA = User::create([
        'name' => 'Staff Alpha',
        'email' => 'staff.a@example.com',
        'phone' => '+919999000003',
        'password' => 'secret123',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->staffStoreA->stores()->attach($this->storeA->id);

    $this->storeManagerA = User::create([
        'name' => 'Manager Alpha',
        'email' => 'manager.a@example.com',
        'phone' => '+919999000004',
        'password' => 'secret123',
        'role' => UserRole::STORE_MANAGER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->storeManagerA->stores()->attach($this->storeA->id);

    $this->category = BikeCategory::create([
        'name' => 'Standard',
        'base_daily_rate' => 500.00,
        'default_deposit_amount' => 1000.00,
    ]);

    $this->bikeA = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeA->id,
        'home_store_id' => $this->storeA->id,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA-01-AA-1111',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 5000,
    ]);

    $this->bikeB = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->storeB->id,
        'home_store_id' => $this->storeB->id,
        'brand' => 'TVS',
        'model_name' => 'Jupiter',
        'registration_number' => 'KA-01-BB-2222',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
        'odometer_reading' => 8000,
    ]);

    $this->bookingB = Booking::create([
        'booking_reference' => 'BK-BETA-001',
        'user_id' => $this->customerB->id,
        'bike_id' => $this->bikeB->id,
        'pickup_store_id' => $this->storeB->id,
        'return_store_id' => $this->storeB->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'idempotency_key' => 'idem_beta_idor',
        'start_date' => Carbon::now()->addDay()->toDateString(),
        'end_date' => Carbon::now()->addDays(2)->toDateString(),
        'base_amount' => 500.00,
        'deposit_amount' => 1000.00,
        'total_amount' => 1500.00,
        'price_breakdown_json' => [],
    ]);

    $this->serviceItem = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Boat Cruise Ticket',
        'category' => 'River Cruise',
        'price_base' => 500.00,
        'price_unit' => 'per_person',
        'status' => 'available',
    ]);

    $this->serviceBookingB = ServiceBooking::create([
        'booking_number' => 'SB-BETA-001',
        'service_type' => 'boating',
        'service_item_id' => $this->serviceItem->id,
        'user_id' => $this->customerB->id,
        'customer_name' => 'Customer Beta',
        'customer_email' => 'customer.b@example.com',
        'customer_phone' => '9999000002',
        'booking_channel' => 'online',
        'start_datetime' => '2026-09-12 16:30:00',
        'pickup_location' => 'Honnavar Jetty',
        'quantity' => 1,
        'base_amount' => 500.00,
        'tax_amount' => 0.00,
        'discount_amount' => 0.00,
        'total_amount' => 500.00,
        'advance_paid' => 500.00,
        'balance_due' => 0.00,
        'payment_status' => 'paid',
        'payment_method' => 'online',
        'status' => 'confirmed',
    ]);
});

test('customer cannot download or print another customer bike booking voucher (IDOR check)', function (): void {
    $this->actingAs($this->customerA);

    // Customer A attempts to access Customer B's voucher
    $downloadResponse = $this->get("/bookings/{$this->bookingB->id}/voucher");
    $downloadResponse->assertStatus(403);

    $printResponse = $this->get("/bookings/{$this->bookingB->id}/print");
    $printResponse->assertStatus(403);
});

test('customer cannot download or print another customer service booking voucher (IDOR check)', function (): void {
    $this->actingAs($this->customerA);

    // Customer A attempts to access Customer B's service pass voucher
    $downloadResponse = $this->get("/services/bookings/{$this->serviceBookingB->booking_number}/voucher");
    $downloadResponse->assertStatus(403);

    $printResponse = $this->get("/services/bookings/{$this->serviceBookingB->booking_number}/print");
    $printResponse->assertStatus(403);
});

test('staff assigned to Store A cannot toggle maintenance on a bike at Store B', function (): void {
    Sanctum::actingAs($this->staffStoreA);

    // Staff A tries to put Bike B (Store B) into maintenance
    $response = $this->postJson("/api/v1/staff/bikes/{$this->bikeB->id}/maintenance", [
        'notes' => 'Unauthorized maintenance attempt',
    ]);

    $response->assertStatus(403);
});

test('store manager assigned to Store A cannot download voucher for booking at Store B', function (): void {
    $this->actingAs($this->storeManagerA);

    // Manager A tries to download voucher for booking B located at Store B
    $response = $this->get("/admin/bookings/{$this->bookingB->id}/voucher");

    $response->assertStatus(403);
});

test('store manager assigned to Store A cannot execute check-in on bike booking at Store B', function (): void {
    $this->actingAs($this->storeManagerA);

    $response = $this->postJson("/admin/check-in/bike/{$this->bookingB->id}/process", [
        'action' => 'check_in',
    ]);

    $response->assertStatus(403);
});
