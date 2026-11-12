<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Customer;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CancelBookingRequest;
use App\Http\Requests\Customer\ConfirmPaymentRequest;
use App\Http\Requests\Customer\ExtendBookingRequest;
use App\Http\Requests\Customer\HoldBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use App\Services\BikeBookingPayments;
use App\Services\PhonePeService;
use App\Services\PricingService;
use App\Services\RazorpayService;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Create or retrieve a held booking with concurrency lock and idempotency.
     */
    public function hold(HoldBookingRequest $request, AvailabilityService $availabilityService): JsonResponse
    {
        $booking = $availabilityService->holdBooking([
            'bike_id' => (int) $request->validated('bike_id'),
            'user_id' => $request->user()->id,
            'pickup_store_id' => (int) $request->validated('pickup_store_id'),
            'return_store_id' => (int) $request->validated('return_store_id'),
            'pickup_point_id' => $request->validated('pickup_point_id'),
            'return_point_id' => $request->validated('return_point_id'),
            'pickup_location_details' => $request->validated('pickup_location_details'),
            'return_location_details' => $request->validated('return_location_details'),
            'start_date' => (string) $request->validated('start_date'),
            'end_date' => (string) $request->validated('end_date'),
            'channel' => BookingChannel::ONLINE,
            'idempotency_key' => (string) $request->validated('idempotency_key'),
            'coupon_code' => $request->validated('coupon_code'),
            'addons' => $request->validated('addons') ?? [],
        ]);

        $booking->load(['bike.images', 'pickupStore', 'returnStore', 'addons']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Booking hold created successfully.',
        ], $booking->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Allocate a specific physical bike from the requested model and create
     * a normal booking hold; checkout remains the existing booking-ID flow.
     */
    public function holdModel(
        \App\Http\Requests\Customer\HoldBikeModelRequest $request,
        AvailabilityService $availabilityService
    ): JsonResponse {
        $booking = $availabilityService->holdModelBooking([
            'bike_model_id' => (int) $request->validated('bike_model_id'),
            'user_id' => $request->user()->id,
            'pickup_store_id' => (int) $request->validated('pickup_store_id'),
            'return_store_id' => (int) $request->validated('return_store_id'),
            'pickup_point_id' => $request->validated('pickup_point_id'),
            'return_point_id' => $request->validated('return_point_id'),
            'pickup_location_details' => $request->validated('pickup_location_details'),
            'return_location_details' => $request->validated('return_location_details'),
            'start_date' => (string) $request->validated('start_date'),
            'end_date' => (string) $request->validated('end_date'),
            'idempotency_key' => (string) $request->validated('idempotency_key'),
            'coupon_code' => $request->validated('coupon_code'),
            'addons' => $request->validated('addons') ?? [],
        ]);
        $booking->load(['bike.images', 'pickupStore', 'returnStore', 'addons']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Bike model reservation held successfully.',
        ], $booking->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Initiate online checkout (Razorpay or PhonePe): creates gateway order for advance + deposit combined (Option A)
     * and transitions booking from held to pending_payment.
     */
    public function checkout(
        int $id,
        Request $request,
        RazorpayService $razorpayService,
        BookingService $bookingService,
        ?PhonePeService $phonePeService = null
    ): JsonResponse {
        $phonePeService ??= app(PhonePeService::class);
        $booking = Booking::where('user_id', $request->user()->id)
            ->findOrFail($id);

        if ($booking->status === BookingStatus::CONFIRMED) {
            return response()->json([
                'success' => false,
                'data' => new BookingResource($booking),
                'message' => 'Booking is already confirmed.',
                'errors' => null,
            ], 422);
        }

        if (! in_array($booking->status, [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT], true)) {
            return response()->json([
                'success' => false,
                'data' => new BookingResource($booking),
                'message' => 'Booking cannot be checked out in current status: '.$booking->status->value,
                'errors' => null,
            ], 422);
        }

        // Pending-payment retries must also respect the original deadline.
        if ($booking->held_until !== null && $booking->held_until->lte(now())) {
            return response()->json([
                'success' => false,
                'data' => new BookingResource($booking),
                'message' => 'This reservation hold has expired. Please reserve a bike again.',
                'errors' => ['booking' => ['Reservation hold expired.']],
            ], 422);
        }

        $validated = $request->validate([
            'gateway' => ['nullable', 'string', 'in:razorpay,phonepe'],
            'payment_option' => ['nullable', 'string', 'in:advance,full'],
            'redirect_url' => ['nullable', 'string', 'max:500'],
            'billing' => ['nullable', 'array'],
            'billing.type' => ['required_with:billing', 'in:personal,business'],
            'billing.name' => ['required_with:billing', 'string', 'min:2', 'max:150'],
            'billing.address' => ['required_with:billing', 'string', 'min:8', 'max:500'],
            'billing.state_code' => ['required_with:billing', 'digits:2'],
            'billing.gstin' => ['nullable', 'string', 'regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/'],
        ]);

        $gateway = strtolower((string) ($validated['gateway'] ?? $request->query('gateway', 'razorpay')));
        $option = (string) ($validated['payment_option'] ?? 'full');
        $breakdown = is_array($booking->price_breakdown_json) ? $booking->price_breakdown_json : [];

        // Billing details are snapshotted before creating a gateway order.
        // Never allow a payment retry to silently modify the invoice recipient.
        $billing = $validated['billing'] ?? null;
        if ($billing !== null) {
            if ($billing['type'] === 'business' && empty($billing['gstin'])) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'billing.gstin' => 'Business GST invoices require a GSTIN.',
                ]);
            }
            if (isset($billing['gstin']) && substr($billing['gstin'], 0, 2) !== $billing['state_code']) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'billing.gstin' => 'GSTIN state code must match the billing state.',
                ]);
            }
            if (isset($breakdown['checkout_billing']) && $breakdown['checkout_billing'] !== $billing) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'billing' => 'Billing details are locked after payment has been initiated.',
                ]);
            }
        } elseif (isset($breakdown['checkout_payment_option']) && ! isset($breakdown['checkout_billing'])) {
            // Preserve backwards compatibility for already-started payments.
            $billing = null;
        } elseif (isset($breakdown['checkout_billing'])) {
            $billing = $breakdown['checkout_billing'];
        }

        // Persist a server-calculated, immutable choice before creating an
        // external gateway order. Retries cannot switch amount or gateway.
        if (isset($breakdown['checkout_payment_option'])
            && ($breakdown['checkout_payment_option'] !== $option
                || ($breakdown['checkout_gateway'] ?? '') !== $gateway)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'payment_option' => 'A checkout was already started with another payment option or gateway.',
            ]);
        }
        $amount = BikeBookingPayments::amountFor($booking, $option);
        if ($amount <= 0) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'payment_option' => 'Online checkout requires a positive amount.',
            ]);
        }
        if ($billing !== null) {
            if (isset($breakdown['checkout_payment_option']) && ! isset($breakdown['checkout_billing'])) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'billing' => 'Billing details cannot be added to a payment already in progress.',
                ]);
            }
            $breakdown['checkout_billing'] = $billing;
        }
        $breakdown['checkout_payment_option'] = $option;
        $breakdown['checkout_gateway'] = $gateway;
        $breakdown['checkout_amount'] = $amount;
        $breakdown['balance_due_on_pickup'] = round(max(0, (float) $booking->total_amount - $amount), 2);
        if ($booking->status === BookingStatus::HELD) {
            $booking = $bookingService->markPendingPayment($booking);
        }
        $booking->update(['price_breakdown_json' => $breakdown]);

        if ($gateway === 'phonepe') {
            $paymentData = $phonePeService->createPayment($booking, $validated['redirect_url'] ?? null);

            $breakdown = is_array($booking->price_breakdown_json) ? $booking->price_breakdown_json : [];
            $breakdown['phonepe_transaction_id'] = $paymentData['merchant_transaction_id'];
            $booking->update(['price_breakdown_json' => $breakdown]);

            return response()->json([
                'success' => true,
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'gateway' => 'phonepe',
                    'merchant_transaction_id' => $paymentData['merchant_transaction_id'],
                    'redirect_url' => $paymentData['redirect_url'],
                    'amount' => $amount,
                    'payment_option' => $option,
                    'balance_due_on_pickup' => $breakdown['balance_due_on_pickup'],
                    'amount_paise' => $paymentData['amount_paise'],
                    'currency' => 'INR',
                    'status' => $booking->status->value,
                ],
                'message' => 'PhonePe checkout order created successfully.',
            ]);
        }

        $order = $razorpayService->createOrder($booking);

        $breakdown = is_array($booking->price_breakdown_json) ? $booking->price_breakdown_json : [];
        $breakdown['razorpay_order_id'] = $order['id'];
        $booking->update(['price_breakdown_json' => $breakdown]);

        return response()->json([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'gateway' => 'razorpay',
                'order_id' => $order['id'],
                'amount' => $amount,
                'payment_option' => $option,
                'balance_due_on_pickup' => $breakdown['balance_due_on_pickup'],
                'amount_paise' => (int) ($order['amount'] ?? round($amount * 100)),
                'currency' => $order['currency'] ?? 'INR',
                'key_id' => $order['key_id'] ?? (string) config('services.razorpay.key_id'),
                'status' => $booking->status->value,
                'notes' => $order['notes'] ?? [],
            ],
            'message' => 'Checkout order created successfully.',
        ]);
    }

    /**
     * Dedicated convenience endpoint for PhonePe checkout.
     */
    public function checkoutPhonepe(
        int $id,
        Request $request,
        PhonePeService $phonePeService,
        BookingService $bookingService
    ): JsonResponse {
        $request->merge(['gateway' => 'phonepe']);

        return $this->checkout($id, $request, app(RazorpayService::class), $bookingService, $phonePeService);
    }

    /**
     * Check payment status on client callback.
     * Note: Enforces that client-side callback CANNOT confirm bookings directly;
     * only verified server-to-server webhooks can confirm bookings.
     */
    public function confirmPayment(
        int $id,
        ConfirmPaymentRequest $request
    ): JsonResponse {
        $booking = Booking::where('user_id', $request->user()->id)
            ->with(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds'])
            ->findOrFail($id);

        if ($booking->status === BookingStatus::CONFIRMED) {
            return response()->json([
                'success' => true,
                'data' => new BookingResource($booking),
                'message' => 'Payment verified and booking confirmed.',
            ]);
        }

        return response()->json([
            'success' => false,
            'data' => new BookingResource($booking),
            'message' => 'Payment is awaiting server-to-server webhook confirmation. Bookings cannot be confirmed via client callback alone.',
            'errors' => null,
        ], 422);
    }

    /**
     * List current user's booking history.
     */
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::where('user_id', $request->user()->id)
            ->with(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => BookingResource::collection($bookings),
            'message' => '',
        ]);
    }

    /**
     * View detailed booking information.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $booking = Booking::where('user_id', $request->user()->id)
            ->with(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => '',
        ]);
    }

    /**
     * Cancel an active booking and calculate refund if paid.
     */
    public function cancel(
        int $id,
        CancelBookingRequest $request,
        BookingService $bookingService,
        RefundService $refundService
    ): JsonResponse {
        $booking = Booking::where('user_id', $request->user()->id)
            ->with(['payments'])
            ->findOrFail($id);

        $hasPaid = $booking->payments()->where('status', PaymentStatus::SUCCESS)->exists();
        $reason = (string) ($request->validated('reason') ?? 'Customer requested cancellation');

        $bookingService->cancel($booking, $reason, $request->user()->id);

        if ($hasPaid) {
            $refundService->processCancellationRefund(
                booking: $booking,
                reason: $reason,
                processedBy: $request->user()->id
            );
        }

        $booking->load(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Booking cancelled successfully.',
        ]);
    }

    /**
     * Extend booking dates if bike is available.
     */
    public function extend(
        int $id,
        ExtendBookingRequest $request,
        BookingService $bookingService,
        AvailabilityService $availabilityService,
        PricingService $pricingService
    ): JsonResponse {
        $booking = Booking::where('user_id', $request->user()->id)
            ->with(['bike'])
            ->findOrFail($id);

        $newEndDate = (string) $request->validated('new_end_date');

        $booking = $bookingService->extend(
            booking: $booking,
            newEndDate: $newEndDate,
            availabilityService: $availabilityService,
            pricingService: $pricingService
        );

        $booking->load(['bike.images', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Booking extended successfully.',
        ]);
    }

    /**
     * Get short-lived signed URLs for the booked bike's RC, Insurance, and Emission Certificate.
     */
    public function documents(int $id, Request $request): JsonResponse
    {
        $booking = Booking::with(['bike.documents'])->findOrFail($id);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Forbidden. You do not own this booking.',
                'errors' => null,
            ], 403);
        }

        $activeStatuses = [
            \App\Enums\BookingStatus::HELD,
            \App\Enums\BookingStatus::PENDING_PAYMENT,
            \App\Enums\BookingStatus::CONFIRMED,
            \App\Enums\BookingStatus::HANDED_OVER,
        ];

        if (! in_array($booking->status, $activeStatuses, true)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Documents are only accessible for active or upcoming bookings.',
                'errors' => null,
            ], 422);
        }

        $documents = $booking->bike->documents->map(function ($doc): array {
            return [
                'id' => $doc->id,
                'document_type' => $doc->document_type?->value ?? (string) $doc->document_type,
                'file_name' => basename((string) $doc->file_path),
                'expiry_date' => $doc->expiry_date?->toDateString(),
                'verified' => (bool) $doc->verified,
                'temporary_url' => \Illuminate\Support\Facades\URL::temporarySignedRoute(
                    'bike-documents.download',
                    now()->addMinutes(15),
                    ['id' => $doc->id]
                ),
            ];
        })->values()->all();

        return response()->json([
            'success' => true,
            'data' => [
                'booking_id' => $booking->id,
                'bike_id' => $booking->bike_id,
                'documents' => $documents,
            ],
            'message' => '',
        ]);
    }
}
