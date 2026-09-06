<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('root route renders Inertia Welcome page with shared props', function (): void {
    $response = $this->get('/');

    $response->assertStatus(200);

    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Welcome')
        ->has('auth')
        ->has('flash')
        ->has('csrf_token')
        ->where('auth.user', null)
    );
});

test('Inertia shares authenticated user details when user is logged in', function (): void {
    $user = User::create([
        'name' => 'Frontend Test User',
        'email' => 'frontend.test@example.com',
        'phone' => '9876599999',
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);

    $response = $this->actingAs($user)->get('/');

    $response->assertStatus(200);

    $response->assertInertia(
        fn (Assert $page) => $page
        ->component('Welcome')
        ->where('auth.user.id', $user->id)
        ->where('auth.user.name', 'Frontend Test User')
        ->where('auth.user.email', 'frontend.test@example.com')
        ->where('auth.user.role', UserRole::CUSTOMER->value)
    );
});

test('root blade view contains inertia container and Google fonts for Inter and Roboto', function (): void {
    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertSee('id="app"', false);
    $response->assertSee('fonts.googleapis.com', false);
    $response->assertSee('Inter', false);
    $response->assertSee('Roboto', false);
});
