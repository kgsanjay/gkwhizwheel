<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\ServiceBooking;
use App\Models\ServicePaymentReceipt;
use App\Models\ServiceQuoteSnapshot;
use App\Models\ServiceResourceAllocation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Explicit approval of an existing unpaid offline proposal, never a financial backfill. */
final class ServiceBookingApproval
{
    private function authorize(User $actor, ServiceBooking $booking, bool $approval = false): void
    {
        abort_unless($actor->status === UserStatus::ACTIVE && $actor->canManageService($booking->service_type), 403);
        $stores = $actor->getAuthorizedStoreIds();
        abort_unless($booking->store_id !== null && ($stores === null || in_array((int) $booking->store_id, $stores, true)), 403);
        if ($approval) {
            abort_unless(in_array($actor->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER], true), 403);
        }
    }

    /** Read-only candidates, never a capacity reservation or price calculation. */
    public function review(ServiceBooking $booking, User $actor): array
    {
        $this->authorize($actor, $booking, true);
        $blocked = ! in_array($booking->status, ['held', 'pending_payment'], true)
            || ! in_array($booking->booking_channel, ['offline_walkin', 'offline_phone'], true)
            || $booking->start_datetime === null || ! $booking->start_datetime->isFuture()
            || $booking->end_datetime === null || ! $booking->end_datetime->gt($booking->start_datetime)
            || ($booking->held_until !== null && $booking->held_until->isPast())
            || (float) $booking->total_amount <= 0 || (float) $booking->advance_paid !== 0.0
            || (float) $booking->balance_due !== (float) $booking->total_amount
            || ! in_array($booking->payment_status, ['pending', 'unpaid'], true)
            || ServicePaymentReceipt::where('service_booking_id', $booking->id)->exists()
            || ServiceQuoteSnapshot::where('service_booking_id', $booking->id)->exists();
        $item = $booking->serviceItem;
        $type = match ($booking->service_type) {
            'boating' => 'boat', 'scuba' => 'scuba_slot', 'homestay' => 'stay_room',
            'guide' => 'tour_guide', 'tours' => 'tour_departure', default => null,
        };
        $blocked = $blocked || $item === null || ! $item->isAvailable()
            || $item->store_id !== $booking->store_id
            || $item->store?->status !== \App\Enums\StoreStatus::ACTIVE
            || ($type === null && $booking->service_type !== 'taxi');
        $review = [
            'blocked' => $blocked, 'resources' => [], 'vehicles' => [], 'drivers' => [],
            'expected_total_paise' => (int) round((float) $booking->total_amount * 100),
            'expected_starts_at' => $booking->start_datetime?->toDateTimeString(),
            'expected_ends_at' => $booking->end_datetime?->toDateTimeString(),
        ];
        if ($blocked) {
            return $review;
        }
        if ($type !== null) {
            $review['resources'] = \App\Models\ServiceResource::where('service_item_id', $booking->service_item_id)
                ->where('store_id', $booking->store_id)->where('resource_type', $type)
                ->where('status', 'available')->where('capacity_units', '>=', $booking->quantity)
                ->orderBy('code')->get(['id', 'code', 'name', 'capacity_units'])->toArray();
        } else {
            $eligibility = app(CabDispatchEligibility::class);
            $review['vehicles'] = \App\Models\CabVehicle::with(['store', 'serviceItem', 'resource'])
                ->where('store_id', $booking->store_id)->where('service_item_id', $booking->service_item_id)
                ->where('seats', '>=', $booking->quantity)->orderBy('registration_number')->get()
                ->filter(fn ($cab) => $eligibility->vehicle($cab))
                ->map(fn ($cab) => ['id' => $cab->id, 'name' => $cab->registration_number, 'seats' => $cab->seats])->values()->all();
            $review['drivers'] = \App\Models\CabDriver::with(['store', 'serviceItem', 'resource'])
                ->where('store_id', $booking->store_id)->where('service_item_id', $booking->service_item_id)->orderBy('name')->get()
                ->filter(fn ($driver) => $eligibility->driver($driver))
                ->map(fn ($driver) => ['id' => $driver->id, 'name' => $driver->name])->values()->all();
        }
        return $review;
    }

    public function approve(int $id, User $actor, array $input): ServiceBooking
    {
        $data = validator($input, [
            'expected_total_paise' => ['required', 'integer', 'min:1', 'max:9999999999'],
            'expected_starts_at' => ['required', 'date'],
            'expected_ends_at' => ['required', 'date', 'after:expected_starts_at'],
            'approval_notes' => ['required', 'string', 'min:5', 'max:1200', 'not_regex:/^\\s*$/'],
            'resource_ids' => ['sometimes', 'array', 'max:2'],
            'resource_ids.*' => ['integer', 'min:1', 'distinct'],
            'cab_vehicle_id' => ['nullable', 'integer', 'min:1'],
            'cab_driver_id' => ['nullable', 'integer', 'min:1'],
        ])->validate();
        return DB::transaction(function () use ($id, $actor, $data): ServiceBooking {
            $booking = ServiceBooking::whereKey($id)->lockForUpdate()->firstOrFail();
            $this->authorize($actor, $booking, true);
            $ids = array_map('intval', $data['resource_ids'] ?? []);
            sort($ids, SORT_NUMERIC);
            $context = [
                'resource_ids' => $ids, 'cab_vehicle_id' => isset($data['cab_vehicle_id']) ? (int) $data['cab_vehicle_id'] : null,
                'cab_driver_id' => isset($data['cab_driver_id']) ? (int) $data['cab_driver_id'] : null,
                'total_paise' => (int) $data['expected_total_paise'],
                'starts_at' => Carbon::parse($data['expected_starts_at'])->toDateTimeString(),
                'ends_at' => Carbon::parse($data['expected_ends_at'])->toDateTimeString(),
                'notes' => trim($data['approval_notes']),
            ];
            $context = \App\Logging\MaskSensitiveDataProcessor::maskSensitiveArray($context);
            if ($booking->start_datetime === null || $booking->end_datetime === null
                || $booking->start_datetime->toDateTimeString() !== $context['starts_at']
                || $booking->end_datetime->toDateTimeString() !== $context['ends_at']
                || (int) round((float) $booking->total_amount * 100) !== $context['total_paise']) {
                throw ValidationException::withMessages(['approval' => 'The reviewed schedule or amount changed. Review the current proposal again.']);
            }
            if ($booking->status === 'confirmed') {
                $audit = ActivityLog::where('action', 'service_booking.approved')
                    ->where('subject_type', ServiceBooking::class)->where('subject_id', (string) $id)->first();
                // MySQL JSON may reorder object keys; compare associative values.
                if ($audit !== null && $audit->new_values == $context
                    && app(ServiceReservationReadiness::class)->issue($booking) === null) {
                    return $booking; // Identical authorized replay; no new audit or allocation.
                }
                throw ValidationException::withMessages(['approval' => 'This booking is already confirmed or approval inputs changed.']);
            }
            if (! in_array($booking->status, ['held', 'pending_payment'], true)
                || ! in_array($booking->booking_channel, ['offline_walkin', 'offline_phone'], true)
                || ! $booking->start_datetime->isFuture()
                || ($booking->held_until !== null && $booking->held_until->isPast())
                || (float) $booking->advance_paid !== 0.0
                || (int) round((float) $booking->balance_due * 100) !== $context['total_paise']
                || ! in_array($booking->payment_status, ['pending', 'unpaid'], true)
                || ServicePaymentReceipt::where('service_booking_id', $id)->exists()
                || ServiceQuoteSnapshot::where('service_booking_id', $id)->exists()) {
                throw ValidationException::withMessages(['approval' => 'Only a current unpaid offline proposal can use this approval workflow.']);
            }
            app(ServiceBookingLifecycle::class)->assertTransition($booking, 'confirmed');
            // This status is uncommitted until resources, readiness and audit all
            // succeed. Reuse cab pairing without exposing a confirmed-only gap.
            $oldStatus = $booking->status;
            $booking->update(['status' => 'confirmed', 'held_until' => null]);
            if ($booking->service_type === 'taxi') {
                if ($ids !== [] || $context['cab_vehicle_id'] === null || $context['cab_driver_id'] === null) {
                    throw ValidationException::withMessages(['resources' => 'Select a cab and driver, not raw cab resource IDs.']);
                }
                app(CabDispatchService::class)->assign($booking, $context['cab_vehicle_id'], $context['cab_driver_id'], $actor, $context['notes']);
            } else {
                if (count($ids) !== 1 || $context['cab_vehicle_id'] !== null || $context['cab_driver_id'] !== null) {
                    throw ValidationException::withMessages(['resources' => 'Select one matching approved service resource.']);
                }
                app(ServiceResourceAllocator::class)->allocate($ids[0], $booking,
                    $context['starts_at'], $context['ends_at'], (int) $booking->quantity, 'confirmed');
            }
            if ($message = app(ServiceReservationReadiness::class)->issue($booking)) {
                throw ValidationException::withMessages(['resources' => $message]);
            }
            ActivityLog::create([
                'user_id' => $actor->id, 'store_id' => $booking->store_id,
                'action' => 'service_booking.approved', 'subject_type' => ServiceBooking::class,
                'subject_id' => (string) $booking->id, 'old_values' => ['status' => $oldStatus],
                'new_values' => $context,
            ]);
            return $booking->fresh();
        });
    }

    public function transition(int $id, User $actor, string $status, ?string $notes = null): ServiceBooking
    {
        return DB::transaction(function () use ($id, $actor, $status, $notes): ServiceBooking {
            $booking = ServiceBooking::whereKey($id)->lockForUpdate()->firstOrFail();
            $this->authorize($actor, $booking);
            if ($status === 'confirmed') {
                throw ValidationException::withMessages(['status' => 'Use explicit resource approval to confirm a reservation.']);
            }
            if ($booking->service_type === 'taxi' && in_array($booking->status, ['confirmed', 'in_progress'], true)) {
                throw ValidationException::withMessages(['status' => 'Use the cab dispatch workflow to preserve paired trip state.']);
            }
            app(ServiceBookingLifecycle::class)->assertTransition($booking, $status);
            if ($booking->status === $status) {
                return $booking;
            }
            if (in_array($status, ['in_progress', 'completed'], true)
                && ($message = app(ServiceReservationReadiness::class)->issue($booking))) {
                throw ValidationException::withMessages(['resources' => $message]);
            }
            $old = $booking->status;
            $booking->update(['status' => $status, 'admin_notes' => $notes ?? $booking->admin_notes]);
            $releasedAllocations = 0;
            if (in_array($status, ['completed', 'cancelled'], true)) {
                $releasedAllocations = ServiceResourceAllocation::where('service_booking_id', $id)
                    ->whereIn('status', ['held', 'confirmed'])->update(['status' => 'released']);
                $booking->serviceItem?->releaseAvailability();
            }
            ActivityLog::create([
                'user_id' => $actor->id, 'store_id' => $booking->store_id,
                'action' => 'service_booking.status_updated', 'subject_type' => ServiceBooking::class,
                'subject_id' => (string) $id, 'old_values' => ['status' => $old], 'new_values' => ['status' => $status, 'released_allocations' => $releasedAllocations],
            ]);
            return $booking->fresh();
        });
    }
}
