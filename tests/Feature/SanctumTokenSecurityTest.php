<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->staff = User::create([
        'name' => 'Staff Mobile Operator',
        'email' => 'staff.mobile@example.com',
        'phone' => '+919999888801',
        'password' => Hash::make('StaffPass123!'),
        'role' => UserRole::STAFF,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->customer = User::create([
        'name' => 'Customer App User',
        'email' => 'customer.app@example.com',
        'phone' => '+919999888802',
        'password' => Hash::make('CustomerPass123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('staff mobile login issues token with scoped abilities and explicit expiration', function (): void {
    $response = $this->postJson('/api/v1/auth/login', [
        'login' => 'staff.mobile@example.com',
        'password' => 'StaffPass123!',
    ]);

    $response->assertOk();
    $tokenString = $response->json('data.token');
    expect($tokenString)->not->toBeNull();

    // Verify token in database
    $tokenId = explode('|', (string) $tokenString)[0];
    $tokenRecord = PersonalAccessToken::find($tokenId);

    expect($tokenRecord)->not->toBeNull();
    // Must NOT have full '*' access
    expect($tokenRecord->abilities)->not->toContain('*');
    // Must have explicit staff operational abilities
    expect($tokenRecord->abilities)->toContain('staff:bikes');
    expect($tokenRecord->abilities)->toContain('staff:bookings');
    expect($tokenRecord->abilities)->toContain('staff:service-bookings');
    expect($tokenRecord->abilities)->toContain('staff:customers');
    expect($tokenRecord->abilities)->toContain('staff:sync');

    // Must have defined expires_at in the future
    expect($tokenRecord->expires_at)->not->toBeNull();
    expect($tokenRecord->expires_at->isFuture())->toBeTrue();
});

test('customer login issues token with customer-only abilities', function (): void {
    $response = $this->postJson('/api/v1/auth/login', [
        'login' => 'customer.app@example.com',
        'password' => 'CustomerPass123!',
    ]);

    $response->assertOk();
    $tokenString = $response->json('data.token');

    $tokenId = explode('|', (string) $tokenString)[0];
    $tokenRecord = PersonalAccessToken::find($tokenId);

    expect($tokenRecord)->not->toBeNull();
    expect($tokenRecord->abilities)->not->toContain('*');
    expect($tokenRecord->abilities)->toContain('customer:bookings');
    expect($tokenRecord->abilities)->toContain('customer:kyc');
    expect($tokenRecord->abilities)->not->toContain('staff:bikes');
    expect($tokenRecord->abilities)->not->toContain('admin:manage');

    expect($tokenRecord->expires_at)->not->toBeNull();
    expect($tokenRecord->expires_at->isFuture())->toBeTrue();
});

test('token ability restrictions enforce role scopes', function (): void {
    $staffToken = $this->staff->createToken('staff_token', $this->staff->tokenAbilities())->accessToken;
    $customerToken = $this->customer->createToken('customer_token', $this->customer->tokenAbilities())->accessToken;

    expect($staffToken->can('staff:bikes'))->toBeTrue();
    expect($staffToken->can('staff:bookings'))->toBeTrue();
    expect($staffToken->can('staff:sync'))->toBeTrue();
    expect($staffToken->can('admin:pricing'))->toBeFalse();
    expect($staffToken->can('*'))->toBeFalse();

    expect($customerToken->can('customer:bookings'))->toBeTrue();
    expect($customerToken->can('customer:kyc'))->toBeTrue();
    expect($customerToken->can('staff:bikes'))->toBeFalse();
    expect($customerToken->can('*'))->toBeFalse();
});

test('expired sanctum tokens are rejected with unauthenticated 401', function (): void {
    // Create an expired token
    $token = $this->staff->createToken(
        name: 'auth_token',
        abilities: $this->staff->tokenAbilities(),
        expiresAt: Carbon::now()->subDay()
    )->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/v1/auth/me');

    $response->assertStatus(401);
});
