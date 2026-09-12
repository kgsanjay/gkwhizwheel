<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Http\Controllers\Web\Admin\AdminServiceWebController;
use App\Models\ServiceItem;
use Database\Seeders\ServiceItemSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('ServiceItemSeeder seeds at least 5-8 realistic items per service vertical using SERVICE_CONFIGS', function (): void {
    $this->seed(ServiceItemSeeder::class);

    $requiredTypes = ['boating', 'scuba', 'homestay', 'guide', 'tours', 'taxi'];
    $configs = AdminServiceWebController::SERVICE_CONFIGS;

    foreach ($requiredTypes as $type) {
        $items = ServiceItem::where('service_type', $type)->get();

        // Must have at least 5-8 items per vertical
        expect($items->count())->toBeGreaterThanOrEqual(5);

        // Every item must have non-empty essential attributes
        foreach ($items as $item) {
            expect($item->name)->not->toBeEmpty();
            expect($item->description)->not->toBeEmpty();
            expect((float) $item->price_base)->toBeGreaterThan(0);
            expect($item->price_unit)->not->toBeEmpty();
            expect($item->status)->toBe('available');
            expect($item->features)->toBeArray()->not->toBeEmpty();
            expect($item->image_url)->not->toBeEmpty();

            // Category must be valid according to SERVICE_CONFIGS
            expect($configs[$type]['categories'])->toContain($item->category);
        }
    }

    // Two-wheelers should also have at least 5 items
    $twoWheelers = ServiceItem::where('service_type', 'two_wheelers')->get();
    expect($twoWheelers->count())->toBeGreaterThanOrEqual(5);
});

test('ServiceItemSeeder is idempotent and can run multiple times without duplicating', function (): void {
    $this->seed(ServiceItemSeeder::class);
    $initialCount = ServiceItem::count();

    // Re-run
    $this->seed(ServiceItemSeeder::class);
    $secondCount = ServiceItem::count();

    expect($secondCount)->toBe($initialCount);
});
