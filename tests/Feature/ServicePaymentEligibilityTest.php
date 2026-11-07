<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ServicePaymentReceipt;
use App\Models\ServiceQuoteSnapshot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Notification::fake();
    Http::fake(['api.razorpay.com/*' => Http::response(['error' => 'offline test'], 503)]);

    $this->paymentCustomer = User::create([
        'name' => 'Payment Test Customer', 'email' => 'payment51@example.test',
        'phone' => '9000009951', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->paymentItem = ServiceItem::create([
        'service_type' => 'boating', 'name' => 'Approved Test Vessel',
        'price_base' => 1000, 'price_unit' => 'per_trip', 'status' => 'available',
    ]);
});

function payment51Booking($test, string $reference, string $status = 'confirmed', string $channel = 'staff'): ServiceBooking
{
    $booking = ServiceBooking::create([
        'booking_number' => $reference, 'user_id' => $test->paymentCustomer->id,
        'service_type' => 'boating', 'service_item_id' => $test->paymentItem->id,
        'customer_name' => 'Payment Test Customer', 'customer_phone' => '9000009951',
        'start_datetime' => now()->addDays(5), 'quantity' => 1,
        'booking_channel' => $channel, 'status' => $status,
        'total_amount' => 1000, 'advance_paid' => 0, 'balance_due' => 1000,
        'payment_status' => 'pending',
    ]);
    if ($channel === 'online') {
        ServiceQuoteSnapshot::create([
            'public_id' => (string) Str::uuid(),
            'user_id' => $test->paymentCustomer->id,
            'service_item_id' => $test->paymentItem->id,
            'service_type' => 'boating',
            'start_datetime' => $booking->start_datetime,
            'quantity' => 1, 'base_amount' => 1000,
            'discount_amount' => 0, 'total_amount' => 1000,
            'breakdown_json' => ['base_amount' => 1000, 'total_amount' => 1000],
            'expires_at' => now()->addMinutes(10),
            'service_booking_id' => $booking->id,
        ]);
    }
    return $booking;
}

test('unconfirmed and unallocated service bookings cannot initiate or verify any payment', function (): void {
    $this->actingAs($this->paymentCustomer);
    foreach (['held', 'pending_payment', 'cancelled', 'expired', 'completed'] as $status) {
        $booking = payment51Booking($this, 'GKW-P51-'.$status, $status);
        $url = '/services/bookings/'.$booking->booking_number;
        $this->postJson($url.'/initiate-payment', ['amount' => 1000])->assertUnprocessable();
        $this->postJson($url.'/verify-payment', ['razorpay_payment_id' => 'pay_'.$status, 'amount' => 1000])
            ->assertUnprocessable();
    }
    expect(ServicePaymentReceipt::count())->toBe(0);
});

test('initiation rejects arbitrary partial charges, permits only full outstanding approved balance', function (): void {
    $booking = payment51Booking($this, 'GKW-P51-PARTIAL');
    $url = '/services/bookings/'.$booking->booking_number.'/initiate-payment';
    $this->actingAs($this->paymentCustomer)
        ->postJson($url, ['amount' => 250])->assertUnprocessable()
        ->assertJsonPath('success', false);
    $this->postJson($url, ['amount' => 1000])->assertOk()
        ->assertJsonPath('amount', 1000);
});

test('verification rejects client amount below approved balance and accepts once', function (): void {
    $booking = payment51Booking($this, 'GKW-P51-REPLAY');
    $url = '/services/bookings/'.$booking->booking_number.'/verify-payment';
    $this->actingAs($this->paymentCustomer)
        ->postJson($url, ['razorpay_payment_id' => 'pay51_test_verified', 'amount' => 1])
        ->assertUnprocessable();
    $this->postJson($url, ['razorpay_payment_id' => 'pay51_test_verified', 'amount' => 1000])
        ->assertOk()->assertJsonPath('success', true);
    $this->postJson($url, ['razorpay_payment_id' => 'pay51_test_verified', 'amount' => 1000])
        ->assertUnprocessable();
    expect(ServicePaymentReceipt::count())->toBe(1)
        ->and((int) ServicePaymentReceipt::first()->amount_paise)->toBe(100000)
        ->and((float) $booking->fresh()->balance_due)->toBe(0.0);
});

test('one provider payment reference cannot settle another booking even with matching amount', function (): void {
    $first = payment51Booking($this, 'GKW-P51-ONE');
    $second = payment51Booking($this, 'GKW-P51-TWO');
    $this->actingAs($this->paymentCustomer);
    $payload = ['razorpay_payment_id' => 'pay51_global_unique', 'amount' => 1000];
    $this->postJson('/services/bookings/'.$first->booking_number.'/verify-payment', $payload)
        ->assertOk();
    $this->postJson('/services/bookings/'.$second->booking_number.'/verify-payment', $payload)
        ->assertUnprocessable();
    expect(ServicePaymentReceipt::count())->toBe(1)
        ->and((float) $second->fresh()->balance_due)->toBe(1000.0);
});

test('online service bookings with missing or altered accepted quote cannot be charged', function (): void {
    $booking = payment51Booking($this, 'GKW-P51-QUOTE', 'confirmed', 'online');
    $url = '/services/bookings/'.$booking->booking_number.'/initiate-payment';
    $this->actingAs($this->paymentCustomer);
    $this->postJson($url, ['amount' => 1000])->assertOk();
    ServiceQuoteSnapshot::where('service_booking_id', $booking->id)->update(['total_amount' => 1]);
    $this->postJson($url, ['amount' => 1000])->assertUnprocessable();
    $this->postJson('/services/bookings/'.$booking->booking_number.'/verify-payment', [
        'razorpay_payment_id' => 'pay51_unapproved', 'amount' => 1000,
    ])->assertUnprocessable();
    expect(ServicePaymentReceipt::count())->toBe(0);
});

test('customer cannot pay another customers service booking', function (): void {
    $booking = payment51Booking($this, 'GKW-P51-PRIVATE');
    $other = User::create([
        'name' => 'Different Customer', 'email' => 'different51@example.test',
        'phone' => '9000009952', 'password' => 'Password123!',
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $this->actingAs($other)->postJson(
        '/services/bookings/'.$booking->booking_number.'/initiate-payment', ['amount' => 1000]
    )->assertForbidden();
});
