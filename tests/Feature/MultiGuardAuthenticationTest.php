<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MultiGuardAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'John Customer',
            'email' => 'john.customer@example.com',
            'phone' => '9876543210',
            'password' => Hash::make('Password123!'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
        ]);

        $this->staff = User::create([
            'name' => 'Alice Staff',
            'email' => 'alice.staff@gkwhizwheel.com',
            'phone' => '9876543211',
            'password' => Hash::make('Password123!'),
            'role' => UserRole::STAFF,
            'status' => UserStatus::ACTIVE,
        ]);
    }

    public function test_customer_login_authenticates_strictly_on_web_guard(): void
    {
        $response = $this->post('/login', [
            'login' => 'john.customer@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertRedirect(route('account.index'));
        $this->assertTrue(Auth::guard('web')->check());
        $this->assertFalse(Auth::guard('admin')->check());
        $this->assertSame($this->customer->id, Auth::guard('web')->id());
    }

    public function test_customer_cannot_access_admin_portal(): void
    {
        // Login as customer on web guard
        $this->post('/login', [
            'login' => 'john.customer@example.com',
            'password' => 'Password123!',
        ]);

        $this->assertTrue(Auth::guard('web')->check());
        $this->assertFalse(Auth::guard('admin')->check());

        // Attempt to access admin dashboard
        $response = $this->get('/admin');
        $response->assertStatus(403);
    }

    public function test_customer_login_via_admin_portal_is_strictly_rejected(): void
    {
        $response = $this->post('/admin/login', [
            'login' => 'john.customer@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertSessionHasErrors(['login']);
        $this->assertFalse(Auth::guard('admin')->check());
        $this->assertFalse(Auth::guard('web')->check());
    }

    public function test_staff_login_authenticates_strictly_on_admin_guard(): void
    {
        $response = $this->post('/admin/login', [
            'login' => 'alice.staff@gkwhizwheel.com',
            'password' => 'Password123!',
        ]);

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertTrue(Auth::guard('admin')->check());
        $this->assertFalse(Auth::guard('web')->check());
        $this->assertSame($this->staff->id, Auth::guard('admin')->id());
    }

    public function test_dual_guard_session_isolation_allows_concurrent_customer_and_admin_sessions(): void
    {
        // 1. Log in as customer on web guard
        $this->post('/login', [
            'login' => 'john.customer@example.com',
            'password' => 'Password123!',
        ]);

        $this->assertTrue(Auth::guard('web')->check());
        $this->assertFalse(Auth::guard('admin')->check());

        // 2. Concurrently log in as staff on admin guard
        $this->post('/admin/login', [
            'login' => 'alice.staff@gkwhizwheel.com',
            'password' => 'Password123!',
        ]);

        // Both guards are active simultaneously without collision
        $this->assertTrue(Auth::guard('web')->check());
        $this->assertTrue(Auth::guard('admin')->check());
        $this->assertSame($this->customer->id, Auth::guard('web')->id());
        $this->assertSame($this->staff->id, Auth::guard('admin')->id());

        // 3. Customer page reflects auth.user and auth.admin in Inertia
        $homeResponse = $this->get('/');
        $homeResponse->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.id', $this->customer->id)
            ->where('auth.admin.id', $this->staff->id)
        );

        // 4. Admin logout only clears admin guard, leaving web customer session intact
        $logoutAdminResponse = $this->post('/admin/logout');
        $logoutAdminResponse->assertRedirect('/admin/login');

        $this->assertFalse(Auth::guard('admin')->check());
        $this->assertTrue(Auth::guard('web')->check());
        $this->assertSame($this->customer->id, Auth::guard('web')->id());

        // 5. Customer logout clears web guard
        $logoutCustomerResponse = $this->post('/logout');
        $logoutCustomerResponse->assertRedirect('/');

        $this->assertFalse(Auth::guard('web')->check());
        $this->assertFalse(Auth::guard('admin')->check());
    }

    public function test_unauthenticated_admin_routes_redirect_to_admin_login(): void
    {
        // Unauthenticated access to admin portal routes must redirect to admin.login
        $this->get('/admin')->assertRedirect(route('admin.login'));
        $this->get('/admin/dashboard')->assertRedirect(route('admin.login'));
        $this->get('/admin/check-in')->assertRedirect(route('admin.login'));

        // Unauthenticated access to customer account routes must redirect to login
        $this->get('/account')->assertRedirect(route('login'));

        // Unauthenticated JSON requests receive 401 Unauthenticated
        $this->getJson('/admin/dashboard')
            ->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_admin_session_timeout_enforces_30_minute_inactivity_logout(): void
    {
        // Log in customer on web guard and staff on admin guard
        $this->post('/login', [
            'login' => 'john.customer@example.com',
            'password' => 'Password123!',
        ]);

        $this->post('/admin/login', [
            'login' => 'alice.staff@gkwhizwheel.com',
            'password' => 'Password123!',
        ]);

        $this->assertTrue(Auth::guard('admin')->check());
        $this->assertTrue(Auth::guard('web')->check());

        // Fast-forward session inactivity beyond 30 minutes (1801 seconds)
        session(['admin.last_activity_time' => time() - 1801]);

        $response = $this->get('/admin');

        $response->assertRedirect(route('admin.login'));
        $response->assertSessionHas('error', 'Your admin session has expired due to 30 minutes of inactivity. Please sign in again.');

        // Admin guard is logged out, but customer session remains intact
        $this->assertFalse(Auth::guard('admin')->check());
        $this->assertTrue(Auth::guard('web')->check());
        $this->assertSame($this->customer->id, Auth::guard('web')->id());
    }

    public function test_sanctum_tokens_have_isolated_abilities_and_admin_endpoints_require_admin_access(): void
    {
        // 1. Customer API login generates token without admin-access
        $customerLogin = $this->postJson('/api/v1/auth/login', [
            'login' => 'john.customer@example.com',
            'password' => 'Password123!',
        ]);

        $customerLogin->assertStatus(200);
        $customerToken = $customerLogin->json('data.token');
        $this->assertNotEmpty($customerToken);

        // 2. Customer token cannot access admin API endpoints (403 Forbidden)
        $customerAdminCall = $this->withHeader('Authorization', 'Bearer '.$customerToken)
            ->getJson('/api/v1/admin/pricing-rules');

        $customerAdminCall->assertStatus(403);

        // 3. Super Admin API login generates token with admin-access
        $this->app['auth']->forgetGuards();

        $superAdmin = User::create([
            'name' => 'Super Admin API',
            'email' => 'superadmin.api@gkwhizwheel.com',
            'phone' => '9876543299',
            'password' => Hash::make('Password123!'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
        ]);

        $adminLogin = $this->postJson('/api/v1/auth/login', [
            'login' => 'superadmin.api@gkwhizwheel.com',
            'password' => 'Password123!',
        ]);

        $adminLogin->assertStatus(200);
        $adminToken = $adminLogin->json('data.token');
        $this->assertNotEmpty($adminToken);

        // 4. Admin token can successfully access admin API endpoints (200 OK)
        $this->app['auth']->forgetGuards();

        $adminCall = $this->withHeader('Authorization', 'Bearer '.$adminToken)
            ->getJson('/api/v1/admin/pricing-rules');

        $adminCall->assertStatus(200);
    }

    public function test_admin_roles_strictly_enforce_2fa_before_granting_access(): void
    {
        // Super Admin without 2FA must be routed to 2FA setup and logged out of admin guard
        $superAdmin = User::create([
            'name' => 'Super Admin 2FA',
            'email' => 'superadmin.2fa@gkwhizwheel.com',
            'phone' => '9876543298',
            'password' => Hash::make('Password123!'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
        ]);

        $responseNo2Fa = $this->post('/admin/login', [
            'login' => 'superadmin.2fa@gkwhizwheel.com',
            'password' => 'Password123!',
        ]);

        $responseNo2Fa->assertRedirect(route('admin.2fa.setup'));
        $this->assertFalse(Auth::guard('admin')->check());

        // Attempting to access admin dashboard directly redirects to admin.login
        $this->get('/admin')->assertRedirect(route('admin.login'));

        // Super Admin with 2FA confirmed must be routed to 2FA challenge and logged out of admin guard
        $superAdmin->forceFill([
            'two_factor_secret' => 'SECRET1234567890',
            'two_factor_confirmed_at' => now(),
        ])->save();

        $responseWith2Fa = $this->post('/admin/login', [
            'login' => 'superadmin.2fa@gkwhizwheel.com',
            'password' => 'Password123!',
        ]);

        $responseWith2Fa->assertRedirect(route('admin.2fa.challenge'));
        $this->assertFalse(Auth::guard('admin')->check());

        // Attempting to access admin dashboard directly redirects to admin.login
        $this->get('/admin')->assertRedirect(route('admin.login'));
    }
}
