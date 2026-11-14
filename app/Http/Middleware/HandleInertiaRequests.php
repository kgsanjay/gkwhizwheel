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
            'site_settings' => fn () => \App\Models\SiteSetting::getAllSettings(),
            'public_branches' => fn () => \App\Models\Store::query()
                ->where('status', \App\Enums\StoreStatus::ACTIVE)
                ->orderBy('id')
                ->get()
                ->pipe(function ($stores) {
                    $published = $stores->where('publication_status', 'published');
                    $selected = $published->isNotEmpty() ? $published : $stores;

                    return $selected->map(function ($store): array {
                        $isHonnavar = str_contains(strtolower((string) ($store->city ?: $store->name)), 'honnavar');
                        $defaultServices = $isHonnavar
                            ? ['two_wheelers', 'taxi', 'homestay', 'boating', 'guide']
                            : ['two_wheelers', 'taxi', 'rooms', 'scuba', 'guide'];

                        return [
                            'id' => $store->id,
                            'name' => $store->name,
                            'public_name' => $store->public_name ?? $store->name,
                            'address_line' => $store->address_line,
                            'city' => $store->city,
                            'state' => $store->state,
                            'pincode' => $store->pincode,
                            'phone' => $store->phone,
                            'whatsapp' => $store->whatsapp ?? preg_replace('/\D/', '', (string) $store->phone),
                            'email' => $store->email ?? 'contact@whizwheels.in',
                            'operating_hours_label' => $store->operating_hours_label ?? 'Open 24/7',
                            'latitude' => $store->latitude,
                            'longitude' => $store->longitude,
                            'google_maps_url' => $store->google_maps_url,
                            'slug' => \Illuminate\Support\Str::slug($store->city ?: $store->name),
                            'services' => $store->services ?? $defaultServices,
                        ];
                    })->values()->all();
                }),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'phone' => $request->user()->phone,
                    'role' => $request->user()->role?->value ?? (string) $request->user()->role,
                    'assigned_services' => $request->user()->assignedServicesList(),
                    'assigned_stores' => $request->user()->stores()->where('stores.status', \App\Enums\StoreStatus::ACTIVE->value)->get()->map(fn ($s): array => [
                        'id' => $s->id,
                        'name' => $s->name,
                        'city' => $s->city,
                        'slug' => $s->slug,
                    ])->values()->all(),
                    'can_access_all_stores' => $request->user()->canAccessAllStores(),
                    'has_two_factor_enabled' => $request->user()->hasTwoFactorEnabled(),
                    'requires_two_factor' => $request->user()->requiresTwoFactor(),
                ] : null,
            ],
            'sidebar_counts' => fn () => ($user = $request->user()) && $user->isStaffOrAdmin() ? [
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
                    \App\Enums\UserRole::ADMIN,
                    \App\Enums\UserRole::STORE_MANAGER,
                    \App\Enums\UserRole::MANAGER,
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
