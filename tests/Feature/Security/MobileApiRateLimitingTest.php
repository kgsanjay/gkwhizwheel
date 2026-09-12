<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class MobileApiRateLimitingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clearResolvedInstances();
    }

    public function test_guest_mobile_app_version_endpoint_is_rate_limited_at_60_rpm(): void
    {
        RateLimiter::clear('mobile-api:mobile:ip:127.0.0.1');

        for ($i = 0; $i < 60; $i++) {
            $response = $this->getJson('/api/v1/staff/app-version');
            $response->assertStatus(200);
        }

        // 61st request exceeds the 60 requests/minute unauthenticated mobile limit
        $throttled = $this->getJson('/api/v1/staff/app-version');
        $throttled->assertStatus(429);
        $throttled->assertJson([
            'success' => false,
            'errors' => [
                'code' => 'MOBILE_RATE_LIMIT_EXCEEDED',
            ],
        ]);
        $this->assertTrue($throttled->headers->has('Retry-After'));
    }

    public function test_deprecated_mobile_app_version_receives_deprecation_headers_when_throttled(): void
    {
        RateLimiter::clear('mobile-api:android:ip:127.0.0.1');

        // Request with deprecated app version (0.8.0 < 1.0.0 min version)
        for ($i = 0; $i < 60; $i++) {
            $this->getJson('/api/v1/customer/app-version', [
                'X-App-Platform' => 'android',
                'X-App-Version' => '0.8.0',
            ])->assertStatus(200);
        }

        $throttled = $this->getJson('/api/v1/customer/app-version', [
            'X-App-Platform' => 'android',
            'X-App-Version' => '0.8.0',
        ]);

        $throttled->assertStatus(429);
        $throttled->assertHeader('X-API-Deprecated', 'true');
        $throttled->assertHeader('X-API-Minimum-Version', '1.0.0');
        $throttled->assertJson([
            'success' => false,
            'errors' => [
                'code' => 'MOBILE_RATE_LIMIT_EXCEEDED',
                'client_version' => '0.8.0',
                'min_supported_version' => '1.0.0',
                'is_deprecated_client' => true,
            ],
        ]);
    }

    public function test_staff_mobile_app_block_g_receives_180_rpm_tier(): void
    {
        $staff = User::factory()->create([
            'role' => UserRole::STAFF,
            'status' => UserStatus::ACTIVE,
        ]);

        RateLimiter::clear("mobile-api:android:user:{$staff->id}");

        // Staff should comfortably make more than 60 requests (testing up to 75)
        for ($i = 0; $i < 75; $i++) {
            $response = $this->actingAs($staff, 'sanctum')->getJson('/api/v1/staff/customers/lookup?phone=9876543210', [
                'X-App-Platform' => 'android',
                'X-App-Version' => '1.2.0',
                'X-Client-Type' => 'staff_app',
            ]);
            $response->assertStatus(200);
        }
    }

    public function test_customer_mobile_app_block_f_receives_120_rpm_tier(): void
    {
        $customer = User::factory()->create([
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        RateLimiter::clear("mobile-api:ios:user:{$customer->id}");

        // Customer mobile app client should comfortably exceed 60 rpm up to 70 requests without 429
        for ($i = 0; $i < 70; $i++) {
            $response = $this->actingAs($customer, 'sanctum')->getJson('/api/v1/bookings', [
                'X-App-Platform' => 'ios',
                'X-App-Version' => '1.0.0',
                'X-Client-Type' => 'customer_app',
            ]);
            $response->assertStatus(200);
        }
    }

    public function test_mobile_rate_limit_bucket_is_isolated_from_web_quotas(): void
    {
        RateLimiter::clear('mobile-api:android:ip:127.0.0.1');
        RateLimiter::clear('contact:127.0.0.1');

        // Exhaust mobile quota on mobile app-version
        for ($i = 0; $i < 60; $i++) {
            $this->getJson('/api/v1/staff/app-version', [
                'X-App-Platform' => 'android',
                'X-App-Version' => '1.2.0',
            ])->assertStatus(200);
        }

        // Mobile endpoint is throttled
        $this->getJson('/api/v1/staff/app-version', [
            'X-App-Platform' => 'android',
            'X-App-Version' => '1.2.0',
        ])->assertStatus(429);

        // Web endpoint from the same IP (e.g. stores list or public bikes) remains completely unblocked
        $webResponse = $this->getJson('/api/v1/stores');
        $webResponse->assertStatus(200);
    }
}
