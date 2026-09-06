<?php

declare(strict_types=1);

use App\Enums\BikeDocumentType;
use App\Enums\PricingRuleType;
use App\Enums\UserRole;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\PricingRule;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;

test('database seeder populates realistic dataset idempotently', function (): void {
    // 1. Run seeder
    $this->seed(DatabaseSeeder::class);

    // Stores check
    expect(Store::count())->toBe(2);
    $koramangala = Store::where('name', 'Koramangala Hub')->firstOrFail();
    $indiranagar = Store::where('name', 'Indiranagar Station')->firstOrFail();

    // Categories check
    expect(BikeCategory::count())->toBe(3);
    $categories = BikeCategory::pluck('name')->toArray();
    expect($categories)->toContain('Scooter', 'Cruiser', 'Sports');

    // Users check
    expect(User::whereIn('role', [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER])->count())->toBe(2)
        ->and(User::where('role', UserRole::STAFF)->count())->toBe(3);

    // Staff store assignment check
    $staffRajesh = User::where('email', 'rajesh@whizwheel.com')->firstOrFail();
    $staffPriya = User::where('email', 'priya@whizwheel.com')->firstOrFail();
    $staffSuresh = User::where('email', 'suresh@whizwheel.com')->firstOrFail();

    expect($staffRajesh->stores->pluck('id'))->toContain($koramangala->id)
        ->and($staffPriya->stores->pluck('id'))->toContain($indiranagar->id)
        ->and($staffSuresh->stores->count())->toBe(2);

    // Bikes check
    expect(Bike::count())->toBe(10)
        ->and(Bike::where('current_store_id', $koramangala->id)->count())->toBe(5)
        ->and(Bike::where('current_store_id', $indiranagar->id)->count())->toBe(5);

    // Bike Documents check: 3 per bike = 30 total
    expect(BikeDocument::count())->toBe(30)
        ->and(BikeDocument::where('document_type', BikeDocumentType::RC)->count())->toBe(10)
        ->and(BikeDocument::where('document_type', BikeDocumentType::INSURANCE)->count())->toBe(10)
        ->and(BikeDocument::where('document_type', BikeDocumentType::EMISSION_CERTIFICATE)->count())->toBe(10);

    // Pricing Rules check: weekend, holiday, one-way
    expect(PricingRule::where('rule_type', PricingRuleType::WEEKEND)->count())->toBeGreaterThanOrEqual(1)
        ->and(PricingRule::where('rule_type', PricingRuleType::HOLIDAY)->count())->toBeGreaterThanOrEqual(1)
        ->and(PricingRule::where('rule_type', PricingRuleType::ONE_WAY_FEE)->count())->toBeGreaterThanOrEqual(1);

    // 2. Test idempotency: re-running seeder should not duplicate records
    $this->seed(DatabaseSeeder::class);

    expect(Store::count())->toBe(2)
        ->and(BikeCategory::count())->toBe(3)
        ->and(User::count())->toBe(5)
        ->and(Bike::count())->toBe(10)
        ->and(BikeDocument::count())->toBe(30);
});
