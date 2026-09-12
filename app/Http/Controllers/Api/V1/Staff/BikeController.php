<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Enums\BikeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\ToggleBikeMaintenanceRequest;
use App\Http\Resources\BikeResource;
use App\Models\ActivityLog;
use App\Models\Bike;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BikeController extends Controller
{
    /**
     * List bikes at a specific store with live status.
     */
    public function index(Request $request): JsonResponse
    {

        $query = Bike::query()
            ->with(['category', 'currentStore', 'homeStore', 'images', 'documents']);

        if ($request->filled('store_id')) {
            $query->where('current_store_id', (int) $request->query('store_id'));
        }

        if ($request->filled('status')) {
            $statusVal = (string) $request->query('status');
            $statusEnum = BikeStatus::tryFrom($statusVal);
            if ($statusEnum !== null) {
                $query->where('status', $statusEnum);
            }
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->query('category_id'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search): void {
                $q->where('brand', 'like', "%{$search}%")
                    ->orWhere('model_name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        $bikes = $query->orderBy('brand')->orderBy('model_name')->get();

        return response()->json([
            'success' => true,
            'data' => BikeResource::collection($bikes),
            'message' => 'Store bikes retrieved successfully.',
        ]);
    }

    /**
     * Toggle or set bike maintenance status.
     */
    public function maintenance(int $id, ToggleBikeMaintenanceRequest $request): JsonResponse
    {
        $notes = $request->validated('notes') ?? $request->validated('reason');

        $result = \Illuminate\Support\Facades\DB::transaction(function () use ($id, $request, $notes): array {
            $bike = Bike::where('id', $id)->lockForUpdate()->firstOrFail();

            $authorizedStoreIds = $request->user()->getAuthorizedStoreIds();
            if ($authorizedStoreIds !== null
                && ! in_array($bike->current_store_id, $authorizedStoreIds, true)
                && ! in_array($bike->home_store_id, $authorizedStoreIds, true)) {
                abort(403, "Unauthorized. You are not assigned to the store for bike {$bike->registration_number}.");
            }

            $oldStatus = $bike->status instanceof BikeStatus ? $bike->status : BikeStatus::from((string) $bike->status);

            if ($request->filled('status')) {
                $newStatus = BikeStatus::from((string) $request->validated('status'));
            } else {
                $newStatus = $oldStatus === BikeStatus::MAINTENANCE
                    ? BikeStatus::AVAILABLE
                    : BikeStatus::MAINTENANCE;
            }

            $bike->update([
                'status' => $newStatus,
            ]);

            ActivityLog::create([
                'user_id' => $request->user()->id,
                'store_id' => $bike->current_store_id,
                'action' => 'bike_maintenance_toggled',
                'subject_type' => Bike::class,
                'subject_id' => $bike->id,
                'old_values' => [
                    'status' => $oldStatus->value,
                ],
                'new_values' => [
                    'status' => $newStatus->value,
                    'notes' => $notes,
                ],
            ]);

            return [$bike, $newStatus];
        });

        /** @var Bike $bike */
        [$bike, $newStatus] = $result;
        $bike->load(['category', 'currentStore', 'homeStore', 'images', 'documents']);

        return response()->json([
            'success' => true,
            'data' => new BikeResource($bike),
            'message' => $newStatus === BikeStatus::MAINTENANCE
                ? 'Bike marked as under maintenance.'
                : 'Bike maintenance completed and marked as available.',
        ]);
    }
}
