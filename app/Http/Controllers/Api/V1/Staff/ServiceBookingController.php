<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Staff;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServiceBookingController extends Controller
{
    /**
     * Ensure staff member is authorized for a specific store ID if provided.
     * Logs an audit record if an explicit cross-store permission was used.
     */
    protected function authorizeStoreAccess(Request $request, int $storeId, ?ServiceBooking $booking = null, string $operation = 'access'): void
    {
        $user = $request->user();
        $authorizedStoreIds = $user->getAuthorizedStoreIds();

        if ($authorizedStoreIds === null) {
            if ($user->role !== UserRole::SUPER_ADMIN) {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'store_id' => $storeId,
                    'action' => 'cross_store_access',
                    'subject_type' => $booking ? ServiceBooking::class : Store::class,
                    'subject_id' => $booking?->id ?? $storeId,
                    'new_values' => [
                        'operation' => $operation,
                        'target_store_id' => $storeId,
                    ],
                ]);
            }

            return;
        }

        if (! in_array($storeId, $authorizedStoreIds, true)) {
            abort(403, "Unauthorized. You are not assigned to store ID {$storeId}.");
        }
    }

    /**
     * Verify service permission for the authenticated staff/manager.
     */
    protected function authorizeServiceAccess(Request $request, string $serviceType): void
    {
        $user = $request->user();
        if ($user->role === UserRole::SUPER_ADMIN) {
            return;
        }

        if (! $user->canManageService($serviceType)) {
            abort(403, "Unauthorized. You are not assigned to manage the {$serviceType} service.");
        }
    }

    /**
     * Display a listing of service bookings with store and service scoping.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->query('store_id'), null, 'list_service_bookings');
        }

        $query = ServiceBooking::query()
            ->with(['serviceItem.images', 'user']);

        // Service Scoping: if not super admin, restrict to assigned services
        if ($user->role !== UserRole::SUPER_ADMIN) {
            $assigned = $user->assignedServicesList();
            $query->whereIn('service_type', $assigned);
        }

        if ($request->filled('service_type')) {
            $serviceType = (string) $request->query('service_type');
            $this->authorizeServiceAccess($request, $serviceType);
            $query->where('service_type', $serviceType);
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        if ($request->filled('date')) {
            $query->whereDate('start_datetime', (string) $request->query('date'));
        }

        if ($request->filled('start_date')) {
            $query->whereDate('start_datetime', '>=', (string) $request->query('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('start_datetime', '<=', (string) $request->query('end_date'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            $query->where(function ($q) use ($search): void {
                $q->where('booking_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%");
            });
        }

        $perPage = min(100, max(1, $request->integer('per_page', 20)));
        $bookings = $query->latest('id')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
            'message' => 'Service bookings retrieved successfully.',
        ]);
    }

    /**
     * Display the specified service booking.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->query('store_id'), null, 'show_service_booking');
        }

        $booking = ServiceBooking::with(['serviceItem.images', 'user'])->findOrFail($id);

        $this->authorizeServiceAccess($request, $booking->service_type);

        return response()->json([
            'success' => true,
            'data' => $booking,
            'message' => 'Service booking retrieved successfully.',
        ]);
    }

    /**
     * Store a newly created service booking (walk-in / phone / offline).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->input('store_id'), null, 'create_service_booking');
        }

        $validated = $request->validate([
            'service_type' => ['required', 'string', 'in:two_wheelers,taxi,boating,scuba,homestay,guide,tours'],
            'service_item_id' => ['nullable', 'exists:service_items,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'customer_email' => ['nullable', 'email', 'max:255'],
            'booking_channel' => ['nullable', 'string', 'in:offline_walkin,offline_phone,online'],
            'start_datetime' => ['required', 'date'],
            'end_datetime' => ['nullable', 'date', 'after_or_equal:start_datetime'],
            'pickup_location' => ['nullable', 'string', 'max:255'],
            'drop_location' => ['nullable', 'string', 'max:255'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'base_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'advance_paid' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string', 'in:cash,upi,card,pay_on_arrival,online'],
            'customer_notes' => ['nullable', 'string'],
            'admin_notes' => ['nullable', 'string'],
            'store_id' => ['nullable', 'integer'],
        ]);

        $this->authorizeServiceAccess($request, $validated['service_type']);

        $booking = DB::transaction(function () use ($validated, $user) {
            $totalAmount = (float) $validated['total_amount'];
            $advancePaid = (float) ($validated['advance_paid'] ?? 0);
            $balanceDue = max(0.0, round($totalAmount - $advancePaid, 2));

            $paymentStatus = match (true) {
                $advancePaid >= $totalAmount => 'paid',
                $advancePaid > 0 => 'partial',
                default => 'pending',
            };

            $prefix = match ($validated['service_type']) {
                'two_wheelers' => 'TW',
                'taxi' => 'TX',
                'boating' => 'BT',
                'scuba' => 'SC',
                'homestay' => 'HS',
                'guide' => 'GD',
                'tours' => 'TR',
                default => 'SB',
            };
            $bookingNumber = $prefix . '-' . date('ymd') . '-' . strtoupper(Str::random(4));

            $serviceItem = ! empty($validated['service_item_id'])
                ? ServiceItem::find($validated['service_item_id'])
                : null;

            $quantity = (int) ($validated['quantity'] ?? 1);

            $booking = ServiceBooking::create([
                'booking_number' => $bookingNumber,
                'service_type' => $validated['service_type'],
                'service_item_id' => $serviceItem?->id,
                'user_id' => null,
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'] ?? null,
                'booking_channel' => $validated['booking_channel'] ?? 'offline_walkin',
                'start_datetime' => $validated['start_datetime'],
                'end_datetime' => $validated['end_datetime'] ?? null,
                'pickup_location' => $validated['pickup_location'] ?? null,
                'drop_location' => $validated['drop_location'] ?? null,
                'quantity' => $quantity,
                'base_amount' => (float) ($validated['base_amount'] ?? $totalAmount),
                'tax_amount' => (float) ($validated['tax_amount'] ?? 0),
                'discount_amount' => (float) ($validated['discount_amount'] ?? 0),
                'total_amount' => $totalAmount,
                'advance_paid' => $advancePaid,
                'balance_due' => $balanceDue,
                'payment_status' => $paymentStatus,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'status' => 'confirmed',
                'customer_notes' => $validated['customer_notes'] ?? null,
                'admin_notes' => $validated['admin_notes'] ?? null,
                'created_by' => $user->id,
            ]);

            if ($serviceItem) {
                $serviceItem->decrementAvailability($quantity);
            }

            return $booking;
        });

        ActivityLog::create([
            'user_id' => $user->id,
            'store_id' => $validated['store_id'] ?? null,
            'action' => 'service_booking_created',
            'subject_type' => ServiceBooking::class,
            'subject_id' => $booking->id,
            'new_values' => [
                'booking_number' => $booking->booking_number,
                'service_type' => $booking->service_type,
                'customer_name' => $booking->customer_name,
                'total_amount' => (string) $booking->total_amount,
                'status' => $booking->status,
            ],
        ]);

        $booking->load(['serviceItem.images', 'user']);

        return response()->json([
            'success' => true,
            'data' => $booking,
            'message' => 'Service booking created successfully.',
        ], 201);
    }

    /**
     * Update the status of the specified service booking.
     */
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $booking = ServiceBooking::findOrFail($id);

        $this->authorizeServiceAccess($request, $booking->service_type);

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->input('store_id'), $booking, 'update_service_booking_status');
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:confirmed,in_progress,completed,cancelled'],
            'admin_notes' => ['nullable', 'string'],
            'store_id' => ['nullable', 'integer'],
        ]);

        $oldStatus = $booking->status;
        $newStatus = $validated['status'];

        DB::transaction(function () use ($booking, $validated, $newStatus) {
            $updateData = ['status' => $newStatus];
            if (isset($validated['admin_notes'])) {
                $updateData['admin_notes'] = $validated['admin_notes'];
            }
            $booking->update($updateData);

            if (in_array($newStatus, ['completed', 'cancelled'], true) && $booking->serviceItem) {
                $booking->serviceItem->releaseAvailability();
            }
        });

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $validated['store_id'] ?? null,
            'action' => 'service_booking_status_updated',
            'subject_type' => ServiceBooking::class,
            'subject_id' => $booking->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $newStatus],
        ]);

        return response()->json([
            'success' => true,
            'data' => $booking->fresh(['serviceItem', 'user']),
            'message' => "Service booking status updated to {$newStatus}.",
        ]);
    }

    /**
     * Mark a service booking as in-progress.
     */
    public function markInProgress(int $id, Request $request): JsonResponse
    {
        $booking = ServiceBooking::findOrFail($id);

        $this->authorizeServiceAccess($request, $booking->service_type);

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->input('store_id'), $booking, 'mark_service_booking_in_progress');
        }

        $oldStatus = $booking->status;
        $booking->update(['status' => 'in_progress']);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $request->input('store_id'),
            'action' => 'service_booking_marked_in_progress',
            'subject_type' => ServiceBooking::class,
            'subject_id' => $booking->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => 'in_progress'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $booking->fresh(['serviceItem', 'user']),
            'message' => 'Service booking marked as in progress.',
        ]);
    }

    /**
     * Mark a service booking as completed.
     */
    public function markCompleted(int $id, Request $request): JsonResponse
    {
        $booking = ServiceBooking::findOrFail($id);

        $this->authorizeServiceAccess($request, $booking->service_type);

        if ($request->filled('store_id')) {
            $this->authorizeStoreAccess($request, (int) $request->input('store_id'), $booking, 'mark_service_booking_completed');
        }

        $oldStatus = $booking->status;

        DB::transaction(function () use ($booking) {
            $booking->update(['status' => 'completed']);
            if ($booking->serviceItem) {
                $booking->serviceItem->releaseAvailability();
            }
        });

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $request->input('store_id'),
            'action' => 'service_booking_marked_completed',
            'subject_type' => ServiceBooking::class,
            'subject_id' => $booking->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => 'completed'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $booking->fresh(['serviceItem', 'user']),
            'message' => 'Service booking marked as completed.',
        ]);
    }
}
