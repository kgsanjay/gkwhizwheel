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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

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

        $token = $user->createToken('auth_token')->plainTextToken;

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
        $token = $user->createToken('auth_token')->plainTextToken;

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
        $token = $user->createToken('auth_token')->plainTextToken;

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
}
