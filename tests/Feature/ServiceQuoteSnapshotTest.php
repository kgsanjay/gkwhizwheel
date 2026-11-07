<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServiceQuoteSnapshot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Notification::fake();
    $this->customer = User::create([
        'name' => 'Quotation Customer',
        'email' => 'quote-customer@example.test',
        'phone' => '9000009742',
        'password' => 'Password123!',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $this->item = ServiceItem::create([
        'service_type' => 'taxi',
        'name' => 'Approved Taxi Test Tariff',
        'price_base' => 800,
        'price_unit' => 'per_trip',
        'capacity' => '4',
        'status' => 'available',
    ]);
});

function serviceQuoteRequest($test): array
{
    return [
        'service_type' => 'taxi',
        'service_item_id' => $test->item->id,
        'start_datetime' => now()->addDays(8)->startOfHour()->toDateTimeString(),
        'quantity' => 2,
    ];
}

function serviceQuoteBooking($test, string $quoteId): array
{
    return [
        ...serviceQuoteRequest($test),
        'quote_id' => $quoteId,
        'customer_name' => 'Quotation Customer',
        'customer_phone' => '9000009742',
        'customer_email' => 'quote-customer@example.test',
        'pickup_location' => 'Honnavar Railway Station',
        'payment_method' => 'pay_on_arrival',
        'total_amount' => 1, // Attempted browser underpayment must be ignored.
        'base_amount' => 1,
        'discount_amount' => 10000,
        'advance_paid' => 123,
        'status' => 'cancelled',
    ];
}

test('server quote uses approved tariff, ignores browser amounts and persists snapshot', function (): void {
    $this->actingAs($this->customer);
    $response = $this->postJson('/services/quote', [
        ...serviceQuoteRequest($this),
        'total_amount' => 1,
        'customBasePrice' => 0.01,
    ])->assertOk()->assertJsonPath('success', true);

    expect($response->json('quote.total_amount'))->toBe(1600)
        ->and(ServiceQuoteSnapshot::count())->toBe(1)
        ->and(ServiceQuoteSnapshot::first()->user_id)->toBe($this->customer->id);
});

test('only authenticated customers can issue a quote and unpriced offers are rejected', function (): void {
    $this->postJson('/services/quote', serviceQuoteRequest($this))->assertUnauthorized();
    $this->actingAs($this->customer);
    $this->item->update(['price_base' => 0]);
    $this->postJson('/services/quote', serviceQuoteRequest($this))->assertUnprocessable();
    expect(ServiceQuoteSnapshot::count())->toBe(0);
});

test('accepted server quote drives actual booked total, despite client tampering', function (): void {
    $this->actingAs($this->customer);
    $quote = $this->postJson('/services/quote', serviceQuoteRequest($this))->assertOk()->json();
    $this->post('/services/book', serviceQuoteBooking($this, $quote['quote_id']))
        ->assertRedirect();
    expect(ServiceBooking::count())->toBe(1)
        ->and((float) ServiceBooking::first()->total_amount)->toBe(1600.0)
        ->and((float) ServiceBooking::first()->advance_paid)->toBe(0.0)
        ->and(ServiceQuoteSnapshot::first()->service_booking_id)->toBe(ServiceBooking::first()->id);
});

test('quote cannot be re-used and a booking without quote id is rejected', function (): void {
    $this->actingAs($this->customer);
    $this->post('/services/book', array_diff_key(
        serviceQuoteBooking($this, '00000000-0000-0000-0000-000000000000'), ['quote_id' => true]
    ))->assertSessionHasErrors('quote_id');

    $quote = $this->postJson('/services/quote', serviceQuoteRequest($this))->json();
    $this->post('/services/book', serviceQuoteBooking($this, $quote['quote_id']))->assertRedirect();
    $this->post('/services/book', serviceQuoteBooking($this, $quote['quote_id']))->assertSessionHasErrors('quote_id');
    expect(ServiceBooking::count())->toBe(1);
});

test('quotes belong to one customer and expire after their validity window', function (): void {
    $this->actingAs($this->customer);
    $quote = $this->postJson('/services/quote', serviceQuoteRequest($this))->json();
    $other = User::create([
        'name' => 'Second Rider', 'email' => 'second-quote@example.test',
        'phone' => '9000009743', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->actingAs($other)->post('/services/book', serviceQuoteBooking($this, $quote['quote_id']))
        ->assertSessionHasErrors('quote_id');

    ServiceQuoteSnapshot::first()->update(['expires_at' => now()->subSecond()]);
    $this->actingAs($this->customer)->post('/services/book', serviceQuoteBooking($this, $quote['quote_id']))
        ->assertSessionHasErrors('quote_id');
    expect(ServiceBooking::count())->toBe(0);
});

test('changed service or date is not bookable against an old snapshot', function (): void {
    $this->actingAs($this->customer);
    $quote = $this->postJson('/services/quote', serviceQuoteRequest($this))->json();
    $payload = serviceQuoteBooking($this, $quote['quote_id']);
    $payload['start_datetime'] = now()->addDays(9)->startOfHour()->toDateTimeString();
    $this->post('/services/book', $payload)->assertSessionHasErrors('quote_id');
    expect(ServiceBooking::count())->toBe(0);
});
