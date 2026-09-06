<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Auth;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the customer to the Google authentication page.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        // Graceful handling if Google API keys are not configured yet
        if (empty($clientId) || empty($clientSecret)) {
            return redirect()->route('login')->withErrors([
                'login' => 'Google Login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env. Please use mobile or email sign-in in the meantime.',
            ]);
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback returned from Google OAuth.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        try {
            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = Socialite::driver('google')->user();

            $email = $googleUser->getEmail();
            $googleId = $googleUser->getId();
            $avatar = $googleUser->getAvatar();
            $name = $googleUser->getName() ?: 'Honnavar Explorer';

            // 1. Look for existing user by google_id
            $user = User::where('google_id', $googleId)->first();

            // 2. If not found by google_id, check by email
            if (! $user && $email) {
                $user = User::where('email', $email)->first();
                if ($user) {
                    $user->update([
                        'google_id' => $googleId,
                        'avatar' => $avatar ?: $user->avatar,
                        'email_verified_at' => $user->email_verified_at ?: now(),
                    ]);
                }
            }

            // 3. If still no user, create a brand new CUSTOMER account
            if (! $user) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'role' => UserRole::CUSTOMER,
                    'status' => UserStatus::ACTIVE,
                    'whatsapp_opt_in' => true,
                    'email_verified_at' => now(),
                ]);
            }

            // Check if suspended
            if ($user->status === UserStatus::BLACKLISTED) {
                return redirect()->route('login')->withErrors([
                    'login' => 'This account has been suspended or deactivated.',
                ]);
            }

            Auth::login($user, true);
            $request->session()->regenerate();

            if ($user->role === UserRole::CUSTOMER) {
                return redirect()->intended(route('account.index'))->with('success', 'Welcome, ' . $user->name . '! Signed in via Google.');
            }

            return redirect()->intended(route('admin.dashboard'));
        } catch (Throwable $e) {
            Log::error('Google OAuth callback failed: ' . $e->getMessage());

            return redirect()->route('login')->withErrors([
                'login' => 'Google sign-in was cancelled or encountered an issue. Please try again or use your password.',
            ]);
        }
    }
}
