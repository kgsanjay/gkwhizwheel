<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    $this->store = Store::create([
        'name' => 'Bangalore Hub',
        'address_line' => '100 MG Road',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9716,
        'longitude' => 77.5946,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 1500.00,
        'default_deposit_amount' => 3000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Meteor 350',
        'registration_number' => 'KA-01-ME-1122',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->customer = User::create([
        'name' => 'Test Customer',
        'email' => 'checkout.customer@example.com',
        'phone' => '9888812345',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    // Booking total in DB is 1500 rental + 3000 deposit = 4500.00
    $this->booking = Booking::create([
        'booking_reference' => 'BK-CHARGE-TEST-001',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::HELD,
        'start_date' => '2026-11-01',
        'end_date' => '2026-11-01',
        'base_amount' => 1500.00,
        'deposit_amount' => 3000.00,
        'total_amount' => 4500.00,
        'price_breakdown_json' => ['base' => 1500, 'deposit' => 3000],
        'idempotency_key' => 'idemp-charge-001',
    ]);
});

test('checkout razorpay charges database total amount and ignores client supplied amount payload', function (): void {
    Sanctum::actingAs($this->customer);

    // Malicious client attempts to pass amount = 1.00 (or 100 paise) in request payload
    $response = $this->postJson("/api/v1/bookings/{$this->booking->id}/checkout", [
        'gateway' => 'razorpay',
        'amount' => 1.00,
        'amount_paise' => 100,
        'total_amount' => 1.00,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'gateway' => 'razorpay',
                'amount' => 4500,
                'amount_paise' => 450000,
            ],
        ]);

    expect((float) $response->json('data.amount'))->toBe(4500.00)
        ->and($response->json('data.amount_paise'))->toBe(450000);
});

test('checkout phonepe charges database total amount and ignores client supplied amount payload', function (): void {
    Sanctum::actingAs($this->customer);

    // Malicious client attempts to pass amount = 5.00 in request payload
    $response = $this->postJson("/api/v1/bookings/{$this->booking->id}/checkout", [
        'gateway' => 'phonepe',
        'amount' => 5.00,
        'amount_paise' => 500,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'gateway' => 'phonepe',
                'amount' => 4500,
                'amount_paise' => 450000,
            ],
        ]);

    expect((float) $response->json('data.amount'))->toBe(4500.00)
        ->and($response->json('data.amount_paise'))->toBe(450000);
});

test('hold booking calculates addon amounts using server side catalog prices instead of client supplied unit price', function (): void {
    Sanctum::actingAs($this->customer);

    // Client attempts to pass 0.01 for insurance (catalog price is 250.00)
    $response = $this->withHeader('Idempotency-Key', 'idemp-tamper-addon-01')
        ->postJson('/api/v1/bookings/hold', [
            'bike_id' => $this->bike->id,
            'start_date' => '2026-11-15',
            'end_date' => '2026-11-15',
            'pickup_store_id' => $this->store->id,
            'return_store_id' => $this->store->id,
            'addons' => [
                [
                    'addon_type' => 'insurance',
                    'quantity' => 1,
                    'unit_price' => 0.01,
                ],
                [
                    'addon_type' => 'helmet',
                    'quantity' => 2,
                    'unit_price' => 0.01,
                ],
            ],
        ]);

    $response->assertCreated();

    // Server-side calculation:
    // Base rate: 1500
    // Insurance: 1 * 250 = 250
    // Helmet: 2 * 100 = 200
    // Deposit: 3000
    // Total: 1500 + 450 + 3000 = 4950.00
    $bookingId = $response->json('data.id');
    $createdBooking = Booking::findOrFail($bookingId);

    expect((float) $createdBooking->total_amount)->toBe(4950.00);

    // Verify in price breakdown
    $breakdown = $createdBooking->price_breakdown_json;
    expect((float) $breakdown['addon_amount'])->toBe(450.00);
});
