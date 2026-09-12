<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    // Super Admin with 2FA enabled
    $this->superAdmin = User::factory()->create([
        'role' => UserRole::SUPER_ADMIN,
        'two_factor_secret' => 'DUMMY_SECRET',
        'two_factor_confirmed_at' => now(),
    ]);

    // Store Manager with 2FA enabled
    $this->storeManager = User::factory()->create([
        'role' => UserRole::STORE_MANAGER,
        'two_factor_secret' => 'DUMMY_SECRET',
        'two_factor_confirmed_at' => now(),
    ]);

    // Staff without 2FA enabled
    $this->staff = User::factory()->create([
        'role' => UserRole::STAFF,
        'two_factor_secret' => null,
        'two_factor_confirmed_at' => null,
    ]);
});

test('super admin and store manager with 2fa enabled cannot access authenticated routes without valid code', function (): void {
    // Attempt login as Super Admin
    $response = $this->post('/admin/login', [
        'login' => $this->superAdmin->email,
        'password' => 'password',
    ]);

    // Assert redirect to 2FA challenge and NOT authenticated
    $response->assertRedirect(route('admin.2fa.challenge'));
    $this->assertGuest();

    // Attempt to access an authenticated admin route directly
    $this->get(route('admin.dashboard'))->assertRedirect(route('admin.login'));
    
    // Attempt login as Store Manager
    $response2 = $this->post('/admin/login', [
        'login' => $this->storeManager->email,
        'password' => 'password',
    ]);
    
    $response2->assertRedirect(route('admin.2fa.challenge'));
    $this->assertGuest();
});

test('staff without 2fa enabled can log in normally', function (): void {
    // Attempt login as Staff
    $response = $this->post('/admin/login', [
        'login' => $this->staff->email,
        'password' => 'password',
    ]);

    // Assert they are authenticated and redirected to dashboard
    $this->assertAuthenticatedAs($this->staff);
    $response->assertRedirect(route('admin.dashboard'));
});
