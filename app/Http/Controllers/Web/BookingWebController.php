<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BookingStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Payment;
use App\Notifications\BookingConfirmationNotification;
use App\Notifications\PaymentReceiptNotification;
use App\Services\QrCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BookingWebController extends Controller
{
    /**
     * Display the booking confirmation page.
     */
    public function confirmation(int $id, Request $request, QrCodeService $qrCodeService): Response
    {
        $booking = Booking::with([
            'bike.images',
            'bike.category',
            'pickupStore',
            'returnStore',
            'addons',
            'payments',
            'refunds',
            'user',
        ])->findOrFail($id);

        $currentUser = $request->user();

        // Enforce authorization if user is logged into web session
        if ($currentUser === null) {
            abort(401, 'Sign in to access your booking documents.');
        }

        $isOwner = $currentUser->id === $booking->user_id;
        $isStaffOrAdmin = in_array($currentUser->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true);

        if (! $isOwner && ! $isStaffOrAdmin) {
            abort(403, 'You are not authorized to view this booking confirmation.');
        }

        $bookingData = (new BookingResource($booking))->resolve();
        $qrDataUri = $qrCodeService->generateDataUri(route('bookings.confirmation', $booking->id));
        $bookingData['qr_data_uri'] = $qrDataUri;
        $bookingData['qr_code_url'] = route('bookings.qr', $booking->id);

        return Inertia::render('Bookings/Confirmation', [
            'booking' => $bookingData,
            'qrDataUri' => $qrDataUri,
        ]);
    }

    /**
     * Simulate server-to-server webhook payment confirmation in local/testing environments.
     */
    public function simulateTestPayment(int $id, Request $request): JsonResponse
    {
        if (! app()->environment(['local', 'testing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Test simulation is only enabled in local and testing environments.',
            ], 403);
        }

        $booking = Booking::with(['user', 'bike'])->findOrFail($id);

        if ($booking->status === BookingStatus::CONFIRMED) {
            return response()->json([
                'success' => true,
                'data' => new BookingResource($booking),
                'message' => 'Booking is already confirmed.',
            ]);
        }

        $validated = $request->validate([
            'gateway' => ['nullable', 'string', 'in:phonepe'],
        ]);

        $gateway = $validated['gateway'] ?? 'phonepe';
        $paymentMethod = PaymentMethod::PHONEPE;
        $gatewayRef = 'pay_sim_'.bin2hex(random_bytes(6));

        DB::transaction(function () use ($booking, $paymentMethod, $gatewayRef): void {
            $booking->update([
                'status' => BookingStatus::CONFIRMED,
            ]);

            $payment = Payment::create([
                'booking_id' => $booking->id,
                'amount' => \App\Services\BikeBookingPayments::expectedGatewayAmount($booking),
                'method' => $paymentMethod,
                'type' => PaymentType::ADVANCE,
                'gateway_reference' => $gatewayRef,
                'status' => PaymentStatus::SUCCESS,
                'notes' => 'Simulated test webhook payment confirmation.',
            ]);

            // Notify user
            if ($booking->user !== null) {
                $booking->user->notify(new BookingConfirmationNotification($booking));
                $booking->user->notify(new PaymentReceiptNotification($payment, $booking));
            }
        });

        $booking->refresh()->load(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Booking confirmed via test payment simulation.',
        ]);
    }

    /**
     * Download official PDF rental agreement / voucher
     */
    public function downloadVoucher(int|string $id, \App\Services\VoucherService $voucherService, Request $request): \Illuminate\Http\Response
    {
        $request->validate([
            'stream' => ['nullable', 'boolean'],
        ]);

        $booking = Booking::with(['bike.category', 'pickupStore', 'returnStore', 'addons', 'user'])
            ->where(function ($query) use ($id): void {
                if (is_numeric($id)) {
                    $query->where('id', (int) $id)->orWhere('booking_reference', (string) $id);
                } else {
                    $query->where('booking_reference', (string) $id);
                }
            })
            ->firstOrFail();

        $currentUser = $request->user();
        if ($currentUser === null) {
            abort(401, 'Sign in to access your booking documents.');
        }
        {
            $isOwner = $currentUser->id === $booking->user_id;
            $isStaffOrAdmin = in_array($currentUser->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true);

            if (! $isOwner && ! $isStaffOrAdmin) {
                abort(403, 'You are not authorized to download this booking voucher.');
            }
        }

        if (! in_array($booking->status, [
            BookingStatus::CONFIRMED,
            BookingStatus::HANDED_OVER,
            BookingStatus::RETURNED,
            BookingStatus::COMPLETED,
        ], true)) {
            abort(409, 'Rental documents are available only after booking confirmation.');
        }

        return $voucherService->generateBikeVoucherPdf($booking, $request->boolean('stream'));
    }

    /**
     * Download a customer billing summary. This is not a GST tax invoice.
     */
    public function downloadBillingStatement(
        int $id,
        \App\Services\BikeBillingStatementService $billingService,
        Request $request
    ): \Illuminate\Http\Response {
        $currentUser = $request->user();
        if ($currentUser === null) {
            abort(401, 'Sign in to download the billing statement.');
        }

        $booking = Booking::with(['bike', 'pickupStore', 'returnStore', 'user', 'payments'])
            ->findOrFail($id);

        $isOwner = $currentUser->id === $booking->user_id;
        $isStaffOrAdmin = in_array($currentUser->role, [
            UserRole::SUPER_ADMIN,
            UserRole::STORE_MANAGER,
            UserRole::STAFF,
        ], true);

        if (! $isOwner && ! $isStaffOrAdmin) {
            abort(403, 'You are not authorized to download this billing statement.');
        }

        return $billingService->download($booking);
    }

    /**
     * Handle browser redirect callback from PhonePe payment gateway.
     */
    public function handlePhonePeCallback(
        Request $request,
        \App\Services\PhonePeService $phonePeService,
        \App\Services\BookingService $bookingService
    ): \Illuminate\Http\RedirectResponse {
        $txnId = (string) ($request->input('transactionId')
            ?? $request->input('merchantTransactionId')
            ?? $request->query('transactionId')
            ?? $request->query('merchantTransactionId')
            ?? '');

        if (preg_match('/^TXN_BK_(\d+)_/', $txnId, $m)) {
            $bookingId = (int) $m[1];
            $booking = Booking::with('user')->find($bookingId);

            if ($booking && $booking->user) {
                // Ensure customer is authenticated in the web session
                if (\Illuminate\Support\Facades\Auth::guest()) {
                    \Illuminate\Support\Facades\Auth::guard('web')->login($booking->user);
                    if ($request->hasSession()) {
                        $request->session()->regenerate();
                    }
                }

                // In local/testing environments where webhooks cannot reach 127.0.0.1,
                // auto-confirm the booking on successful callback from the UAT simulator.
                if (app()->environment('local', 'testing') && $booking->status !== BookingStatus::CONFIRMED) {
                    \Illuminate\Support\Facades\DB::transaction(function () use ($booking, $txnId): void {
                        $booking->update([
                            'status' => BookingStatus::CONFIRMED,
                        ]);

                        Payment::firstOrCreate(
                            [
                                'booking_id' => $booking->id,
                                'gateway_reference' => $txnId,
                            ],
                            [
                                'amount' => \App\Services\BikeBookingPayments::expectedGatewayAmount($booking),
                                'method' => PaymentMethod::PHONEPE,
                                'type' => PaymentType::ADVANCE,
                                'status' => PaymentStatus::SUCCESS,
                                'notes' => 'Simulated PhonePe UAT test confirmation.',
                            ]
                        );

                        if ($booking->user !== null) {
                            $booking->user->notify(new BookingConfirmationNotification($booking));
                        }
                    });
                } elseif ($booking->status !== BookingStatus::CONFIRMED) {
                    // Server-to-server fallback verification via PhonePe Check Status API
                    // in case the async webhook is delayed or blocked by a WAF/proxy.
                    $breakdown = is_array($booking->price_breakdown_json) ? $booking->price_breakdown_json : [];
                    $storedTxnId = (string) ($breakdown['phonepe_transaction_id'] ?? '');
                    if ($storedTxnId !== '' && hash_equals($storedTxnId, $txnId)) {
                        $status = $phonePeService->checkPaymentStatus($txnId);
                        $expectedPaise = (int) round(\App\Services\BikeBookingPayments::expectedGatewayAmount($booking) * 100);
                        if ($status['verified'] && $status['amount_paise'] === $expectedPaise) {
                            $gatewayRef = $status['transaction_id'] !== '' ? $status['transaction_id'] : $txnId;
                            DB::transaction(function () use ($booking, $gatewayRef, $bookingService, $breakdown): void {
                                $locked = Booking::where('id', $booking->id)->lockForUpdate()->first();
                                if (! $locked || $locked->status === BookingStatus::CONFIRMED) {
                                    return;
                                }

                                Payment::firstOrCreate(
                                    ['gateway_reference' => $gatewayRef],
                                    [
                                        'booking_id' => $locked->id,
                                        'amount' => \App\Services\BikeBookingPayments::expectedGatewayAmount($locked),
                                        'method' => PaymentMethod::PHONEPE,
                                        'type' => PaymentType::ADVANCE,
                                        'status' => PaymentStatus::SUCCESS,
                                        'notes' => 'PhonePe online bike rental '.(($breakdown['checkout_payment_option'] ?? 'full') === 'advance' ? 'advance' : 'full').' payment verified via status API',
                                    ]
                                );

                                if (in_array($locked->status, [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT], true)) {
                                    $bookingService->confirmPayment($locked, $gatewayRef);
                                }
                            });
                            $booking->refresh();
                        }
                    }
                }
            }

            $isConfirmed = $booking && $booking->status === BookingStatus::CONFIRMED;

            return redirect()->route('bookings.confirmation', $bookingId)
                ->with('status', $isConfirmed
                    ? 'Payment successful! Your booking is confirmed.'
                    : 'We are verifying your PhonePe payment. Your status will update shortly.');
        }

        if (preg_match('/^TXN_SRV_(\d+)_/', $txnId, $m)) {
            $srvBooking = \App\Models\ServiceBooking::with('user')->find((int) $m[1]);
            if ($srvBooking) {
                if ($srvBooking->user && \Illuminate\Support\Facades\Auth::guest()) {
                    \Illuminate\Support\Facades\Auth::guard('web')->login($srvBooking->user);
                    if ($request->hasSession()) {
                        $request->session()->regenerate();
                    }
                }

                return redirect()->route('services.booking.confirmation', $srvBooking->booking_number)
                    ->with('success', 'PhonePe payment processed. Review your service booking details below.');
            }
        }

        return redirect()->route('account.index');
    }

    /**
     * View print-optimized rental agreement / pass in browser
     */
    public function printVoucher(int|string $id, \App\Services\VoucherService $voucherService, Request $request): \Illuminate\View\View
    {
        $booking = Booking::with(['bike.category', 'pickupStore', 'returnStore', 'addons', 'user'])
            ->where(function ($query) use ($id): void {
                if (is_numeric($id)) {
                    $query->where('id', (int) $id)->orWhere('booking_reference', (string) $id);
                } else {
                    $query->where('booking_reference', (string) $id);
                }
            })
            ->firstOrFail();

        $currentUser = $request->user();
        if ($currentUser === null) {
            abort(401, 'Sign in to access your booking documents.');
        }
        {
            $isOwner = $currentUser->id === $booking->user_id;
            $isStaffOrAdmin = in_array($currentUser->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true);

            if (! $isOwner && ! $isStaffOrAdmin) {
                abort(403, 'You are not authorized to view this booking voucher.');
            }
        }

        if (! in_array($booking->status, [
            BookingStatus::CONFIRMED,
            BookingStatus::HANDED_OVER,
            BookingStatus::RETURNED,
            BookingStatus::COMPLETED,
        ], true)) {
            abort(409, 'Rental documents are available only after booking confirmation.');
        }

        return $voucherService->renderBikeVoucherHtml($booking);
    }

    /**
     * Stream check-in QR code as a PNG image.
     */
    public function qrCode(int|string $id, QrCodeService $qrCodeService, Request $request): \Illuminate\Http\Response
    {
        $booking = Booking::where(function ($query) use ($id): void {
            if (is_numeric($id)) {
                $query->where('id', (int) $id)->orWhere('booking_reference', (string) $id);
            } else {
                $query->where('booking_reference', (string) $id);
            }
        })->firstOrFail();

        $currentUser = $request->user();
        if ($currentUser !== null) {
            $isOwner = $currentUser->id === $booking->user_id;
            $isStaffOrAdmin = in_array($currentUser->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true);

            if (! $isOwner && ! $isStaffOrAdmin) {
                abort(403, 'You are not authorized to view this check-in pass.');
            }
        }

        $verificationUrl = route('bookings.confirmation', $booking->id);
        $png = $qrCodeService->generatePng($verificationUrl);

        return response($png, 200, [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
