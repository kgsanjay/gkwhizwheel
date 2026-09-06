<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Notifications\OtpNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

test('customer can register with valid credentials and receive token in standard envelope', function (): void {
    $payload = [
        'name' => 'Rahul Sharma',
        'email' => 'rahul.sharma@example.com',
        'phone' => '9876543210',
        'password' => 'SecurePass123!',
        'whatsapp_opt_in' => true,
    ];

    $response = $this->postJson('/api/v1/auth/register', $payload);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'success',
            'data' => [
                'user' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'role',
                    'status',
                    'whatsapp_opt_in',
                    'created_at',
                    'updated_at',
                ],
                'token',
            ],
            'message',
        ])
        ->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'name' => 'Rahul Sharma',
                    'email' => 'rahul.sharma@example.com',
                    'phone' => '9876543210',
                    'role' => 'customer',
                    'status' => 'active',
                    'whatsapp_opt_in' => true,
                ],
            ],
            'message' => 'Registration successful.',
        ]);

    $this->assertDatabaseHas('users', [
        'email' => 'rahul.sharma@example.com',
        'phone' => '9876543210',
    ]);
});

test('registration validates required fields and unique constraints returning standard error envelope', function (): void {
    User::create([
        'name' => 'Existing User',
        'email' => 'existing@example.com',
        'phone' => '9999988888',
        'password' => Hash::make('password123'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $response = $this->postJson('/api/v1/auth/register', [
        'name' => '',
        'email' => 'existing@example.com',
        'phone' => '9999988888',
        'password' => 'short',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'The given data was invalid.',
        ])
        ->assertJsonValidationErrors(['name', 'email', 'phone', 'password']);
});

test('user can login with email and password returning token', function (): void {
    $user = User::create([
        'name' => 'Amit Kumar',
        'email' => 'amit@example.com',
        'phone' => '9123456780',
        'password' => Hash::make('CorrectPassword123'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'amit@example.com',
        'password' => 'CorrectPassword123',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => 'amit@example.com',
                ],
            ],
            'message' => 'Logged in successfully.',
        ]);

    expect($response->json('data.token'))->toBeString()->not->toBeEmpty();
});

test('user can login with phone number and password', function (): void {
    $user = User::create([
        'name' => 'Priya Patel',
        'email' => 'priya@example.com',
        'phone' => '9811122233',
        'password' => Hash::make('Password789!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'phone' => '9811122233',
        'password' => 'Password789!',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'phone' => '9811122233',
                ],
            ],
        ]);
});

test('login fails with wrong password and returns error envelope', function (): void {
    User::create([
        'name' => 'Test User',
        'email' => 'testuser@example.com',
        'phone' => '9000011111',
        'password' => Hash::make('RealPassword'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'testuser@example.com',
        'password' => 'WrongPassword',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Invalid credentials.',
            'errors' => [
                'login' => ['Invalid credentials.'],
            ],
        ]);
});

test('blacklisted user cannot login with password', function (): void {
    User::create([
        'name' => 'Suspended User',
        'email' => 'suspended@example.com',
        'phone' => '9000022222',
        'password' => Hash::make('Password123'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::BLACKLISTED,
        'blacklist_reason' => 'Multiple vehicle damage violations',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'suspended@example.com',
        'password' => 'Password123',
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Account is not active or has been suspended.',
        ]);
});

test('requesting email OTP caches 6-digit code and dispatches notification', function (): void {
    Notification::fake();

    $email = 'otp.user@example.com';
    User::create([
        'name' => 'OTP User',
        'email' => $email,
        'phone' => '9888812345',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $response = $this->postJson('/api/v1/auth/otp/request', [
        'email' => $email,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => null,
            'message' => 'OTP sent to your email address.',
        ]);

    $cachedOtp = Cache::get("otp:{$email}");
    expect($cachedOtp)->toBeString()
        ->and(strlen($cachedOtp))->toBe(6);

    Notification::assertSentOnDemand(OtpNotification::class, function (OtpNotification $notification, $channels, $notifiable) use ($email, $cachedOtp): bool {
        return $notifiable->routes['mail'] === $email && $notification->otp === $cachedOtp;
    });
});

test('requesting email OTP for unknown email returns 404 error envelope', function (): void {
    $response = $this->postJson('/api/v1/auth/otp/request', [
        'email' => 'nonexistent@example.com',
    ]);

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'No account found with this email address. Please register first.',
        ]);
});

test('verifying valid OTP authenticates existing user and returns token', function (): void {
    $user = User::create([
        'name' => 'Existing Customer',
        'email' => 'existing.otp@example.com',
        'phone' => '9777788888',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    Cache::put('otp:existing.otp@example.com', '654321', now()->addMinutes(10));

    $response = $this->postJson('/api/v1/auth/otp/verify', [
        'email' => 'existing.otp@example.com',
        'otp' => '654321',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'email' => 'existing.otp@example.com',
                ],
            ],
            'message' => 'OTP verified successfully.',
        ]);

    expect($response->json('data.token'))->toBeString()->not->toBeEmpty();
    expect(Cache::has('otp:existing.otp@example.com'))->toBeFalse();
});

test('verifying valid OTP for unknown email returns 404 error envelope', function (): void {
    $newEmail = 'brand.new.user@example.com';
    Cache::put("otp:{$newEmail}", '112233', now()->addMinutes(10));

    $response = $this->postJson('/api/v1/auth/otp/verify', [
        'email' => $newEmail,
        'otp' => '112233',
    ]);

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'No account found with this email address. Please register first.',
        ]);
});

test('verifying invalid or expired OTP returns 422 error envelope', function (): void {
    Cache::put('otp:test@example.com', '999999', now()->addMinutes(10));

    $response = $this->postJson('/api/v1/auth/otp/verify', [
        'email' => 'test@example.com',
        'otp' => '000000',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Invalid or expired OTP.',
            'errors' => [
                'otp' => ['Invalid or expired OTP.'],
            ],
        ]);
});

test('authenticated user can logout and current token is revoked', function (): void {
    $user = User::create([
        'name' => 'Logout User',
        'email' => 'logout@example.com',
        'phone' => '9555544444',
        'password' => Hash::make('secret123'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/v1/auth/logout');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => null,
            'message' => 'Logged out successfully.',
        ]);

    expect($user->tokens()->count())->toBe(0);
});

test('unauthenticated request to logout or me returns 401 error envelope', function (): void {
    $responseLogout = $this->postJson('/api/v1/auth/logout');
    $responseLogout->assertStatus(401)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Unauthenticated.',
        ]);

    $responseMe = $this->getJson('/api/v1/auth/me');
    $responseMe->assertStatus(401)
        ->assertJson([
            'success' => false,
            'data' => null,
            'message' => 'Unauthenticated.',
        ]);
});

test('authenticated user can retrieve own profile via me endpoint', function (): void {
    $user = User::create([
        'name' => 'Profile User',
        'email' => 'profile@example.com',
        'phone' => '9444433333',
        'password' => Hash::make('passpass1'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    Sanctum::actingAs($user, ['*']);

    $response = $this->getJson('/api/v1/auth/me');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => 'Profile User',
                    'email' => 'profile@example.com',
                    'phone' => '9444433333',
                    'role' => 'customer',
                    'status' => 'active',
                ],
            ],
            'message' => '',
        ]);
});
