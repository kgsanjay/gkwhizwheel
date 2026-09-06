<?php

declare(strict_types=1);

use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\RefundStatus;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\Store;
use App\Models\User;
use App\Services\RefundService;

beforeEach(function (): void {
    $this->refundService = app(RefundService::class);

    $this->store = Store::create([
        'name' => 'Store Refund Test',
        'address_line' => '100 Hub Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560001',
        'latitude' => 12.9715987,
        'longitude' => 77.5945627,
        'status' => StoreStatus::ACTIVE,
    ]);

    $this->category = BikeCategory::create([
        'name' => 'Cruiser',
        'base_daily_rate' => 1000.00,
        'default_deposit_amount' => 3000.00,
    ]);

    $this->bike = Bike::create([
        'category_id' => $this->category->id,
        'current_store_id' => $this->store->id,
        'home_store_id' => $this->store->id,
        'brand' => 'Royal Enfield',
        'model_name' => 'Classic 350',
        'registration_number' => 'KA-01-RF-1234',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::MANUAL,
        'status' => BikeStatus::AVAILABLE,
    ]);

    $this->customer = User::create([
        'name' => 'Refund Customer',
        'email' => 'refundcustomer@example.com',
        'phone' => '9888877777',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->staff = User::create([
        'name' => 'Staff Officer',
        'email' => 'staffofficer@example.com',
        'phone' => '9888866666',
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    // Booking: Start on 2026-10-10 (00:00:00), 2 days @ 1000 = 2000 rental + 3000 deposit = 5000 total
    $this->booking = Booking::create([
        'booking_reference' => 'BK-REFUND-001',
        'bike_id' => $this->bike->id,
        'user_id' => $this->customer->id,
        'pickup_store_id' => $this->store->id,
        'return_store_id' => $this->store->id,
        'channel' => BookingChannel::ONLINE,
        'status' => BookingStatus::CONFIRMED,
        'start_date' => '2026-10-10',
        'end_date' => '2026-10-11',
        'base_amount' => 2000.00,
        'deposit_amount' => 3000.00,
        'total_amount' => 5000.00,
        'price_breakdown_json' => ['base' => 2000, 'deposit' => 3000],
        'idempotency_key' => 'refund-booking-001',
    ]);

    $this->payment = Payment::create([
        'booking_id' => $this->booking->id,
        'type' => PaymentType::ADVANCE,
        'amount' => 5000.00,
        'method' => PaymentMethod::RAZORPAY,
        'gateway_reference' => 'pay_rzp_orig_001',
        'status' => PaymentStatus::SUCCESS,
        'collected_by' => $this->staff->id,
    ]);
});

test('cancellation more than 24 hours before pickup grants 100 percent refund and creates refund record', function (): void {
    // Cancellation 48 hours prior (2026-10-08 00:00:00 vs pickup 2026-10-10 00:00:00)
    $cancellationTime = '2026-10-08 00:00:00';

    $calculation = $this->refundService->calculateRefundAmount($this->booking, $cancellationTime);

    expect($calculation['is_full_refund'])->toBeTrue()
        ->and($calculation['refund_percentage'])->toBe(100.0)
        ->and($calculation['rental_refund_amount'])->toBe(2000.00)
        ->and($calculation['deposit_refund_amount'])->toBe(3000.00)
        ->and($calculation['refund_amount'])->toBe(5000.00);

    // Process and record in database
    $refund = $this->refundService->processCancellationRefund(
        booking: $this->booking,
        reason: 'Customer requested cancellation 2 days prior',
        processedBy: $this->staff->id,
        paymentId: $this->payment->id,
        cancellationTime: $cancellationTime
    );

    expect($refund)->toBeInstanceOf(Refund::class)
        ->and($refund->booking_id)->toBe($this->booking->id)
        ->and($refund->payment_id)->toBe($this->payment->id)
        ->and((float) $refund->amount)->toBe(5000.00)
        ->and($refund->status)->toBe(RefundStatus::COMPLETED)
        ->and($refund->processed_by)->toBe($this->staff->id)
        ->and($refund->gateway_reference)->toStartWith('stub_rfnd_')
        ->and(Refund::where('booking_id', $this->booking->id)->count())->toBe(1);
});

test('cancellation within 24 hours before pickup grants partial refund of rental and full deposit', function (): void {
    // Cancellation 12 hours prior (2026-10-09 12:00:00 vs pickup 2026-10-10 00:00:00)
    $cancellationTime = '2026-10-09 12:00:00';

    $calculation = $this->refundService->calculateRefundAmount($this->booking, $cancellationTime);

    // Default partial percentage is 50% of 2000 rental = 1000 + 3000 deposit = 4000 total
    expect($calculation['is_full_refund'])->toBeFalse()
        ->and($calculation['refund_percentage'])->toBe(50.0)
        ->and($calculation['rental_refund_amount'])->toBe(1000.00)
        ->and($calculation['deposit_refund_amount'])->toBe(3000.00)
        ->and($calculation['refund_amount'])->toBe(4000.00);

    $refund = $this->refundService->processCancellationRefund(
        booking: $this->booking,
        reason: 'Cancellation under 24h',
        cancellationTime: $cancellationTime
    );

    expect((float) $refund->amount)->toBe(4000.00)
        ->and($refund->payment_id)->toBe($this->payment->id);
});

test('cancellation threshold and partial percentage are configurable', function (): void {
    $cancellationTime = '2026-10-08 12:00:00'; // 36 hours before pickup

    // With a custom threshold of 48h, 36h is now considered partial!
    // And with custom percentage 75%: 75% of 2000 = 1500 + 3000 deposit = 4500
    $calculation = $this->refundService->calculateRefundAmount(
        booking: $this->booking,
        cancellationTime: $cancellationTime,
        fullRefundHours: 48,
        partialRefundPercentage: 75.0
    );

    expect($calculation['is_full_refund'])->toBeFalse()
        ->and($calculation['refund_percentage'])->toBe(75.0)
        ->and($calculation['rental_refund_amount'])->toBe(1500.00)
        ->and($calculation['deposit_refund_amount'])->toBe(3000.00)
        ->and($calculation['refund_amount'])->toBe(4500.00);
});

test('cancellation after pickup start date gives zero rental refund and returns security deposit', function (): void {
    $cancellationTime = '2026-10-10 04:00:00'; // 4 hours after pickup day began

    $calculation = $this->refundService->calculateRefundAmount($this->booking, $cancellationTime);

    expect($calculation['is_full_refund'])->toBeFalse()
        ->and($calculation['refund_percentage'])->toBe(0.0)
        ->and($calculation['rental_refund_amount'])->toBe(0.00)
        ->and($calculation['deposit_refund_amount'])->toBe(3000.00)
        ->and($calculation['refund_amount'])->toBe(3000.00);
});

test('deposit refund at return calculates correctly with damage and late fee deductions', function (): void {
    // Deposit is 3000. Damage: 400, Late fee: 300 -> Refund: 2300
    $refund = $this->refundService->createDepositRefund(
        booking: $this->booking,
        damageDeductions: 400.00,
        lateFeeDeductions: 300.00,
        reason: 'Deposit refund after scratch penalty',
        processedBy: $this->staff->id
    );

    expect((float) $refund->amount)->toBe(2300.00)
        ->and($refund->reason)->toBe('Deposit refund after scratch penalty')
        ->and($refund->status)->toBe(RefundStatus::COMPLETED)
        ->and($refund->gateway_reference)->toStartWith('stub_rfnd_');
});
