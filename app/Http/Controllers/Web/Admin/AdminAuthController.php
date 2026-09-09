<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

        $identifier = $validated['login'];
        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user || ! $user->password || ! Hash::check($validated['password'], $user->password)) {
            return back()->withErrors([
                'login' => 'Invalid email/phone or password.',
            ])->onlyInput('login');
        }

        if ($user->status === UserStatus::BLACKLISTED) {
            return back()->withErrors([
                'login' => 'This account has been suspended or deactivated.',
            ])->onlyInput('login');
        }

        $isAdminRoute = $request->is('admin/*') || $request->routeIs('admin.login*');
        if ($isAdminRoute && $user->role === UserRole::CUSTOMER) {
            return back()->withErrors([
                'login' => 'Access denied. Customer accounts cannot access the admin console.',
            ])->onlyInput('login');
        }

        $remember = (bool) ($validated['remember'] ?? false);
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
     * Handle customer registration.
     */
    public function storeRegister(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:6'],
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
