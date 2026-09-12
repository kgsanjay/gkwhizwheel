<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\BikeStatus;
use App\Enums\StoreStatus;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RateLimitingSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('contact:127.0.0.1');
        RateLimiter::clear('otp:test@example.com');
        RateLimiter::clear('otp:127.0.0.1');
        RateLimiter::clear('coupons:127.0.0.1');
    }

    public function test_contact_form_is_rate_limited(): void
    {
        // Allowed 5 requests per minute
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/contact', [
                'name' => 'John Doe',
                'phone' => '9876543210',
                'email' => 'john@example.com',
                'message' => 'Test message',
            ]);
            $response->assertStatus(200);
        }

        // 6th request must receive 429 Too Many Requests
        $response = $this->postJson('/contact', [
            'name' => 'John Doe',
            'phone' => '9876543210',
            'email' => 'john@example.com',
            'message' => 'Spam attempt',
        ]);
        $response->assertStatus(429);
    }

    public function test_api_contact_form_is_rate_limited(): void
    {
        RateLimiter::clear('contact:127.0.0.1');

        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/v1/contact', [
                'name' => 'API Visitor',
                'phone' => '9876543210',
                'message' => 'Hello via API',
            ]);
            $response->assertStatus(200);
        }

        $response = $this->postJson('/api/v1/contact', [
            'name' => 'API Visitor',
            'phone' => '9876543210',
            'message' => 'Spam via API',
        ]);
        $response->assertStatus(429);
    }

    public function test_otp_request_endpoint_is_rate_limited(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'status' => \App\Enums\UserStatus::ACTIVE,
        ]);

        for ($i = 0; $i < 10; $i++) {
            $response = $this->postJson('/api/v1/auth/otp/request', [
                'email' => 'test@example.com',
            ]);
            $response->assertStatus(200);
        }

        // 11th OTP request must be throttled
        $response = $this->postJson('/api/v1/auth/otp/request', [
            'email' => 'test@example.com',
        ]);
        $response->assertStatus(429);
    }

    public function test_public_price_quote_endpoint_has_coupon_throttle(): void
    {
        $category = BikeCategory::create([
            'name' => 'Scooter',
            'base_daily_rate' => 500,
            'default_deposit_amount' => 1000,
        ]);

        $store = Store::create([
            'name' => 'Honnavar Main',
            'address_line' => 'Station Rd',
            'city' => 'Honnavar',
            'state' => 'Karnataka',
            'pincode' => '581334',
            'latitude' => 14.2802,
            'longitude' => 74.4437,
            'phone' => '9876543210',
            'status' => StoreStatus::ACTIVE,
        ]);

        $bike = Bike::create([
            'category_id' => $category->id,
            'current_store_id' => $store->id,
            'home_store_id' => $store->id,
            'brand' => 'Honda',
            'model_name' => 'Activa 6G',
            'registration_number' => 'KA-47-E-1234',
            'fuel_type' => \App\Enums\FuelType::PETROL,
            'transmission' => \App\Enums\Transmission::AUTOMATIC,
            'status' => BikeStatus::AVAILABLE,
        ]);

        for ($i = 0; $i < 20; $i++) {
            $response = $this->postJson("/api/v1/bikes/{$bike->id}/price-quote", [
                'start_date' => now()->addDays(1)->format('Y-m-d H:i:s'),
                'end_date' => now()->addDays(2)->format('Y-m-d H:i:s'),
                'pickup_store_id' => $store->id,
                'return_store_id' => $store->id,
                'coupon_code' => "TEST{$i}",
            ]);
            $response->assertStatus(200);
        }

        // 21st attempt must be throttled
        $response = $this->postJson("/api/v1/bikes/{$bike->id}/price-quote", [
            'start_date' => now()->addDays(1)->format('Y-m-d H:i:s'),
            'end_date' => now()->addDays(2)->format('Y-m-d H:i:s'),
            'pickup_store_id' => $store->id,
            'return_store_id' => $store->id,
            'coupon_code' => 'TEST_EXCESS',
        ]);
        $response->assertStatus(429);
    }

    public function test_all_public_write_routes_have_throttle_middleware_applied(): void
    {
        $routes = Route::getRoutes();

        // 1. Service booking creation
        $serviceBookRoute = $routes->getByName('services.book');
        $this->assertNotNull($serviceBookRoute);
        $this->assertContains('throttle:bookings', $serviceBookRoute->gatherMiddleware());

        // 2. Service quote calculation (coupon testing)
        $serviceQuoteRoute = $routes->getByName('services.quote');
        $this->assertNotNull($serviceQuoteRoute);
        $this->assertContains('throttle:coupons', $serviceQuoteRoute->gatherMiddleware());

        // 3. Service booking payment initiation
        $initiatePayRoute = $routes->getByName('services.booking.initiate-payment');
        $this->assertNotNull($initiatePayRoute);
        $this->assertContains('throttle:payments', $initiatePayRoute->gatherMiddleware());

        // 4. Service booking payment verification
        $verifyPayRoute = $routes->getByName('services.booking.verify-payment');
        $this->assertNotNull($verifyPayRoute);
        $this->assertContains('throttle:payments', $verifyPayRoute->gatherMiddleware());

        // 5. Contact form submission
        $contactRoute = $routes->getByName('contact.store');
        $this->assertNotNull($contactRoute);
        $this->assertContains('throttle:contact', $contactRoute->gatherMiddleware());

        // 6. KYC Upload
        $kycRoute = $routes->getByName('account.kyc.upload');
        $this->assertNotNull($kycRoute);
        $this->assertContains('throttle:uploads', $kycRoute->gatherMiddleware());
    }
}
