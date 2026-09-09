<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\BookingStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\BookingResource;
use App\Http\Resources\KycDocumentResource;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
                'addons',
                'payments',
                'refunds',
            ])
            ->latest()
            ->get();

        $serviceBookings = \App\Models\ServiceBooking::with(['serviceItem'])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id);
                if (! empty($user->phone)) {
                    $cleanPhone = preg_replace('/^\+?91/', '', $user->phone);
                    $query->orWhere('customer_phone', $user->phone)
                        ->orWhere('customer_phone', $cleanPhone);
                }
                if (! empty($user->email)) {
                    $query->orWhere('customer_email', $user->email);
                }
            })
            ->latest()
            ->get();

        $serviceBookings->transform(function ($sb) {
            $coord = \App\Notifications\ServiceBookingConfirmedNotification::SERVICE_COORDINATORS[$sb->service_type] ?? null;
            $sb->coordinator = $coord;
            return $sb;
        });

        $activeStatuses = [
            BookingStatus::HELD->value,
            BookingStatus::PENDING_PAYMENT->value,
            BookingStatus::CONFIRMED->value,
            BookingStatus::HANDED_OVER->value,
        ];

        $bikeActiveCount = $bookings->filter(fn ($b) => in_array($b->status->value, $activeStatuses, true))->count();
        $bikeCompletedCount = $bookings->filter(fn ($b) => $b->status === BookingStatus::RETURNED)->count();
        $bikeCancelledCount = $bookings->filter(fn ($b) => $b->status === BookingStatus::CANCELLED)->count();

        $serviceActiveCount = $serviceBookings->filter(fn ($sb) => in_array($sb->status, ['confirmed', 'in_progress'], true))->count();
        $serviceCompletedCount = $serviceBookings->filter(fn ($sb) => $sb->status === 'completed')->count();
        $serviceCancelledCount = $serviceBookings->filter(fn ($sb) => $sb->status === 'cancelled')->count();

        $activeCount = $bikeActiveCount + $serviceActiveCount;
        $completedCount = $bikeCompletedCount + $serviceCompletedCount;
        $cancelledCount = $bikeCancelledCount + $serviceCancelledCount;

        $featuredBikes = \App\Models\Bike::with(['category', 'currentStore', 'images'])
            ->where('status', \App\Enums\BikeStatus::AVAILABLE)
            ->take(3)
            ->get();

        $isKycVerified = $user ? $user->kycDocuments()->where('verified', true)->exists() : false;
        $hasKycUploaded = $user ? $user->kycDocuments()->exists() : false;

        return Inertia::render('Account/Bookings', [
            'bookings' => BookingResource::collection($bookings)->resolve(),
            'serviceBookings' => $serviceBookings,
            'stats' => [
                'active_count' => $activeCount,
                'completed_count' => $completedCount,
                'cancelled_count' => $cancelledCount,
                'total_count' => $bookings->count() + $serviceBookings->count(),
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
            'addons',
            'payments',
            'refunds',
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
