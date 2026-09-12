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
            'service_item_id' => ['nullable', 'exists:service_items,id'],
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
            'custom_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $item = null;
        if (! empty($validated['service_item_id'])) {
            $item = ServiceItem::where('service_type', $validated['service_type'])
                ->find($validated['service_item_id']);
        }
        if (! $item) {
            $item = ServiceItem::where('service_type', $validated['service_type'])->first();
        }

        $quantity = (int) $validated['quantity'];

        // Dynamic price calculation using PricingService
        $pricingService = app(\App\Services\PricingService::class);
        $quote = $item
            ? $pricingService->calculateServiceQuote(
                $validated['service_type'],
                $item,
                $validated['start_datetime'],
                $quantity
            )
            : null;

        $baseAmount = $quote ? $quote['base_amount'] : ($item ? (float) $item->price_base * $quantity : 0.0);

        // Total amount calculation with custom estimate fallback (e.g. custom packages or multi-day stays)
        if (! empty($validated['custom_amount']) && (float) $validated['custom_amount'] > 0) {
            $totalAmount = (float) $validated['custom_amount'];
        } elseif ($quote) {
            $totalAmount = (float) $quote['total_amount'];
        } else {
            $totalAmount = ($item ? (float) $item->price_base : 0.0) * $quantity;
        }

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
            $booking = $availabilityService->createServiceBooking([
                'booking_number' => $bookingNumber,
                'service_type' => $validated['service_type'],
                'service_item_id' => $item?->id,
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
        if ($user !== null && $booking->user_id !== null) {
            $isOwner = $user->id === $booking->user_id;
            $isStaffOrAdmin = in_array($user->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true);

            if (! $isOwner && ! $isStaffOrAdmin) {
                abort(403, 'You are not authorized to access this service booking.');
            }
        }
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

        $coordinator = \App\Notifications\ServiceBookingConfirmedNotification::SERVICE_COORDINATORS[$booking->service_type] ?? [
            'name' => 'WhizWheel Operations Desk',
            'phone' => '+91 94815 12340',
            'spot' => 'Palya Main Rd Hub, Honnavar',
        ];

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

        if ($booking->payment_status === 'paid' || (float) $booking->balance_due <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'This reservation is already fully settled.',
            ], 422);
        }

        $validated = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:1'],
        ]);

        $amount = (float) ($validated['amount'] ?? $booking->balance_due);
        if ($amount <= 0 || $amount > (float) $booking->balance_due) {
            $amount = (float) $booking->balance_due;
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

        $paidAmount = (float) $validated['amount'];

        // In production, verify HMAC signature if signature and order_id are present
        if (! app()->environment('local', 'testing') && ! empty($validated['razorpay_signature']) && ! empty($validated['razorpay_order_id'])) {
            $validSignature = $razorpayService->verifyPaymentSignature(
                $validated['razorpay_order_id'],
                $validated['razorpay_payment_id'],
                $validated['razorpay_signature']
            );

            if (! $validSignature) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment signature verification failed.',
                ], 400);
            }
        }

        $newAdvance = (float) $booking->advance_paid + $paidAmount;
        $total = (float) $booking->total_amount;
        $newBalance = max(0.0, $total - $newAdvance);
        $newPaymentStatus = $newBalance <= 0.01 ? 'paid' : 'partial';

        $booking->update([
            'advance_paid' => $newAdvance,
            'balance_due' => $newBalance,
            'payment_status' => $newPaymentStatus,
            'payment_method' => 'online',
        ]);

        ActivityLog::create([
            'user_id' => $request->user()?->id ?? $booking->user_id,
            'action' => 'service_booking.payment_received',
            'description' => "Online payment of ₹{$paidAmount} received for booking #{$booking->booking_number} (Ref: {$validated['razorpay_payment_id']})",
            'subject_type' => ServiceBooking::class,
            'subject_id' => (string) $booking->id,
            'metadata' => [
                'payment_id' => $validated['razorpay_payment_id'],
                'amount' => $paidAmount,
                'balance_due' => $newBalance,
                'payment_status' => $newPaymentStatus,
            ],
        ]);

        // Send updated confirmation to customer
        if ($booking->user) {
            $booking->user->notify(new ServiceBookingConfirmedNotification($booking));
        } elseif (! empty($booking->customer_phone)) {
            Notification::route('mail', $booking->customer_email ?: 'guest@whizwheel.com')
                ->route(\App\Channels\WhatsAppChannel::class, $booking->customer_phone)
                ->notify(new ServiceBookingConfirmedNotification($booking));
        }

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
        $validated = $request->validate([
            'service_type' => ['required', 'string'],
            'service_item_id' => ['nullable', 'integer'],
            'start_datetime' => ['required', 'date'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'base_price' => ['nullable', 'numeric', 'min:0'],
            'coupon_code' => ['nullable', 'string', 'max:50'],
        ]);

        $item = null;
        if (! empty($validated['service_item_id'])) {
            $item = ServiceItem::where('service_type', $validated['service_type'])
                ->find($validated['service_item_id']);
        }
        if (! $item) {
            $item = ServiceItem::where('service_type', $validated['service_type'])->first();
        }

        if (! $item && ! isset($validated['base_price'])) {
            return response()->json([
                'success' => false,
                'message' => 'Service item not found.',
            ], 404);
        }

        $quote = $pricingService->calculateServiceQuote(
            $validated['service_type'],
            $item,
            $validated['start_datetime'],
            (int) ($validated['quantity'] ?? 1),
            $validated['coupon_code'] ?? null,
            isset($validated['base_price']) ? (float) $validated['base_price'] : null
        );

        return response()->json([
            'success' => true,
            'quote' => $quote,
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
