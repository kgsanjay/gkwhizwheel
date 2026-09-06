<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\BikeResource;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BikeWebController extends Controller
{
    /**
     * Display the bike catalog with filters.
     */
    public function index(Request $request): Response
    {
        $categories = BikeCategory::orderBy('name')->get();
        $stores = Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get();

        return Inertia::render('Bikes/Index', [
            'categories' => $categories,
            'stores' => $stores,
            'initialFilters' => [
                'category_id' => $request->query('category_id', ''),
                'store_id' => $request->query('store_id', ''),
                'min_price' => $request->query('min_price', ''),
                'max_price' => $request->query('max_price', ''),
                'start_date' => $request->query('start_date', ''),
                'end_date' => $request->query('end_date', ''),
            ],
        ]);
    }

    /**
     * Display the bike detail view with live price calculation.
     */
    public function show(int $id): Response
    {
        $bike = Bike::with(['category', 'currentStore', 'homeStore', 'images'])->findOrFail($id);
        $stores = Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get();

        return Inertia::render('Bikes/Show', [
            'bike' => (new BikeResource($bike))->resolve(),
            'stores' => $stores,
        ]);
    }
}
