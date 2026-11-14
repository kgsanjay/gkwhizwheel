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
use App\Models\BikeModel;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->honnavar = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334', 'latitude' => 14.28,
        'longitude' => 74.44, 'status' => StoreStatus::ACTIVE,
    ]);
    $this->murudeshwar = Store::create([
        'name' => 'Murudeshwar', 'address_line' => 'Bus Stand', 'city' => 'Murudeshwar',
        'state' => 'Karnataka', 'pincode' => '581350', 'latitude' => 14.09,
        'longitude' => 74.49, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooter', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $this->model = BikeModel::create([
        'category_id' => $category->id,
        'brand' => 'Honda', 'name' => 'Activa 6G',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
    ]);
    $this->otherModel = BikeModel::create([
        'category_id' => $category->id,
        'brand' => 'TVS', 'name' => 'Jupiter',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
    ]);
    $this->customer = User::create([
        'name' => 'Rider', 'email' => 'allocation.rider@example.test',
        'phone' => '9000009501', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->otherCustomer = User::create([
        'name' => 'Another rider', 'email' => 'allocation.other@example.test',
        'phone' => '9000009502', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->start = now()->addDays(8)->toDateString();
    $this->end = now()->addDays(9)->toDateString();
});

function allocationBike($test, Store $store, string $registration, ?BikeModel $model = null, BikeStatus $status = BikeStatus::AVAILABLE): Bike
{
    $model ??= $test->model;

    $bike = Bike::create([
        'bike_model_id' => $model->id, 'category_id' => $model->category_id,
        'brand' => $model->brand, 'model_name' => $model->name,
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'registration_number' => $registration,
        'home_store_id' => $store->id, 'current_store_id' => $store->id,
        'status' => $status,
    ]);
    \Tests\Support\VerifiedBikeDocuments::attach($bike);
    return $bike;
}

function allocationPayload($test, ?BikeModel $model = null, ?Store $pickup = null, ?Store $return = null, string $key = 'model-hold-01'): array
{
    return [
        'bike_model_id' => ($model ?? $test->model)->id,
        'pickup_store_id' => ($pickup ?? $test->honnavar)->id,
        'return_store_id' => ($return ?? $test->honnavar)->id,
        'start_date' => $test->start,
        'end_date' => $test->end,
        'idempotency_key' => $key,
    ];
}

function allocationPriorBooking($test, Bike $bike, Store $pickup, Store $return): Booking
{
    return Booking::create([
        'booking_reference' => 'BK-ALLOC-'.strtoupper(\Illuminate\Support\Str::random(8)),
        'user_id' => $test->customer->id, 'bike_id' => $bike->id,
        'pickup_store_id' => $pickup->id, 'return_store_id' => $return->id,
        'start_date' => now()->addDays(3)->toDateString(),
        'end_date' => now()->addDays(4)->toDateString(),
        'channel' => BookingChannel::ONLINE, 'status' => BookingStatus::CONFIRMED,
        'base_amount' => 1000, 'total_amount' => 1000, 'deposit_amount' => 0,
        'price_breakdown_json' => [], 'idempotency_key' => (string) \Illuminate\Support\Str::uuid(),
    ]);
}

test('model hold assigns a physical Activa and retains its requested model', function (): void {
    $bike = allocationBike($this, $this->honnavar, 'KA-47-ALLOC-01');
    Sanctum::actingAs($this->customer);

    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this))
        ->assertCreated()
        ->assertJsonPath('data.bike_id', $bike->id)
        ->assertJsonPath('data.bike_model_id', $this->model->id)
        ->assertJsonPath('data.status', 'held');

    $booking = Booking::sole();
    expect($booking->bike_id)->toBe($bike->id)
        ->and($booking->bike_model_id)->toBe($this->model->id)
        ->and($booking->held_until->isFuture())->toBeTrue();
});

test('retries return the same physical bike, without a second booking', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-02');
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-03');
    Sanctum::actingAs($this->customer);
    $first = $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this))
        ->assertCreated()->json('data.id');
    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this))
        ->assertOk()->assertJsonPath('data.id', $first);
    expect(Booking::count())->toBe(1);
});

test('same model idempotency key cannot be replayed by a different customer or route', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-04');
    Sanctum::actingAs($this->customer);
    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this))->assertCreated();

    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, return: $this->murudeshwar))
        ->assertUnprocessable();
    Sanctum::actingAs($this->otherCustomer);
    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this))
        ->assertUnprocessable();
    expect(Booking::count())->toBe(1);
});

test('an existing bike-specific hold cannot be reused as a model hold', function (): void {
    $bike = allocationBike($this, $this->honnavar, 'KA-47-ALLOC-05');
    Sanctum::actingAs($this->customer);
    $this->postJson('/api/v1/bookings/hold', [
        'bike_id' => $bike->id,
        'pickup_store_id' => $this->honnavar->id, 'return_store_id' => $this->honnavar->id,
        'start_date' => $this->start, 'end_date' => $this->end,
        'idempotency_key' => 'shared-mode-key',
    ])->assertCreated();

    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'shared-mode-key'))
        ->assertUnprocessable();
    expect(Booking::count())->toBe(1);
});

test('model allocation assigns different physical bikes to overlapping customers and eventually sells out', function (): void {
    $one = allocationBike($this, $this->honnavar, 'KA-47-ALLOC-06');
    $two = allocationBike($this, $this->honnavar, 'KA-47-ALLOC-07');
    Sanctum::actingAs($this->customer);
    $first = $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'one'))
        ->assertCreated()->json('data.bike_id');
    Sanctum::actingAs($this->otherCustomer);
    $second = $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'two'))
        ->assertCreated()->json('data.bike_id');
    expect($first)->not->toBe($second)
        ->and([$first, $second])->toContain($one->id, $two->id);

    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'three'))
        ->assertUnprocessable();
    expect(Booking::count())->toBe(2);
});

test('future return to another branch enables only destination pickup', function (): void {
    $bike = allocationBike($this, $this->murudeshwar, 'KA-47-ALLOC-08');
    allocationPriorBooking($this, $bike, $this->murudeshwar, $this->honnavar);
    Sanctum::actingAs($this->customer);

    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, pickup: $this->murudeshwar))
        ->assertUnprocessable();
    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this))
        ->assertCreated()->assertJsonPath('data.bike_id', $bike->id);
});

test('allocation rejects inactive model, maintenance bikes and empty inventory', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-09', status: BikeStatus::MAINTENANCE);
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-10', model: $this->otherModel);
    Sanctum::actingAs($this->customer);
    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this))
        ->assertUnprocessable();
    $this->model->update(['is_active' => false]);
    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'inactive'))
        ->assertUnprocessable();
});

test('model hold requires authentication and a valid future date range', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-11');
    $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this))->assertUnauthorized();
    Sanctum::actingAs($this->customer);
    $invalid = allocationPayload($this);
    $invalid['end_date'] = now()->addDays(2)->toDateString();
    $this->postJson('/api/v1/bookings/model-hold', $invalid)->assertUnprocessable();
});

test('expired held reservation cannot start payment before the expiry worker runs', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-EXP-01');
    Sanctum::actingAs($this->customer);

    $bookingId = $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'exp-hold-01'))
        ->assertCreated()->json('data.id');
    Booking::findOrFail($bookingId)->update(['held_until' => now()->subSeconds(5)]);

    $this->postJson('/api/v1/bookings/'.$bookingId.'/checkout', [
        'gateway' => 'phonepe',
    ])->assertUnprocessable()
        ->assertJsonPath('success', false);

    expect(Booking::findOrFail($bookingId)->status)->toBe(BookingStatus::HELD);
});

test('expired pending-payment booking cannot create another gateway order', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-EXP-02');
    Sanctum::actingAs($this->customer);

    $bookingId = $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'exp-hold-02'))
        ->assertCreated()->json('data.id');
    Booking::findOrFail($bookingId)->update([
        'status' => BookingStatus::PENDING_PAYMENT,
        'held_until' => now()->subSeconds(5),
    ]);

    $this->postJson('/api/v1/bookings/'.$bookingId.'/checkout', [
        'gateway' => 'phonepe',
    ])->assertUnprocessable()
        ->assertJsonPath('success', false);

    expect(Booking::findOrFail($bookingId)->status)->toBe(BookingStatus::PENDING_PAYMENT);
});

test('booking service itself rejects transition of an expired hold', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-ALLOC-EXP-03');
    Sanctum::actingAs($this->customer);

    $bookingId = $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'exp-hold-03'))
        ->assertCreated()->json('data.id');
    $booking = Booking::findOrFail($bookingId);
    $booking->update(['held_until' => now()->subSeconds(5)]);

    expect(fn () => app(\App\Services\BookingService::class)->markPendingPayment($booking->fresh()))
        ->toThrow(\Illuminate\Validation\ValidationException::class);
    expect($booking->fresh()->status)->toBe(BookingStatus::HELD);
});

test('new web rental hold waives category deposit and retains rental total', function (): void {
    $this->model->category->update(['default_deposit_amount' => 500]);
    allocationBike($this, $this->honnavar, 'KA-47-NODEP-01');
    Sanctum::actingAs($this->customer);
    $response = $this->postJson('/api/v1/bookings/model-hold', allocationPayload($this, key: 'deposit-free-01'))
        ->assertCreated()
        ->assertJsonPath('data.deposit_amount', 0);

    $booking = Booking::findOrFail($response->json('data.id'));
    expect((float) $booking->deposit_amount)->toBe(0.0)
        ->and((float) $booking->total_amount)->toBeGreaterThan(0)
        ->and($booking->price_breakdown_json['deposit_waived'])->toBeTrue();
});

test('₹100 advance checkout charges only ₹100 and stores outstanding balance', function (): void {
    $this->model->category->update(['default_deposit_amount' => 500]);
    allocationBike($this, $this->honnavar, 'KA-47-NODEP-02');
    Sanctum::actingAs($this->customer);

    $bookingId = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'payment-advance-01'))->assertCreated()->json('data.id');
    $booking = Booking::findOrFail($bookingId);
    $this->postJson('/api/v1/bookings/'.$bookingId.'/checkout', [
        'gateway' => 'phonepe',
        'payment_option' => 'advance',
    ])->assertOk()->assertJsonPath('data.amount', 100)
        ->assertJsonPath('data.amount_paise', 10000)
        ->assertJsonPath('data.payment_option', 'advance')
        ->assertJsonPath('data.balance_due_on_pickup', (int) round((float) $booking->total_amount - 100, 2));

    $updated = $booking->fresh();
    expect($updated->price_breakdown_json['checkout_amount'])->toBe(100)
        ->and($updated->price_breakdown_json['checkout_payment_option'])->toBe('advance')
        ->and((float) $updated->deposit_amount)->toBe(0.0);

    $this->postJson('/api/v1/bookings/'.$bookingId.'/checkout', [
        'gateway' => 'phonepe', 'payment_option' => 'full',
    ])->assertUnprocessable();
});

test('full web checkout charges rental total and no security deposit', function (): void {
    $this->model->category->update(['default_deposit_amount' => 500]);
    allocationBike($this, $this->honnavar, 'KA-47-NODEP-03');
    Sanctum::actingAs($this->customer);

    $bookingId = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'payment-full-01'))->assertCreated()->json('data.id');
    $booking = Booking::findOrFail($bookingId);
    $this->postJson('/api/v1/bookings/'.$bookingId.'/checkout', [
        'gateway' => 'phonepe',
        'payment_option' => 'full',
    ])->assertOk()
        ->assertJsonPath('data.amount', (int) $booking->total_amount)
        ->assertJsonPath('data.balance_due_on_pickup', 0)
        ->assertJsonPath('data.payment_option', 'full');
});

test('PhonePe advance payment request uses the selected checkout amount', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-NODEP-04');
    Sanctum::actingAs($this->customer);

    $bookingId = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'payment-phonepe-01'))->assertCreated()->json('data.id');
    $this->postJson('/api/v1/bookings/'.$bookingId.'/checkout', [
        'gateway' => 'phonepe', 'payment_option' => 'advance',
    ])->assertOk()
        ->assertJsonPath('data.amount', 100)
        ->assertJsonPath('data.amount_paise', 10000)
        ->assertJsonPath('data.payment_option', 'advance');
});

test('advance-only checkout cannot be used for older bookings with a deposit', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-NODEP-05');
    Sanctum::actingAs($this->customer);
    $bookingId = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'payment-legacy-01'))->assertCreated()->json('data.id');
    Booking::findOrFail($bookingId)->update(['deposit_amount' => 500]);

    $this->postJson('/api/v1/bookings/'.$bookingId.'/checkout', [
        'gateway' => 'phonepe', 'payment_option' => 'advance',
    ])->assertUnprocessable();

    expect(Booking::findOrFail($bookingId)->status)->toBe(BookingStatus::HELD);
});

test('advance booking cannot be handed over before the pickup balance is collected', function (): void {
    $bike = allocationBike($this, $this->honnavar, 'KA-47-NODEP-HANDOVER');
    Sanctum::actingAs($this->customer);
    $id = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'pickup-balance-test'))->assertCreated()->json('data.id');
    $booking = Booking::findOrFail($id);
    $this->postJson('/api/v1/bookings/'.$id.'/checkout', [
        'gateway' => 'phonepe', 'payment_option' => 'advance',
    ])->assertOk();
    $booking->refresh()->update(['status' => BookingStatus::CONFIRMED]);

    \App\Models\Payment::create([
        'booking_id' => $id, 'type' => \App\Enums\PaymentType::ADVANCE,
        'amount' => 100, 'method' => \App\Enums\PaymentMethod::PHONEPE,
        'status' => \App\Enums\PaymentStatus::SUCCESS,
        'gateway_reference' => 'pay_advance_handover_test',
    ]);

    expect(fn () => app(\App\Services\BookingService::class)->markHandedOver(
        $booking->fresh(), 0
    ))->toThrow(\Illuminate\Validation\ValidationException::class);

    expect($booking->fresh()->status)->toBe(BookingStatus::CONFIRMED)
        ->and($bike->fresh()->status)->toBe(BikeStatus::AVAILABLE);

    \App\Models\Payment::create([
        'booking_id' => $id, 'type' => \App\Enums\PaymentType::ADVANCE,
        'amount' => (float) $booking->total_amount - 100,
        'method' => \App\Enums\PaymentMethod::CASH,
        'status' => \App\Enums\PaymentStatus::SUCCESS,
        'gateway_reference' => 'cash_remaining_handover_test',
    ]);

    $handedOver = app(\App\Services\BookingService::class)->markHandedOver(
        $booking->fresh(), 0
    );
    expect($handedOver->status)->toBe(BookingStatus::HANDED_OVER);
});


test('expired model booking holds reject checkout without creating a gateway order', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-EXP-01');
    Sanctum::actingAs($this->customer);
    $id = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'expired-checkout-01'))->assertCreated()->json('data.id');

    $booking = Booking::findOrFail($id);
    $booking->update(['held_until' => now()->subMinute()]);

    foreach (['phonepe'] as $gateway) {
        $this->postJson("/api/v1/bookings/{$id}/checkout", [
            'gateway' => $gateway,
            'payment_option' => 'advance',
        ])->assertUnprocessable()->assertJsonPath('errors.booking.0', 'Reservation hold expired.');
    }

    $fresh = $booking->fresh();
    expect($fresh->status)->toBe(BookingStatus::HELD)
        ->and($fresh->price_breakdown_json['checkout_gateway'] ?? null)->toBeNull();
});

test('payment retries cannot switch checkout gateway or amount', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-RETRY-01');
    Sanctum::actingAs($this->customer);
    $id = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'gateway-lock-01'))->assertCreated()->json('data.id');

    $this->postJson("/api/v1/bookings/{$id}/checkout", [
        'gateway' => 'phonepe', 'payment_option' => 'advance',
    ])->assertOk()->assertJsonPath('data.amount', 100);

    $this->postJson("/api/v1/bookings/{$id}/checkout", [
        'gateway' => 'phonepe', 'payment_option' => 'full',
    ])->assertUnprocessable()->assertJsonValidationErrors(['payment_option']);

    $fresh = Booking::findOrFail($id);
    expect($fresh->status)->toBe(BookingStatus::PENDING_PAYMENT)
        ->and($fresh->price_breakdown_json['checkout_gateway'])->toBe('phonepe')
        ->and($fresh->price_breakdown_json['checkout_payment_option'])->toBe('advance')
        ->and((float) $fresh->price_breakdown_json['checkout_amount'])->toBe(100.0);
});

test('other customers cannot start payment for an owned model hold', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-OWNER-01');
    Sanctum::actingAs($this->customer);
    $id = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'foreign-checkout-01'))->assertCreated()->json('data.id');

    Sanctum::actingAs($this->otherCustomer);
    $this->postJson("/api/v1/bookings/{$id}/checkout", [
        'gateway' => 'phonepe', 'payment_option' => 'full',
    ])->assertNotFound();

    expect(Booking::findOrFail($id)->status)->toBe(BookingStatus::HELD);
});


test('gateway initiation errors roll back pending status and checkout selections', function (): void {
    allocationBike($this, $this->honnavar, 'KA-47-ROLLBACK-01');
    Sanctum::actingAs($this->customer);
    $id = $this->postJson('/api/v1/bookings/model-hold',
        allocationPayload($this, key: 'gateway-error-rollback-01'))->assertCreated()->json('data.id');

    $gateway = \Mockery::mock(\App\Services\PhonePeService::class);
    $gateway->shouldReceive('createPayment')->once()
        ->andThrow(new \RuntimeException('Gateway unreachable'));
    app()->instance(\App\Services\PhonePeService::class, $gateway);

    $this->postJson("/api/v1/bookings/{$id}/checkout", [
        'gateway' => 'phonepe',
        'payment_option' => 'advance',
    ])->assertInternalServerError();

    $booking = Booking::findOrFail($id);
    expect($booking->status)->toBe(BookingStatus::HELD)
        ->and($booking->price_breakdown_json['checkout_gateway'] ?? null)->toBeNull()
        ->and($booking->price_breakdown_json['phonepe_transaction_id'] ?? null)->toBeNull();
});
