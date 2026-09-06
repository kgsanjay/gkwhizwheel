<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStoreRequest;
use App\Http\Requests\Admin\UpdateStoreRequest;
use App\Http\Resources\StoreResource;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class StoreController extends Controller
{
    /**
     * Display a listing of stores, optionally filtered by status.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Store::class);

        $query = Store::query()->with('staff');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $stores = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => StoreResource::collection($stores),
            'message' => 'Stores retrieved successfully.',
        ]);
    }

    /**
     * Store a newly created store (super_admin only).
     */
    public function store(StoreStoreRequest $request): JsonResponse
    {
        Gate::authorize('create', Store::class);

        $store = Store::create($request->validated());

        return response()->json([
            'success' => true,
            'data' => new StoreResource($store),
            'message' => 'Store created successfully.',
        ], 201);
    }

    /**
     * Display the specified store.
     */
    public function show(int $id): JsonResponse
    {
        $store = Store::with('staff')->findOrFail($id);
        Gate::authorize('view', $store);

        return response()->json([
            'success' => true,
            'data' => new StoreResource($store),
            'message' => 'Store retrieved successfully.',
        ]);
    }

    /**
     * Update the specified store.
     */
    public function update(int $id, UpdateStoreRequest $request): JsonResponse
    {
        $store = Store::findOrFail($id);
        Gate::authorize('update', $store);

        $store->update($request->validated());
        $store->load('staff');

        return response()->json([
            'success' => true,
            'data' => new StoreResource($store),
            'message' => 'Store updated successfully.',
        ]);
    }
}
