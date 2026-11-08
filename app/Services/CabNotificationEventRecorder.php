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

        // Bind every notification intent to the actual cab operation.
        // A caller must not associate a valid operation from another booking.
        $source = $type === 'dispatch_cancelled'
            ? CabDispatch::find($sourceId)
            : CabRescheduleRequest::find($sourceId);
        $expectedStatus = $type === 'dispatch_cancelled' ? 'cancelled' : 'approved';
        if ($source === null
            || (int) $source->service_booking_id !== (int) $booking->id
            || $source->status !== $expectedStatus
            || ($type === 'dispatch_cancelled' && $booking->status !== 'cancelled')) {
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
