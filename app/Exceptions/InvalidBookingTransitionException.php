<?php

declare(strict_types=1);

namespace App\Exceptions;

use App\Enums\BookingStatus;
use App\Models\Booking;
use RuntimeException;

class InvalidBookingTransitionException extends RuntimeException
{
    public static function make(Booking $booking, BookingStatus $targetStatus): self
    {
        $current = $booking->status instanceof BookingStatus ? $booking->status->value : (string) $booking->status;

        return new self("Cannot transition booking [{$booking->booking_reference}] from [{$current}] to [{$targetStatus->value}].");
    }
}
