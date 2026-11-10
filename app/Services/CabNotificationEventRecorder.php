<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CabNotificationEvent;
use App\Models\CabDispatch;
use App\Models\CabRescheduleRequest;
use App\Models\ServiceBooking;
use Illuminate\Validation\ValidationException;

/**
 * Durable intent ledger, NOT a delivery queue. No customer contact is attempted.
 * Unique event keys prevent duplicate intents from retries and replay.
 */
final class CabNotificationEventRecorder
{
    public function record(ServiceBooking $booking, string $type, int $sourceId): CabNotificationEvent
    {
        if ($booking->service_type !== 'taxi'
            || ! in_array($type, ['dispatch_cancelled', 'reschedule_approved'], true)
            || $sourceId < 1) {
            throw ValidationException::withMessages(['event' => 'Invalid cab notification event.']);
        }

        // Never trust a potentially stale in-memory booking status when recording
        // an operation intent. The persisted booking is the source of truth.
        $booking = ServiceBooking::findOrFail($booking->id);

        // Bind every notification intent to the actual cab operation.
        // A caller must not associate a valid operation from another booking.
        $source = $type === 'dispatch_cancelled'
            ? CabDispatch::find($sourceId)
            : CabRescheduleRequest::find($sourceId);
        $expectedStatus = $type === 'dispatch_cancelled' ? 'cancelled' : 'approved';
        $sourceBookingId = $type === 'dispatch_cancelled'
            ? $source?->service_booking_id
            : $source?->dispatch?->service_booking_id;
        if ($source === null
            || (int) $sourceBookingId !== (int) $booking->id
            || $source->status !== $expectedStatus
            || ($type === 'dispatch_cancelled' && $booking->status !== 'cancelled')
            || ($type === 'reschedule_approved' && (
                $booking->status !== 'confirmed'
                || $source->dispatch?->status !== 'assigned'
                || $source->reviewed_at === null
                || $source->reviewed_by === null
                || $source->dispatch?->starts_at === null
                || $source->dispatch?->ends_at === null
                || ! $source->dispatch->starts_at->equalTo($source->proposed_starts_at)
                || ! $source->dispatch->ends_at->equalTo($source->proposed_ends_at)
                || $booking->start_datetime === null
                || $booking->end_datetime === null
                || ! $booking->start_datetime->equalTo($source->proposed_starts_at)
                || ! $booking->end_datetime->equalTo($source->proposed_ends_at)
            ))) {
            throw ValidationException::withMessages(['event' => 'Cab notification source does not match a completed operation.']);
        }

        $key = $type.':'.$sourceId;
        // MySQL + SQLite enforce event_key uniqueness. firstOrCreate is safe
        // against duplicate workers only with the unique index in place.
        return CabNotificationEvent::firstOrCreate(
            ['event_key' => $key],
            [
                'service_booking_id' => $booking->id,
                'event_type' => $type,
                'status' => 'pending_approval',
                'recorded_at' => now(),
            ]
        );
    }
}
