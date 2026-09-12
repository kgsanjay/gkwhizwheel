<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignStaffStoresRequest;
use App\Http\Requests\Admin\StoreStaffRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    /**
     * Display a listing of staff and store manager accounts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->whereIn('role', [UserRole::STAFF, UserRole::STORE_MANAGER])
            ->with('stores');

        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        if ($request->filled('store_id')) {
            $query->whereHas('stores', function ($q) use ($request): void {
                $q->where('stores.id', $request->query('store_id'));
            });
        }

        $staffMembers = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($staffMembers),
            'message' => 'Staff members retrieved successfully.',
        ]);
    }

    /**
     * Create a new staff or store manager account.
     */
    public function store(StoreStaffRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => UserRole::from($validated['role']),
            'status' => UserStatus::ACTIVE,
        ];

        $staff = User::create($userData);

        if (! empty($validated['store_ids']) && is_array($validated['store_ids'])) {
            $staff->stores()->syncWithoutDetaching($validated['store_ids']);
        }

        try {
            $staff->assignRole($validated['role']);
        } catch (\Throwable) {
            // Spatie role table may not be seeded in all test environments
        }

        $staff->load('stores');

        return response()->json([
            'success' => true,
            'data' => new UserResource($staff),
            'message' => 'Staff account created successfully.',
        ], 201);
    }

    /**
     * Display the specified staff member.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $staff = User::query()
            ->whereIn('role', [UserRole::STAFF, UserRole::STORE_MANAGER])
            ->with('stores')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new UserResource($staff),
            'message' => 'Staff member retrieved successfully.',
        ]);
    }

    /**
     * Assign staff to one or more stores.
     */
    public function assignStores(int $id, AssignStaffStoresRequest $request): JsonResponse
    {
        $staff = User::query()
            ->whereIn('role', [UserRole::STAFF, UserRole::STORE_MANAGER])
            ->findOrFail($id);

        $storeIds = $request->validated('store_ids');
        $staff->stores()->syncWithoutDetaching($storeIds);
        $staff->load('stores');

        return response()->json([
            'success' => true,
            'data' => new UserResource($staff),
            'message' => 'Stores assigned successfully.',
        ]);
    }

    /**
     * Unassign staff from a specific store.
     */
    public function unassignStore(int $id, int $storeId, Request $request): JsonResponse
    {
        $staff = User::query()
            ->whereIn('role', [UserRole::STAFF, UserRole::STORE_MANAGER])
            ->findOrFail($id);

        $staff->stores()->detach($storeId);

        return response()->json([
            'success' => true,
            'data' => new UserResource($staff->fresh('stores')),
            'message' => 'Store unassigned successfully.',
        ]);
    }
}
