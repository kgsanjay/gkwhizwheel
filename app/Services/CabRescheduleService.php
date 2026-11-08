<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CabDispatch;
use App\Models\CabRescheduleRequest;
use App\Models\ServiceBooking;
use App\Models\ServiceResource;
use App\Models\ServiceResourceAllocation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * All-or-nothing change to existing cab/driver allocation windows.
 * Do not use for paid or online quoted reservations until repricing is supported.
 */
final class CabRescheduleService
{
    public function __construct(
        private readonly CabDispatchEligibility $eligibility,
        private readonly CabNotificationEventRecorder $notificationEvents
    ) {}

    public function resolve(int $id, User $actor, string $decision, ?string $reason = null): CabRescheduleRequest
    {
        abort_unless($actor->canManageService('taxi'), 403);
        if (! in_array($decision, ['approved', 'rejected'], true)) {
            throw ValidationException::withMessages(['decision' => 'Invalid rescheduling decision.']);
        }

        return DB::transaction(function () use ($id, $actor, $decision, $reason): CabRescheduleRequest {
            // Serializes with start/cancel and competing proposals for the same dispatch.
            $proposalRef = CabRescheduleRequest::findOrFail($id);
            $dispatch = CabDispatch::whereKey($proposalRef->cab_dispatch_id)->lockForUpdate()->firstOrFail();
            $booking = ServiceBooking::whereKey($dispatch->service_booking_id)->lockForUpdate()->firstOrFail();
            $proposal = CabRescheduleRequest::whereKey($id)->lockForUpdate()->firstOrFail();
            $stores = $actor->getAuthorizedStoreIds();
            abort_unless($booking->service_type === 'taxi' && $booking->store_id !== null
                && ($stores === null || in_array((int) $booking->store_id, $stores, true)), 403);

            if ($proposal->status !== 'pending') {
                throw ValidationException::withMessages(['proposal' => 'This proposal has already been resolved.']);
            }
            if ($decision === 'rejected') {
                if ($reason === null || mb_strlen(trim($reason)) < 5) {
                    throw ValidationException::withMessages(['reason' => 'A rejection reason is required.']);
                }
                $proposal->update(['status' => 'rejected', 'reviewed_by' => $actor->id,
                    'reviewed_at' => now(), 'review_notes' => trim($reason)]);
                return $proposal->fresh();
            }
            if ($dispatch->status !== 'assigned' || $booking->status !== 'confirmed'
                || ! $dispatch->starts_at->isFuture() || ! $proposal->proposed_starts_at->isFuture()
                || ! $proposal->proposed_ends_at->greaterThan($proposal->proposed_starts_at)
                || ! $proposal->original_starts_at->equalTo($dispatch->starts_at)
                || ! $proposal->original_ends_at->equalTo($dispatch->ends_at)
                || ! $booking->start_datetime->equalTo($dispatch->starts_at)
                || ! $booking->end_datetime?->equalTo($dispatch->ends_at)) {
                throw ValidationException::withMessages(['proposal' => 'Original schedule is stale or trip is no longer eligible.']);
            }
            // Original online quote IDs bind the date and price. Never bypass that contract.
            if (! in_array($booking->booking_channel, ['offline_walkin', 'offline_phone'], true)
                || (float) $booking->advance_paid > 0
                || ! in_array($booking->payment_status, ['pending', 'unpaid'], true)
                // Some legacy/partially reconciled bookings have captured
                // receipts even when the cached advance still reads zero.
                || \App\Models\ServicePaymentReceipt::where('service_booking_id', $booking->id)->exists()
                || \App\Models\ServiceQuoteSnapshot::where('service_booking_id', $booking->id)->exists()) {
                throw ValidationException::withMessages([
                    'proposal' => 'Priced, paid or receipt-backed trips require a separately approved quote/payment reconciliation.',
                ]);
            }
            if (! $this->eligibility->vehicle($dispatch->vehicle)
                || ! $this->eligibility->driver($dispatch->driver)) {
                throw ValidationException::withMessages(['resources' => 'Cab and driver compliance must be current.']);
            }

            $resourceIds = [$dispatch->vehicle->service_resource_id, $dispatch->driver->service_resource_id];
            sort($resourceIds, SORT_NUMERIC);
            foreach ($resourceIds as $resourceId) {
                $resource = ServiceResource::whereKey($resourceId)->lockForUpdate()->firstOrFail();
                if ($resource->status !== 'available' || $resource->capacity_units !== 1) {
                    throw ValidationException::withMessages(['resources' => 'Assigned resource is not available.']);
                }
                $allocation = ServiceResourceAllocation::where('service_resource_id', $resourceId)
                    ->where('service_booking_id', $booking->id)->lockForUpdate()->first();
                if ($allocation === null || $allocation->status !== 'confirmed'
                    || ! $allocation->starts_at->equalTo($dispatch->starts_at)
                    || ! $allocation->ends_at->equalTo($dispatch->ends_at)) {
                    throw ValidationException::withMessages(['resources' => 'Existing cab allocation is inconsistent.']);
                }
                $conflict = ServiceResourceAllocation::where('service_resource_id', $resourceId)
                    ->where('service_booking_id', '!=', $booking->id)
                    ->where('starts_at', '<', $proposal->proposed_ends_at)
                    ->where('ends_at', '>', $proposal->proposed_starts_at)
                    ->where(function ($q): void {
                        $q->where('status', 'confirmed')
                            ->orWhere(function ($held): void {
                                $held->where('status', 'held')
                                    ->where(function ($expiry): void {
                                        $expiry->whereNull('held_until')->orWhere('held_until', '>', now());
                                    });
                            });
                    })->exists();
                if ($conflict) {
                    throw ValidationException::withMessages(['resources' => 'Cab or driver is booked in the proposed window.']);
                }
                $allocation->update([
                    'starts_at' => $proposal->proposed_starts_at,
                    'ends_at' => $proposal->proposed_ends_at,
                ]);
            }
            $booking->update(['start_datetime' => $proposal->proposed_starts_at,
                'end_datetime' => $proposal->proposed_ends_at]);
            $dispatch->update(['starts_at' => $proposal->proposed_starts_at,
                'ends_at' => $proposal->proposed_ends_at]);
            $proposal->update(['status' => 'approved', 'reviewed_by' => $actor->id,
                'reviewed_at' => now(), 'review_notes' => $reason !== null ? trim($reason) : null]);
            $this->notificationEvents->record($booking, 'reschedule_approved', $proposal->id);
            return $proposal->fresh();
        }, 3);
    }
}
