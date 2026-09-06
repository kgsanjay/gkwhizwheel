<?php

declare(strict_types=1);

use App\Enums\AddonType;
use App\Enums\BikeConditionStage;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\KycDocumentType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\RefundStatus;
use App\Enums\Transmission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('bookings table has exact columns and composite availability index', function () {
    expect(Schema::hasTable('bookings'))->toBeTrue();

    $columns = [
        'id',
        'booking_reference',
        'bike_id',
        'user_id',
        'pickup_store_id',
        'return_store_id',
        'channel',
        'status',
        'start_date',
        'end_date',
        'base_amount',
        'pricing_adjustments_amount',
        'one_way_fee_amount',
        'addon_amount',
        'discount_amount',
        'deposit_amount',
        'late_fee_amount',
        'damage_fee_amount',
        'total_amount',
        'price_breakdown_json',
        'held_until',
        'created_by',
        'completed_by',
        'agreement_signed_at',
        'agreement_signature_path',
        'idempotency_key',
        'created_at',
        'updated_at',
    ];

    foreach ($columns as $column) {
        expect(Schema::hasColumn('bookings', $column))->toBeTrue("Missing bookings.{$column}");
    }

    $indexes = Schema::getIndexes('bookings');
    $availabilityIdx = collect($indexes)->first(fn ($idx) => $idx['name'] === 'bookings_availability_idx');

    expect($availabilityIdx)->not->toBeNull()
        ->and($availabilityIdx['columns'])->toBe(['bike_id', 'start_date', 'end_date', 'status']);
});

test('operational tables have exact columns per schema', function () {
    expect(Schema::hasTable('booking_addons'))->toBeTrue()
        ->and(Schema::hasTable('payments'))->toBeTrue()
        ->and(Schema::hasTable('refunds'))->toBeTrue()
        ->and(Schema::hasTable('kyc_documents'))->toBeTrue()
        ->and(Schema::hasTable('bike_condition_logs'))->toBeTrue()
        ->and(Schema::hasTable('bike_condition_photos'))->toBeTrue()
        ->and(Schema::hasTable('reviews'))->toBeTrue();

    // Check tables without updated_at
    expect(Schema::hasColumn('booking_addons', 'updated_at'))->toBeFalse()
        ->and(Schema::hasColumn('bike_condition_logs', 'updated_at'))->toBeFalse()
        ->and(Schema::hasColumn('bike_condition_photos', 'updated_at'))->toBeFalse();

    // Check reviews unique booking_id
    $reviewIndexes = Schema::getIndexes('reviews');
    $uniqueBooking = collect($reviewIndexes)->filter(fn ($idx) => $idx['unique'])
        ->contains(fn ($idx) => in_array('booking_id', $idx['columns'], true));

    expect($uniqueBooking)->toBeTrue();
});

test('can insert full booking flow with addons, payments, refunds, logs, and reviews', function () {
    $customer = User::factory()->create();
    $staff = User::factory()->create();

    $storeId = DB::table('stores')->insertGetId([
        'name' => 'Whitefield Station',
        'address_line' => 'ITPL Main Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560066',
        'latitude' => 12.9850000,
        'longitude' => 77.7300000,
        'phone' => '+918099887766',
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $categoryId = DB::table('bike_categories')->insertGetId([
        'name' => 'Commuter Scooter',
        'base_daily_rate' => 450.00,
        'default_deposit_amount' => 1000.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $bikeId = DB::table('bikes')->insertGetId([
        'category_id' => $categoryId,
        'current_store_id' => $storeId,
        'home_store_id' => $storeId,
        'brand' => 'Honda',
        'model_name' => 'Activa 6G',
        'registration_number' => 'KA04AB5678',
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::AUTOMATIC->value,
        'odometer_reading' => 12000,
        'status' => BikeStatus::AVAILABLE->value,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Booking
    $bookingId = DB::table('bookings')->insertGetId([
        'booking_reference' => 'BK-2026-00001',
        'bike_id' => $bikeId,
        'user_id' => $customer->id,
        'pickup_store_id' => $storeId,
        'return_store_id' => $storeId,
        'channel' => BookingChannel::ONLINE->value,
        'status' => BookingStatus::CONFIRMED->value,
        'start_date' => '2026-09-10',
        'end_date' => '2026-09-12',
        'base_amount' => 900.00,
        'pricing_adjustments_amount' => 0.00,
        'one_way_fee_amount' => 0.00,
        'addon_amount' => 100.00,
        'discount_amount' => 0.00,
        'deposit_amount' => 1000.00,
        'late_fee_amount' => 0.00,
        'damage_fee_amount' => 0.00,
        'total_amount' => 2000.00,
        'price_breakdown_json' => json_encode(['days' => 2, 'rate' => 450]),
        'idempotency_key' => 'idemp-uuid-test-001',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Booking Addon
    DB::table('booking_addons')->insert([
        'booking_id' => $bookingId,
        'addon_type' => AddonType::HELMET->value,
        'quantity' => 2,
        'unit_price' => 50.00,
        'created_at' => now(),
    ]);

    // Payment
    $paymentId = DB::table('payments')->insertGetId([
        'booking_id' => $bookingId,
        'type' => PaymentType::ADVANCE->value,
        'amount' => 2000.00,
        'method' => PaymentMethod::RAZORPAY->value,
        'gateway_reference' => 'pay_rzp_123456',
        'status' => PaymentStatus::SUCCESS->value,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Refund
    DB::table('refunds')->insert([
        'booking_id' => $bookingId,
        'payment_id' => $paymentId,
        'amount' => 1000.00,
        'reason' => 'Deposit returned after successful bike return',
        'processed_by' => $staff->id,
        'status' => RefundStatus::COMPLETED->value,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // KYC Document
    DB::table('kyc_documents')->insert([
        'user_id' => $customer->id,
        'document_type' => KycDocumentType::DRIVING_LICENSE->value,
        'file_path' => 'kyc/dl_customer_1.pdf',
        'verified' => true,
        'verified_by' => $staff->id,
        'verified_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // Bike Condition Log & Photo
    $conditionLogId = DB::table('bike_condition_logs')->insertGetId([
        'booking_id' => $bookingId,
        'stage' => BikeConditionStage::HANDOVER->value,
        'odometer_reading' => 12000,
        'notes' => 'Minor scratch on left mirror',
        'logged_by' => $staff->id,
        'created_at' => now(),
    ]);

    DB::table('bike_condition_photos')->insert([
        'bike_condition_log_id' => $conditionLogId,
        'file_path' => 'conditions/mirror_scratch.jpg',
        'created_at' => now(),
    ]);

    // Review
    DB::table('reviews')->insert([
        'booking_id' => $bookingId,
        'user_id' => $customer->id,
        'bike_id' => $bikeId,
        'rating' => 5,
        'comment' => 'Smooth pickup and great bike condition!',
        'is_visible' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    expect(DB::table('bookings')->where('id', $bookingId)->value('booking_reference'))->toBe('BK-2026-00001')
        ->and(DB::table('payments')->where('booking_id', $bookingId)->value('method'))->toBe('razorpay')
        ->and(DB::table('reviews')->where('booking_id', $bookingId)->value('rating'))->toBe(5);
});
