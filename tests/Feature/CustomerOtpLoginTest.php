<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Notifications\OtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CustomerOtpLoginTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Ramesh Kumar',
            'email' => 'ramesh.customer@example.com',
            'phone' => '9876543210',
            'password' => Hash::make('Password123!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
            'whatsapp_opt_in' => true,
        ]);
    }

    public function test_customer_can_request_otp_with_valid_phone(): void
    {
        Notification::fake();

        $response = $this->postJson('/login/otp/request', [
            'login' => '9876543210',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user_id' => $this->customer->id,
            ]);

        Notification::assertSentTo(
            $this->customer,
            OtpNotification::class,
            function (OtpNotification $notification) {
                return strlen($notification->otp) === 6;
            }
        );

        $cachedOtp = Cache::get("login_otp:{$this->customer->id}");
        $this->assertNotNull($cachedOtp);
        $this->assertSame(6, strlen((string) $cachedOtp));
    }

    public function test_customer_can_request_otp_with_phone_country_code(): void
    {
        Notification::fake();

        $response = $this->postJson('/login/otp/request', [
            'login' => '+919876543210',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user_id' => $this->customer->id,
            ]);
    }

    public function test_customer_can_request_otp_with_valid_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/login/otp/request', [
            'login' => 'ramesh.customer@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'user_id' => $this->customer->id,
            ]);
    }

    public function test_customer_cannot_request_otp_if_user_not_found(): void
    {
        $response = $this->postJson('/login/otp/request', [
            'login' => '9999999999',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'not_found' => true,
            ]);
    }

    public function test_customer_can_verify_otp_and_login_strictly_to_web_guard(): void
    {
        Cache::put("login_otp:{$this->customer->id}", '654321', 600);

        $response = $this->postJson('/login/otp/verify', [
            'user_id' => $this->customer->id,
            'otp' => '654321',
            'remember' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'authenticated',
            ]);

        // Assert strictly authenticated on web guard, NOT on admin guard
        $this->assertTrue(Auth::guard('web')->check());
        $this->assertFalse(Auth::guard('admin')->check());
        $this->assertSame($this->customer->id, Auth::guard('web')->id());

        // Assert cache key was cleared
        $this->assertNull(Cache::get("login_otp:{$this->customer->id}"));
    }

    public function test_customer_cannot_verify_with_invalid_otp(): void
    {
        Cache::put("login_otp:{$this->customer->id}", '654321', 600);

        $response = $this->postJson('/login/otp/verify', [
            'user_id' => $this->customer->id,
            'otp' => '000000',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertFalse(Auth::guard('web')->check());
    }
}
