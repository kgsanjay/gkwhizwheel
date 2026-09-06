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

        // Security: rate limiters for auth, bookings, and payments
        \Illuminate\Support\Facades\RateLimiter::for('auth', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(10)->by($request->ip() ?: 'global');
        });

        \Illuminate\Support\Facades\RateLimiter::for('bookings', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->user()?->id ? (string) $request->user()->id : ($request->ip() ?: 'global'));
        });

        \Illuminate\Support\Facades\RateLimiter::for('payments', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(30)->by($request->user()?->id ? (string) $request->user()->id : ($request->ip() ?: 'global'));
        });
    }
}
