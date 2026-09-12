<?php

declare(strict_types=1);

use App\Models\ServiceItem;
use App\Models\ServiceItemImage;
use Illuminate\Support\Facades\Schema;

test('service_item_images table has correct schema columns', function () {
    expect(Schema::hasTable('service_item_images'))->toBeTrue();
    expect(Schema::hasColumns('service_item_images', [
        'id',
        'service_item_id',
        'image_path',
        'sort_order',
        'is_primary',
        'created_at',
        'updated_at',
    ]))->toBeTrue();
});

test('ServiceItem and ServiceItemImage models have correct relationships and casts', function () {
    $serviceItem = ServiceItem::create([
        'service_type' => 'boating',
        'name' => 'Sharavathi Sunset Cruise',
        'category' => 'Speedboat',
        'description' => 'Fast speedboat tour along backwaters',
        'price_base' => 1200.00,
        'price_unit' => 'per_trip',
        'capacity' => 6,
        'image_url' => 'https://images.unsplash.com/boat.jpg',
        'status' => 'active',
        'sort_order' => 1,
    ]);

    $image1 = ServiceItemImage::create([
        'service_item_id' => $serviceItem->id,
        'image_path' => 'services/boat_1.jpg',
        'sort_order' => 1,
        'is_primary' => true,
    ]);

    $image2 = ServiceItemImage::create([
        'service_item_id' => $serviceItem->id,
        'image_path' => 'services/boat_2.jpg',
        'sort_order' => 2,
        'is_primary' => false,
    ]);

    expect($serviceItem->images)->toHaveCount(2);
    expect($serviceItem->images->first()->image_path)->toBe('services/boat_1.jpg');
    expect($image1->is_primary)->toBeTrue();
    expect($image1->sort_order)->toBe(1);
    expect($image1->serviceItem->id)->toBe($serviceItem->id);

    // Verify cascade on delete
    $serviceItem->delete();
    expect(ServiceItemImage::where('id', $image1->id)->exists())->toBeFalse();
    expect(ServiceItemImage::where('id', $image2->id)->exists())->toBeFalse();
});
