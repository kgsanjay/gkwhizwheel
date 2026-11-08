<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\User;
use App\Notifications\ServiceBookingConfirmedNotification;
use App\Notifications\ServicePaymentReceivedNotification;
use App\Notifications\ServiceManagerBookingAlertNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerServiceBookingController extends Controller
{
    protected const SERVICE_PREFIXES = [
        'two_wheelers' => 'BW',
        'taxi' => 'TX',
        'boating' => 'BT',
        'scuba' => 'SC',
        'homestay' => 'HS',
        'guide' => 'GD',
        'tours' => 'TR',
    ];

    /**
     * Store online customer booking securely
     */
    public function store(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if (! Auth::check()) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Please log in to confirm your booking.'], 401);
            }
            return redirect()->guest(route('login'))->with('error', 'Please log in to confirm your reservation.');
        }

        $validated = $request->validate([
            'service_type' => ['required', 'string', 'in:two_wheelers,taxi,boating,scuba,homestay,guide,tours'],
            'service_item_id' => ['required', 'integer', 'exists:service_items,id'],
            'quote_id' => ['required', 'uuid', 'exists:service_quote_snapshots,public_id'],
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_phone' => ['required', 'string', 'regex:/^[6-9]\d{9}$/'],
            'customer_email' => ['nullable', 'email', 'max:150'],
            'start_datetime' => ['required', 'date', 'after:yesterday'],
            'end_datetime' => ['nullable', 'date', 'after_or_equal:start_datetime'],
            'quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'pickup_location' => ['required', 'string', 'max:255'],
            'drop_location' => ['nullable', 'string', 'max:255'],
            'payment_method' => ['required', 'string', 'in:pay_on_arrival,upi,online,cash'],
            'customer_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $item = ServiceItem::where('service_type', $validated['service_type'])
            ->whereIn('status', ['available', 'active'])
            ->findOrFail($validated['service_item_id']);

        $quantity = (int) $validated['quantity'];
        // An accepted quote is a time-limited, user-owned snapshot of server
        // prices. Client-provided totals, coupons and price adjustments are ignored.
        $quoteSnapshot = \App\Models\ServiceQuoteSnapshot::where('public_id', $validated['quote_id'])->firstOrFail();
        app(\App\Services\ServiceQuoteSnapshots::class)->assertValidForBooking(
            $quoteSnapshot, $request->user()->id, $item,
            $validated['start_datetime'], $quantity, $validated['end_datetime'] ?? null
        );
        $quote = $quoteSnapshot->breakdown_json;
        $baseAmount = (float) $quoteSnapshot->base_amount;
        $totalAmount = (float) $quoteSnapshot->total_amount;

        // Advance calculation: If pay_on_arrival, advance is 0
        $advancePaid = 0.00;
        $paymentStatus = 'pending';
        $balanceDue = max(0, $totalAmount - $advancePaid);

        // Append surge breakdown notes transparently if dynamic rate applied
        $customerNotes = $validated['customer_notes'] ?? '';
        if ($quote && ! empty($quote['applied_rules'])) {
            $surgeLabels = array_map(fn ($r) => "{$r['rule_name']} (+₹{$r['total_adjustment']})", $quote['applied_rules']);
            $surgeNote = 'Applied Surge/Special Rate: ' . implode(', ', $surgeLabels);
            $customerNotes = $customerNotes ? "{$customerNotes}\n{$surgeNote}" : $surgeNote;
        }

        $prefix = self::SERVICE_PREFIXES[$validated['service_type']] ?? 'SRV';
        $dateCode = Carbon::now()->format('ymd');
        $randomCode = strtoupper(Str::random(4));
        $bookingNumber = "GKW-{$prefix}-{$dateCode}-{$randomCode}";

        $availabilityService = app(\App\Services\AvailabilityService::class);
        try {
            $booking = DB::transaction(function () use (
                $validated, $request, $item, $availabilityService, $bookingNumber,
                $quantity, $baseAmount, $totalAmount, $advancePaid, $balanceDue,
                $paymentStatus, $customerNotes, $quoteSnapshot, $quote
            ): ServiceBooking {
                $lockedQuote = \App\Models\ServiceQuoteSnapshot::whereKey($quoteSnapshot->id)
                    ->lockForUpdate()->firstOrFail();
                app(\App\Services\ServiceQuoteSnapshots::class)->assertValidForBooking(
                    $lockedQuote, $request->user()->id, $item,
                    $validated['start_datetime'], $quantity, $validated['end_datetime'] ?? null
                );
                $booking = $availabilityService->createServiceBooking([
                'booking_number' => $bookingNumber,
                'service_type' => $validated['service_type'],
                'service_item_id' => $item?->id,
                'store_id' => $item?->store_id,
                'user_id' => $request->user()?->id,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'] ?? null,
                'booking_channel' => 'online',
                'start_datetime' => $validated['start_datetime'],
                'end_datetime' => $validated['end_datetime'] ?? null,
                'pickup_location' => $validated['pickup_location'],
                'drop_location' => $validated['drop_location'] ?? null,
                'quantity' => $quantity,
                'base_amount' => $baseAmount,
                'tax_amount' => 0.00,
                'discount_amount' => $quote ? $quote['discount_amount'] : 0.00,
                'total_amount' => $totalAmount,
                'advance_paid' => $advancePaid,
                'balance_due' => $balanceDue,
                'payment_status' => $paymentStatus,
                'payment_method' => $validated['payment_method'],
                'status' => 'confirmed',
                'customer_notes' => $customerNotes ?: null,
            ]);
                if ($message = app(\App\Services\ServiceReservationReadiness::class)->issue($booking)) {
                    throw \Illuminate\Validation\ValidationException::withMessages(['resources' => $message]);
                }
                $lockedQuote->update(['service_booking_id' => $booking->id]);
                return $booking;
            });
        } catch (\App\Exceptions\ServiceItemNotAvailableException $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }

            return back()->withInput()->withErrors(['service_item_id' => $e->getMessage()])->with('error', $e->getMessage());
        }

        ActivityLog::create([
            'user_id' => $request->user()?->id,
            'action' => 'service_booking.online_created',
            'description' => "Online booking #{$bookingNumber} created for {$item->name} by {$booking->customer_name}",
            'subject_type' => ServiceBooking::class,
            'subject_id' => (string) $booking->id,
            'metadata' => [
                'total' => $totalAmount,
                'service' => $validated['service_type'],
                'phone' => $booking->customer_phone,
            ],
        ]);

        // Dispatch booking confirmation to customer (WhatsApp & Email)
        if ($request->user()) {
            $request->user()->notify(new ServiceBookingConfirmedNotification($booking));
        } else {
            Notification::route('mail', $booking->customer_email ?: 'guest@whizwheel.com')
                ->route(\App\Channels\WhatsAppChannel::class, $booking->customer_phone)
                ->notify(new ServiceBookingConfirmedNotification($booking));
        }

        // Dispatch operational alert to assigned service managers
        $managerIds = DB::table('service_user')
            ->where('service_type', $validated['service_type'])
            ->pluck('user_id');

        $managers = User::whereIn('id', $managerIds)->get();
        if ($managers->isEmpty()) {
            $managers = User::where('role', UserRole::SUPER_ADMIN)->get();
        }

        foreach ($managers as $manager) {
            $manager->notify(new ServiceManagerBookingAlertNotification($booking));
        }

        return redirect()->route('services.booking.confirmation', $bookingNumber);
    }

    /**
     * Verify ownership or staff/admin access for service booking operations.
     */
    protected function authorizeBookingAccess(?User $user, ServiceBooking $booking): void
    {
        abort_unless($user !== null, 403, 'Authentication required.');

        if ($user->role === UserRole::SUPER_ADMIN || ($booking->user_id !== null && $user->id === $booking->user_id)) {
            return;
        }

        if (in_array($user->role, [UserRole::STORE_MANAGER, UserRole::STAFF], true)
            && $booking->store_id !== null
            && $user->canManageService($booking->service_type)
            && in_array((int) $booking->store_id, $user->getAuthorizedStoreIds() ?? [], true)) {
            return;
        }

        abort(403, 'You are not authorized to access this service booking.');
    }

    /**
     * Show booking confirmation page
     */
    public function confirmation(string $bookingNumber, Request $request): Response
    {
        $booking = ServiceBooking::with(['serviceItem'])
            ->where('booking_number', $bookingNumber)
            ->firstOrFail();

        $this->authorizeBookingAccess($request->user(), $booking);

        $coordinator = (new ServiceBookingConfirmedNotification($booking))->getCoordinatorDetails();

        return Inertia::render('ServiceBookingConfirmation', [
            'booking' => $booking,
            'coordinator' => $coordinator,
            'razorpayKey' => config('services.razorpay.key_id', 'rzp_test_placeholder'),
        ]);
    }

    /**
     * Initiate online Razorpay payment for booking (advance or full balance)
     */
    public function initiatePayment(string $bookingNumber, Request $request, \App\Services\RazorpayService $razorpayService): \Illuminate\Http\JsonResponse
    {
        $booking = ServiceBooking::with(['serviceItem'])
            ->where('booking_number', $bookingNumber)
            ->firstOrFail();

        $this->authorizeBookingAccess($request->user(), $booking);

        $eligibility = app(\App\Services\ServicePaymentEligibility::class);
        if ($message = $eligibility->issue($booking)) {
            return response()->json(['success' => false, 'message' => $message], 422);
        }
        $validated = $request->validate(['amount' => ['nullable', 'numeric', 'min:1']]);
        $amount = (float) $booking->balance_due;
        $requestedPaise = (int) round((float) ($validated['amount'] ?? $amount) * 100);
        if (! $eligibility->amountAllowed($booking, $requestedPaise)) {
            return response()->json([
                'success' => false,
                'message' => 'Only the approved outstanding balance is payable online. Partial-payment terms are not configured.',
            ], 422);
        }

        try {
            $order = $razorpayService->createServiceOrder($booking, $amount);

            return response()->json([
                'success' => true,
                'order' => $order,
                'amount' => $amount,
                'key_id' => $order['key_id'] ?? config('services.razorpay.key_id', 'rzp_test_placeholder'),
                'booking_number' => $booking->booking_number,
                'customer' => [
                    'name' => $booking->customer_name,
                    'phone' => $booking->customer_phone,
                    'email' => $booking->customer_email,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not initiate online payment: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verify payment completion and settle booking balance
     */
    public function verifyPayment(string $bookingNumber, Request $request, \App\Services\RazorpayService $razorpayService): \Illuminate\Http\JsonResponse
    {
        $booking = ServiceBooking::with(['serviceItem'])
            ->where('booking_number', $bookingNumber)
            ->firstOrFail();

        $this->authorizeBookingAccess($request->user(), $booking);

        $validated = $request->validate([
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_order_id' => ['nullable', 'string'],
            'razorpay_signature' => ['nullable', 'string'],
            'amount' => ['required', 'numeric', 'min:1'],
        ]);

        $eligibility = app(\App\Services\ServicePaymentEligibility::class);
        if ($message = $eligibility->issue($booking)) {
            return response()->json(['success' => false, 'message' => $message], 422);
        }

        $paidAmount = (float) $validated['amount'];

        if (! app()->environment('testing')) {
            // Payment proof is mandatory in every running application environment.
            // Only the isolated automated test environment uses fixture payments.
            $orderId = (string) ($validated['razorpay_order_id'] ?? '');
            $signature = (string) ($validated['razorpay_signature'] ?? '');
            if ($orderId === '' || $signature === ''
                || ! $razorpayService->verifyPaymentSignature(
                    $orderId, $validated['razorpay_payment_id'], $signature
                )) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment signature verification failed.',
                ], 400);
            }

            $verifiedPaise = $razorpayService->verifiedServicePaymentAmountPaise(
                $booking, $orderId, $validated['razorpay_payment_id']
            );
            if ($verifiedPaise === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'The payment could not be verified with the payment provider.',
                ], 400);
            }
            $paidAmount = round($verifiedPaise / 100, 2);
        }

        $paidPaise = (int) round($paidAmount * 100);
        if (! $eligibility->amountAllowed($booking, $paidPaise)) {
            return response()->json([
                'success' => false,
                'message' => 'The verified payment does not equal the approved outstanding balance.',
            ], 422);
        }

        // Lock the booking while applying the payment so duplicate callbacks
        // cannot credit the same gateway payment twice.
        try {
        $applied = DB::transaction(function () use ($booking, $request, $validated, $paidAmount, $paidPaise): bool {
            $locked = ServiceBooking::whereKey($booking->id)->lockForUpdate()->firstOrFail();
            $paymentId = $validated['razorpay_payment_id'];
            if (app(\App\Services\ServicePaymentEligibility::class)->issue($locked) !== null
                || ! app(\App\Services\ServicePaymentEligibility::class)->amountAllowed($locked, $paidPaise)
                || \App\Models\ServicePaymentReceipt::where('provider', 'razorpay')
                    ->where('payment_id', $paymentId)->exists()
                || ActivityLog::where('action', 'service_booking.payment_received')
                    ->get()->contains(fn ($log) => ($log->new_values['payment_id'] ?? null) === $paymentId)) {
                return false;
            }
            // Unique(provider,payment_id) is enforced by the DB, even if two
            // workers race for the same payment on separate booking rows.
            \App\Models\ServicePaymentReceipt::create([
                'service_booking_id' => $locked->id,
                'provider' => 'razorpay',
                'payment_id' => $paymentId,
                'order_id' => $validated['razorpay_order_id'] ?? null,
                'amount_paise' => $paidPaise,
            ]);

            $newAdvance = round((float) $locked->advance_paid + $paidAmount, 2);
            $newBalance = max(0.0, round((float) $locked->total_amount - $newAdvance, 2));
            $newPaymentStatus = $newBalance <= 0.01 ? 'paid' : 'partial';

            $locked->update([
                'advance_paid' => $newAdvance,
                'balance_due' => $newBalance,
                'payment_status' => $newPaymentStatus,
                'payment_method' => 'online',
            ]);
            ActivityLog::create([
                'user_id' => $request->user()?->id ?? $locked->user_id,
                'action' => 'service_booking.payment_received',
                'description' => "Online payment of ₹{$paidAmount} received for booking #{$locked->booking_number} (Ref: {$paymentId})",
                'subject_type' => ServiceBooking::class,
                'subject_id' => (string) $locked->id,
                'new_values' => [
                    'payment_id' => $paymentId,
                    'amount' => $paidAmount,
                    'balance_due' => $newBalance,
                    'payment_status' => $newPaymentStatus,
                ],
            ]);
            return true;
        });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'This payment reference has already been processed.',
            ], 422);
        }

        if (! $applied) {
            return response()->json([
                'success' => false,
                'message' => 'Payment already applied or exceeds the outstanding balance.',
            ], 422);
        }
        $booking->refresh();

        // Notify only after the payment transaction commits. This is a receipt,
        // not another reservation confirmation. Never use a placeholder address.
        $receiptNotification = new ServicePaymentReceivedNotification(
            $booking, $validated['razorpay_payment_id'], $paidPaise
        );
        if ($booking->user && filter_var($booking->user->email, FILTER_VALIDATE_EMAIL)) {
            $booking->user->notify($receiptNotification);
        } elseif ($booking->customer_email && filter_var($booking->customer_email, FILTER_VALIDATE_EMAIL)) {
            Notification::route('mail', $booking->customer_email)->notify($receiptNotification);
        }

        // A successful payment is not a booking-status transition. Do not send
        // another "booking confirmed" message for an already confirmed booking.
        // Payment receipts require their own notification template and delivery flow.

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully.',
            'booking' => $booking->fresh()->load('serviceItem'),
        ]);
    }

    /**
     * Calculate live dynamic quote for travel service booking modal
     */
    public function calculateQuote(Request $request, \App\Services\PricingService $pricingService): \Illuminate\Http\JsonResponse
    {
        abort_unless($request->user(), 401, 'Sign in to request a service quote.');

        $validated = $request->validate([
            'service_type' => ['required', 'in:taxi,boating,scuba,homestay,guide,tours'],
            'service_item_id' => ['required', 'integer', 'exists:service_items,id'],
            'start_datetime' => ['required', 'date', 'after:now'],
            'end_datetime' => ['nullable', 'date', 'after:start_datetime'],
            'quantity' => ['required', 'integer', 'between:1,50'],
        ]);

        $item = ServiceItem::where('service_type', $validated['service_type'])
            ->whereIn('status', ['available', 'active'])
            ->findOrFail($validated['service_item_id']);

        $snapshot = app(\App\Services\ServiceQuoteSnapshots::class)->issue(
            $request->user()->id, $item, $validated['start_datetime'],
            (int) $validated['quantity'], $validated['end_datetime'] ?? null
        );
        $quote = $snapshot->breakdown_json;

        return response()->json([
            'success' => true,
            'confirmation_available' => false,
            'quote' => $quote,
            'quote_id' => $snapshot->public_id,
            'expires_at' => $snapshot->expires_at->toIso8601String(),
        ]);
    }

    /**
     * Download official PDF trip voucher / pass
     */
    public function downloadVoucher(string $bookingNumber, \App\Services\VoucherService $voucherService, Request $request): \Illuminate\Http\Response
    {
        $request->validate([
            'stream' => ['nullable', 'boolean'],
        ]);

        $booking = ServiceBooking::with(['serviceItem'])
            ->where('booking_number', $bookingNumber)
            ->firstOrFail();

        $this->authorizeBookingAccess($request->user(), $booking);

        return $voucherService->generateServiceVoucherPdf($booking, $request->boolean('stream'));
    }

    /**
     * View print-optimized trip pass in browser
     */
    public function printVoucher(string $bookingNumber, \App\Services\VoucherService $voucherService, Request $request): \Illuminate\View\View
    {
        $booking = ServiceBooking::with(['serviceItem'])
            ->where('booking_number', $bookingNumber)
            ->firstOrFail();

        $this->authorizeBookingAccess($request->user(), $booking);

        return $voucherService->renderServiceVoucherHtml($booking);
    }
}
