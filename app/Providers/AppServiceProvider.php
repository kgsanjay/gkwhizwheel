<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Bike::class, \App\Policies\BikePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\PricingRule::class, \App\Policies\PricingRulePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Coupon::class, \App\Policies\CouponPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Store::class, \App\Policies\StorePolicy::class);

        \Illuminate\Support\Facades\Event::listen(
            \Illuminate\Notifications\Events\NotificationSent::class,
            [\App\Listeners\LogNotificationAttempt::class, 'handleSent']
        );
        \Illuminate\Support\Facades\Event::listen(
            \Illuminate\Notifications\Events\NotificationFailed::class,
            [\App\Listeners\LogNotificationAttempt::class, 'handleFailed']
        );

        // Security: rate limiters for auth, otp, contact, coupons, bookings, payments, uploads, and reviews
        \Illuminate\Support\Facades\RateLimiter::for('auth', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(10)->by($request->ip() ?: 'global');
        });

        \Illuminate\Support\Facades\RateLimiter::for('otp', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(10)->by($request->input('email') ?: ($request->ip() ?: 'global'));
        });

        \Illuminate\Support\Facades\RateLimiter::for('contact', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->ip() ?: 'global');
        });

        \Illuminate\Support\Facades\RateLimiter::for('coupons', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(20)->by($request->user()?->id ? (string) $request->user()->id : ($request->ip() ?: 'global'));
        });

        \Illuminate\Support\Facades\RateLimiter::for('bookings', function (\Illuminate\Http\Request $request) {
            if ($request->hasHeader('X-App-Platform') || in_array($request->header('X-Client-Type'), ['customer_app', 'staff_app'], true)) {
                $isStaff = $request->header('X-Client-Type') === 'staff_app';
                $limit = $isStaff ? 180 : 120;
                $platform = strtolower((string) ($request->header('X-App-Platform') ?: 'mobile'));
                $userKey = $request->user()?->id ? 'user:' . $request->user()->id : 'ip:' . ($request->ip() ?: 'global');
                return \Illuminate\Cache\RateLimiting\Limit::perMinute($limit)->by("mobile-api:{$platform}:{$userKey}");
            }

            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->user()?->id ? (string) $request->user()->id : ($request->ip() ?: 'global'));
        });

        \Illuminate\Support\Facades\RateLimiter::for('payments', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(30)->by($request->user()?->id ? (string) $request->user()->id : ($request->ip() ?: 'global'));
        });

        \Illuminate\Support\Facades\RateLimiter::for('uploads', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(15)->by($request->user()?->id ? (string) $request->user()->id : ($request->ip() ?: 'global'));
        });

        \Illuminate\Support\Facades\RateLimiter::for('reviews', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->user()?->id ? (string) $request->user()->id : ($request->ip() ?: 'global'));
        });

        // Security: rate limiter specifically for mobile apps (Block F: Customer Mobile, Block G: Staff Operations)
        \Illuminate\Support\Facades\RateLimiter::for('mobile-api', function (\Illuminate\Http\Request $request) {
            $clientType = $request->header('X-Client-Type');
            $user = $request->user();
            $role = $user?->role instanceof \BackedEnum ? $user->role->value : (string) ($user?->role ?? '');

            $isStaff = $clientType === 'staff_app'
                || in_array($role, ['staff', 'store_manager', 'super_admin'], true)
                || $request->is('api/v1/staff*');

            $isCustomer = $clientType === 'customer_app'
                || $role === 'customer'
                || $request->is('api/v1/customer*')
                || $request->is('api/v1/bookings*');

            // Sized appropriately for mobile traffic:
            // Block G (Staff Ops): 180 rpm (3 req/sec) for barcode scanning, customer intake & batch sync
            // Block F (Customer App): 120 rpm (2 req/sec) for customer browsing, bookings & payment polling
            // Guest / Unauthenticated: 60 rpm
            if ($isStaff && $user !== null) {
                $limit = 180;
            } elseif ($isCustomer && $user !== null) {
                $limit = 120;
            } else {
                $limit = 60;
            }

            $platform = strtolower((string) ($request->header('X-App-Platform') ?: 'mobile'));
            $appVersion = (string) ($request->header('X-App-Version') ?: '1.0.0');
            $identifier = $user?->id ? 'user:' . $user->id : 'ip:' . ($request->ip() ?: 'global');
            $key = "mobile-api:{$platform}:{$identifier}";

            // Versioning / Deprecation safety check
            $minVersion = $isStaff
                ? (string) config('app.staff_app_min_version', '1.0.0')
                : (string) config('app.customer_app_min_version', '1.0.0');

            $isDeprecated = version_compare($appVersion, $minVersion, '<');

            return \Illuminate\Cache\RateLimiting\Limit::perMinute($limit)
                ->by($key)
                ->response(function (\Illuminate\Http\Request $request, array $headers) use ($appVersion, $minVersion, $isDeprecated) {
                    $responseHeaders = $headers;
                    if ($isDeprecated) {
                        $responseHeaders['X-API-Deprecated'] = 'true';
                        $responseHeaders['X-API-Minimum-Version'] = $minVersion;
                    }

                    return response()->json([
                        'success' => false,
                        'message' => 'Too many mobile API requests. Please slow down and try again later.',
                        'errors' => [
                            'code' => 'MOBILE_RATE_LIMIT_EXCEEDED',
                            'retry_after' => (int) ($headers['Retry-After'] ?? 60),
                            'client_version' => $appVersion,
                            'min_supported_version' => $minVersion,
                            'is_deprecated_client' => $isDeprecated,
                        ],
                    ], 429, $responseHeaders);
                });
        });

        // Wire CSP nonce with Vite scripts
        if (class_exists(\Illuminate\Support\Facades\Vite::class)) {
            $this->app->resolving('csp-nonce', function (string $nonce): void {
                \Illuminate\Support\Facades\Vite::useCspNonce($nonce);
            });
        }
    }
}
