<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BikeStatus;
use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\Bike;
use App\Models\BikeModel;
use App\Models\CabFareRule;
use App\Models\CabVehicle;
use App\Models\PickupPoint;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BranchServiceLandingWebController extends Controller
{
    /**
     * Map public service URL slugs to service types, metadata, and default details.
     *
     * @var array<string, array<string, mixed>>
     */
    protected const SERVICE_MAP = [
        'bikes' => [
            'type' => 'two_wheelers',
            'canonical_slug' => 'bikes',
            'name' => 'Two-Wheeler & Scooter Rental',
            'short_title' => 'Bike Rentals',
            'badge' => 'Self-Drive Fleet',
            'headline' => 'Explore the Coastline on Your Own Terms',
            'subheadline' => 'Premium, road-legal two-wheelers maintained with rigorous 25-point pre-flight inspections, complimentary sanitized helmets, and zero security deposit options for verified riders.',
            'seo_description' => 'Rent self-drive bikes & Honda Activas in :city with GK WhizWheel. Certified road-legal fleet, commercial insurance, zero security deposit option & 24/7 road rescue.',
            'inclusions' => [
                ['title' => 'ISI Certified Helmets', 'desc' => 'Complimentary sanitized ISI helmets for both rider and pillion.'],
                ['title' => '100% Road-Legal Fleet', 'desc' => 'Commercial yellow-board registration, valid RC, comprehensive insurance & PUC.'],
                ['title' => 'Zero Security Deposit', 'desc' => 'Instant 5-minute digital KYC verification option for Indian travelers.'],
                ['title' => '24/7 Roadside Rescue', 'desc' => 'Instant mechanical backup and replacement fleet anywhere along the coastal corridor.'],
                ['title' => '25-Point Mechanical Check', 'desc' => 'Brakes, tires, battery, drive chain, and lighting inspected before every single trip.'],
                ['title' => 'Flexible Multi-Hub Return', 'desc' => 'Rent in Honnavar and drop off in Murudeshwar (or railway stations) with one-way returns.'],
            ],
            'rules' => [
                'Valid original Driving License (Motorcycle with/without Gear) is mandatory.',
                'Aadhaar / Government ID verification required prior to vehicle handover.',
                'Helmets must be worn by both rider and pillion at all times as per Karnataka MV Act.',
                'Speed limit on NH-66 and coastal bypass roads is capped at 70 km/h for your safety.',
                'Fuel is provided on level-to-level handover (return with same fuel level).',
            ],
        ],
        'boating' => [
            'type' => 'boating',
            'canonical_slug' => 'boating',
            'name' => 'Sharavathi River & Backwater Boating',
            'short_title' => 'Backwater Boating',
            'badge' => 'Estuary Cruises',
            'headline' => 'Glide Through Untouched Mangrove Canopies',
            'subheadline' => 'Private Shikara cruises and guided motorboat safaris across the serene Sharavathi river estuary, mangrove lagoons, and Arabian sea confluence at golden hour.',
            'seo_description' => 'Book private Sharavathi river backwater boating & mangrove cruises in :city with GK WhizWheel. Certified life jackets, native captains & sunset tours.',
            'inclusions' => [
                ['title' => 'Certified Life Jackets', 'desc' => 'Mandatory maritime-grade safety life jackets for adults and children.'],
                ['title' => 'Experienced Native Captain', 'desc' => 'Licensed local navigators with deep knowledge of estuary sandbars and wildlife.'],
                ['title' => 'Mangrove Boardwalk Access', 'desc' => 'Cruise past protected mangrove conservation zones and secluded river islands.'],
                ['title' => 'Sunset Estuary Staging', 'desc' => 'Timed perfectly for panoramic Arabian Sea sunset reflections where river meets sea.'],
            ],
            'rules' => [
                'Wearing life jackets is legally mandatory from boarding until disembarkation.',
                'Arrive at the designated boarding jetty 15 minutes prior to booked departure.',
                'Children under 5 must be accompanied and supervised by a responsible adult.',
                'Alcohol consumption and smoking on board are strictly prohibited.',
            ],
        ],
        'scuba' => [
            'type' => 'scuba',
            'canonical_slug' => 'scuba',
            'name' => 'Netrani Island PADI Scuba Diving',
            'short_title' => 'Scuba Diving',
            'badge' => 'Netrani Island Coral Reefs',
            'headline' => 'Discover India’s Premier Coral Reef Sanctuary',
            'subheadline' => 'PADI & SSI certified discovery scuba dives with 1-on-1 divemaster accompaniment, 4K GoPro underwater videos, and complete marine expedition equipment.',
            'seo_description' => 'Experience PADI certified scuba diving at Netrani Island from :city with GK WhizWheel. 1-on-1 divemaster, 4K GoPro footage, gear & boat transfers included.',
            'inclusions' => [
                ['title' => '1-on-1 Certified Divemaster', 'desc' => 'Personal certified instructor holding your hand throughout the underwater dive.'],
                ['title' => '4K GoPro Video & Photos', 'desc' => 'Complimentary high-definition underwater footage delivered to your phone.'],
                ['title' => 'Complete Diving Gear', 'desc' => 'Wetsuit, mask, snorkel, buoyancy compensator (BCD), regulators, and fins included.'],
                ['title' => 'Harbor Boat Transit', 'desc' => 'High-speed twin-engine boat transit to and from Netrani Island with light refreshments.'],
            ],
            'rules' => [
                'Non-swimmers are 100% welcome for Discover Scuba Diving programs.',
                'Participants must complete a standard medical questionnaire prior to boarding.',
                'Do not take a commercial flight within 18 hours after your scuba dive.',
                'Age limit: Minimum 10 years old. Maximum 60 years old in good cardiovascular health.',
            ],
        ],
        'cabs' => [
            'type' => 'taxi',
            'canonical_slug' => 'cabs',
            'name' => 'Private Chauffeur Cabs & Station Transfers',
            'short_title' => 'Private Cabs',
            'badge' => 'Intercity & Local Chauffeur',
            'headline' => 'Punctual, Transparent Coastal Road Journeys',
            'subheadline' => 'Clean, air-conditioned sedans and 7-seater SUVs driven by vetted, courteous native chauffeurs. Fixed transparent fares with fuel, driver allowance, and tolls accounted for.',
            'seo_description' => 'Book private AC cabs and railway station transfers in :city with GK WhizWheel. Innova Crysta & Dzire cabs with polite chauffeurs and zero hidden charges.',
            'inclusions' => [
                ['title' => 'Air-Conditioned Fleet', 'desc' => 'Spotless Swift Dzires, Ertigas, and Innova Crystas with pristine upholstery.'],
                ['title' => 'Verified Native Chauffeurs', 'desc' => 'Commercial badge drivers familiar with every coastal detour and tourist attraction.'],
                ['title' => 'Guaranteed Station Pickup', 'desc' => 'Punctual platform wait for Konkan Railway morning arrivals (Honnavar & Murudeshwar).'],
                ['title' => 'Clear Transparent Tariffs', 'desc' => 'Upfront distance/day package rates without surprise fuel or parking markups.'],
            ],
            'rules' => [
                'Fares include vehicle, fuel, driver allowance, and standard luggage handling.',
                'Interstate permits, state border taxes, and unusual commercial parking billed at actuals.',
                'Night driving policy complies with safety regulations on ghat and forest stretches.',
            ],
        ],
        'homestays' => [
            'type' => 'homestay',
            'canonical_slug' => 'homestays',
            'name' => 'Riverfront Wooden Cottages & Stays',
            'short_title' => 'Homestays',
            'badge' => 'Verified Heritage Stays',
            'headline' => 'Wake Up to Birds and River Mist',
            'subheadline' => 'Quiet wooden cottages, riverfront private rooms, and eco-villas surrounded by coconut groves. Authentic Karavali coastal breakfasts and verified quiet family hospitality.',
            'seo_description' => 'Book verified riverfront homestays & wooden cottages in :city with GK WhizWheel. River views, home-cooked food, AC rooms and peaceful nature.',
            'inclusions' => [
                ['title' => 'Riverfront / Secluded Setting', 'desc' => 'Peaceful family-run cottages away from the congestion of the highway.'],
                ['title' => 'Authentic Home Breakfast', 'desc' => 'Traditional homemade coastal Karavali breakfast included with every stay.'],
                ['title' => 'Inverter Power & AC', 'desc' => 'Air-conditioned bedrooms backed by reliable battery inverters.'],
                ['title' => 'Host Concierge', 'desc' => 'Direct assistance with local boat bookings, secret beaches, and fresh seafood sourcing.'],
            ],
            'rules' => [
                'Standard check-in: 12:00 PM; check-out: 11:00 AM (flexible luggage drop for early trains).',
                'Quiet hours observed after 10:30 PM out of respect for nature and neighboring families.',
                'Government photo ID required for every adult guest at check-in.',
            ],
        ],
        'guide' => [
            'type' => 'guide',
            'canonical_slug' => 'guide',
            'name' => 'Native Heritage & Eco-Trail Guides',
            'short_title' => 'Tour Guides',
            'badge' => 'Certified Storytellers',
            'headline' => 'Uncover 500 Years of Coastal History',
            'subheadline' => 'Private guided expeditions through Mirjan Fort, Yana rock monoliths, Vibhooti waterfalls, and mangrove sanctuaries with passionate native historical storytellers.',
            'seo_description' => 'Hire native tour guides in :city with GK WhizWheel. Discover Mirjan Fort, Yana Caves, waterfalls and coastal culture with zero commercial kickbacks.',
            'inclusions' => [
                ['title' => 'Dedicated Native Historian', 'desc' => 'Private local expert dedicated exclusively to your group for 4 or 8 hours.'],
                ['title' => 'Strict Zero-Commission Rule', 'desc' => 'You will never be dragged into overpriced tourist souvenir or spice shops.'],
                ['title' => 'Trail Safety & Customs', 'desc' => 'Safe navigation along rocky forest paths, water pools, and sacred shrine protocols.'],
            ],
            'rules' => [
                'Guide tariff covers professional time and storytelling for up to 6 group members.',
                'Vehicle transit (bike pillion or private car seat) to be coordinated with the guide.',
                'Monument and reserve park entry tickets (nominal ₹10–₹30) paid directly at ticket counters.',
            ],
        ],
        'tours' => [
            'type' => 'tours',
            'canonical_slug' => 'tours',
            'name' => 'Curated Coastal Karnataka Tour Circuits',
            'short_title' => 'Tour Circuits',
            'badge' => 'All-Inclusive Experience',
            'headline' => 'The Complete Uttara Kannada Experience',
            'subheadline' => 'Seamlessly bundled 2-day and 3-day itineraries combining river boating, heritage fort discovery, beach excursions, and comfortable homestay hospitality.',
            'seo_description' => 'Explore all-inclusive 2D/3D coastal Karnataka tour packages from :city with GK WhizWheel. Bikes/Cabs, homestays, boating, and guided sightseeing bundled.',
            'inclusions' => [
                ['title' => 'End-to-End Coordination', 'desc' => 'Vehicle rental, homestay booking, boating slots, and activity timings pre-aligned.'],
                ['title' => 'No Planning Stress', 'desc' => 'Carefully curated timeline maximizing scenic spots without travel exhaustion.'],
                ['title' => '24/7 Dedicated Trip Concierge', 'desc' => 'Single WhatsApp point of contact for meal recommendations and live assistance.'],
            ],
            'rules' => [
                'Packages can be customized with your choice of self-drive bikes or chauffeur AC cabs.',
                'Flexible cancellation up to 48 hours before scheduled arrival.',
            ],
        ],
    ];

    /**
     * Display the dynamic service landing page for the specified branch and service.
     */
    public function show(string $branch, string $serviceSlug): Response|RedirectResponse
    {
        $normalizedBranch = strtolower(trim($branch));

        // Find active store matching branch slug, city, or name
        $store = Store::query()
            ->where('status', StoreStatus::ACTIVE)
            ->get()
            ->first(function (Store $s) use ($normalizedBranch): bool {
                $citySlug = Str::slug($s->city ?: $s->name);
                $nameSlug = Str::slug($s->name);

                return $citySlug === $normalizedBranch
                    || $nameSlug === $normalizedBranch
                    || str_starts_with($normalizedBranch, $citySlug)
                    || str_starts_with($citySlug, $normalizedBranch)
                    || str_contains(strtolower($s->name), $normalizedBranch)
                    || str_contains(strtolower((string) $s->city), $normalizedBranch);
            });

        if (! $store) {
            abort(404, "Branch '{$branch}' not found.");
        }

        $canonicalCitySlug = Str::slug($store->city ?: $store->name);

        // Map service slug to canonical (supporting both hyphens and underscores)
        $normalizedService = str_replace('_', '-', strtolower(trim($serviceSlug)));
        $serviceAliases = [
            'bike' => 'bikes',
            'bike-rentals' => 'bikes',
            'bike-rental' => 'bikes',
            'two-wheelers' => 'bikes',
            'two-wheeler' => 'bikes',
            'scuba-diving' => 'scuba',
            'netrani' => 'scuba',
            'netrani-scuba' => 'scuba',
            'boat' => 'boating',
            'boat-cruise' => 'boating',
            'sharavathi-boating' => 'boating',
            'taxi' => 'cabs',
            'cab' => 'cabs',
            'taxi-services' => 'cabs',
            'car-rental' => 'cabs',
            'homestay' => 'homestays',
            'rooms' => 'homestays',
            'stays' => 'homestays',
            'cottages' => 'homestays',
            'guides' => 'guide',
            'tour-guide' => 'guide',
            'tour-guides' => 'guide',
            'tour' => 'tours',
            'tour-packages' => 'tours',
            'packages' => 'tours',
        ];

        $canonicalServiceSlug = $serviceAliases[$normalizedService] ?? $normalizedService;

        if (! isset(self::SERVICE_MAP[$canonicalServiceSlug])) {
            abort(404, "Service '{$serviceSlug}' not found.");
        }

        $serviceConfig = self::SERVICE_MAP[$canonicalServiceSlug];
        $serviceType = $serviceConfig['type'];

        // If URL requested was not canonical, redirect to clean canonical URL
        if ($branch !== $canonicalCitySlug || $serviceSlug !== $canonicalServiceSlug) {
            return redirect()->route('branch.service.show', [
                'branch' => $canonicalCitySlug,
                'serviceSlug' => $canonicalServiceSlug,
            ], 301);
        }

        // Active pickup points for this store
        $pickupPoints = $store->pickupPoints()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get([
                'id', 'store_id', 'name', 'slug', 'address_line', 'landmark',
                'delivery_fee', 'pickup_fee', 'return_fee',
                'supports_pickup', 'supports_return', 'latitude', 'longitude',
            ])
            ->map(fn (PickupPoint $point): array => [
                'id' => $point->id,
                'store_id' => $point->store_id,
                'name' => $point->name,
                'slug' => $point->slug,
                'address_line' => $point->address_line,
                'landmark' => $point->landmark,
                'delivery_fee' => (float) $point->delivery_fee,
                'pickup_fee' => (float) $point->pickup_fee,
                'return_fee' => (float) $point->return_fee,
                'supports_pickup' => (bool) $point->supports_pickup,
                'supports_return' => (bool) $point->supports_return,
                'latitude' => $point->latitude,
                'longitude' => $point->longitude,
            ])
            ->values()
            ->all();

        // Branch-enabled services list
        $storeServices = $store->services ?? [];
        $availableServices = collect(self::SERVICE_MAP)->map(function ($cfg, $slug) use ($storeServices): array {
            $enabledKey = ($slug === 'bikes') ? 'bikes' : $slug;
            $type = $cfg['type'];

            $assocEnabled = null;
            if (isset($storeServices[$enabledKey])) {
                $assocEnabled = (bool) $storeServices[$enabledKey];
            } elseif (isset($storeServices[$type])) {
                $assocEnabled = (bool) $storeServices[$type];
            }

            $indexedEnabled = in_array($enabledKey, $storeServices, true) || in_array($type, $storeServices, true);
            if ($slug === 'homestays' && in_array('rooms', $storeServices, true)) {
                $indexedEnabled = true;
            }

            $isEnabled = $assocEnabled !== null ? $assocEnabled : $indexedEnabled;

            return [
                'slug' => $slug,
                'name' => $cfg['short_title'],
                'full_name' => $cfg['name'],
                'is_enabled' => $isEnabled,
            ];
        })->values()->all();

        // Branch inventory based on service type
        $inventory = [];

        if ($canonicalServiceSlug === 'bikes') {
            $models = BikeModel::query()
                ->where('is_active', true)
                ->with(['category:id,name,base_daily_rate', 'branchPrices'])
                ->whereHas('bikes', fn ($q) => $q->where('current_store_id', $store->id))
                ->orderBy('brand')
                ->orderBy('name')
                ->get();

            $bikes = Bike::query()
                ->where('current_store_id', $store->id)
                ->whereIn('bike_model_id', $models->pluck('id'))
                ->get(['id', 'bike_model_id', 'status', 'primary_image_path', 'base_daily_rate_override']);

            $inventory = $models->map(function (BikeModel $model) use ($bikes, $store): array {
                $atBranch = $bikes->where('bike_model_id', $model->id);
                $imagePath = $model->primary_image_path
                    ?: $atBranch->first(fn (Bike $b) => $b->primary_image_path !== null)?->primary_image_path;

                $configuredPrice = $model->branchPrices->firstWhere('store_id', $store->id);
                $weekdayRate = $configuredPrice !== null
                    ? (float) $configuredPrice->weekday_rate
                    : (float) ($atBranch->first()?->base_daily_rate_override ?? $model->category?->base_daily_rate ?? 0);
                $weekendRate = $configuredPrice !== null
                    ? (float) $configuredPrice->weekend_rate
                    : round($weekdayRate * 1.15, 2);

                $activeUnits = $atBranch->where('status', '!=', BikeStatus::RETIRED);
                $availableCount = $activeUnits->where('status', BikeStatus::AVAILABLE)->count();
                $bookedCount = $activeUnits->where('status', BikeStatus::ON_RENT)->count();

                return [
                    'id' => $model->id,
                    'brand' => $model->brand,
                    'name' => $model->name,
                    'slug' => Str::slug($model->brand . ' ' . $model->name),
                    'category_name' => $model->category?->name,
                    'fuel_type' => $model->fuel_type->value ?? 'Petrol',
                    'transmission' => $model->transmission->value ?? 'Automatic',
                    'physical_units' => $activeUnits->count(),
                    'available_now' => $availableCount,
                    'booked_units' => $bookedCount,
                    'weekday_rate' => $weekdayRate,
                    'weekend_rate' => $weekendRate,
                    'indicative_daily_rate' => $weekdayRate,
                    'image_url' => $imagePath
                        ? (str_starts_with($imagePath, 'http') || str_starts_with($imagePath, '/')
                            ? $imagePath
                            : Storage::disk('public')->url($imagePath))
                        : '/images/bikes/honda-activa.webp',
                ];
            })->values()->all();
        } else {
            // Service items for multi-service categories
            $items = ServiceItem::query()
                ->where('service_type', $serviceType)
                ->whereIn('status', ['available', 'active'])
                ->where(function ($q) use ($store): void {
                    $q->where('store_id', $store->id)
                        ->orWhereNull('store_id');
                })
                ->with(['images' => fn ($q) => $q->orderBy('sort_order'), 'store'])
                ->orderBy('sort_order')
                ->get();

            $inventory = $items->map(function (ServiceItem $item): array {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'category' => $item->category,
                    'description' => $item->description,
                    'price_base' => (float) $item->price_base,
                    'price_unit' => $item->price_unit ?: 'per booking',
                    'duration' => $item->duration,
                    'capacity' => $item->capacity,
                    'features' => $item->features ?? [],
                    'image_url' => $item->primary_image_url ?: '/images/services/boat_tour.jpg',
                ];
            })->values()->all();
        }

        // Other active branches for quick switching
        $otherBranches = Store::query()
            ->where('status', StoreStatus::ACTIVE)
            ->where('id', '!=', $store->id)
            ->get(['id', 'name', 'city'])
            ->map(fn (Store $other): array => [
                'id' => $other->id,
                'name' => $other->name,
                'city' => $other->city,
                'slug' => Str::slug($other->city ?: $other->name),
            ])
            ->filter(fn (array $b): bool => $b['slug'] !== $canonicalCitySlug)
            ->unique('slug')
            ->values()
            ->all();

        // Cab rates if viewing cab service
        $cabFareRules = [];
        $cabVehicles = [];
        if ($canonicalServiceSlug === 'cabs') {
            $cabFareRules = CabFareRule::where('is_active', true)->where('is_approved', true)->with('store')->get();
            $cabVehicles = CabVehicle::where('status', 'active')->with('store')->get();
        }

        $cityName = $store->city ?: $store->name;
        $seoTitle = "{$serviceConfig['name']} in {$cityName} | GK WhizWheel";
        $seoDescription = str_replace(':city', $cityName, $serviceConfig['seo_description']);

        return Inertia::render('Services/BranchServiceLanding', [
            'branch' => [
                'id' => $store->id,
                'name' => $store->name,
                'city' => $store->city,
                'slug' => $canonicalCitySlug,
                'address' => $store->address_line,
                'address_line' => $store->address_line,
                'state' => $store->state,
                'pincode' => $store->pincode,
                'phone' => $store->phone,
                'whatsapp' => $store->whatsapp ?? preg_replace('/\D/', '', (string) $store->phone),
                'google_maps_url' => $store->google_maps_url,
                'operating_hours_label' => $store->operating_hours_label ?? 'Open 24/7',
                'services' => $store->services ?? [],
            ],
            'service' => [
                'slug' => $canonicalServiceSlug,
                'type' => $serviceType,
                'name' => $serviceConfig['name'],
                'short_title' => $serviceConfig['short_title'],
                'badge' => $serviceConfig['badge'],
                'headline' => $serviceConfig['headline'],
                'subheadline' => $serviceConfig['subheadline'],
                'inclusions' => $serviceConfig['inclusions'],
                'rules' => $serviceConfig['rules'],
            ],
            'inventory' => $inventory,
            'pickupPoints' => $pickupPoints,
            'otherBranches' => $otherBranches,
            'availableServices' => $availableServices,
            'cabFareRules' => $cabFareRules,
            'cabVehicles' => $cabVehicles,
            'seo' => [
                'title' => $seoTitle,
                'description' => $seoDescription,
            ],
        ]);
    }
}
