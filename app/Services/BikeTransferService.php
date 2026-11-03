<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BikeStatus;
use App\Enums\BookingStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\BikeTransfer;
use App\Models\Booking;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BikeTransferService
{
    private const OPEN_STATUSES = ['requested', 'approved', 'in_transit'];
    private const BLOCKING_STATUSES = ['approved', 'in_transit'];

    public static function hasBlockingTransfer(int $bikeId): bool
    {
        return BikeTransfer::where('bike_id', $bikeId)
            ->whereIn('status', self::BLOCKING_STATUSES)->exists();
    }

    public function request(User $actor, int $bikeId, int $destinationId, string $reason): BikeTransfer
    {
        return DB::transaction(function () use ($actor, $bikeId, $destinationId, $reason): BikeTransfer {
            $bike = Bike::whereKey($bikeId)->lockForUpdate()->firstOrFail();
            $fromId = (int) $bike->current_store_id;
            $this->requireStoreAccess($actor, $fromId);
            $this->assertSafeForTransfer($bike, $destinationId);

            $transfer = BikeTransfer::create([
                'bike_id' => $bikeId,
                'from_store_id' => $fromId,
                'to_store_id' => $destinationId,
                'status' => 'requested',
                'reason' => $reason,
                'requested_by' => $actor->id,
            ]);
            $this->audit($actor, $transfer, 'requested');

            return $transfer;
        });
    }

    public function approve(User $actor, int $id): BikeTransfer
    {
        abort_unless($actor->role === UserRole::SUPER_ADMIN, 403);

        return DB::transaction(function () use ($actor, $id): BikeTransfer {
            // Lock bike first across every transfer transition and booking hold.
            $transferId = BikeTransfer::whereKey($id)->value('bike_id');
            $bike = Bike::whereKey($transferId)->lockForUpdate()->firstOrFail();
            $transfer = BikeTransfer::whereKey($id)->lockForUpdate()->firstOrFail();

            $this->transitionFrom($transfer, 'requested');
            if ((int) $bike->current_store_id !== (int) $transfer->from_store_id) {
                throw ValidationException::withMessages(['bike_id' => 'Bike has moved since this transfer was requested.']);
            }
            $this->assertSafeForTransfer($bike, (int) $transfer->to_store_id, $transfer->id);

            $transfer->update(['status' => 'approved', 'approved_by' => $actor->id, 'approved_at' => now()]);
            $this->audit($actor, $transfer, 'approved');

            return $transfer;
        });
    }

    public function dispatch(User $actor, int $id): BikeTransfer
    {
        return DB::transaction(function () use ($actor, $id): BikeTransfer {
            $bikeId = BikeTransfer::whereKey($id)->value('bike_id');
            $bike = Bike::whereKey($bikeId)->lockForUpdate()->firstOrFail();
            $transfer = BikeTransfer::whereKey($id)->lockForUpdate()->firstOrFail();
            $this->requireStoreAccess($actor, (int) $transfer->from_store_id);
            $this->transitionFrom($transfer, 'approved');
            if ((int) $bike->current_store_id !== (int) $transfer->from_store_id
                || $bike->status !== BikeStatus::AVAILABLE) {
                throw ValidationException::withMessages(['bike_id' => 'Bike is not at the source branch or is unavailable.']);
            }

            $transfer->update(['status' => 'in_transit', 'dispatched_by' => $actor->id, 'dispatched_at' => now()]);
            $this->audit($actor, $transfer, 'dispatched');

            return $transfer;
        });
    }

    public function receive(User $actor, int $id): BikeTransfer
    {
        return DB::transaction(function () use ($actor, $id): BikeTransfer {
            $bikeId = BikeTransfer::whereKey($id)->value('bike_id');
            $bike = Bike::whereKey($bikeId)->lockForUpdate()->firstOrFail();
            $transfer = BikeTransfer::whereKey($id)->lockForUpdate()->firstOrFail();
            $this->requireStoreAccess($actor, (int) $transfer->to_store_id);
            $this->transitionFrom($transfer, 'in_transit');
            if ((int) $bike->current_store_id !== (int) $transfer->from_store_id) {
                throw ValidationException::withMessages(['bike_id' => 'Bike physical location changed unexpectedly.']);
            }

            // Only now move the physical bike; never on request or approval.
            $bike->update(['current_store_id' => $transfer->to_store_id]);
            $transfer->update(['status' => 'received', 'received_by' => $actor->id, 'received_at' => now()]);
            $this->audit($actor, $transfer, 'received');

            return $transfer;
        });
    }

    public function cancel(User $actor, int $id): BikeTransfer
    {
        return DB::transaction(function () use ($actor, $id): BikeTransfer {
            $bikeId = BikeTransfer::whereKey($id)->value('bike_id');
            Bike::whereKey($bikeId)->lockForUpdate()->firstOrFail();
            $transfer = BikeTransfer::whereKey($id)->lockForUpdate()->firstOrFail();
            $this->requireStoreAccess($actor, (int) $transfer->from_store_id);
            if (! in_array($transfer->status, ['requested', 'approved'], true)) {
                throw ValidationException::withMessages(['status' => 'Only requested or approved transfers can be cancelled.']);
            }
            $transfer->update(['status' => 'cancelled', 'closed_by' => $actor->id, 'closed_at' => now()]);
            $this->audit($actor, $transfer, 'cancelled');

            return $transfer;
        });
    }

    private function assertSafeForTransfer(Bike $bike, int $destinationId, ?int $excludeId = null): void
    {
        if (! $bike->current_store_id || $bike->status !== BikeStatus::AVAILABLE || (int) $bike->current_store_id === $destinationId) {
            throw ValidationException::withMessages(['bike_id' => 'The bike must be available and the destination must differ from its current branch.']);
        }

        if (! Store::whereKey((int) $bike->current_store_id)->where('status', StoreStatus::ACTIVE)->exists()) {
            throw ValidationException::withMessages(['bike_id' => 'Source branch must be active.']);
        }

        if (! Store::whereKey($destinationId)->where('status', StoreStatus::ACTIVE)->exists()) {
            throw ValidationException::withMessages(['to_store_id' => 'Choose an active destination branch.']);
        }
        if (BikeTransfer::where('bike_id', $bike->id)->whereIn('status', self::OPEN_STATUSES)
            ->when($excludeId !== null, fn ($q) => $q->whereKeyNot($excludeId))->exists()) {
            throw ValidationException::withMessages(['bike_id' => 'This bike already has an open transfer.']);
        }

        // Conservative guarantee: no active commitments may be invalidated by
        // a physical move. Future transfer scheduling comes in a later phase.
        $hasReservations = Booking::where('bike_id', $bike->id)
            ->where('end_date', '>=', today()->toDateString())
            ->where(function ($q): void {
                $q->whereIn('status', [
                    BookingStatus::CONFIRMED->value, BookingStatus::HANDED_OVER->value,
                ])->orWhere(function ($q): void {
                    $q->whereIn('status', [BookingStatus::HELD->value, BookingStatus::PENDING_PAYMENT->value])
                        ->where(function ($q): void {
                            $q->whereNull('held_until')->orWhere('held_until', '>', now());
                        });
                });
            })->exists();
        if ($hasReservations) {
            throw ValidationException::withMessages([
                'bike_id' => 'This bike has active or future reservations. Reassign them before transferring.',
            ]);
        }
    }

    private function requireStoreAccess(User $actor, int $storeId): void
    {
        abort_unless(in_array($actor->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true), 403);
        if ($actor->role === UserRole::SUPER_ADMIN) return;

        $ids = $actor->getAuthorizedStoreIds();
        abort_unless($ids !== null && in_array($storeId, $ids, true), 403);
    }

    private function transitionFrom(BikeTransfer $transfer, string $expected): void
    {
        if ($transfer->status !== $expected) {
            throw ValidationException::withMessages(['status' => "Only {$expected} transfers can perform this action."]);
        }
    }

    private function audit(User $actor, BikeTransfer $transfer, string $event): void
    {
        ActivityLog::create([
            'user_id' => $actor->id,
            'store_id' => $transfer->from_store_id,
            'action' => 'bike_transfer_'.$event,
            'subject_type' => BikeTransfer::class,
            'subject_id' => $transfer->id,
            'new_values' => [
                'bike_id' => $transfer->bike_id,
                'from_store_id' => $transfer->from_store_id,
                'to_store_id' => $transfer->to_store_id,
                'status' => $transfer->status,
            ],
        ]);
    }
}
