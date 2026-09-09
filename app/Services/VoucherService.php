<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Booking;
use App\Models\ServiceBooking;
use App\Notifications\ServiceBookingConfirmedNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Illuminate\View\View;

class VoucherService
{
    public function __construct(
        protected QrCodeService $qrCodeService
    ) {}

    /**
     * Generate downloadable or streamable PDF voucher for a travel service booking.
     */
    public function generateServiceVoucherPdf(ServiceBooking $booking, bool $stream = false): Response
    {
        $verificationUrl = route('services.booking.confirmation', $booking->booking_number);
        $qrDataUri = $this->qrCodeService->generateDataUri($verificationUrl);

        $coordinator = ServiceBookingConfirmedNotification::SERVICE_COORDINATORS[$booking->service_type] ?? [
            'name' => 'WhizWheel Operations Desk',
            'phone' => '+91 86609 89586',
            'spot' => $booking->pickup_location,
        ];

        $pdf = Pdf::loadView('vouchers.service_voucher', [
            'booking' => $booking,
            'coordinator' => $coordinator,
            'qrDataUri' => $qrDataUri,
            'isPdf' => true,
        ])->setPaper('a4', 'portrait');

        $filename = "{$booking->booking_number}_voucher.pdf";

        return $stream ? $pdf->stream($filename) : $pdf->download($filename);
    }

    /**
     * Render the print-optimized HTML view for a service booking.
     */
    public function renderServiceVoucherHtml(ServiceBooking $booking): View
    {
        $verificationUrl = route('services.booking.confirmation', $booking->booking_number);
        $qrDataUri = $this->qrCodeService->generateDataUri($verificationUrl);

        $coordinator = ServiceBookingConfirmedNotification::SERVICE_COORDINATORS[$booking->service_type] ?? [
            'name' => 'WhizWheel Operations Desk',
            'phone' => '+91 86609 89586',
            'spot' => $booking->pickup_location,
        ];

        return view('vouchers.service_voucher', [
            'booking' => $booking,
            'coordinator' => $coordinator,
            'qrDataUri' => $qrDataUri,
            'isPdf' => false,
        ]);
    }

    /**
     * Generate downloadable or streamable PDF voucher for a two-wheeler fleet booking.
     */
    public function generateBikeVoucherPdf(Booking $booking, bool $stream = false): Response
    {
        $verificationUrl = route('bookings.confirmation', $booking->id);
        $qrDataUri = $this->qrCodeService->generateDataUri($verificationUrl);

        $pdf = Pdf::loadView('vouchers.bike_voucher', [
            'booking' => $booking->loadMissing(['bike.category', 'pickupStore', 'returnStore', 'addons', 'user']),
            'qrDataUri' => $qrDataUri,
            'isPdf' => true,
        ])->setPaper('a4', 'portrait');

        $filename = "{$booking->booking_number}_rental_agreement.pdf";

        return $stream ? $pdf->stream($filename) : $pdf->download($filename);
    }

    /**
     * Render the print-optimized HTML view for a fleet bike booking.
     */
    public function renderBikeVoucherHtml(Booking $booking): View
    {
        $verificationUrl = route('bookings.confirmation', $booking->id);
        $qrDataUri = $this->qrCodeService->generateDataUri($verificationUrl);

        return view('vouchers.bike_voucher', [
            'booking' => $booking->loadMissing(['bike.category', 'pickupStore', 'returnStore', 'addons', 'user']),
            'qrDataUri' => $qrDataUri,
            'isPdf' => false,
        ]);
    }
}
