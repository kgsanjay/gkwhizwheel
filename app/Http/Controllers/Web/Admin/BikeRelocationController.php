<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BikeStatus;
use App\Enums\BookingStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeRelocationTask;
use App\Models\Store;
use App\Services\BikeLocationSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BikeRelocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user?->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true), 403);

        $query = BikeRelocationTask::query()->with(['bike', 'affectedBooking'])
            ->where('status', 'open');
        if ($user->role !== UserRole::SUPER_ADMIN) {
            $query->whereIn('required_store_id', $user->getAuthorizedStoreIds() ?? []);
        }
        if ($request->filled('store_id')) {
            $requestedStore = $request->integer('store_id');
            if ($user->role !== UserRole::SUPER_ADMIN) {
                abort_unless(in_array($requestedStore, $user->getAuthorizedStoreIds() ?? [], true), 403);
            }
            $query->where('required_store_id', $requestedStore);
        }

        $tasks = $query->orderBy('id')->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $tasks->getCollection()->map(fn (BikeRelocationTask $task): array => [
                'id' => $task->id,
                'status' => $task->status,
                'bike_id' => $task->bike_id,
                'bike_registration' => $task->bike?->registration_number,
                'affected_booking_id' => $task->affected_booking_id,
                'affected_booking_reference' => $task->affectedBooking?->booking_reference,
                'from_store_id' => $task->from_store_id,
                'required_store_id' => $task->required_store_id,
                'pickup_date' => $task->affectedBooking?->start_date?->toDateString(),
            ])->all(),
            'meta' => ['total' => $tasks->total(), 'current_page' => $tasks->currentPage()],
        ]);
    }

    /**
     * Superadmin confirms physical receipt AFTER staff actually transfers the bike.
     * Never update a customer's booking or auto-claim a transfer has occurred.
     */
    public function confirmReceipt(int $id, Request $request, BikeLocationSchedule $schedule): JsonResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);
        $validated = $request->validate([
            'physical_receipt_confirmed' => ['required', 'accepted'],
            'destination_store_id' => ['required', 'integer', 'exists:stores,id'],
        ]);

        return DB::transaction(function () use ($id, $request, $validated, $schedule): JsonResponse {
            $task = BikeRelocationTask::whereKey($id)->lockForUpdate()->firstOrFail();
            if ($task->status !== 'open') {
                throw ValidationException::withMessages(['task' => 'This relocation has already been resolved.']);
            }

            $bike = Bike::whereKey($task->bike_id)->lockForUpdate()->firstOrFail();
            $destinationId = (int) $validated['destination_store_id'];
            if ($destinationId !== (int) $task->required_store_id
                || (int) $bike->current_store_id !== (int) $task->from_store_id
                || $bike->status !== BikeStatus::AVAILABLE) {
                throw ValidationException::withMessages([
                    'destination_store_id' => 'The bike location, status or destination no longer matches this task.',
                ]);
            }

            $destination = Store::findOrFail($destinationId);
            if ($destination->status !== StoreStatus::ACTIVE) {
                throw ValidationException::withMessages(['destination_store_id' => 'The receiving branch must be active.']);
            }

            $affected = $task->affectedBooking;
            if ($affected === null || $affected->bike_id !== $bike->id
                || $affected->status !== BookingStatus::CONFIRMED
                || $affected->start_date->toDateString() < now()->toDateString()) {
                throw ValidationException::withMessages(['task' => 'The affected reservation must be a future confirmed booking.']);
            }

            $oldStoreId = (int) $bike->current_store_id;
            $bike->update(['current_store_id' => $destinationId]);

            // Reject the purported transfer if another earlier reservation still
            // cannot be fulfilled. The transaction rolls back the bike's location.
            if ($schedule->firstUnfulfillableReservation($bike) !== null) {
                throw ValidationException::withMessages([
                    'task' => 'The transfer would leave another upcoming reservation unfulfillable.',
                ]);
            }

            $task->update(['status' => 'resolved']);
            ActivityLog::create([
                'user_id' => $request->user()->id,
                'store_id' => $destinationId,
                'action' => 'bike_relocation_receipt_confirmed',
                'subject_type' => BikeRelocationTask::class,
                'subject_id' => (string) $task->id,
                'old_values' => ['current_store_id' => $oldStoreId, 'status' => 'open'],
                'new_values' => [
                    'current_store_id' => $destinationId,
                    'status' => 'resolved',
                    'bike_id' => $bike->id,
                    'affected_booking_id' => $task->affected_booking_id,
                ],
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'task_id' => $task->id,
                    'status' => $task->status,
                    'bike_id' => $bike->id,
                    'current_store_id' => $bike->current_store_id,
                ],
            ]);
        });
    }
}
