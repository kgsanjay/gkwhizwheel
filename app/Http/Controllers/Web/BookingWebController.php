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
    public function confirmation(int $id, Request $request): Response
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
        {
            $isOwner = $currentUser->id === $booking->user_id;
            $isStaffOrAdmin = in_array($currentUser->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true);

            if (! $isOwner && ! $isStaffOrAdmin) {
                abort(403, 'You are not authorized to view this booking confirmation.');
            }
        }

        return Inertia::render('Bookings/Confirmation', [
            'booking' => (new BookingResource($booking))->resolve(),
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
            'gateway' => ['nullable', 'string', 'in:razorpay,phonepe'],
        ]);

        $gateway = $validated['gateway'] ?? 'razorpay';
        $paymentMethod = $gateway === 'phonepe' ? PaymentMethod::PHONEPE : PaymentMethod::RAZORPAY;
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
            ->where('id', $id)
            ->orWhere('booking_number', $id)
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
    public function handlePhonePeCallback(Request $request): \Illuminate\Http\RedirectResponse
    {
        $txnId = (string) ($request->input('transactionId')
            ?? $request->input('merchantTransactionId')
            ?? $request->query('transactionId')
            ?? $request->query('merchantTransactionId')
            ?? '');

        if (preg_match('/^TXN_BK_(\d+)_/', $txnId, $m)) {
            return redirect()->route('bookings.confirmation', (int) $m[1])
                ->with('status', 'Returned from PhonePe. Your booking will be confirmed after server-side payment verification.');
        }

        if (preg_match('/^TXN_SRV_(\d+)_/', $txnId, $m)) {
            $srvBooking = \App\Models\ServiceBooking::find((int) $m[1]);
            if ($srvBooking) {
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
            ->where('id', $id)
            ->orWhere('booking_number', $id)
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

        return $voucherService->renderBikeVoucherHtml($booking);
    }
}
