<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BookingStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\ServiceBooking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminCheckInWebController extends Controller
{
    /**
     * Render the Ground Coordinator Pass Scanner & Check-in view.
     */
    public function index(Request $request): Response
    {
        $code = trim((string) $request->query('code', $request->query('booking_number', '')));
        $initialBooking = null;

        if ($code !== '') {
            $initialBooking = $this->findBooking($code);
        }

        $recentLogs = ActivityLog::whereIn('action', ['ground_checkin.processed', 'ground_checkin.offline_synced'])
            ->with('user')
            ->latest()
            ->take(6)
            ->get()
            ->map(function ($log) {
                $values = $log->new_values ?? [];
                return [
                    'id' => $log->id,
                    'description' => $values['description'] ?? 'Pass action processed',
                    'staff_name' => $log->user?->name ?? 'Ground Staff',
                    'created_at' => $log->created_at?->diffForHumans() ?? 'Just now',
                    'metadata' => $values,
                ];
            });

        return Inertia::render('Admin/CheckIn/Index', [
            'initialCode' => $code,
            'initialBooking' => $initialBooking,
            'recentLogs' => $recentLogs,
        ]);
    }

    /**
     * AJAX/JSON lookup for any booking by reference, QR string, or phone.
     */
    public function lookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'min:2', 'max:255'],
        ]);

        $booking = $this->findBooking($validated['code']);

        if (! $booking) {
            return response()->json([
                'success' => false,
                'message' => "No active booking found matching '{$validated['code']}'. Check number or try phone lookup.",
                'data' => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => "Verified booking pass #{$booking['booking_number']}.",
            'data' => $booking,
        ]);
    }

    /**
     * Process ground check-in, balance collection, or boarding.
     */
    public function process(Request $request, string $type, int|string $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:check_in,board,collect_balance,complete'],
            'payment_method' => ['nullable', 'string', 'in:cash,upi,card'],
            'amount_collected' => ['nullable', 'numeric', 'min:0'],
            'ground_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! in_array($type, ['service', 'bike'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid booking type.',
            ], 400);
        }

        $result = $this->executeCheckInAction(
            type: $type,
            id: $id,
            action: $validated['action'],
            paymentMethod: $validated['payment_method'] ?? 'cash',
            amount: (float) ($validated['amount_collected'] ?? 0),
            notes: trim((string) ($validated['ground_notes'] ?? '')),
            user: $request->user(),
        );

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => $result['data'],
        ]);
    }

    /**
     * Batch sync offline queued check-in actions from IndexedDB.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.client_id' => ['nullable', 'string'],
            'items.*.type' => ['required', 'string', 'in:service,bike'],
            'items.*.id' => ['required'],
            'items.*.action' => ['required', 'string', 'in:check_in,board,collect_balance,complete'],
            'items.*.payment_method' => ['nullable', 'string', 'in:cash,upi,card'],
            'items.*.amount_collected' => ['nullable', 'numeric', 'min:0'],
            'items.*.ground_notes' => ['nullable', 'string', 'max:1000'],
            'items.*.queued_at' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $syncedIds = [];
        $errors = [];

        foreach ($validated['items'] as $item) {
            $clientId = $item['client_id'] ?? (string) $item['id'];
            try {
                $this->executeCheckInAction(
                    type: $item['type'],
                    id: $item['id'],
                    action: $item['action'],
                    paymentMethod: $item['payment_method'] ?? 'cash',
                    amount: (float) ($item['amount_collected'] ?? 0),
                    notes: trim((string) ($item['ground_notes'] ?? '')),
                    user: $user,
                    queuedAt: $item['queued_at'] ?? null,
                );
                $syncedIds[] = $clientId;
            } catch (\Throwable $e) {
                $errors[] = [
                    'client_id' => $clientId,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'synced_count' => count($syncedIds),
            'synced_ids' => $syncedIds,
            'errors' => $errors,
            'message' => sprintf('Synced %d offline check-in%s successfully.', count($syncedIds), count($syncedIds) === 1 ? '' : 's'),
        ]);
    }

    /**
     * Common execution logic for check-in action on service or bike booking.
     *
     * @return array{message: string, data: array}
     */
    protected function executeCheckInAction(
        string $type,
        int|string $id,
        string $action,
        string $paymentMethod = 'cash',
        float $amount = 0.0,
        string $notes = '',
        ?User $user = null,
        ?string $queuedAt = null
    ): array {
        $staffName = $user?->name ?? 'Ground Coordinator';
        $now = Carbon::now();

        if ($type === 'service') {
            $booking = ServiceBooking::with(['serviceItem'])->findOrFail($id);

            $newAdvance = (float) $booking->advance_paid;
            $newBalance = (float) $booking->balance_due;
            $paymentStatus = $booking->payment_status;

            if ($amount > 0) {
                $newAdvance += $amount;
                $newBalance = max(0, (float) $booking->total_amount - $newAdvance);
                $paymentStatus = $newBalance <= 0 ? 'paid' : 'partial';
            }

            $newStatus = match ($action) {
                'complete' => 'completed',
                default => 'in_progress',
            };

            $noteTag = $queuedAt
                ? "[Offline Check-in queued at {$queuedAt}, synced {$now->format('d M H:i')} by {$staffName}]"
                : "[Check-in {$now->format('d M H:i')} by {$staffName}]";

            $noteDetails = [];
            if ($amount > 0) {
                $noteDetails[] = "Collected balance ₹{$amount} via " . strtoupper($paymentMethod);
            }
            if ($action === 'board' || $action === 'check_in') {
                $noteDetails[] = 'Passenger(s) verified & boarded at jetty/hub';
            }
            if ($notes !== '') {
                $noteDetails[] = $notes;
            }

            $updatedNotes = $booking->admin_notes ? $booking->admin_notes . "\n" : '';
            $updatedNotes .= $noteTag . ': ' . implode('. ', $noteDetails) . '.';

            $booking->update([
                'status' => $newStatus,
                'advance_paid' => $newAdvance,
                'balance_due' => $newBalance,
                'payment_status' => $paymentStatus,
                'admin_notes' => $updatedNotes,
            ]);

            ActivityLog::create([
                'user_id' => $user?->id,
                'action' => $queuedAt ? 'ground_checkin.offline_synced' : 'ground_checkin.processed',
                'subject_type' => ServiceBooking::class,
                'subject_id' => (int) $booking->id,
                'new_values' => [
                    'description' => $queuedAt
                        ? "{$staffName} synced offline check-in for {$booking->service_type} pass {$booking->booking_number} (queued {$queuedAt})"
                        : "{$staffName} checked in {$booking->service_type} pass {$booking->booking_number} ({$booking->customer_name})",
                    'booking_number' => $booking->booking_number,
                    'customer_name' => $booking->customer_name,
                    'amount_collected' => $amount,
                    'payment_method' => $paymentMethod,
                    'action' => $action,
                    'new_status' => $newStatus,
                    'is_offline_sync' => (bool) $queuedAt,
                    'queued_at' => $queuedAt,
                ],
            ]);

            return [
                'message' => "Pass #{$booking->booking_number} verified & checked in successfully!",
                'data' => $this->formatServiceBooking($booking->fresh(['serviceItem'])),
            ];
        }

        if ($type === 'bike') {
            $booking = Booking::with(['bike.category', 'pickupStore', 'returnStore', 'user'])->findOrFail($id);

            $newStatus = match ($action) {
                'complete' => BookingStatus::COMPLETED,
                default => BookingStatus::HANDED_OVER,
            };

            $booking->update([
                'status' => $newStatus,
                'completed_by' => $user?->id,
            ]);

            ActivityLog::create([
                'user_id' => $user?->id,
                'action' => $queuedAt ? 'ground_checkin.offline_synced' : 'ground_checkin.processed',
                'subject_type' => Booking::class,
                'subject_id' => (int) $booking->id,
                'new_values' => [
                    'description' => $queuedAt
                        ? "{$staffName} synced offline handover for bike booking {$booking->booking_reference} (queued {$queuedAt})"
                        : "{$staffName} completed ground handover for bike booking {$booking->booking_reference}",
                    'booking_reference' => $booking->booking_reference,
                    'customer_name' => $booking->customer_name ?? $booking->user?->name,
                    'action' => $action,
                    'is_offline_sync' => (bool) $queuedAt,
                    'queued_at' => $queuedAt,
                ],
            ]);

            return [
                'message' => "Bike rental #{$booking->booking_reference} marked as handed over!",
                'data' => $this->formatBikeBooking($booking->fresh(['bike.category', 'pickupStore', 'returnStore', 'user'])),
            ];
        }

        throw new \InvalidArgumentException('Invalid booking type.');
    }

    /**
     * Search across ServiceBookings and Fleet Bookings.
     */
    protected function findBooking(string $rawCode): ?array
    {
        $code = trim($rawCode);

        // If a full confirmation or print URL was scanned, extract the booking reference
        if (preg_match('/(?:bookings\/|booking=)([A-Za-z0-9\-_]+)/', $code, $matches)) {
            $code = $matches[1];
        }

        // 1. Check ServiceBooking by booking_number (case-insensitive)
        $serviceBooking = ServiceBooking::with(['serviceItem'])
            ->where('booking_number', $code)
            ->orWhere('booking_number', 'like', "%{$code}%")
            ->first();

        // 2. Or search by customer phone if code is numeric
        if (! $serviceBooking && preg_match('/^\d{10}$/', $code)) {
            $serviceBooking = ServiceBooking::with(['serviceItem'])
                ->where('customer_phone', $code)
                ->latest()
                ->first();
        }

        if ($serviceBooking) {
            return $this->formatServiceBooking($serviceBooking);
        }

        // 3. Check Two-Wheeler Booking by reference or booking_number or phone
        $bikeQuery = Booking::with(['bike.category', 'pickupStore', 'returnStore', 'user']);
        $bikeBooking = $bikeQuery->where('booking_reference', $code)
            ->orWhere('booking_number', $code)
            ->orWhere('id', is_numeric($code) ? (int) $code : 0)
            ->first();

        if (! $bikeBooking && preg_match('/^\d{10}$/', $code)) {
            $bikeBooking = Booking::with(['bike.category', 'pickupStore', 'returnStore', 'user'])
                ->where('customer_phone', $code)
                ->latest()
                ->first();
        }

        if ($bikeBooking) {
            return $this->formatBikeBooking($bikeBooking);
        }

        return null;
    }

    /**
     * Format a ServiceBooking into a clean unified dictionary.
     */
    protected function formatServiceBooking(ServiceBooking $booking): array
    {
        return [
            'type' => 'service',
            'id' => $booking->id,
            'booking_number' => $booking->booking_number,
            'service_type' => $booking->service_type,
            'title' => $booking->serviceItem?->name ?? ucfirst(str_replace('_', ' ', $booking->service_type)) . ' Experience',
            'category' => $booking->serviceItem?->category ?? 'Tourism & Activities',
            'customer_name' => $booking->customer_name,
            'customer_phone' => $booking->customer_phone,
            'customer_email' => $booking->customer_email,
            'start_datetime' => $booking->start_datetime?->format('D, d M Y • h:i A') ?? '—',
            'pickup_location' => $booking->pickup_location ?? 'Mavinkurve Jetty / Honnavar Point',
            'drop_location' => $booking->drop_location,
            'quantity' => $booking->quantity,
            'base_amount' => (float) $booking->base_amount,
            'total_amount' => (float) $booking->total_amount,
            'advance_paid' => (float) $booking->advance_paid,
            'balance_due' => (float) $booking->balance_due,
            'payment_status' => $booking->payment_status,
            'payment_method' => $booking->payment_method,
            'status' => $booking->status,
            'admin_notes' => $booking->admin_notes,
            'voucher_url' => route('services.booking.voucher', $booking->booking_number),
            'print_url' => route('services.booking.print', $booking->booking_number),
        ];
    }

    /**
     * Format a Bike Booking into a clean unified dictionary.
     */
    protected function formatBikeBooking(Booking $booking): array
    {
        $statusValue = $booking->status instanceof \BackedEnum ? $booking->status->value : (string) $booking->status;

        return [
            'type' => 'bike',
            'id' => $booking->id,
            'booking_number' => $booking->booking_number ?? $booking->booking_reference,
            'service_type' => 'two_wheelers',
            'title' => trim(($booking->bike?->brand ?? '') . ' ' . ($booking->bike?->model_name ?? $booking->bike?->category?->name ?? 'Two-Wheeler Rental')),
            'category' => $booking->bike?->category?->name ?? 'Fleet Rental',
            'registration_number' => $booking->bike?->registration_number ?? '—',
            'customer_name' => $booking->customer_name ?? $booking->user?->name ?? 'Valued Renter',
            'customer_phone' => $booking->customer_phone ?? $booking->user?->phone ?? '—',
            'customer_email' => $booking->user?->email,
            'start_datetime' => $booking->start_date ? Carbon::parse($booking->start_date)->format('D, d M Y') : '—',
            'pickup_location' => $booking->pickupStore?->name ?? 'Palya Main Rd Hub, Honnavar',
            'drop_location' => $booking->returnStore?->name ?? $booking->pickupStore?->name ?? 'Palya Main Rd Hub',
            'quantity' => 1,
            'base_amount' => (float) $booking->base_amount,
            'total_amount' => (float) $booking->total_amount,
            'deposit_amount' => (float) $booking->deposit_amount,
            'advance_paid' => (float) $booking->total_amount,
            'balance_due' => 0.00,
            'payment_status' => $booking->payment_status ?? 'paid',
            'payment_method' => 'online',
            'status' => $statusValue,
            'admin_notes' => null,
            'voucher_url' => route('bookings.voucher', $booking->id),
            'print_url' => route('bookings.print', $booking->id),
        ];
    }
}
