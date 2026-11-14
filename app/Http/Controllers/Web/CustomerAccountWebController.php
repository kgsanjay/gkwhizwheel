<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CancelBookingRequest;
use App\Http\Requests\Customer\ExtendBookingRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\KycDocumentResource;
use App\Models\Booking;
use App\Models\Review;
use App\Models\ServiceBooking;
use App\Models\ServiceEnquiry;
use App\Services\AvailabilityService;
use App\Services\BookingService;
use App\Services\PricingService;
use App\Services\RefundService;
use App\Services\ServicePaymentEligibility;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CustomerAccountWebController extends Controller
{
    /**
     * Display the customer account dashboard with booking history.
     */
    public function index(Request $request): mixed
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->guest(route('login'));
        }

        $bookings = Booking::where('user_id', $user->id)
            ->with([
                'bike.images',
                'bike.category',
                'pickupStore',
                'returnStore',
                'pickupPoint',
                'returnPoint',
                'addons',
                'payments',
                'refunds',
                'review',
                'conditionLogs.photos',
            ])
            ->latest()
            ->get();

        $serviceBookings = ServiceBooking::with(['serviceItem'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $paymentEligibility = app(ServicePaymentEligibility::class);

        $serviceBookings->transform(function ($sb) use ($paymentEligibility) {
            $coord = (new \App\Notifications\ServiceBookingConfirmedNotification($sb))->getCoordinatorDetails();
            $sb->coordinator = $coord;
            $sb->is_payment_eligible = $paymentEligibility->issue($sb) === null;
            return $sb;
        });

        // Enquiries belonging to the customer's user_id or matching phone/email
        $serviceEnquiries = ServiceEnquiry::query()
            ->where(function ($q) use ($user): void {
                $q->where('user_id', $user->id);
                if (! empty($user->phone)) {
                    $q->orWhere('customer_phone', $user->phone);
                }
                if (! empty($user->email)) {
                    $q->orWhere('customer_email', $user->email);
                }
            })
            ->latest()
            ->get([
                'id', 'reference', 'service_type', 'start_datetime',
                'pickup_location', 'drop_location', 'quantity', 'status',
                'customer_name', 'customer_phone', 'customer_email',
                'created_at',
            ]);

        $activeStatuses = [
            BookingStatus::HELD->value,
            BookingStatus::PENDING_PAYMENT->value,
            BookingStatus::CONFIRMED->value,
            BookingStatus::HANDED_OVER->value,
        ];

        $bikeActiveCount = $bookings->filter(fn ($b) => in_array($b->status->value, $activeStatuses, true))->count();
        $bikeCompletedCount = $bookings->filter(fn ($b) => in_array($b->status, [BookingStatus::RETURNED, BookingStatus::COMPLETED], true))->count();
        $bikeCancelledCount = $bookings->filter(fn ($b) => $b->status === BookingStatus::CANCELLED)->count();

        $serviceActiveCount = $serviceBookings->filter(fn ($sb) => in_array($sb->status, ['held', 'pending_payment', 'confirmed', 'in_progress'], true))->count();
        $enquiryActiveCount = $serviceEnquiries->filter(fn ($e) => in_array($e->status, ['requested', 'reviewing'], true))->count();
        $serviceCompletedCount = $serviceBookings->filter(fn ($sb) => $sb->status === 'completed')->count();
        $serviceCancelledCount = $serviceBookings->filter(fn ($sb) => $sb->status === 'cancelled')->count();

        $activeCount = $bikeActiveCount + $serviceActiveCount + $enquiryActiveCount;
        $completedCount = $bikeCompletedCount + $serviceCompletedCount;
        $cancelledCount = $bikeCancelledCount + $serviceCancelledCount + $serviceEnquiries->filter(fn ($e) => $e->status === 'cancelled')->count();

        $featuredBikes = \App\Models\Bike::with(['category', 'currentStore', 'images'])
            ->where('status', \App\Enums\BikeStatus::AVAILABLE)
            ->take(3)
            ->get();

        $isKycVerified = $user->kycDocuments()->where('verified', true)->exists();
        $hasKycUploaded = $user->kycDocuments()->exists();

        return Inertia::render('Account/Bookings', [
            'bookings' => BookingResource::collection($bookings)->resolve(),
            'serviceBookings' => $serviceBookings,
            'serviceEnquiries' => $serviceEnquiries,
            'stats' => [
                'active_count' => $activeCount,
                'completed_count' => $completedCount,
                'cancelled_count' => $cancelledCount,
                'total_count' => $bookings->count() + $serviceBookings->count() + $serviceEnquiries->count(),
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'is_kyc_verified' => $isKycVerified,
                'has_kyc_uploaded' => $hasKycUploaded,
            ],
            'featuredBikes' => \App\Http\Resources\BikeResource::collection($featuredBikes)->resolve(),
        ]);
    }

    /**
     * Display detailed booking overview with bike documents and self-service actions.
     */
    public function show(int $id, Request $request): mixed
    {
        $currentUser = $request->user();

        if ($currentUser === null) {
            return redirect()->guest(route('login'));
        }

        $booking = Booking::with([
            'bike.images',
            'bike.category',
            'bike.documents',
            'pickupStore',
            'returnStore',
            'pickupPoint',
            'returnPoint',
            'addons',
            'payments',
            'refunds',
            'review',
            'conditionLogs.photos',
            'user',
        ])->findOrFail($id);

        $isOwner = $currentUser->id === $booking->user_id;
        $isStaffOrAdmin = in_array($currentUser->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true);

        if (! $isOwner && ! $isStaffOrAdmin) {
            abort(403, 'You are not authorized to view this booking.');
        }

        return Inertia::render('Account/BookingDetail', [
            'booking' => (new BookingResource($booking))->resolve(),
        ]);
    }

    /**
     * Cancel customer's own booking prior to pickup and process eligible refund.
     */
    public function cancelBooking(
        int $id,
        CancelBookingRequest $request,
        BookingService $bookingService,
        RefundService $refundService
    ): mixed {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $booking = Booking::with('payments')->findOrFail($id);
        abort_unless((int) $booking->user_id === (int) $user->id, 403, 'You do not own this booking.');

        if (! in_array($booking->status, [BookingStatus::HELD, BookingStatus::PENDING_PAYMENT, BookingStatus::CONFIRMED], true)) {
            return back()->withErrors(['booking' => 'Booking cannot be cancelled in its current status: '.$booking->status->value]);
        }

        $reason = (string) ($request->validated('reason') ?? 'Customer cancelled via account portal');
        $hasPaid = $booking->payments()->where('status', PaymentStatus::SUCCESS)->exists();

        $bookingService->cancel($booking, $reason, $user->id);

        if ($hasPaid) {
            $refundService->processCancellationRefund(
                booking: $booking,
                reason: $reason,
                processedBy: $user->id
            );
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Booking cancelled successfully.',
                'data' => (new BookingResource($booking->fresh(['payments', 'refunds'])))->resolve(),
            ]);
        }

        return back()->with('success', 'Booking cancelled successfully.');
    }

    /**
     * Extend customer's own active or confirmed booking if bike is available.
     */
    public function extendBooking(
        int $id,
        ExtendBookingRequest $request,
        BookingService $bookingService,
        AvailabilityService $availabilityService,
        PricingService $pricingService
    ): mixed {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $booking = Booking::with('bike')->findOrFail($id);
        abort_unless((int) $booking->user_id === (int) $user->id, 403, 'You do not own this booking.');

        $newEndDate = (string) $request->validated('new_end_date');

        try {
            $booking = $bookingService->extend(
                booking: $booking,
                newEndDate: $newEndDate,
                availabilityService: $availabilityService,
                pricingService: $pricingService
            );
        } catch (\InvalidArgumentException|\App\Exceptions\BikeNotAvailableException|\App\Exceptions\InvalidBookingTransitionException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'errors' => ['new_end_date' => [$e->getMessage()]],
                ], 422);
            }

            return back()->withErrors(['new_end_date' => $e->getMessage()]);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Booking extended successfully.',
                'data' => (new BookingResource($booking->fresh(['payments', 'refunds'])))->resolve(),
            ]);
        }

        return back()->with('success', 'Booking extended successfully to '.$newEndDate.'.');
    }

    /**
     * Rate and review customer's own completed booking.
     */
    public function reviewBooking(int $id, Request $request): mixed
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $booking = Booking::with('review')->findOrFail($id);
        abort_unless((int) $booking->user_id === (int) $user->id, 403, 'You do not own this booking.');

        if (! in_array($booking->status, [BookingStatus::COMPLETED, BookingStatus::RETURNED], true)) {
            abort(422, 'Reviews can only be submitted after the rental trip is completed.');
        }

        if ($booking->review !== null || Review::where('booking_id', $booking->id)->exists()) {
            abort(422, 'A review has already been submitted for this booking.');
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $review = Review::create([
            'booking_id' => $booking->id,
            'user_id' => $user->id,
            'bike_id' => $booking->bike_id,
            'rating' => (int) $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'is_visible' => true,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Thank you for rating your trip!',
                'data' => $review,
            ]);
        }

        return back()->with('success', 'Thank you for your review!');
    }

    /**
     * Update customer profile details.
     */
    public function updateProfile(Request $request): mixed
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
        ]);

        $user->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully.',
                'data' => $user->fresh(),
            ]);
        }

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Display customer KYC compliance and upload portal.
     */
    public function kyc(Request $request): mixed
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->guest(route('login'));
        }

        $documents = $user->kycDocuments()->latest()->get();

        return Inertia::render('Account/Kyc', [
            'documents' => KycDocumentResource::collection($documents)->resolve(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ],
        ]);
    }
}
