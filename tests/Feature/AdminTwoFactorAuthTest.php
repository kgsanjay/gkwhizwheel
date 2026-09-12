<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class AdminTwoFactorAuthTest extends TestCase
{
    use RefreshDatabase;

    protected TwoFactorService $twoFactorService;
    protected Google2FA $google2fa;

    protected function setUp(): void
    {
        parent::setUp();
        $this->twoFactorService = app(TwoFactorService::class);
        $this->google2fa = new Google2FA();
    }

    public function test_super_admin_login_without_2fa_redirects_to_mandatory_setup(): void
    {
        $superAdmin = User::factory()->create([
            'email' => 'superadmin_2fa_setup@gkwhizwheel.com',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
        ]);

        $response = $this->post('/admin/login', [
            'login' => $superAdmin->email,
            'password' => 'StrongPass123!@#',
        ]);

        $response->assertRedirect(route('admin.2fa.setup'));
        $this->assertGuest();
        $this->assertSame($superAdmin->id, session('login.2fa.user_id'));
    }

    public function test_store_manager_login_without_2fa_redirects_to_mandatory_setup(): void
    {
        $manager = User::factory()->create([
            'email' => 'manager_2fa_setup@gkwhizwheel.com',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::STORE_MANAGER,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
        ]);

        $response = $this->post('/admin/login', [
            'login' => $manager->email,
            'password' => 'StrongPass123!@#',
        ]);

        $response->assertRedirect(route('admin.2fa.setup'));
        $this->assertGuest();
        $this->assertSame($manager->id, session('login.2fa.user_id'));
    }

    public function test_super_admin_with_2fa_confirmed_redirects_to_challenge(): void
    {
        $secret = $this->twoFactorService->generateSecretKey();

        $superAdmin = User::factory()->create([
            'email' => 'superadmin_2fa_active@gkwhizwheel.com',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
        ]);

        $response = $this->post('/admin/login', [
            'login' => $superAdmin->email,
            'password' => 'StrongPass123!@#',
        ]);

        $response->assertRedirect(route('admin.2fa.challenge'));
        $this->assertGuest();
        $this->assertSame($superAdmin->id, session('login.2fa.user_id'));
    }

    public function test_super_admin_can_authenticate_with_valid_totp_code(): void
    {
        $secret = $this->twoFactorService->generateSecretKey();

        $superAdmin = User::factory()->create([
            'email' => 'superadmin_verify@gkwhizwheel.com',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
        ]);

        // Put user in session as if credentials just passed
        session(['login.2fa.user_id' => $superAdmin->id]);

        $validOtp = $this->google2fa->getCurrentOtp($secret);

        $response = $this->post('/admin/2fa/challenge', [
            'code' => $validOtp,
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($superAdmin);
        $this->assertNull(session('login.2fa.user_id'));
    }

    public function test_super_admin_receives_error_with_invalid_totp_code(): void
    {
        $secret = $this->twoFactorService->generateSecretKey();

        $superAdmin = User::factory()->create([
            'email' => 'superadmin_invalid@gkwhizwheel.com',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
        ]);

        session(['login.2fa.user_id' => $superAdmin->id]);

        $response = $this->post('/admin/2fa/challenge', [
            'code' => '000000',
        ]);

        $response->assertSessionHasErrors(['code']);
        $this->assertGuest();
    }

    public function test_super_admin_can_authenticate_with_recovery_code_and_code_is_consumed(): void
    {
        $secret = $this->twoFactorService->generateSecretKey();
        $recoveryCodes = ['code-one-11', 'code-two-22', 'code-three-33'];

        $superAdmin = User::factory()->create([
            'email' => 'superadmin_recovery@gkwhizwheel.com',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => $recoveryCodes,
        ]);

        session(['login.2fa.user_id' => $superAdmin->id]);

        $response = $this->post('/admin/2fa/challenge', [
            'recovery_code' => 'code-one-11',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($superAdmin);

        // Verify recovery code was consumed
        $superAdmin->refresh();
        $this->assertCount(2, $superAdmin->two_factor_recovery_codes);
        $this->assertNotContains('code-one-11', $superAdmin->two_factor_recovery_codes);
        $this->assertContains('code-two-22', $superAdmin->two_factor_recovery_codes);
    }

    public function test_user_can_confirm_2fa_setup_and_receive_recovery_codes(): void
    {
        $staff = User::factory()->create([
            'email' => 'staff_setup@gkwhizwheel.com',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::STAFF,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->actingAs($staff);

        // 1. Visit setup page to generate secret
        $setupResponse = $this->get('/admin/2fa/setup');
        $setupResponse->assertOk();

        $staff->refresh();
        $this->assertNotNull($staff->two_factor_secret);
        $this->assertNull($staff->two_factor_confirmed_at);

        // 2. Confirm with valid code
        $validOtp = $this->google2fa->getCurrentOtp($staff->two_factor_secret);

        $confirmResponse = $this->post('/admin/2fa/confirm', [
            'code' => $validOtp,
        ]);

        $confirmResponse->assertRedirect(route('admin.2fa.recovery-codes'));

        $staff->refresh();
        $this->assertNotNull($staff->two_factor_confirmed_at);
        $this->assertCount(8, $staff->two_factor_recovery_codes);

        // 3. View recovery codes page
        $recoveryPage = $this->get('/admin/2fa/recovery-codes');
        $recoveryPage->assertOk();
    }

    public function test_super_admin_and_store_manager_cannot_disable_2fa(): void
    {
        $superAdmin = User::factory()->create([
            'email' => 'admin_no_disable@gkwhizwheel.com',
            'role' => UserRole::SUPER_ADMIN,
            'two_factor_secret' => $this->twoFactorService->generateSecretKey(),
            'two_factor_confirmed_at' => now(),
        ]);

        $manager = User::factory()->create([
            'email' => 'manager_no_disable@gkwhizwheel.com',
            'role' => UserRole::STORE_MANAGER,
            'two_factor_secret' => $this->twoFactorService->generateSecretKey(),
            'two_factor_confirmed_at' => now(),
        ]);

        // Super Admin attempt to disable
        $response1 = $this->actingAs($superAdmin)->post('/admin/2fa/disable');
        $response1->assertSessionHasErrors(['two_factor']);
        $superAdmin->refresh();
        $this->assertNotNull($superAdmin->two_factor_confirmed_at);

        // Store Manager attempt to disable
        $response2 = $this->actingAs($manager)->post('/admin/2fa/disable');
        $response2->assertSessionHasErrors(['two_factor']);
        $manager->refresh();
        $this->assertNotNull($manager->two_factor_confirmed_at);
    }

    public function test_staff_login_is_direct_when_2fa_not_configured_and_can_disable_when_enabled(): void
    {
        $staff = User::factory()->create([
            'email' => 'staff_optional@gkwhizwheel.com',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::STAFF,
            'status' => UserStatus::ACTIVE,
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
        ]);

        // Staff without 2FA logs in directly (optional for staff)
        $response = $this->post('/admin/login', [
            'login' => $staff->email,
            'password' => 'StrongPass123!@#',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertAuthenticatedAs($staff);

        // When staff has 2FA enabled, they are permitted to disable it
        $staff->update([
            'two_factor_secret' => $this->twoFactorService->generateSecretKey(),
            'two_factor_confirmed_at' => now(),
        ]);

        $disableResponse = $this->actingAs($staff)->post('/admin/2fa/disable');
        $disableResponse->assertSessionHas('success');

        $staff->refresh();
        $this->assertNull($staff->two_factor_confirmed_at);
        $this->assertNull($staff->two_factor_secret);
    }

    public function test_customer_login_is_never_redirected_to_2fa(): void
    {
        $customer = User::factory()->create([
            'email' => 'customer_direct@example.com',
            'phone' => '9888877777',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        $response = $this->post('/login', [
            'login' => $customer->email,
            'password' => 'StrongPass123!@#',
        ]);

        $response->assertRedirect(route('account.index'));
        $this->assertAuthenticatedAs($customer);
    }
}
