<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'phone' => $request->user()->phone,
                    'role' => $request->user()->role?->value ?? (string) $request->user()->role,
                    'assigned_services' => $request->user()->assignedServicesList(),
                ] : null,
            ],
            'sidebar_counts' => fn () => ($user = $request->user()) && in_array($user->role?->value ?? (string) $user->role, ['super_admin', 'store_manager', 'staff'], true) ? [
                'bikes' => [
                    'total' => \App\Models\Booking::whereIn('status', [
                        \App\Enums\BookingStatus::PENDING_PAYMENT,
                        \App\Enums\BookingStatus::CONFIRMED,
                    ])->count(),
                    'pickups' => \App\Models\Booking::where('status', \App\Enums\BookingStatus::CONFIRMED)->count(),
                    'returns' => \App\Models\Booking::where('status', \App\Enums\BookingStatus::HANDED_OVER)->count(),
                ],
                'services' => \App\Models\ServiceBooking::select('service_type', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                    ->whereIn('status', ['confirmed', 'pending'])
                    ->groupBy('service_type')
                    ->pluck('count', 'service_type')
                    ->toArray(),
                'services_total' => \App\Models\ServiceBooking::whereIn('status', ['confirmed', 'pending'])->count(),
                'staff' => \App\Models\User::whereIn('role', [
                    \App\Enums\UserRole::STORE_MANAGER,
                    \App\Enums\UserRole::STAFF,
                ])->count(),
            ] : null,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'csrf_token' => csrf_token(),
        ];
    }
}
