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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the customer to the Google authentication page.
     */
    public function redirectToGoogle(Request $request): RedirectResponse
    {
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        // Graceful handling if Google API keys are not configured yet
        if (empty($clientId) || empty($clientSecret)) {
            return redirect()->route('login')->withErrors([
                'login' => 'Google Login requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env. Please use mobile or email sign-in in the meantime.',
            ]);
        }

        // Preserve customer's current booking/page URL so OAuth returns them right back to checkout
        $redirect = $request->query('redirect');
        if (is_string($redirect)
            && str_starts_with($redirect, '/')
            && ! str_starts_with($redirect, '//')
            && ! str_starts_with($redirect, '/\\')
            && ! str_starts_with($redirect, '/admin')) {
            $request->session()->put('url.intended', url($redirect));
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
            $rawUser = is_array($googleUser->user) ? $googleUser->user : [];
            $emailVerified = (bool) ($rawUser['email_verified'] ?? $rawUser['verified_email'] ?? false);

            if (! $email || ! $emailVerified) {
                Log::warning('Google OAuth rejected: email missing or unverified by Google');

                return redirect()->route('login')->withErrors([
                    'login' => 'Your Google account email must be verified to sign in.',
                ]);
            }

            // 1. Look for existing user by google_id
            $user = User::where('google_id', $googleId)->first();

            // 2. If not found by google_id, check by verified email (customers only)
            if (! $user) {
                $existingByEmail = User::where('email', strtolower($email))->first();
                if ($existingByEmail) {
                    if ($existingByEmail->role !== UserRole::CUSTOMER) {
                        Log::warning('Google OAuth rejected: non-customer account', ['user_id' => $existingByEmail->id]);

                        return redirect()->route('login')->withErrors([
                            'login' => 'Staff and Admin accounts must sign in through the Staff Portal with password and 2FA.',
                        ]);
                    }

                    // OWASP pre-hijacking defense: if an existing customer account never verified
                    // its email, invalidate any pre-set password and active tokens before linking
                    // the Google-verified identity so an attacker who pre-registered cannot retain access.
                    $wasUnverified = $existingByEmail->email_verified_at === null;
                    $updates = [
                        'google_id' => $googleId,
                        'avatar' => $avatar ?: $existingByEmail->avatar,
                    ];
                    if ($wasUnverified && ! empty($existingByEmail->password)) {
                        $updates['password'] = Hash::make(Str::random(40));
                    }
                    $existingByEmail->update($updates);
                    if ($wasUnverified) {
                        $existingByEmail->tokens()->delete();
                        $existingByEmail->forceFill(['email_verified_at' => now()])->save();
                    }
                    $user = $existingByEmail;
                }
            }

            // 3. If still no user, create a brand new CUSTOMER account
            if (! $user) {
                $user = User::create([
                    'name' => $name,
                    'email' => strtolower($email),
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'role' => UserRole::CUSTOMER,
                    'status' => UserStatus::ACTIVE,
                    'whatsapp_opt_in' => true,
                ]);
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            if ($user->role !== UserRole::CUSTOMER) {
                return redirect()->route('login')->withErrors([
                    'login' => 'Staff and Admin accounts must sign in through the Staff Portal with password and 2FA.',
                ]);
            }

            // Check if suspended
            if ($user->status === UserStatus::BLACKLISTED) {
                return redirect()->route('login')->withErrors([
                    'login' => 'This account has been suspended or deactivated.',
                ]);
            }

            Auth::guard('web')->login($user);
            $request->session()->regenerate();

            return redirect()->intended(route('account.index'))->with('success', 'Welcome, ' . $user->name . '! Signed in via Google.');
        } catch (Throwable $e) {
            Log::error('Google OAuth callback failed: ' . $e->getMessage());

            return redirect()->route('login')->withErrors([
                'login' => 'Google sign-in was cancelled or encountered an issue. Please try again or use your password.',
            ]);
        }
    }
}
