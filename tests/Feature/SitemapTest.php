<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_returns_valid_xml_with_proper_headers(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml');

        $content = $response->getContent();
        $this->assertStringStartsWith('<?xml version="1.0" encoding="UTF-8"?>', $content);
        $this->assertStringContainsString('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', $content);
    }

    public function test_sitemap_includes_all_static_marketing_pages(): void
    {
        $response = $this->get('/sitemap.xml');
        $content = $response->getContent();

        // Static marketing pages required by prompt
        $expectedPaths = [
            url('/'),
            url('/services'),
            url('/about'),
            url('/how-it-works'),
            url('/contact'),
            url('/services/bikes'),
            url('/services/cabs'),
            url('/services/homestays'),
            url('/services/boating'),
            url('/services/scuba'),
            url('/services/guide'),
            url('/services/tours'),
        ];

        foreach ($expectedPaths as $path) {
            $this->assertStringContainsString("<loc>{$path}</loc>", $content);
        }
    }

    public function test_sitemap_dynamically_queries_and_includes_active_bikes_with_lastmod(): void
    {
        $store = Store::create([
            'name' => 'Honnavar Main Hub',
            'code' => 'HVR-01',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'address_line' => 'Palya Main Road',
            'phone' => '8660989586',
            'email' => 'hub@whizwheel.com',
            'latitude' => 14.2802,
            'longitude' => 74.4437,
            'status' => \App\Enums\StoreStatus::ACTIVE,
        ]);

        $category = BikeCategory::create([
            'name' => 'Cruiser',
            'base_daily_rate' => 1200.00,
            'default_deposit_amount' => 0.00,
        ]);

        $activeBike = Bike::create([
            'category_id' => $category->id,
            'current_store_id' => $store->id,
            'home_store_id' => $store->id,
            'brand' => 'Royal Enfield',
            'model_name' => 'Classic 350',
            'registration_number' => 'KA-47-E-9999',
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::MANUAL,
            'status' => BikeStatus::AVAILABLE,
            'base_daily_rate_override' => 1200.00,
        ]);

        $retiredBike = Bike::create([
            'category_id' => $category->id,
            'current_store_id' => $store->id,
            'home_store_id' => $store->id,
            'brand' => 'Hero',
            'model_name' => 'Old Splendor',
            'registration_number' => 'KA-47-E-0000',
            'fuel_type' => FuelType::PETROL,
            'transmission' => Transmission::MANUAL,
            'status' => BikeStatus::RETIRED,
            'base_daily_rate_override' => 300.00,
        ]);

        $response = $this->get('/sitemap.xml');
        $content = $response->getContent();

        $activeBikeUrl = url("/services/bikes/{$activeBike->id}");
        $retiredBikeUrl = url("/services/bikes/{$retiredBike->id}");

        $this->assertStringContainsString("<loc>{$activeBikeUrl}</loc>", $content);
        $this->assertStringContainsString("<lastmod>{$activeBike->updated_at->toAtomString()}</lastmod>", $content);

        // Retired bikes should not be in sitemap
        $this->assertStringNotContainsString("<loc>{$retiredBikeUrl}</loc>", $content);
    }

    public function test_sitemap_dynamically_queries_and_includes_active_service_items_with_lastmod(): void
    {
        $activeItem = ServiceItem::create([
            'service_type' => 'boating',
            'name' => 'Sharavathi Sunset Cruise',
            'category' => 'Sunset Cruises',
            'description' => '1-hour sunset cruise along backwaters.',
            'price_base' => 1200.00,
            'price_unit' => 'per boat',
            'capacity' => 6,
            'status' => 'available',
        ]);

        $inactiveItem = ServiceItem::create([
            'service_type' => 'boating',
            'name' => 'Outdated Boat Charter',
            'category' => 'Sunset Cruises',
            'description' => 'Decommissioned boat.',
            'price_base' => 900.00,
            'price_unit' => 'per boat',
            'capacity' => 4,
            'status' => 'inactive',
        ]);

        $response = $this->get('/sitemap.xml');
        $content = $response->getContent();

        $activeItemUrl = url("/services/boating/{$activeItem->id}");
        $inactiveItemUrl = url("/services/boating/{$inactiveItem->id}");

        $this->assertStringContainsString("<loc>{$activeItemUrl}</loc>", $content);
        $this->assertStringContainsString("<lastmod>{$activeItem->updated_at->toAtomString()}</lastmod>", $content);

        // Inactive item should not be in sitemap
        $this->assertStringNotContainsString("<loc>{$inactiveItemUrl}</loc>", $content);
    }

    public function test_service_item_route_from_sitemap_returns_successful_response(): void
    {
        $item = ServiceItem::create([
            'service_type' => 'boating',
            'name' => 'Mangrove Safari',
            'category' => 'Safari',
            'description' => 'Mangrove boat safari.',
            'price_base' => 800.00,
            'price_unit' => 'per person',
            'capacity' => 10,
            'status' => 'available',
        ]);

        $response = $this->get("/services/boating/{$item->id}");
        $response->assertStatus(200);
    }

    public function test_robots_txt_contains_required_allow_disallow_and_sitemap_directives(): void
    {
        $path = public_path('robots.txt');
        $this->assertFileExists($path);

        $content = file_get_contents($path);

        $this->assertStringContainsString('User-agent: *', $content);
        $this->assertStringContainsString('Allow: /', $content);
        $this->assertStringContainsString('Allow: /services/', $content);
        $this->assertStringContainsString('Disallow: /admin', $content);
        $this->assertStringContainsString('Disallow: /api', $content);
        $this->assertStringContainsString('Disallow: /staff', $content);
        $this->assertStringContainsString('Disallow: /account', $content);
        $this->assertStringContainsString('Sitemap: https://whizwheels.in/sitemap.xml', $content);
    }
}


