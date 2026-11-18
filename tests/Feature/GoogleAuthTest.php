<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;

uses(RefreshDatabase::class);

function mockGoogleSocialiteUser(string $id, string $email, string $name, bool $emailVerified = true): void
{
    $socialiteUser = new SocialiteUser();
    $socialiteUser->setRaw([
        'sub' => $id,
        'email' => $email,
        'email_verified' => $emailVerified,
        'verified_email' => $emailVerified,
        'name' => $name,
        'picture' => 'https://lh3.googleusercontent.com/avatar.png',
    ])->map([
        'id' => $id,
        'name' => $name,
        'email' => $email,
        'avatar' => 'https://lh3.googleusercontent.com/avatar.png',
    ]);

    $provider = Mockery::mock(\Laravel\Socialite\Contracts\Provider::class);
    $provider->shouldReceive('user')->once()->andReturn($socialiteUser);

    Socialite::shouldReceive('driver')->with('google')->once()->andReturn($provider);
}

test('google callback creates and authenticates a brand new verified customer', function (): void {
    mockGoogleSocialiteUser('google-new-100', 'new.rider@gmail.com', 'New Rider', true);

    $this->get('/auth/google/callback')
        ->assertRedirect('/account');

    $user = User::where('email', 'new.rider@gmail.com')->firstOrFail();
    expect($user->google_id)->toBe('google-new-100')
        ->and($user->role)->toBe(UserRole::CUSTOMER)
        ->and($user->email_verified_at)->not->toBeNull();
    $this->assertAuthenticatedAs($user, 'web');
});

test('google callback links existing unverified customer and rotates unverified password to prevent pre-hijacking', function (): void {
    $customer = User::create([
        'name' => 'Existing Rider',
        'email' => 'existing.rider@gmail.com',
        'phone' => '9876543210',
        'password' => Hash::make('PreRegisteredPass123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $customer->createToken('pre-registered-token');

    mockGoogleSocialiteUser('google-link-200', 'existing.rider@gmail.com', 'Existing Rider', true);

    $this->get('/auth/google/callback')
        ->assertRedirect('/account');

    $customer->refresh();
    expect($customer->google_id)->toBe('google-link-200')
        ->and($customer->email_verified_at)->not->toBeNull()
        ->and(Hash::check('PreRegisteredPass123!', (string) $customer->password))->toBeFalse()
        ->and($customer->tokens()->count())->toBe(0);
    $this->assertAuthenticatedAs($customer, 'web');
});

test('google callback links existing verified customer while keeping their password intact', function (): void {
    $customer = User::create([
        'name' => 'Verified Rider',
        'email' => 'verified.rider@gmail.com',
        'phone' => '9876543211',
        'password' => Hash::make('VerifiedPass123!'),
        'role' => UserRole::CUSTOMER,
        'status' => UserStatus::ACTIVE,
    ]);
    $customer->forceFill(['email_verified_at' => now()])->save();

    mockGoogleSocialiteUser('google-verified-300', 'verified.rider@gmail.com', 'Verified Rider', true);

    $this->get('/auth/google/callback')
        ->assertRedirect('/account');

    $customer->refresh();
    expect($customer->google_id)->toBe('google-verified-300')
        ->and(Hash::check('VerifiedPass123!', (string) $customer->password))->toBeTrue();
    $this->assertAuthenticatedAs($customer, 'web');
});

test('google callback rejects unverified google email and staff accounts', function (): void {
    mockGoogleSocialiteUser('google-unverified-400', 'unverified@gmail.com', 'Unverified', false);

    $this->get('/auth/google/callback')
        ->assertRedirect('/login')
        ->assertSessionHasErrors('login');
    $this->assertGuest('web');

    User::create([
        'name' => 'Staff Admin',
        'email' => 'staff.admin@gmail.com',
        'phone' => '9876543212',
        'password' => Hash::make('AdminPass123!'),
        'role' => UserRole::ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    mockGoogleSocialiteUser('google-staff-500', 'staff.admin@gmail.com', 'Staff Admin', true);

    $this->get('/auth/google/callback')
        ->assertRedirect('/login')
        ->assertSessionHasErrors('login');
    $this->assertGuest('web');
});
