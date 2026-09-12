<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Hashing\BcryptHasher;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminAccountLockoutAndComplexityTest extends TestCase
{
    use RefreshDatabase;

    public function test_passwords_are_hashed_via_bcrypt_default(): void
    {
        // Confirm hashing driver is bcrypt and hasher instance is standard BcryptHasher
        $driver = config('hashing.driver');
        $this->assertContains($driver, ['bcrypt', 'argon', 'argon2id']);
        $this->assertInstanceOf(BcryptHasher::class, Hash::driver());

        // Confirm password saved on user model is properly hashed
        $user = User::factory()->create([
            'password' => Hash::make('StrongAdminPassword2026!'),
        ]);

        $this->assertNotSame('StrongAdminPassword2026!', $user->password);
        $this->assertTrue(Hash::check('StrongAdminPassword2026!', $user->password));
        $this->assertTrue(str_starts_with($user->password, '$2y$'));
    }

    public function test_failed_login_attempts_trigger_account_lockout_after_n_attempts(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin_lockout_test@gkwhizwheel.com',
            'phone' => '9988776655',
            'password' => Hash::make('StrongAdminPassword2026!'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
        ]);

        $throttleKey = 'login.account:' . Str::transliterate(Str::lower($admin->email));
        RateLimiter::clear($throttleKey);

        // Attempt 5 failed logins with incorrect password
        for ($i = 1; $i <= 5; $i++) {
            $response = $this->post('/admin/login', [
                'login' => $admin->email,
                'password' => 'WrongPassword!',
            ]);

            $response->assertSessionHasErrors(['login']);
            $this->assertGuest();
        }

        // The 6th attempt should hit account lockout even if correct password is provided
        $lockoutResponse = $this->post('/admin/login', [
            'login' => $admin->email,
            'password' => 'StrongAdminPassword2026!',
        ]);

        $lockoutResponse->assertSessionHasErrors(['login']);
        $sessionErrors = session('errors')->get('login');
        $this->assertStringContainsString('temporarily locked', $sessionErrors[0]);
        $this->assertGuest();

        // RateLimiter reports too many attempts on per-account key
        $this->assertTrue(RateLimiter::tooManyAttempts($throttleKey, 5));
    }

    public function test_account_lockout_is_keyed_per_account_not_just_per_ip(): void
    {
        $admin = User::factory()->create([
            'email' => 'per_account_target@gkwhizwheel.com',
            'password' => Hash::make('StrongAdminPassword2026!'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
        ]);

        $throttleKey = 'login.account:' . Str::transliterate(Str::lower($admin->email));
        RateLimiter::clear($throttleKey);

        // Attacker attempts 5 wrong passwords from IP 1.2.3.4
        for ($i = 1; $i <= 5; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '1.2.3.4'])
                ->post('/admin/login', [
                    'login' => $admin->email,
                    'password' => 'WrongPassword!',
                ]);
        }

        // Legitimate user from a different IP (e.g. 5.6.7.8) is protected by per-account lockout
        $responseFromDifferentIp = $this->withServerVariables(['REMOTE_ADDR' => '5.6.7.8'])
            ->post('/admin/login', [
                'login' => $admin->email,
                'password' => 'StrongAdminPassword2026!',
            ]);

        $responseFromDifferentIp->assertSessionHasErrors(['login']);
        $sessionErrors = session('errors')->get('login');
        $this->assertStringContainsString('temporarily locked', $sessionErrors[0]);
        $this->assertGuest();
    }

    public function test_successful_login_clears_account_rate_limiter(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin_clear_test@gkwhizwheel.com',
            'password' => Hash::make('StrongAdminPassword2026!'),
            'role' => UserRole::STAFF,
            'status' => UserStatus::ACTIVE,
        ]);

        $throttleKey = 'login.account:' . Str::transliterate(Str::lower($admin->email));
        RateLimiter::clear($throttleKey);

        // 2 failed attempts
        for ($i = 1; $i <= 2; $i++) {
            $this->post('/admin/login', [
                'login' => $admin->email,
                'password' => 'WrongPassword!',
            ]);
        }

        $this->assertSame(2, RateLimiter::attempts($throttleKey));

        // Successful login
        $successResponse = $this->post('/admin/login', [
            'login' => $admin->email,
            'password' => 'StrongAdminPassword2026!',
        ]);

        $successResponse->assertRedirect('/admin/dashboard');
        $this->assertAuthenticatedAs($admin);

        // Rate limiter counter is cleared
        $this->assertSame(0, RateLimiter::attempts($throttleKey));
    }

    public function test_registration_rejects_passwords_under_12_characters(): void
    {
        $response = $this->post('/register', [
            'name' => 'Short Pass User',
            'email' => 'shortpass@example.com',
            'phone' => '9123456780',
            'password' => 'Short123!', // 9 chars < 12
        ]);

        $response->assertSessionHasErrors(['password']);
        $errors = session('errors')->get('password');
        $this->assertStringContainsString('at least 12 characters', $errors[0]);
        $this->assertGuest();
    }

    public function test_registration_rejects_compromised_common_passwords(): void
    {
        $response = $this->post('/register', [
            'name' => 'Pwned Pass User',
            'email' => 'pwnedpass@example.com',
            'phone' => '9123456781',
            'password' => 'password123456', // 14 chars but well-known compromised password
        ]);

        $response->assertSessionHasErrors(['password']);
        $errors = session('errors')->get('password');
        $this->assertStringContainsString('data leak', $errors[0]);
        $this->assertGuest();
    }

    public function test_registration_succeeds_with_strong_12_plus_uncompromised_password(): void
    {
        $response = $this->post('/register', [
            'name' => 'Valid Pass User',
            'email' => 'validpass@example.com',
            'phone' => '9123456782',
            'password' => 'KaravaliExplorer#2026$Safe',
            'whatsapp_opt_in' => true,
        ]);

        $response->assertRedirect(route('account.index'));
        $this->assertAuthenticated();

        $user = User::where('email', 'validpass@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('KaravaliExplorer#2026$Safe', $user->password));
    }
}
