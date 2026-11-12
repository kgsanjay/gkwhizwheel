<?php

declare(strict_types=1);

use App\Models\Review;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('public reviews API is empty when there are no approved customer reviews', function (): void {
    $this->getJson('/api/v1/reviews')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonCount(0, 'data')
        ->assertJsonPath('meta.total', 0)
        ->assertJsonPath('meta.average_rating', null);
});

test('bike listing and marketing pages fetch real fleet and customer review APIs', function (): void {
    $catalog = file_get_contents(resource_path('js/Pages/Bikes/Index.jsx'));
    $home = file_get_contents(resource_path('js/Pages/Welcome.jsx'));
    $services = file_get_contents(resource_path('js/Pages/Services.jsx'));

    expect($catalog)->toContain("apiClient.get('/bikes'")
        ->toContain("apiClient.get('/bike-categories')")
        ->toContain("apiClient.get('/stores')")
        ->not->toContain("'/storage/bikes/honda-activa.jpg'")
        ->not->toContain("'350.00'");

    expect($home)->toContain("apiClient.get('/bikes')")
        ->toContain("apiClient.get('/reviews')")
        ->not->toContain('(324+ reviews)')
        ->not->toContain("id: 'ankit-bike'");

    expect($services)->toContain("apiClient.get('/bikes')")
        ->not->toContain("'Activa 6G, Classic 350 & CB350'");
});
