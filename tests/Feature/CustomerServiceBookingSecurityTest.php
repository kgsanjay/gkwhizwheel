<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->customer = User::create([
        'name' => 'Booking Customer', 'email' => 'pricing.customer@example.test',
        'phone' => '9888801001', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->otherCustomer = User::create([
        'name' => 'Other Customer', 'email' => 'pricing.other@example.test',
        'phone' => '9888801002', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->branch = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Temple Road', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350',
        'latitude' => 14.09, 'longitude' => 74.49,
        'phone' => '9888801003', 'status' => StoreStatus::ACTIVE,
    ]);
    $this->item = ServiceItem::create([
        'store_id' => $this->branch->id, 'service_type' => 'taxi',
        'name' => 'Branch Taxi', 'price_base' => 3000,
        'price_unit' => 'per_trip', 'status' => 'available',
    ]);
});

test('customer quote cannot override configured base price', function (): void {
    $this->actingAs($this->customer)->postJson('/services/quote', [
        'service_type' => 'taxi',
        'service_item_id' => $this->item->id,
        'start_datetime' => now()->addDays(3)->toDateTimeString(),
        'quantity' => 1,
        'base_price' => 1,
    ])->assertOk()->assertJsonPath('quote.base_price', 3000);
});

test('customer booking does not honor custom amount', function (): void {
    $date = now()->addDays(3)->toDateTimeString();
    $quoteId = $this->actingAs($this->customer)->postJson('/services/quote', [
        'service_type' => 'taxi',
        'service_item_id' => $this->item->id,
        'start_datetime' => $date,
        'quantity' => 1,
    ])->assertOk()->json('quote_id');
    $this->post('/services/book', [
        'quote_id' => $quoteId,
        'service_type' => 'taxi',
        'service_item_id' => $this->item->id,
        'customer_name' => 'Booking Customer',
        'customer_phone' => '9888801001',
        'start_datetime' => $date,
        'quantity' => 1,
        'pickup_location' => 'Murudeshwar',
        'payment_method' => 'pay_on_arrival',
        'custom_amount' => 1,
    ])->assertSessionHasErrors('resources');
    expect(ServiceBooking::count())->toBe(0);
    expect((float) \App\Models\ServiceQuoteSnapshot::first()->total_amount)->toBe(3000.0);
});

test('another customer cannot view an unrelated booking confirmation', function (): void {
    $booking = ServiceBooking::create([
        'booking_number' => 'GKW-TX-PRIVATE-01', 'service_type' => 'taxi',
        'service_item_id' => $this->item->id, 'store_id' => $this->branch->id,
        'user_id' => $this->customer->id,
        'customer_name' => 'Booking Customer', 'customer_phone' => '9888801001',
        'start_datetime' => now()->addDays(3), 'total_amount' => 3000,
    ]);
    $this->actingAs($this->otherCustomer)
        ->get('/services/bookings/'.$booking->booking_number.'/confirmation')
        ->assertForbidden();
    $this->actingAs($this->otherCustomer)
        ->get('/services/bookings/'.$booking->booking_number.'/voucher')
        ->assertForbidden();
});


test('same gateway payment reference cannot be credited twice', function (): void {
    $this->item->update(['service_type' => 'boating']);
    $booking = ServiceBooking::create([
        'booking_number' => 'GKW-TX-REPLAY-01',
        'service_type' => 'boating',
        'service_item_id' => $this->item->id,
        'store_id' => $this->branch->id,
        'user_id' => $this->customer->id,
        'customer_name' => 'Booking Customer',
        'customer_phone' => '9888801001',
        'start_datetime' => now()->addDays(3),
        'total_amount' => 3000,
        'advance_paid' => 0,
        'balance_due' => 3000,
        'payment_status' => 'pending',
        'booking_channel' => 'offline_walkin',
        'status' => 'confirmed',
    ]);

    gkwAllocatePaymentFixture($booking);
    $payload = [
        'razorpay_payment_id' => 'pay_replay_fixture_123',
        'amount' => 3000,
    ];

    $url = '/services/bookings/'.$booking->booking_number.'/verify-payment';
    $this->actingAs($this->customer)->postJson($url, $payload)
        ->assertOk()
        ->assertJsonPath('success', true);
    $this->actingAs($this->customer)->postJson($url, $payload)
        ->assertStatus(422)
        ->assertJsonPath('success', false);

    $booking->refresh();
    expect((float) $booking->advance_paid)->toBe(3000.0);
    expect((float) $booking->balance_due)->toBe(0.0);
    $this->assertDatabaseCount('service_payment_receipts', 1);
});
