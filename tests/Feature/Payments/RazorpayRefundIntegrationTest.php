<?php

declare(strict_types=1);

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Store;
use App\Models\User;
use App\Services\RefundService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

test('cancellation refund successfully processes via razorpay api', function (): void {
    Http::fake([
        'api.razorpay.com/v1/payments/*/refund' => Http::response([
            'id' => 'rfnd_1234567890',
            'entity' => 'refund',
            'amount' => 50000,
            'status' => 'processed',
        ], 200),
    ]);

    $user = User::factory()->create();
    
    $store = Store::create([
        'name' => 'Test Store 1',
        'address_line' => 'Line 1',
        'city' => 'City',
        'state' => 'State',
        'pincode' => '111111',
        'latitude' => '12.9716',
        'longitude' => '77.5946',
        'status' => 'active',
    ]);

    $category = BikeCategory::create([
        'name' => 'Test Category',
        'base_daily_rate' => 500,
        'default_deposit_amount' => 1000,
    ]);

    $bike = Bike::create([
        'category_id' => $category->id,
        'current_store_id' => $store->id,
        'home_store_id' => $store->id,
        'brand' => 'Honda',
        'model_name' => 'Activa',
        'registration_number' => 'KA01AB1234',
        'fuel_type' => 'petrol',
        'transmission' => 'automatic',
        'status' => 'available',
    ]);

    $booking = Booking::create([
        'booking_reference' => 'BK-RAZOR',
        'bike_id' => $bike->id,
        'user_id' => $user->id,
        'pickup_store_id' => $store->id,
        'return_store_id' => $store->id,
        'channel' => 'offline',
        'status' => 'confirmed',
        'start_date' => now()->addDays(2)->format('Y-m-d'),
        'end_date' => now()->addDays(4)->format('Y-m-d'),
        'base_amount' => 1000.00,
        'deposit_amount' => 500.00,
        'total_amount' => 1000.00,
        'idempotency_key' => 'idem-razor',
        'price_breakdown_json' => [],
    ]);

    $payment = Payment::create([
        'booking_id' => $booking->id,
        'method' => PaymentMethod::RAZORPAY,
        'status' => PaymentStatus::SUCCESS,
        'gateway_reference' => 'pay_1234567890',
        'amount' => 1000.00,
        'type' => 'advance',
    ]);

    /** @var RefundService $refundService */
    $refundService = app(RefundService::class);

    $refund = $refundService->processCancellationRefund(
        booking: $booking,
        reason: 'Customer requested cancellation',
        processedBy: $user->id,
        paymentId: $payment->id
    );

    expect($refund->status)->toBe(RefundStatus::COMPLETED)
        ->and($refund->gateway_reference)->toBe('rfnd_1234567890')
        ->and($refund->amount)->toEqual(1000.00);
});
