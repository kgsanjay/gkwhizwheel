<?php

declare(strict_types=1);

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('users table has exact expected columns and indexes', function () {
    expect(Schema::hasTable('users'))->toBeTrue();

    $expectedColumns = [
        'id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'whatsapp_opt_in',
        'status',
        'blacklist_reason',
        'email_verified_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    foreach ($expectedColumns as $column) {
        expect(Schema::hasColumn('users', $column))->toBeTrue("Missing column users.{$column}");
    }

    $indexes = Schema::getIndexes('users');
    $indexColumns = collect($indexes)->flatMap(fn ($idx) => $idx['columns'])->all();

    expect($indexColumns)->toContain('phone')
        ->and($indexColumns)->toContain('email')
        ->and($indexColumns)->toContain('role');
});

test('stores table has exact expected columns', function () {
    expect(Schema::hasTable('stores'))->toBeTrue();

    $expectedColumns = [
        'id',
        'name',
        'address_line',
        'city',
        'state',
        'pincode',
        'latitude',
        'longitude',
        'phone',
        'operating_hours',
        'status',
        'created_at',
        'updated_at',
    ];

    foreach ($expectedColumns as $column) {
        expect(Schema::hasColumn('stores', $column))->toBeTrue("Missing column stores.{$column}");
    }

    // Ensure deleted_at does not exist on stores
    expect(Schema::hasColumn('stores', 'deleted_at'))->toBeFalse();
});

test('bike_categories table has exact expected columns', function () {
    expect(Schema::hasTable('bike_categories'))->toBeTrue();

    $expectedColumns = [
        'id',
        'name',
        'base_daily_rate',
        'default_deposit_amount',
        'created_at',
        'updated_at',
    ];

    foreach ($expectedColumns as $column) {
        expect(Schema::hasColumn('bike_categories', $column))->toBeTrue("Missing column bike_categories.{$column}");
    }

    // Ensure deleted_at does not exist on bike_categories
    expect(Schema::hasColumn('bike_categories', 'deleted_at'))->toBeFalse();
});

test('stores record can be created with json operating hours and store status enum', function () {
    $storeId = DB::table('stores')->insertGetId([
        'name' => 'Koramangala Hub',
        'address_line' => '100 Feet Rd, 4th Block',
        'city' => 'Bengaluru',
        'state' => 'Karnataka',
        'pincode' => '560034',
        'latitude' => 12.9352420,
        'longitude' => 77.6244800,
        'phone' => '+918012345678',
        'operating_hours' => json_encode(['mon' => '09:00-20:00', 'tue' => '09:00-20:00']),
        'status' => StoreStatus::ACTIVE->value,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $store = DB::table('stores')->where('id', $storeId)->first();

    expect($store)->not->toBeNull()
        ->and($store->name)->toBe('Koramangala Hub')
        ->and($store->status)->toBe(StoreStatus::ACTIVE->value);
});

test('bike_categories record can be created with rate and deposit decimals', function () {
    $categoryId = DB::table('bike_categories')->insertGetId([
        'name' => 'Cruiser',
        'base_daily_rate' => 799.50,
        'default_deposit_amount' => 2000.00,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $category = DB::table('bike_categories')->where('id', $categoryId)->first();

    expect($category)->not->toBeNull()
        ->and($category->name)->toBe('Cruiser')
        ->and((float) $category->base_daily_rate)->toBe(799.5)
        ->and((float) $category->default_deposit_amount)->toBe(2000.0);
});

test('user record can be created with all schema attributes and soft deleted', function () {
    $user = User::factory()->create([
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    expect($user->role)->toBe(UserRole::SUPER_ADMIN)
        ->and($user->status)->toBe(UserStatus::ACTIVE);

    $user->delete();

    expect($user->trashed())->toBeTrue();
    expect(User::withTrashed()->find($user->id))->not->toBeNull();
    expect(User::find($user->id))->toBeNull();
});
