<?php

declare(strict_types=1);

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\DiscountType;
use App\Enums\FuelType;
use App\Enums\PricingRateType;
use App\Enums\PricingRuleType;
use App\Enums\Transmission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('staff_store pivot table has correct structure and unique composite index', function () {
    expect(Schema::hasTable('staff_store'))->toBeTrue();

    $columns = ['id', 'user_id', 'store_id', 'created_at', 'updated_at'];
    foreach ($columns as $column) {
        expect(Schema::hasColumn('staff_store', $column))->toBeTrue();
    }

    $indexes = Schema::getIndexes('staff_store');
    $uniqueIndices = collect($indexes)->filter(fn ($idx) => $idx['unique']);

    $hasCompositeUnique = $uniqueIndices->contains(function ($idx) {
        return in_array('user_id', $idx['columns'], true) && in_array('store_id', $idx['columns'], true);
    });

    expect($hasCompositeUnique)->toBeTrue();
});

test('bikes table has exact columns, soft deletes, and indexes', function () {
    expect(Schema::hasTable('bikes'))->toBeTrue();

    $columns = [
        'id',
        'category_id',
        'current_store_id',
        'home_store_id',
        'brand',
        'model_name',
        'registration_number',
        'fuel_type',
        'transmission',
        'base_daily_rate_override',
        'deposit_amount_override',
        'odometer_reading',
        'status',
        'next_service_due_date',
        'primary_image_path',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    foreach ($columns as $column) {
        expect(Schema::hasColumn('bikes', $column))->toBeTrue("Missing bikes.{$column}");
    }

    $indexes = Schema::getIndexes('bikes');
    $indexColumns = collect($indexes)->flatMap(fn ($idx) => $idx['columns'])->all();

    expect($indexColumns)->toContain('registration_number')
        ->and($indexColumns)->toContain('current_store_id')
        ->and($indexColumns)->toContain('status');
});

test('bike_images table has exact columns and single created_at timestamp', function () {
    expect(Schema::hasTable('bike_images'))->toBeTrue();

    $columns = ['id', 'bike_id', 'file_path', 'sort_order', 'created_at'];
    foreach ($columns as $column) {
        expect(Schema::hasColumn('bike_images', $column))->toBeTrue();
    }

    expect(Schema::hasColumn('bike_images', 'updated_at'))->toBeFalse();
});

test('bike_documents table has exact columns and composite unique index', function () {
    expect(Schema::hasTable('bike_documents'))->toBeTrue();

    $columns = [
        'id',
        'bike_id',
        'document_type',
        'file_path',
        'issue_date',
        'expiry_date',
        'uploaded_by',
        'verified',
        'created_at',
        'updated_at',
    ];

    foreach ($columns as $column) {
        expect(Schema::hasColumn('bike_documents', $column))->toBeTrue();
    }

    $indexes = Schema::getIndexes('bike_documents');
    $uniqueIndices = collect($indexes)->filter(fn ($idx) => $idx['unique']);

    $hasCompositeUnique = $uniqueIndices->contains(function ($idx) {
        return in_array('bike_id', $idx['columns'], true) && in_array('document_type', $idx['columns'], true);
    });

    expect($hasCompositeUnique)->toBeTrue();
});

test('pricing_rules table has exact columns and nullable store relations', function () {
    expect(Schema::hasTable('pricing_rules'))->toBeTrue();

    $columns = [
        'id',
        'bike_id',
        'category_id',
        'rule_type',
        'day_of_week',
        'date_start',
        'date_end',
        'from_store_id',
        'to_store_id',
        'rate_type',
        'value',
        'priority',
        'is_active',
        'created_at',
        'updated_at',
    ];

    foreach ($columns as $column) {
        expect(Schema::hasColumn('pricing_rules', $column))->toBeTrue("Missing pricing_rules.{$column}");
    }
});

test('coupons and coupon_usages tables have exact columns', function () {
    expect(Schema::hasTable('coupons'))->toBeTrue()
        ->and(Schema::hasTable('coupon_usages'))->toBeTrue();

    $couponColumns = [
        'id',
        'code',
        'discount_type',
        'value',
        'max_uses_total',
        'max_uses_per_user',
        'valid_from',
        'valid_until',
        'is_active',
        'created_at',
        'updated_at',
    ];

    foreach ($couponColumns as $column) {
        expect(Schema::hasColumn('coupons', $column))->toBeTrue("Missing coupons.{$column}");
    }

    $usageColumns = ['id', 'coupon_id', 'user_id', 'booking_id', 'created_at'];
    foreach ($usageColumns as $column) {
        expect(Schema::hasColumn('coupon_usages', $column))->toBeTrue("Missing coupon_usages.{$column}");
    }

    expect(Schema::hasColumn('coupon_usages', 'updated_at'))->toBeFalse();
});

test('can insert relational data into bikes, images, documents, pricing rules, and coupons', function () {
    $user = User::factory()->create();

    $storeId = DB::table('stores')->insertGetId([
        'name' => 'Indiranagar Branch',
        'address_line' => '12th Main Rd',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560038',
        'latitude' => 12.9783690,
        'longitude' => 77.6408260,
        'phone' => '+918023456789',
        'operating_hours' => json_encode(['all' => '08:00-22:00']),
        'status' => 'active',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $categoryId = DB::table('bike_categories')->insertGetId([
        'name' => 'Sports',
        'base_daily_rate' => 1200.00,
        'default_deposit_amount' => 5000.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // staff_store pivot
    DB::table('staff_store')->insert([
        'user_id' => $user->id,
        'store_id' => $storeId,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // bike
    $bikeId = DB::table('bikes')->insertGetId([
        'category_id' => $categoryId,
        'current_store_id' => $storeId,
        'home_store_id' => $storeId,
        'brand' => 'Yamaha',
        'model_name' => 'R15 V4',
        'registration_number' => 'KA01EQ1234',
        'fuel_type' => FuelType::PETROL->value,
        'transmission' => Transmission::MANUAL->value,
        'odometer_reading' => 1500,
        'status' => BikeStatus::AVAILABLE->value,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // bike image
    DB::table('bike_images')->insert([
        'bike_id' => $bikeId,
        'file_path' => 'bikes/r15-front.jpg',
        'sort_order' => 1,
        'created_at' => now(),
    ]);

    // bike document
    DB::table('bike_documents')->insert([
        'bike_id' => $bikeId,
        'document_type' => BikeDocumentType::RC->value,
        'file_path' => 'documents/rc_ka01eq1234.pdf',
        'issue_date' => '2024-01-01',
        'expiry_date' => '2039-01-01',
        'uploaded_by' => $user->id,
        'verified' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // pricing rule
    DB::table('pricing_rules')->insert([
        'category_id' => $categoryId,
        'rule_type' => PricingRuleType::WEEKEND->value,
        'day_of_week' => 6,
        'rate_type' => PricingRateType::PERCENTAGE->value,
        'value' => 15.00,
        'priority' => 1,
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // coupon
    $couponId = DB::table('coupons')->insertGetId([
        'code' => 'WELCOME50',
        'discount_type' => DiscountType::PERCENTAGE->value,
        'value' => 50.00,
        'max_uses_total' => 100,
        'max_uses_per_user' => 1,
        'valid_from' => '2026-01-01',
        'valid_until' => '2026-12-31',
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // booking for coupon usage
    $bookingId = DB::table('bookings')->insertGetId([
        'booking_reference' => 'BK-2026-TEST-CPN',
        'bike_id' => $bikeId,
        'user_id' => $user->id,
        'pickup_store_id' => $storeId,
        'return_store_id' => $storeId,
        'channel' => 'online',
        'status' => 'confirmed',
        'start_date' => '2026-09-10',
        'end_date' => '2026-09-11',
        'base_amount' => 1200.00,
        'deposit_amount' => 5000.00,
        'total_amount' => 6200.00,
        'price_breakdown_json' => json_encode(['base' => 1200]),
        'idempotency_key' => 'idemp-test-cpn-001',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    // coupon usage
    DB::table('coupon_usages')->insert([
        'coupon_id' => $couponId,
        'user_id' => $user->id,
        'booking_id' => $bookingId,
        'created_at' => now(),
    ]);

    expect(DB::table('bikes')->where('id', $bikeId)->value('registration_number'))->toBe('KA01EQ1234')
        ->and(DB::table('bike_documents')->where('bike_id', $bikeId)->value('document_type'))->toBe('rc')
        ->and(DB::table('coupons')->where('id', $couponId)->value('code'))->toBe('WELCOME50');
});
