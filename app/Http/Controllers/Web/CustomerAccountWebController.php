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
    public function index(Request $request): Response
    {
        $user = $request->user();

        $bookings = Booking::where('user_id', $user?->id)
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

        $activeStatuses = [
            BookingStatus::HELD->value,
            BookingStatus::PENDING_PAYMENT->value,
            BookingStatus::CONFIRMED->value,
            BookingStatus::HANDED_OVER->value,
        ];

        $activeCount = $bookings->filter(fn ($b) => in_array($b->status->value, $activeStatuses, true))->count();
        $completedCount = $bookings->filter(fn ($b) => $b->status === BookingStatus::RETURNED)->count();
        $cancelledCount = $bookings->filter(fn ($b) => $b->status === BookingStatus::CANCELLED)->count();

        return Inertia::render('Account/Bookings', [
            'bookings' => BookingResource::collection($bookings)->resolve(),
            'stats' => [
                'active_count' => $activeCount,
                'completed_count' => $completedCount,
                'cancelled_count' => $cancelledCount,
                'total_count' => $bookings->count(),
            ],
        ]);
    }

    /**
     * Display detailed booking overview with bike documents and self-service actions.
     */
    public function show(int $id, Request $request): Response
    {
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

        $currentUser = $request->user();

        if ($currentUser !== null) {
            $isOwner = $currentUser->id === $booking->user_id;
            $isStaffOrAdmin = in_array($currentUser->role, [UserRole::SUPER_ADMIN, UserRole::STORE_MANAGER, UserRole::STAFF], true);

            if (! $isOwner && ! $isStaffOrAdmin) {
                abort(403, 'You are not authorized to view this booking.');
            }
        }

        return Inertia::render('Account/BookingDetail', [
            'booking' => (new BookingResource($booking))->resolve(),
        ]);
    }

    /**
     * Display customer KYC compliance and upload portal.
     */
    public function kyc(Request $request): Response
    {
        $user = $request->user();
        $documents = $user ? $user->kycDocuments()->latest()->get() : collect();

        return Inertia::render('Account/Kyc', [
            'documents' => KycDocumentResource::collection($documents)->resolve(),
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ] : null,
        ]);
    }
}
