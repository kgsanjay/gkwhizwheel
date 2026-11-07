<?php

declare(strict_types=1);

use App\Models\ServiceItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('home page shares real active service items with the universal booking modal', function (): void {
    $active = ServiceItem::create([
        'service_type' => 'boating', 'name' => 'Verified Boat Cruise',
        'price_base' => 1800, 'price_unit' => 'per_trip', 'status' => 'active',
    ]);
    ServiceItem::create([
        'service_type' => 'scuba', 'name' => 'Unavailable Dive',
        'price_base' => 5000, 'price_unit' => 'per_trip', 'status' => 'inactive',
    ]);

    $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->has('availableItems', 1)
        ->where('availableItems.0.id', $active->id)
        ->where('availableItems.0.service_type', 'boating')
        ->where('availableItems.0.price_base', '1800.00'));
});

test('universal service booking uses real item IDs and server quote contract', function (): void {
    $code = file_get_contents(resource_path('js/Components/ServiceBookingModal.jsx'));
    expect($code)
        ->toContain('service_item_id: selectedServiceItem?.id ?? null')
        ->toContain('service_item_id: selectedServiceItem.id')
        ->toContain('Number(dynamicQuote.total_amount)')
        ->not->toContain('service_item_id: null')
        ->not->toContain('base_price: estimatedCost')
        ->not->toContain('defaultItemId:');
});
