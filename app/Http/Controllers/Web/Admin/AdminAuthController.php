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
     * Display the admin & staff login view.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user !== null && in_array($user->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true)) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Admin/Login', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request for admin/staff.
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

        if ($user->role === UserRole::CUSTOMER) {
            return back()->withErrors([
                'login' => 'Customer accounts cannot log in to the Staff & Admin portal. Please use the customer portal.',
            ])->onlyInput('login');
        }

        $remember = (bool) ($validated['remember'] ?? false);
        Auth::login($user, $remember);

        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')->with('success', 'You have been logged out successfully.');
    }
}
