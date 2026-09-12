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
use Inertia\Inertia;
use Inertia\Response;

class AdminAuthController extends Controller
{
    /**
     * Display the login view (Customer or Admin).
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $isAdminRoute = $request->is('admin/*') || $request->routeIs('admin.*');

        if ($user !== null) {
            if (in_array($user->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true)) {
                return redirect()->route('admin.dashboard');
            }

            if ($isAdminRoute) {
                // User is a customer attempting to reach admin login; log them out of customer session
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            } else {
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
        $user = $request->user();

        if ($user !== null) {
            return redirect()->route('account.index');
        }

        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'initialTab' => 1, // Pre-select Sign Up
        ]);
    }

    /**
     * Handle an incoming authentication request for both customers and staff.
     */
    public function store(Request $request): RedirectResponse
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
        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($throttleKey, $lockoutSeconds);

            return back()->withErrors([
                'login' => 'Invalid email/phone or password.',
            ])->onlyInput('login');
        }

        if ($user->status === UserStatus::BLACKLISTED) {
            RateLimiter::hit($throttleKey, $lockoutSeconds);

            return back()->withErrors([
                'login' => 'This account has been suspended or deactivated.',
            ])->onlyInput('login');
        }

        $isAdminRoute = $request->is('admin/*') || $request->routeIs('admin.login*');
        if ($isAdminRoute && $user->role === UserRole::CUSTOMER) {
            RateLimiter::hit($throttleKey, $lockoutSeconds);

            return back()->withErrors([
                'login' => 'Access denied. Customer accounts cannot access the admin console.',
            ])->onlyInput('login');
        }

        RateLimiter::clear($throttleKey);

        $remember = (bool) ($validated['remember'] ?? false);

        // Two-Factor Authentication enforcement for admin & staff:
        if ($user->role !== UserRole::CUSTOMER) {
            // If user already has 2FA enabled, challenge for TOTP code
            if ($user->hasTwoFactorEnabled()) {
                $request->session()->put([
                    'login.2fa.user_id' => $user->id,
                    'login.2fa.remember' => $remember,
                ]);

                return redirect()->route('admin.2fa.challenge');
            }

            // Super Admin and Store Manager: 2FA is required at minimum
            if ($user->requiresTwoFactor()) {
                $request->session()->put([
                    'login.2fa.user_id' => $user->id,
                    'login.2fa.remember' => $remember,
                    'login.2fa.setup_required' => true,
                ]);

                return redirect()->route('admin.2fa.setup');
            }
        }

        Auth::login($user, $remember);

        $request->session()->regenerate();

        if ($user->role === UserRole::CUSTOMER) {
            $intended = session()->get('url.intended');
            if ($intended && ! str_contains($intended, '/admin')) {
                return redirect()->intended(route('account.index'));
            }
            return redirect()->route('account.index');
        }

        // For staff, store_manager, and super_admin:
        $intended = session()->get('url.intended');
        if ($intended && str_contains($intended, '/admin') && ! str_contains($intended, '/admin/login')) {
            return redirect()->intended(route('admin.dashboard'));
        }

        return redirect()->route('admin.dashboard');
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
        $request->session()->forget(['login.2fa.user_id', 'login.2fa.remember', 'login.2fa.setup_required']);

        Auth::login($user, $remember);
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
        $user = $request->user();

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
        $secret = $user->two_factor_secret;
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
            'userRole' => $user->role->value,
        ]);
    }

    /**
     * Confirm and activate Two-Factor Authentication.
     */
    public function twoFactorConfirm(Request $request, TwoFactorService $twoFactorService): RedirectResponse
    {
        $user = $request->user();

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

        if (! Auth::check()) {
            $remember = (bool) $request->session()->get('login.2fa.remember', false);
            Auth::login($user, $remember);
            $request->session()->forget(['login.2fa.user_id', 'login.2fa.remember', 'login.2fa.setup_required']);
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
        $user = $request->user();

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
        $user = $request->user();

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

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('account.index')->with('success', 'Account created successfully! Welcome to GK WhizWheels.');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): mixed
    {
        $isAdminRoute = $request->is('admin/*') || $request->routeIs('admin.*');

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $targetUrl = $isAdminRoute ? route('admin.login') : route('home');

        if ($request->header('X-Inertia')) {
            return \Inertia\Inertia::location($targetUrl);
        }

        return redirect($targetUrl)->with('success', 'You have been logged out successfully.');
    }
}
