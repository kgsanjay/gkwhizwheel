<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\OtpRequestRequest;
use App\Http\Requests\Auth\OtpVerifyRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Store;
use App\Models\User;
use App\Notifications\OtpNotification;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Throwable;

class AuthController extends Controller
{
    /**
     * Register a new customer account.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => $request->validated('phone'),
            'password' => $request->validated('password'),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
            'whatsapp_opt_in' => $request->boolean('whatsapp_opt_in'),
        ]);

        $token = $this->issueToken($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
            'message' => 'Registration successful.',
        ], 201);
    }

    /**
     * Authenticate via email or phone with password.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $identifier = (string) ($request->validated('email') ?? $request->validated('phone') ?? $request->validated('login'));
        $throttleKey = 'api.login.account:'.Str::transliterate(Str::lower(trim($identifier)));

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
                'errors' => ['login' => ["Too many login attempts. Please try again in {$seconds} seconds."]],
            ], 429);
        }

        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user || ! $user->password || ! Hash::check((string) $request->validated('password'), $user->password)) {
            RateLimiter::hit($throttleKey, 300);

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid credentials.',
                'errors' => [
                    'login' => ['Invalid credentials.'],
                ],
            ], 401);
        }

        if ($user->status === UserStatus::BLACKLISTED) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Account is not active or has been suspended.',
                'errors' => null,
            ], 403);
        }

        // Enforce TOTP 2FA on API login whenever 2FA is active on the account
        if ($user->hasTwoFactorEnabled()) {
            $twoFactorService = app(TwoFactorService::class);
            $code = (string) $request->input('two_factor_code', '');
            $recoveryCode = (string) $request->input('recovery_code', '');
            $verified2fa = false;

            if ($code !== '' && ! empty($user->two_factor_secret)) {
                $verified2fa = $twoFactorService->verify((string) $user->two_factor_secret, $code);
            } elseif ($recoveryCode !== '') {
                $verified2fa = $twoFactorService->verifyAndConsumeRecoveryCode($user, $recoveryCode);
            }

            if (! $verified2fa) {
                RateLimiter::hit($throttleKey, 300);

                return response()->json([
                    'success' => false,
                    'data' => ['two_factor_required' => true],
                    'message' => 'Two-factor authentication code is required.',
                    'errors' => [
                        'two_factor_code' => ['A valid two-factor authentication code is required.'],
                    ],
                ], 422);
            }
        }

        RateLimiter::clear($throttleKey);
        $this->loadUserStores($user);
        $token = $this->issueToken($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
            'message' => 'Logged in successfully.',
        ]);
    }

    /**
     * Request a 6-digit email OTP for passwordless login.
     */
    public function requestOtp(OtpRequestRequest $request): JsonResponse
    {
        $email = strtolower(trim((string) $request->validated('email')));

        $user = User::where('email', $email)
            ->where('role', UserRole::CUSTOMER)
            ->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'No account found with this email address. Please register first.',
                'errors' => [
                    'email' => ['No account found with this email address. Please register first.'],
                ],
            ], 404);
        }

        if ($user->status === UserStatus::BLACKLISTED) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Account is not active or has been suspended.',
                'errors' => null,
            ], 403);
        }

        $otp = (string) random_int(100000, 999999);

        Cache::put("otp:{$email}", $otp, now()->addMinutes(10));
        Cache::forget("otp_attempts:{$email}");

        Notification::route('mail', $email)->notify(new OtpNotification($otp));

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'OTP sent to your email address.',
        ]);
    }

    /**
     * Verify email OTP and return auth token.
     */
    public function verifyOtp(OtpVerifyRequest $request): JsonResponse
    {
        $email = strtolower(trim((string) $request->validated('email')));
        $otp = trim((string) $request->validated('otp'));
        $attemptKey = "otp_attempts:{$email}";
        $attempts = (int) Cache::get($attemptKey, 0);

        if ($attempts >= 5) {
            Cache::forget("otp:{$email}");

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Too many invalid OTP attempts. Please request a new code.',
                'errors' => ['otp' => ['Too many invalid OTP attempts. Please request a new code.']],
            ], 429);
        }

        $cachedOtp = Cache::get("otp:{$email}");

        if (! is_string($cachedOtp) || $cachedOtp === '' || ! hash_equals($cachedOtp, $otp)) {
            $nextAttempts = $attempts + 1;
            Cache::put($attemptKey, $nextAttempts, now()->addMinutes(10));
            if ($nextAttempts >= 5) {
                Cache::forget("otp:{$email}");
            }

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid or expired OTP.',
                'errors' => [
                    'otp' => ['Invalid or expired OTP.'],
                ],
            ], 422);
        }

        $consumed = Cache::pull("otp:{$email}");
        Cache::forget($attemptKey);
        if (! is_string($consumed) || ! hash_equals($consumed, $otp)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid or expired OTP.',
                'errors' => ['otp' => ['Invalid or expired OTP.']],
            ], 422);
        }

        $user = User::where('email', $email)
            ->where('role', UserRole::CUSTOMER)
            ->first();

        if (! $user) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'No account found with this email address. Please register first.',
                'errors' => [
                    'email' => ['No account found with this email address. Please register first.'],
                ],
            ], 404);
        }

        if ($user->status === UserStatus::BLACKLISTED) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Account is not active or has been suspended.',
                'errors' => null,
            ], 403);
        }

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $this->loadUserStores($user);
        $token = $this->issueToken($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
            'message' => 'OTP verified successfully.',
        ]);
    }

    /**
     * Revoke current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user !== null) {
            $this->loadUserStores($user);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user !== null ? new UserResource($user) : null,
            ],
            'message' => '',
        ]);
    }

    /**
     * Update authenticated user profile fields.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'whatsapp_opt_in' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['phone'])) {
            $cleanPhone = preg_replace('/\D+/', '', (string) $validated['phone']) ?? '';
            if (strlen($cleanPhone) === 12 && str_starts_with($cleanPhone, '91')) {
                $cleanPhone = substr($cleanPhone, 2);
            } elseif (strlen($cleanPhone) === 11 && str_starts_with($cleanPhone, '0')) {
                $cleanPhone = substr($cleanPhone, 1);
            }
            $taken = User::where('id', '!=', $user->id)
                ->where(fn ($q) => $q->where('phone', $cleanPhone)->orWhere('phone', '91'.$cleanPhone)->orWhere('phone', '+91'.$cleanPhone))
                ->exists();
            if ($taken) {
                return response()->json([
                    'success' => false,
                    'data' => null,
                    'message' => 'This phone number is already registered with another account.',
                    'errors' => ['phone' => ['This phone number is already registered with another account.']],
                ], 422);
            }
            $validated['phone'] = $cleanPhone;
        }

        $user->update($validated);

        $this->loadUserStores($user);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => new UserResource($user),
            ],
            'message' => 'Profile updated successfully.',
        ]);
    }

    /**
     * Resolve customer account at checkout:
     * - If already authenticated: return current user.
     * - If existing customer by phone or email: challenge with OTP to protect account/KYC.
     * - If brand new customer: auto-create account, log into web session and issue API token.
     */
    public function checkoutResolve(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user !== null) {
            if (empty($user->phone) && $request->filled('phone')) {
                $cleanPhone = preg_replace('/\D+/', '', (string) $request->input('phone')) ?? '';
                if (preg_match('/^[6-9]\d{9}$/', $cleanPhone)) {
                    $taken = User::where('id', '!=', $user->id)
                        ->where(fn ($q) => $q->where('phone', $cleanPhone)->orWhere('phone', '91'.$cleanPhone)->orWhere('phone', '+91'.$cleanPhone))
                        ->exists();
                    if (! $taken) {
                        $user->update(['phone' => $cleanPhone]);
                    }
                }
            }
            $this->loadUserStores($user);

            return response()->json([
                'success' => true,
                'status' => 'authenticated',
                'data' => [
                    'user' => new UserResource($user),
                    'token' => null,
                ],
                'message' => 'Already signed in.',
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['required', 'string', 'regex:/^[6-9]\d{9}$/'],
            'email' => ['nullable', 'email', 'max:150'],
        ]);

        $cleanPhone = preg_replace('/\D+/', '', $validated['phone']) ?? '';
        $email = ! empty($validated['email']) ? strtolower(trim($validated['email'])) : null;

        // 1. Search for existing active user by phone or email (never resurrect soft-deleted accounts)
        $existing = User::where(function ($q) use ($cleanPhone, $email): void {
            $q->where('phone', $cleanPhone)
                ->orWhere('phone', '91'.$cleanPhone)
                ->orWhere('phone', '+91'.$cleanPhone);
            if ($email !== null) {
                $q->orWhere('email', $email);
            }
        })->first();

        if ($existing) {
            if ($existing->role !== UserRole::CUSTOMER) {
                return response()->json([
                    'success' => false,
                    'status' => 'staff_account',
                    'message' => 'Staff and Admin accounts cannot use guest checkout OTP. Please sign in through the Staff Portal.',
                ], 403);
            }

            if ($existing->status === UserStatus::BLACKLISTED) {
                return response()->json([
                    'success' => false,
                    'status' => 'suspended',
                    'message' => 'This account has been suspended or deactivated.',
                ], 403);
            }

            // Never mutate $existing->email or $existing->name before OTP verification;
            // hold safe pending updates in cache and apply only after OTP succeeds.
            $pendingUpdates = [];
            if (! empty($validated['name']) && (empty($existing->name) || str_starts_with($existing->name, 'Customer '))) {
                $pendingUpdates['name'] = $validated['name'];
            }
            if (! empty($email) && (empty($existing->email) || str_ends_with($existing->email, '@whizwheels.local'))) {
                $pendingUpdates['email'] = $email;
            }

            // Generate 6-digit OTP cached for 10 minutes
            $otp = (string) random_int(100000, 999999);
            Cache::put("checkout_otp:{$existing->id}", $otp, now()->addMinutes(10));
            Cache::forget("checkout_otp_attempts:{$existing->id}");
            if ($pendingUpdates !== []) {
                Cache::put("checkout_otp_pending:{$existing->id}", $pendingUpdates, now()->addMinutes(10));
            }
            Log::info('Checkout OTP generated', ['user_id' => $existing->id]);

            try {
                $existing->notify(new OtpNotification($otp));
            } catch (Throwable $e) {
                Log::warning("Could not dispatch OTP notification for user {$existing->id}: ".$e->getMessage());
            }

            $existingPhone = (string) ($existing->phone ?? $cleanPhone);
            $maskedPhone = strlen($existingPhone) >= 4
                ? substr($existingPhone, 0, 2).'******'.substr($existingPhone, -2)
                : '******';
            $existingRealEmail = (! empty($existing->email) && ! str_ends_with($existing->email, '@whizwheels.local'))
                ? $existing->email
                : null;
            $maskedEmail = null;
            if ($existingRealEmail) {
                $parts = explode('@', $existingRealEmail);
                $maskedEmail = substr($parts[0], 0, 2).'***@'.($parts[1] ?? '');
            }

            $exposeDebugOtp = app()->environment('testing');

            return response()->json([
                'success' => true,
                'status' => 'otp_required',
                'user_id' => $existing->id,
                'is_new_user' => false,
                'masked_phone' => $maskedPhone,
                'masked_email' => $maskedEmail,
                'debug_otp' => $exposeDebugOtp ? $otp : null,
                'message' => 'Please enter the 6-digit verification code sent to your registered WhatsApp or Email.',
            ]);
        }

        // 2. Brand new customer: Auto-provision account with zero friction
        $finalEmail = $email ?: ("guest_{$cleanPhone}@whizwheels.local");
        $newUser = User::create([
            'name' => $validated['name'],
            'phone' => $cleanPhone,
            'email' => $finalEmail,
            'password' => Hash::make(Str::random(32)),
            'role' => UserRole::CUSTOMER,
            'status' => UserStatus::ACTIVE,
            'whatsapp_opt_in' => true,
        ]);

        if ($request->boolean('verify_phone')) {
            $otp = (string) random_int(100000, 999999);
            Cache::put("checkout_otp:{$newUser->id}", $otp, now()->addMinutes(10));
            Cache::forget("checkout_otp_attempts:{$newUser->id}");
            Log::info('Checkout OTP generated for new user', ['user_id' => $newUser->id]);

            try {
                $newUser->notify(new OtpNotification($otp));
            } catch (Throwable $e) {
                Log::warning("Could not dispatch OTP notification for new user {$newUser->id}: ".$e->getMessage());
            }

            $maskedPhone = substr($cleanPhone, 0, 2).'******'.substr($cleanPhone, -2);
            $effectiveEmail = $email && ! str_ends_with($email, '@whizwheels.local') ? $email : null;
            $maskedEmail = $effectiveEmail ? substr(explode('@', $effectiveEmail)[0], 0, 2).'***@'.(explode('@', $effectiveEmail)[1] ?? '') : null;
            $exposeDebugOtp = app()->environment('testing');

            return response()->json([
                'success' => true,
                'status' => 'otp_required',
                'user_id' => $newUser->id,
                'is_new_user' => true,
                'masked_phone' => $maskedPhone,
                'masked_email' => $maskedEmail,
                'debug_otp' => $exposeDebugOtp ? $otp : null,
                'message' => 'Please enter the 6-digit verification code sent to your WhatsApp or Email.',
            ]);
        }

        if ($request->hasSession()) {
            Auth::guard('web')->login($newUser);
            $request->session()->regenerate();
        }

        $token = $this->issueToken($newUser);

        return response()->json([
            'success' => true,
            'status' => 'authenticated',
            'data' => [
                'user' => new UserResource($newUser),
                'token' => $token,
            ],
            'message' => 'Customer account created successfully.',
        ], 201);
    }

    /**
     * Verify 6-digit OTP for existing customer at checkout.
     */
    public function checkoutVerifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        $userId = (int) $validated['user_id'];
        $otp = trim((string) $validated['otp']);
        $attemptKey = "checkout_otp_attempts:{$userId}";
        $attempts = (int) Cache::get($attemptKey, 0);

        if ($attempts >= 5) {
            Cache::forget("checkout_otp:{$userId}");
            Cache::forget("checkout_otp_pending:{$userId}");

            return response()->json([
                'success' => false,
                'message' => 'Too many invalid verification attempts. Please request a new code.',
                'errors' => [
                    'otp' => ['Too many invalid verification attempts. Please request a new code.'],
                ],
            ], 429);
        }

        $cachedOtp = Cache::get("checkout_otp:{$userId}");

        if (! is_string($cachedOtp) || $cachedOtp === '' || ! hash_equals($cachedOtp, $otp)) {
            $nextAttempts = $attempts + 1;
            Cache::put($attemptKey, $nextAttempts, now()->addMinutes(10));
            if ($nextAttempts >= 5) {
                Cache::forget("checkout_otp:{$userId}");
                Cache::forget("checkout_otp_pending:{$userId}");
            }
            Log::warning('Checkout OTP mismatch', ['user_id' => $userId]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code. Please check your WhatsApp or Email, or click Resend Code.',
                'errors' => [
                    'otp' => ['Invalid or expired verification code.'],
                ],
            ], 422);
        }

        $consumed = Cache::pull("checkout_otp:{$userId}");
        Cache::forget($attemptKey);
        if (! is_string($consumed) || ! hash_equals($consumed, $otp)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code.',
                'errors' => ['otp' => ['Invalid or expired verification code.']],
            ], 422);
        }

        $user = User::where('role', UserRole::CUSTOMER)->findOrFail($userId);
        if ($user->status === UserStatus::BLACKLISTED) {
            return response()->json([
                'success' => false,
                'message' => 'This account has been suspended or deactivated.',
            ], 403);
        }

        $pending = Cache::pull("checkout_otp_pending:{$userId}");
        if (is_array($pending)) {
            $safeUpdates = [];
            if (! empty($pending['name']) && (empty($user->name) || str_starts_with($user->name, 'Customer '))) {
                $safeUpdates['name'] = $pending['name'];
            }
            if (! empty($pending['email'])
                && (empty($user->email) || str_ends_with($user->email, '@whizwheels.local'))
                && ! User::where('id', '!=', $user->id)->where('email', $pending['email'])->exists()) {
                $safeUpdates['email'] = $pending['email'];
            }
            if ($safeUpdates !== []) {
                $user->update($safeUpdates);
            }
        }

        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        }

        $this->loadUserStores($user);
        $token = $this->issueToken($user);

        return response()->json([
            'success' => true,
            'status' => 'authenticated',
            'csrf_token' => csrf_token(),
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
            'message' => 'Verified and signed in successfully.',
        ]);
    }

    /**
     * Eager load active assigned stores for staff or all active stores for super admin.
     */
    private function loadUserStores(User $user): User
    {
        if ($user->role === UserRole::SUPER_ADMIN) {
            $user->setRelation('stores', Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get());
        } else {
            $user->load(['stores' => fn ($query) => $query->where('status', StoreStatus::ACTIVE)->orderBy('name')]);
        }

        return $user;
    }

    /**
     * Issue a personal access token with role-scoped abilities and defined expiration.
     */
    protected function issueToken(User $user, string $name = 'auth_token'): string
    {
        $expirationMinutes = (int) config('sanctum.expiration', 43200);

        $tokenName = $name !== 'auth_token'
            ? $name
            : ($user->isStaffOrAdmin() ? 'admin-device' : 'auth_token');

        return $user->createToken(
            name: $tokenName,
            abilities: $user->tokenAbilities(),
            expiresAt: now()->addMinutes($expirationMinutes)
        )->plainTextToken;
    }
}
