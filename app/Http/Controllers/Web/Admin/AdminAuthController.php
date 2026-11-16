<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuthController extends Controller
{
    /**
     * Display the login view (Customer or Admin).
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $isAdminRoute = $request->is('admin/*') || $request->routeIs('admin.*');

        if ($isAdminRoute) {
            $adminUser = Auth::guard('admin')->user();
            if ($adminUser !== null && $adminUser->isStaffOrAdmin()) {
                return redirect()->route('admin.dashboard');
            }
        } else {
            $customerUser = Auth::guard('web')->user();
            if ($customerUser !== null) {
                return redirect()->route('account.index');
            }
        }

        $component = $isAdminRoute ? 'Admin/Login' : 'Auth/Login';

        return Inertia::render($component, [
            'status' => session('status'),
            'initialTab' => 0, // 0 for Login, 1 for Sign Up
        ]);
    }

    /**
     * Display the customer sign up view.
     */
    public function createRegister(Request $request): Response|RedirectResponse
    {
        $user = Auth::guard('web')->user();

        if ($user !== null) {
            return redirect()->route('account.index');
        }

        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'initialTab' => 1, // Pre-select Sign Up
        ]);
    }

    /**
     * Route incoming authentication request to either admin guard or web guard.
     */
    public function store(Request $request): RedirectResponse
    {
        $isAdminRoute = $request->is('admin/*') || $request->routeIs('admin.login*');

        if ($isAdminRoute) {
            return $this->storeAdmin($request);
        }

        return $this->storeCustomer($request);
    }

    /**
     * Handle incoming admin/staff authentication request using the admin guard.
     */
    public function storeAdmin(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $throttleKey = 'login.account:' . Str::transliterate(Str::lower($validated['login']));
        $maxAttempts = 5;
        $lockoutSeconds = 300; // 5 minutes lockout

        if (RateLimiter::tooManyAttempts($throttleKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return back()->withErrors([
                'login' => "Too many login attempts. This account is temporarily locked. Please try again in {$seconds} seconds.",
            ])->onlyInput('login');
        }

        $identifier = $validated['login'];
        $remember = (bool) ($validated['remember'] ?? false);

        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        $credentials = $user
            ? ['email' => $user->email, 'password' => $validated['password']]
            : ['email' => $identifier, 'password' => $validated['password']];

        if (! Auth::guard('admin')->attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey, $lockoutSeconds);

            return back()->withErrors([
                'login' => 'Invalid email/phone or password.',
            ])->onlyInput('login');
        }

        /** @var \App\Models\User $authenticatedUser */
        $authenticatedUser = Auth::guard('admin')->user();

        if ($authenticatedUser->status === UserStatus::BLACKLISTED) {
            Auth::guard('admin')->logout();
            RateLimiter::hit($throttleKey, $lockoutSeconds);

            throw ValidationException::withMessages([
                'login' => 'This account has been suspended or deactivated.',
            ]);
        }

        // Strict Spatie Role check post-login:
        // User must have super_admin, admin, store_manager, or staff roles
        $allowedRoles = ['super_admin', 'superadmin', 'admin', 'store_manager', 'staff', 'manager'];
        $hasAuthorizedRole = false;
        try {
            $hasAuthorizedRole = $authenticatedUser->hasAnyRole($allowedRoles);
        } catch (\Throwable) {
            $hasAuthorizedRole = false;
        }

        if (! $hasAuthorizedRole) {
            $roleVal = $authenticatedUser->role instanceof UserRole ? $authenticatedUser->role->value : (string) $authenticatedUser->role;
            $hasAuthorizedRole = in_array($roleVal, $allowedRoles, true) || $authenticatedUser->isStaffOrAdmin();
        }

        if (! $hasAuthorizedRole) {
            Auth::guard('admin')->logout();
            RateLimiter::hit($throttleKey, $lockoutSeconds);

            throw ValidationException::withMessages([
                'login' => 'Unauthorized access to admin portal.',
            ]);
        }

        RateLimiter::clear($throttleKey);

        // Two-Factor Authentication enforcement for admin & staff:
        if ($authenticatedUser->hasTwoFactorEnabled()) {
            Auth::guard('admin')->logout();
            $request->session()->put([
                'login.2fa.user_id' => $authenticatedUser->id,
                'login.2fa.remember' => $remember,
                'login.2fa.guard' => 'admin',
            ]);

            return redirect()->route('admin.2fa.challenge');
        }

        if ($authenticatedUser->requiresTwoFactor()) {
            Auth::guard('admin')->logout();
            $request->session()->put([
                'login.2fa.user_id' => $authenticatedUser->id,
                'login.2fa.remember' => $remember,
                'login.2fa.setup_required' => true,
                'login.2fa.guard' => 'admin',
            ]);

            return redirect()->route('admin.2fa.setup');
        }

        $request->session()->put('admin.last_activity_time', time());
        $request->session()->regenerate();

        $intended = session()->get('url.intended');
        if ($intended && str_contains($intended, '/admin') && ! str_contains($intended, '/admin/login')) {
            return redirect()->intended(route('admin.dashboard'));
        }

        return redirect()->route('admin.dashboard');
    }

    /**
     * Handle incoming public/customer authentication request using the default web guard.
     */
    public function storeCustomer(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $throttleKey = 'login.customer:' . Str::transliterate(Str::lower($validated['login']));
        $maxAttempts = 5;
        $lockoutSeconds = 300;

        if (RateLimiter::tooManyAttempts($throttleKey, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return back()->withErrors([
                'login' => "Too many login attempts. This account is temporarily locked. Please try again in {$seconds} seconds.",
            ])->onlyInput('login');
        }

        $identifier = $validated['login'];
        $remember = (bool) ($validated['remember'] ?? false);

        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        $credentials = $user
            ? ['email' => $user->email, 'password' => $validated['password']]
            : ['email' => $identifier, 'password' => $validated['password']];

        if (! Auth::guard('web')->attempt($credentials, $remember)) {
            RateLimiter::hit($throttleKey, $lockoutSeconds);

            return back()->withErrors([
                'login' => 'Invalid email/phone or password.',
            ])->onlyInput('login');
        }

        /** @var \App\Models\User $authenticatedUser */
        $authenticatedUser = Auth::guard('web')->user();

        if ($authenticatedUser->status === UserStatus::BLACKLISTED) {
            Auth::guard('web')->logout();
            RateLimiter::hit($throttleKey, $lockoutSeconds);

            return back()->withErrors([
                'login' => 'This account has been suspended or deactivated.',
            ])->onlyInput('login');
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        // Customer login strictly operates on the web guard with customer privileges.
        // It strictly does not touch the admin guard.
        $intended = session()->get('url.intended');
        if ($intended && ! str_contains($intended, '/admin')) {
            return redirect()->intended(route('account.index'));
        }

        return redirect()->route('account.index');
    }

    /**
     * Display the Two-Factor Authentication challenge screen.
     */
    public function twoFactorChallenge(Request $request): Response|RedirectResponse
    {
        $userId = $request->session()->get('login.2fa.user_id');

        if (! $userId) {
            return redirect()->route('admin.login');
        }

        $user = User::find($userId);
        if (! $user) {
            $request->session()->forget(['login.2fa.user_id', 'login.2fa.remember']);
            return redirect()->route('admin.login');
        }

        return Inertia::render('Admin/TwoFactorChallenge', [
            'status' => session('status'),
            'userEmail' => $user->email,
        ]);
    }

    /**
     * Authenticate a Two-Factor Authentication challenge attempt.
     */
    public function twoFactorAuthenticate(Request $request, TwoFactorService $twoFactorService): RedirectResponse
    {
        $userId = $request->session()->get('login.2fa.user_id');
        $remember = (bool) $request->session()->get('login.2fa.remember', false);

        if (! $userId) {
            return redirect()->route('admin.login');
        }

        $user = User::find($userId);
        if (! $user) {
            $request->session()->forget(['login.2fa.user_id', 'login.2fa.remember']);
            return redirect()->route('admin.login');
        }

        $throttleKey = '2fa.account:' . $user->id;
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'code' => "Too many invalid 2FA attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        $validated = $request->validate([
            'code' => ['nullable', 'string'],
            'recovery_code' => ['nullable', 'string'],
        ]);

        $code = $validated['code'] ?? null;
        $recoveryCode = $validated['recovery_code'] ?? null;

        $valid = false;

        if (! empty($code) && ! empty($user->two_factor_secret)) {
            $valid = $twoFactorService->verify($user->two_factor_secret, (string) $code);
        } elseif (! empty($recoveryCode)) {
            $valid = $twoFactorService->verifyAndConsumeRecoveryCode($user, (string) $recoveryCode);
        }

        if (! $valid) {
            RateLimiter::hit($throttleKey, 300);
            return back()->withErrors([
                'code' => 'The provided two-factor authentication code or recovery code is invalid.',
            ]);
        }

        RateLimiter::clear($throttleKey);
        $guard = $request->session()->get('login.2fa.guard', 'admin');
        $request->session()->forget(['login.2fa.user_id', 'login.2fa.remember', 'login.2fa.setup_required', 'login.2fa.guard']);

        Auth::guard($guard)->login($user, $remember);
        $request->session()->put('admin.last_activity_time', time());
        $request->session()->regenerate();

        $intended = session()->get('url.intended');
        if ($intended && str_contains($intended, '/admin') && ! str_contains($intended, '/admin/login')) {
            return redirect()->intended(route('admin.dashboard'));
        }

        return redirect()->route('admin.dashboard');
    }

    /**
     * Display the Two-Factor Authentication setup screen.
     */
    public function twoFactorSetup(Request $request, TwoFactorService $twoFactorService): Response|RedirectResponse
    {
        $user = Auth::guard('admin')->user() ?? $request->user();

        if (! $user) {
            $userId = $request->session()->get('login.2fa.user_id');
            if ($userId) {
                $user = User::find($userId);
            }
        }

        if (! $user) {
            return redirect()->route('admin.login');
        }

        // Generate or retrieve unconfirmed secret key
        $secret = null;
        try {
            $secret = $user->two_factor_secret;
        } catch (\Throwable) {
            $secret = null;
        }
        if (empty($secret)) {
            $secret = $twoFactorService->generateSecretKey();
            $user->forceFill(['two_factor_secret' => $secret])->save();
        }

        $qrCode = $twoFactorService->getQrCodeDataUri($user->email, $secret);

        return Inertia::render('Admin/TwoFactorSetup', [
            'qrCode' => $qrCode,
            'secretKey' => $secret,
            'isRequired' => $user->requiresTwoFactor(),
            'isConfirmed' => $user->hasTwoFactorEnabled(),
            'userRole' => $user->role instanceof UserRole ? $user->role->value : (string) $user->role,
        ]);
    }

    /**
     * Confirm and activate Two-Factor Authentication.
     */
    public function twoFactorConfirm(Request $request, TwoFactorService $twoFactorService): RedirectResponse
    {
        $user = Auth::guard('admin')->user() ?? $request->user();

        if (! $user) {
            $userId = $request->session()->get('login.2fa.user_id');
            if ($userId) {
                $user = User::find($userId);
            }
        }

        if (! $user) {
            return redirect()->route('admin.login');
        }

        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        if (! $twoFactorService->verify((string) $user->two_factor_secret, $validated['code'])) {
            return back()->withErrors([
                'code' => 'The provided two-factor authentication code is invalid. Please check your authenticator app and try again.',
            ]);
        }

        $recoveryCodes = $twoFactorService->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => $recoveryCodes,
        ])->save();

        $guard = $request->session()->get('login.2fa.guard', 'admin');
        if (! Auth::guard($guard)->check()) {
            $remember = (bool) $request->session()->get('login.2fa.remember', false);
            Auth::guard($guard)->login($user, $remember);
            $request->session()->forget(['login.2fa.user_id', 'login.2fa.remember', 'login.2fa.setup_required', 'login.2fa.guard']);
            $request->session()->put('admin.last_activity_time', time());
        $request->session()->regenerate();
        }

        $request->session()->put('admin.2fa.new_recovery_codes', $recoveryCodes);

        return redirect()->route('admin.2fa.recovery-codes')->with('success', 'Two-factor authentication has been successfully activated!');
    }

    /**
     * Display the Two-Factor Authentication recovery codes screen.
     */
    public function twoFactorRecoveryCodes(Request $request): Response|RedirectResponse
    {
        $user = Auth::guard('admin')->user() ?? $request->user();

        if (! $user) {
            return redirect()->route('admin.login');
        }

        $codes = session('admin.2fa.new_recovery_codes') ?? $user->two_factor_recovery_codes ?? [];

        return Inertia::render('Admin/TwoFactorRecoveryCodes', [
            'recoveryCodes' => $codes,
        ]);
    }

    /**
     * Disable Two-Factor Authentication (Allowed for Staff, Forbidden for Super Admin & Store Manager).
     */
    public function twoFactorDisable(Request $request): RedirectResponse
    {
        $user = Auth::guard('admin')->user() ?? $request->user();

        if (! $user) {
            return redirect()->route('admin.login');
        }

        if ($user->requiresTwoFactor()) {
            return back()->withErrors([
                'two_factor' => 'Two-factor authentication is mandatory for Super Admin and Store Manager roles and cannot be disabled.',
            ]);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return back()->with('success', 'Two-factor authentication has been disabled.');
    }

    /**
     * Handle customer registration.
     */
    public function storeRegister(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', Password::min(12)->uncompromised()],
            'whatsapp_opt_in' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
            'whatsapp_opt_in' => (bool) ($validated['whatsapp_opt_in'] ?? true),
        ]);

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return redirect()->route('account.index')->with('success', 'Account created successfully! Welcome to GK WhizWheels.');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): mixed
    {
        $isAdminRoute = $request->is('admin/*') || $request->routeIs('admin.*') || $request->has('admin');

        if ($isAdminRoute) {
            Auth::guard('admin')->logout();
            $request->session()->forget(['admin.last_activity_time', 'admin.active_store_id']);
            // If the active web session is also staff/admin, clear it on admin logout
            if (Auth::guard('web')->check() && Auth::guard('web')->user()?->isStaffOrAdmin()) {
                Auth::guard('web')->logout();
            }
            $targetUrl = route('admin.login');
        } else {
            Auth::guard('web')->logout();
            $targetUrl = route('home');
        }

        // Invalidate session if no guards remain authenticated; otherwise preserve other active guard session
        if (! Auth::guard('admin')->check() && ! Auth::guard('web')->check()) {
            $request->session()->invalidate();
        }
        $request->session()->regenerateToken();

        if ($request->header('X-Inertia')) {
            return \Inertia\Inertia::location($targetUrl);
        }

        return redirect($targetUrl)->with('success', 'You have been logged out successfully.');
    }
}
