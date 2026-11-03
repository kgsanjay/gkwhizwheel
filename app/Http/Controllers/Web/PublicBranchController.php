<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BikeStatus;
use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BikeResource;
use App\Models\Bike;
use App\Models\Store;
use Inertia\Inertia;
use Inertia\Response;

class PublicBranchController extends Controller
{
    public function index(): Response
    {
        $branches = Store::query()
            ->where('status', StoreStatus::ACTIVE)
            ->where('publication_status', 'published')
            ->whereNotNull('slug')
            ->withCount(['currentBikes' => fn ($query) => $query->where('status', BikeStatus::AVAILABLE)])
            ->orderBy('city')
            ->orderBy('name')
            ->get(['id', 'slug', 'name', 'public_name', 'city', 'state', 'address_line', 'hero_image_url', 'public_description']);

        return Inertia::render('Locations/Index', [
            'branches' => $branches,
            'canonicalUrl' => url('/locations'),
        ]);
    }

    public function show(string $slug): Response
    {
        $branch = Store::query()
            ->where('slug', $slug)
            ->where('status', StoreStatus::ACTIVE)
            ->where('publication_status', 'published')
            ->firstOrFail();

        $bikes = Bike::query()
            ->where('current_store_id', $branch->id)
            ->where('status', BikeStatus::AVAILABLE)
            ->with(['category', 'currentStore', 'homeStore', 'images'])
            ->orderBy('brand')
            ->orderBy('model_name')
            ->get();

        return Inertia::render('Locations/Show', [
            'branch' => [
                'id' => $branch->id,
                'slug' => $branch->slug,
                'name' => $branch->public_name ?: $branch->name,
                'city' => $branch->city,
                'state' => $branch->state,
                'address_line' => $branch->address_line,
                'pincode' => $branch->pincode,
                'latitude' => (float) $branch->latitude,
                'longitude' => (float) $branch->longitude,
                'phone' => $branch->phone,
                'operating_hours' => $branch->operating_hours,
                'hero_image_url' => $branch->hero_image_url,
                'public_description' => $branch->public_description,
                'pickup_instructions' => $branch->pickup_instructions,
                'seo_title' => $branch->seo_title,
                'seo_description' => $branch->seo_description,
            ],
            'bikes' => BikeResource::collection($bikes)->resolve(),
            'canonicalUrl' => url('/locations/'.$branch->slug),
        ]);
    }
}
