<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProcessBookingRefundRequest;
use App\Http\Requests\Admin\UpdateBookingOverrideRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\RefundResource;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Services\RefundService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Authorize that the current authenticated user has admin privileges.
     */
    protected function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        $isAuthorized = $user !== null && (
            $user->role === UserRole::SUPER_ADMIN
            || $user->hasRole('super_admin')
            || $user->hasRole('admin')
        );

        if (! $isAuthorized) {
            throw new AuthorizationException('This action is unauthorized.');
        }
    }

    /**
     * Display a paginated listing of bookings with administrative filters.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $query = Booking::query()
            ->with(['user', 'bike', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds']);

        if ($request->filled('store_id')) {
            $storeId = (int) $request->query('store_id');
            $query->where(function ($q) use ($storeId): void {
                $q->where('pickup_store_id', $storeId)
                    ->orWhere('return_store_id', $storeId);
            });
        }

        if ($request->filled('channel')) {
            $query->where('channel', $request->query('channel'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('date')) {
            $date = (string) $request->query('date');
            $query->whereDate('start_date', '<=', $date)
                ->whereDate('end_date', '>=', $date);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('start_date', '>=', $request->query('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('end_date', '<=', $request->query('end_date'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', (int) $request->query('user_id'));
        }

        if ($request->filled('bike_id')) {
            $query->where('bike_id', (int) $request->query('bike_id'));
        }

        $perPage = $request->integer('per_page', 15);
        $bookings = $query->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => BookingResource::collection($bookings),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
            'message' => 'Bookings retrieved successfully.',
        ]);
    }

    /**
     * Display the specified booking.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $booking = Booking::with([
            'user',
            'bike.images',
            'pickupStore',
            'returnStore',
            'addons',
            'payments',
            'refunds',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Booking retrieved successfully.',
        ]);
    }

    /**
     * Administrative manual override for booking fields (dates, status, fee amounts).
     */
    public function update(int $id, UpdateBookingOverrideRequest $request): JsonResponse
    {
        $booking = Booking::findOrFail($id);
        $oldValues = $booking->only([
            'start_date',
            'end_date',
            'status',
            'total_amount',
            'base_amount',
            'deposit_amount',
            'discount_amount',
            'late_fee_amount',
            'damage_fee_amount',
            'pickup_store_id',
            'return_store_id',
        ]);

        $validated = $request->validated();
        $updateData = collect($validated)->except(['reason'])->all();

        $booking->update($updateData);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $booking->pickup_store_id,
            'action' => 'admin_booking_override',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'old_values' => $oldValues,
            'new_values' => array_merge($booking->fresh()->only(array_keys($oldValues)), [
                'reason' => $validated['reason'] ?? null,
            ]),
        ]);

        $booking->load(['user', 'bike', 'pickupStore', 'returnStore', 'addons', 'payments', 'refunds']);

        return response()->json([
            'success' => true,
            'data' => new BookingResource($booking),
            'message' => 'Booking updated successfully.',
        ]);
    }

    /**
     * Process an admin-authorized full or partial refund for a booking.
     */
    public function refund(
        int $id,
        ProcessBookingRefundRequest $request,
        RefundService $refundService
    ): JsonResponse {
        $booking = Booking::findOrFail($id);
        $validated = $request->validated();

        $amount = isset($validated['amount'])
            ? (float) $validated['amount']
            : (float) $booking->total_amount;

        $refund = $refundService->processManualRefund(
            booking: $booking,
            amount: $amount,
            reason: $validated['reason'],
            processedBy: $request->user()->id,
            paymentId: isset($validated['payment_id']) ? (int) $validated['payment_id'] : null
        );

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $booking->pickup_store_id,
            'action' => 'admin_booking_refund',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'old_values' => [
                'status' => $booking->status?->value ?? (string) $booking->status,
                'total_amount' => (float) $booking->total_amount,
            ],
            'new_values' => [
                'refund_id' => $refund->id,
                'amount' => $amount,
                'reason' => $validated['reason'],
            ],
        ]);

        return response()->json([
            'success' => true,
            'data' => new RefundResource($refund),
            'message' => 'Refund processed successfully.',
        ], 201);
    }
}
