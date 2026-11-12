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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

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
        $identifier = $request->validated('email') ?? $request->validated('phone') ?? $request->validated('login');

        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user || ! $user->password || ! Hash::check((string) $request->validated('password'), $user->password)) {
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
        $email = $request->validated('email');

        $user = User::where('email', $email)->first();

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
        $email = $request->validated('email');
        $otp = $request->validated('otp');
        $cachedOtp = Cache::get("otp:{$email}");

        if (! $cachedOtp || (string) $cachedOtp !== (string) $otp) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Invalid or expired OTP.',
                'errors' => [
                    'otp' => ['Invalid or expired OTP.'],
                ],
            ], 422);
        }

        Cache::forget("otp:{$email}");

        $user = User::where('email', $email)->first();

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
            $user->update(['email_verified_at' => now()]);
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
        $request->user()?->currentAccessToken()?->delete();

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

        // 1. Search for existing user by phone or email
        $existing = User::where(function ($q) use ($cleanPhone): void {
                $q->where('phone', $cleanPhone)
                    ->orWhere('phone', '91'.$cleanPhone)
                    ->orWhere('phone', '+91'.$cleanPhone);
            })
            ->orWhere(function ($q) use ($email): void {
                if ($email !== null) {
                    $q->where('email', $email);
                }
            })
            ->first();

        if ($existing) {
            if ($existing->status === UserStatus::BLACKLISTED) {
                return response()->json([
                    'success' => false,
                    'status' => 'suspended',
                    'message' => 'This account has been suspended or deactivated.',
                ], 403);
            }

            // Generate 6-digit OTP cached for 10 minutes
            $otp = (string) random_int(100000, 999999);
            Cache::put("checkout_otp:{$existing->id}", $otp, now()->addMinutes(10));

            // Deliver via Mail if email available
            if ($existing->email && filter_var($existing->email, FILTER_VALIDATE_EMAIL)) {
                try {
                    Notification::route('mail', $existing->email)->notify(new OtpNotification($otp));
                } catch (\Throwable) {}
            }

            // Deliver via WhatsApp if phone available
            if ($existing->phone) {
                try {
                    Notification::route(\App\Channels\WhatsAppChannel::class, $existing->phone)->notify(new OtpNotification($otp));
                } catch (\Throwable) {}
            }

            $maskedPhone = substr($existing->phone ?? $cleanPhone, 0, 2).'******'.substr($existing->phone ?? $cleanPhone, -2);
            $maskedEmail = null;
            if ($existing->email) {
                $parts = explode('@', $existing->email);
                $maskedEmail = substr($parts[0], 0, 2).'***@'.($parts[1] ?? '');
            }

            return response()->json([
                'success' => true,
                'status' => 'otp_required',
                'user_id' => $existing->id,
                'masked_phone' => $maskedPhone,
                'masked_email' => $maskedEmail,
                'message' => 'Welcome back! We found your existing account. Please enter the 6-digit verification code sent to your phone/email to continue.',
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
            'email_verified_at' => $email ? now() : null,
        ]);

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
        $otp = $validated['otp'];
        $cachedOtp = Cache::get("checkout_otp:{$userId}");

        if (! $cachedOtp || (string) $cachedOtp !== (string) $otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code. Please try again.',
                'errors' => [
                    'otp' => ['Invalid or expired verification code.'],
                ],
            ], 422);
        }

        Cache::forget("checkout_otp:{$userId}");

        $user = User::findOrFail($userId);
        if ($user->status === UserStatus::BLACKLISTED) {
            return response()->json([
                'success' => false,
                'message' => 'This account has been suspended or deactivated.',
            ], 403);
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

        return $user->createToken(
            name: $name,
            abilities: $user->tokenAbilities(),
            expiresAt: now()->addMinutes($expirationMinutes)
        )->plainTextToken;
    }
}
