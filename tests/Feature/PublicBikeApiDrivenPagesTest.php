<?php

declare(strict_types=1);

use App\Models\Review;
use App\Enums\BikeStatus;
use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
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
        ->toContain("apiClient.get('/services')")
        ->toContain("apiClient.get('/reviews')")
        ->not->toContain("'Activa 6G, Classic 350 & CB350'")
        ->not->toContain('Combo Rate (Save 10%)')
        ->toContain('item?.description')
        ->toContain('item?.price_base')
        ->toContain('item?.features')
        ->not->toContain('5.0 Verified');

    expect($catalog)->toContain('displayedFleetNames.slice(0, 4)')
        ->not->toContain("['Honda Activa 6G', 'Classic 350', 'CB350', 'Electric EV']")
        ->not->toContain('10% Tiered Discount');

    expect($home)->toContain("apiClient.get('/services')")
        ->toContain('].map(enhanceHomeService).map((srv) => (')
        ->toContain('featuredTour?.description')
        ->toContain('heroService?.description')
        ->toContain('heroService?.primary_image_url')
        ->not->toContain('Custom Combos • Save 10%')
        ->not->toContain('5.0 Verified')
        ->not->toContain('src="/images/services/tour.jpg"');
});


test('public reviews API only exposes approved comments from real bike bookings', function (): void {
    $store = Store::create([
        'name' => 'Review API Store', 'address_line' => 'Market Road', 'city' => 'Honnavar',
        'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.281, 'longitude' => 74.444, 'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Review Category', 'base_daily_rate' => 500, 'default_deposit_amount' => 0,
    ]);
    $bike = Bike::create([
        'category_id' => $category->id, 'current_store_id' => $store->id,
        'home_store_id' => $store->id, 'brand' => 'Test Brand',
        'model_name' => 'API Bike', 'registration_number' => 'KA-47-API-11',
        'fuel_type' => FuelType::PETROL, 'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
    $customer = User::create([
        'name' => 'Actual Customer', 'email' => 'public-review@example.test',
        'phone' => '9876543111', 'password' => bcrypt('test-password'),
        'role' => UserRole::CUSTOMER, 'status' => UserStatus::ACTIVE,
    ]);
    $makeBooking = function (string $reference) use ($store, $bike, $customer): Booking {
        return Booking::create([
            'booking_reference' => $reference, 'bike_id' => $bike->id,
            'user_id' => $customer->id, 'pickup_store_id' => $store->id,
            'return_store_id' => $store->id, 'channel' => BookingChannel::ONLINE,
            'status' => BookingStatus::RETURNED,
            'start_date' => now()->subDays(3)->toDateString(),
            'end_date' => now()->subDays(2)->toDateString(),
            'base_amount' => 500, 'deposit_amount' => 0, 'total_amount' => 500,
            'price_breakdown_json' => [], 'idempotency_key' => $reference,
        ]);
    };

    Review::create([
        'booking_id' => $makeBooking('REAL-REVIEW-11')->id, 'user_id' => $customer->id,
        'bike_id' => $bike->id, 'rating' => 4, 'comment' => 'Actual approved review.',
        'is_visible' => true,
    ]);
    Review::create([
        'booking_id' => $makeBooking('HIDDEN-REVIEW-12')->id, 'user_id' => $customer->id,
        'bike_id' => $bike->id, 'rating' => 1, 'comment' => 'Not approved for publication.',
        'is_visible' => false,
    ]);

    $this->getJson('/api/v1/reviews')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('meta.average_rating', 4)
        ->assertJsonPath('data.0.customer_name', 'Actual Customer')
        ->assertJsonPath('data.0.bike_name', 'Test Brand API Bike')
        ->assertJsonPath('data.0.comment', 'Actual approved review.')
        ->assertDontSee('Not approved for publication.');
});
