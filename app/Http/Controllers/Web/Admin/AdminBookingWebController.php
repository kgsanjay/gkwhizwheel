<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\BookingChannel;
use App\Enums\BookingStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\StoreStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ProcessRefundAdminRequest;
use App\Http\Requests\Admin\UpdateBookingAdminRequest;
use App\Models\ActivityLog;
use App\Models\Bike;
use App\Models\Booking;
use App\Models\Store;
use App\Services\BookingService;
use App\Services\RefundService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminBookingWebController extends Controller
{
    /**
     * Display a listing and calendar view of bookings with multi-criteria filters.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Booking::class);

        $user = $request->user();
        $isSuperAdmin = $user->role === UserRole::SUPER_ADMIN;

        $query = Booking::query()
            ->with(['bike.category', 'user', 'pickupStore', 'returnStore', 'payments', 'refunds', 'conditionLogs.photos', 'addons']);

        // Scope to user's assigned stores if not super admin
        if (! $isSuperAdmin) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();
            if (! empty($userStoreIds)) {
                $query->where(function ($q) use ($userStoreIds): void {
                    $q->whereIn('pickup_store_id', $userStoreIds)
                        ->orWhereIn('return_store_id', $userStoreIds);
                });
            }
        }

        // Search filter
        if ($search = $request->query('search')) {
            $term = '%' . trim($search) . '%';
            $query->where(function ($q) use ($term): void {
                $q->where('booking_reference', 'like', $term)
                    ->orWhereHas('user', function ($uq) use ($term): void {
                        $uq->where('name', 'like', $term)
                            ->orWhere('email', 'like', $term)
                            ->orWhere('phone', 'like', $term);
                    })
                    ->orWhereHas('bike', function ($bq) use ($term): void {
                        $bq->where('registration_number', 'like', $term)
                            ->orWhere('model_name', 'like', $term)
                            ->orWhere('brand', 'like', $term);
                    });
            });
        }

        // Store filter
        if ($storeId = $request->query('store_id')) {
            $query->where(function ($q) use ($storeId): void {
                $q->where('pickup_store_id', (int) $storeId)
                    ->orWhere('return_store_id', (int) $storeId);
            });
        }

        // Channel filter
        if ($channel = $request->query('channel')) {
            $query->where('channel', $channel);
        }

        // Status filter
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Date range filter
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('start_date', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('end_date', '<=', $dateTo);
        }

        // Calendar Events query (broader set for interactive calendar view)
        $calendarQuery = Booking::query()
            ->with(['bike', 'user', 'pickupStore', 'returnStore']);

        if (! $isSuperAdmin) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();
            if (! empty($userStoreIds)) {
                $calendarQuery->where(function ($q) use ($userStoreIds): void {
                    $q->whereIn('pickup_store_id', $userStoreIds)
                        ->orWhereIn('return_store_id', $userStoreIds);
                });
            }
        }

        if ($storeId) {
            $calendarQuery->where(function ($q) use ($storeId): void {
                $q->where('pickup_store_id', (int) $storeId)
                    ->orWhere('return_store_id', (int) $storeId);
            });
        }
        if ($status) {
            $calendarQuery->where('status', $status);
        }
        if ($channel) {
            $calendarQuery->where('channel', $channel);
        }

        // Default calendar month window
        $calendarMonth = $request->query('month', Carbon::now()->format('Y-m'));
        $monthStart = Carbon::parse($calendarMonth . '-01')->startOfMonth()->subDays(7)->toDateString();
        $monthEnd = Carbon::parse($calendarMonth . '-01')->endOfMonth()->addDays(7)->toDateString();

        $calendarEvents = $calendarQuery
            ->whereDate('start_date', '<=', $monthEnd)
            ->whereDate('end_date', '>=', $monthStart)
            ->get()
            ->map(function (Booking $b): array {
                $statusColor = match ($b->status) {
                    BookingStatus::CONFIRMED => '#1976D2',
                    BookingStatus::HANDED_OVER => '#ED6C02',
                    BookingStatus::RETURNED, BookingStatus::COMPLETED => '#2E7D32',
                    BookingStatus::CANCELLED, BookingStatus::EXPIRED => '#757575',
                    default => '#9C27B0',
                };

                return [
                    'id' => $b->id,
                    'booking_reference' => $b->booking_reference,
                    'title' => "{$b->booking_reference} - " . ($b->user?->name ?? 'Guest') . " (" . ($b->bike?->model_name ?? 'Bike') . ")",
                    'start' => $b->start_date?->toDateString(),
                    'end' => $b->end_date?->toDateString(),
                    'status' => $b->status instanceof BookingStatus ? $b->status->value : (string) $b->status,
                    'color' => $statusColor,
                    'customer_name' => $b->user?->name ?? 'Customer',
                    'customer_phone' => $b->user?->phone,
                    'bike_model' => $b->bike?->model_name ?? 'Bike',
                    'registration_number' => $b->bike?->registration_number,
                    'pickup_store' => $b->pickupStore?->name,
                    'return_store' => $b->returnStore?->name,
                    'total_amount' => (float) $b->total_amount,
                ];
            });

        // List bookings (paginated 15 per page)
        $bookings = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        // Stats summary
        $today = Carbon::today()->toDateString();
        $baseStatsQuery = Booking::query();
        if (! $isSuperAdmin) {
            $userStoreIds = $user->stores()->pluck('stores.id')->all();
            if (! empty($userStoreIds)) {
                $baseStatsQuery->where(function ($q) use ($userStoreIds): void {
                    $q->whereIn('pickup_store_id', $userStoreIds)
                        ->orWhereIn('return_store_id', $userStoreIds);
                });
            }
        }

        $stats = [
            'total' => (clone $baseStatsQuery)->count(),
            'confirmed' => (clone $baseStatsQuery)->where('status', BookingStatus::CONFIRMED)->count(),
            'active_rentals' => (clone $baseStatsQuery)->where('status', BookingStatus::HANDED_OVER)->count(),
            'returned' => (clone $baseStatsQuery)->whereIn('status', [BookingStatus::RETURNED, BookingStatus::COMPLETED])->count(),
            'cancelled' => (clone $baseStatsQuery)->where('status', BookingStatus::CANCELLED)->count(),
            'today_handovers' => (clone $baseStatsQuery)
                ->where('status', BookingStatus::CONFIRMED)
                ->whereDate('start_date', $today)
                ->count(),
            'today_returns' => (clone $baseStatsQuery)
                ->where('status', BookingStatus::HANDED_OVER)
                ->whereDate('end_date', $today)
                ->count(),
        ];

        $stores = Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get(['id', 'name', 'city']);

        return Inertia::render('Admin/Bookings/Index', [
            'bookings' => $bookings->through(fn (Booking $b): array => [
                'id' => $b->id,
                'booking_reference' => $b->booking_reference,
                'channel' => $b->channel instanceof BookingChannel ? $b->channel->value : (string) $b->channel,
                'status' => $b->status instanceof BookingStatus ? $b->status->value : (string) $b->status,
                'start_date' => $b->start_date?->toDateString(),
                'end_date' => $b->end_date?->toDateString(),
                'total_amount' => (float) $b->total_amount,
                'deposit_amount' => (float) $b->deposit_amount,
                'paid_amount' => (float) $b->payments->where('status', PaymentStatus::SUCCESS)->sum('amount'),
                'refunded_amount' => (float) $b->refunds->where('status', RefundStatus::COMPLETED)->sum('amount'),
                'user' => [
                    'id' => $b->user?->id,
                    'name' => $b->user?->name ?? 'Guest',
                    'email' => $b->user?->email,
                    'phone' => $b->user?->phone,
                ],
                'bike' => [
                    'id' => $b->bike?->id,
                    'model' => $b->bike?->model_name ?? 'Bike',
                    'registration_number' => $b->bike?->registration_number,
                    'category' => $b->bike?->category?->name,
                    'odometer_reading' => (int) ($b->bike?->odometer_reading ?? 0),
                    'base_daily_rate' => (float) ($b->bike?->base_daily_rate ?? $b->bike?->category?->base_daily_rate ?? 500.0),
                ],
                'latest_condition_log' => ($latestLog = $b->conditionLogs->sortByDesc('id')->first()) ? [
                    'id' => $latestLog->id,
                    'stage' => $latestLog->stage instanceof \App\Enums\BikeConditionStage ? $latestLog->stage->value : (string) $latestLog->stage,
                    'odometer_reading' => (int) $latestLog->odometer_reading,
                    'notes' => $latestLog->notes,
                    'created_at' => $latestLog->created_at?->toIso8601String(),
                ] : null,
                'condition_logs' => $b->conditionLogs->sortByDesc('id')->map(fn ($cl) => [
                    'id' => $cl->id,
                    'stage' => $cl->stage instanceof \App\Enums\BikeConditionStage ? $cl->stage->value : (string) $cl->stage,
                    'odometer_reading' => (int) $cl->odometer_reading,
                    'notes' => $cl->notes,
                    'photos' => $cl->photos->map(fn ($p) => [
                        'id' => $p->id,
                        'file_path' => $p->file_path,
                        'url' => \Illuminate\Support\Facades\Storage::disk('public')->url($p->file_path),
                    ])->values()->all(),
                    'created_at' => $cl->created_at?->toIso8601String(),
                ])->values()->all(),
                'addons' => $b->addons->map(fn ($ad) => [
                    'id' => $ad->id,
                    'name' => $ad->name,
                    'price' => (float) $ad->price,
                ])->values()->all(),
                'pickup_store' => [
                    'id' => $b->pickupStore?->id,
                    'name' => $b->pickupStore?->name,
                    'city' => $b->pickupStore?->city,
                ],
                'return_store' => [
                    'id' => $b->returnStore?->id,
                    'name' => $b->returnStore?->name,
                    'city' => $b->returnStore?->city,
                ],
                'created_at' => $b->created_at?->toIso8601String(),
            ]),
            'calendar_events' => $calendarEvents,
            'stats' => $stats,
            'stores' => $stores,
            'statuses' => array_map(fn ($s) => ['value' => $s->value, 'label' => ucwords(str_replace('_', ' ', $s->value))], BookingStatus::cases()),
            'channels' => array_map(fn ($c) => ['value' => $c->value, 'label' => ucfirst($c->value)], BookingChannel::cases()),
            'filters' => [
                'search' => $request->query('search', ''),
                'store_id' => $request->query('store_id', ''),
                'channel' => $request->query('channel', ''),
                'status' => $request->query('status', ''),
                'date_from' => $request->query('date_from', ''),
                'date_to' => $request->query('date_to', ''),
                'view_mode' => $request->query('view_mode', 'list'),
                'month' => $calendarMonth,
            ],
        ]);
    }

    /**
     * Show the form for editing an existing booking manually.
     */
    public function edit(int $id): Response
    {
        $booking = Booking::with([
            'bike.category',
            'user',
            'pickupStore',
            'returnStore',
            'payments',
            'refunds',
        ])->findOrFail($id);

        Gate::authorize('update', $booking);

        $stores = Store::where('status', StoreStatus::ACTIVE)->orderBy('name')->get(['id', 'name', 'city']);

        return Inertia::render('Admin/Bookings/Edit', [
            'booking' => [
                'id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'channel' => $booking->channel instanceof BookingChannel ? $booking->channel->value : (string) $booking->channel,
                'status' => $booking->status instanceof BookingStatus ? $booking->status->value : (string) $booking->status,
                'start_date' => $booking->start_date?->toDateString(),
                'end_date' => $booking->end_date?->toDateString(),
                'base_amount' => (float) $booking->base_amount,
                'deposit_amount' => (float) $booking->deposit_amount,
                'one_way_fee_amount' => (float) $booking->one_way_fee_amount,
                'addon_amount' => (float) $booking->addon_amount,
                'discount_amount' => (float) $booking->discount_amount,
                'late_fee_amount' => (float) $booking->late_fee_amount,
                'damage_fee_amount' => (float) $booking->damage_fee_amount,
                'total_amount' => (float) $booking->total_amount,
                'pickup_store_id' => $booking->pickup_store_id,
                'return_store_id' => $booking->return_store_id,
                'price_breakdown_json' => $booking->price_breakdown_json,
                'paid_amount' => (float) $booking->payments->where('status', PaymentStatus::SUCCESS)->sum('amount'),
                'user' => [
                    'id' => $booking->user?->id,
                    'name' => $booking->user?->name,
                    'email' => $booking->user?->email,
                    'phone' => $booking->user?->phone,
                ],
                'bike' => [
                    'id' => $booking->bike?->id,
                    'model' => $booking->bike?->model_name ?? 'Bike',
                    'registration_number' => $booking->bike?->registration_number,
                    'category' => $booking->bike?->category?->name,
                ],
                'pickup_store' => $booking->pickupStore,
                'return_store' => $booking->returnStore,
                'payments' => $booking->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'type' => $p->type?->value ?? (string) $p->type,
                    'status' => $p->status?->value ?? (string) $p->status,
                    'payment_method' => $p->method?->value ?? (string) $p->method,
                    'gateway_payment_id' => $p->gateway_reference,
                    'created_at' => $p->created_at?->toIso8601String(),
                ]),
                'refunds' => $booking->refunds->map(fn ($r) => [
                    'id' => $r->id,
                    'amount' => (float) $r->amount,
                    'reason' => $r->reason,
                    'status' => $r->status?->value ?? (string) $r->status,
                    'created_at' => $r->created_at?->toIso8601String(),
                ]),
            ],
            'stores' => $stores,
            'statuses' => array_map(fn ($s) => ['value' => $s->value, 'label' => ucwords(str_replace('_', ' ', $s->value))], BookingStatus::cases()),
        ]);
    }

    /**
     * Update the specified booking manually.
     */
    public function update(int $id, UpdateBookingAdminRequest $request): RedirectResponse
    {
        $booking = Booking::findOrFail($id);
        Gate::authorize('update', $booking);

        $validated = $request->validated();
        $startDate = Carbon::parse($validated['start_date'])->toDateString();
        $endDate = Carbon::parse($validated['end_date'])->toDateString();

        $oldValues = $booking->only([
            'start_date',
            'end_date',
            'status',
            'total_amount',
            'late_fee_amount',
            'damage_fee_amount',
            'pickup_store_id',
            'return_store_id',
        ]);

        DB::transaction(function () use ($booking, $validated, $startDate, $endDate, $oldValues, $request): void {
            // Concurrency safety: acquire row-level lock on bike during availability-affecting write
            $bike = Bike::where('id', $booking->bike_id)->lockForUpdate()->firstOrFail();

            // Check for bike reservation conflicts on new dates if dates changed
            if ($startDate !== $booking->start_date?->toDateString() || $endDate !== $booking->end_date?->toDateString()) {
                $hasConflict = Booking::where('bike_id', $bike->id)
                    ->where('id', '!=', $booking->id)
                    ->whereIn('status', [BookingStatus::CONFIRMED, BookingStatus::HANDED_OVER, BookingStatus::HELD])
                    ->where(function ($q) use ($startDate, $endDate): void {
                        $q->whereBetween('start_date', [$startDate, $endDate])
                            ->orWhereBetween('end_date', [$startDate, $endDate])
                            ->orWhere(function ($sub) use ($startDate, $endDate): void {
                                $sub->where('start_date', '<=', $startDate)
                                    ->where('end_date', '>=', $endDate);
                            });
                    })
                    ->exists();

                if ($hasConflict) {
                    throw ValidationException::withMessages([
                        'start_date' => "The assigned bike ({$bike->registration_number}) is already reserved for another booking between {$startDate} and {$endDate}.",
                    ]);
                }
            }

            $lateFee = isset($validated['late_fee_amount']) ? (float) $validated['late_fee_amount'] : (float) $booking->late_fee_amount;
            $damageFee = isset($validated['damage_fee_amount']) ? (float) $validated['damage_fee_amount'] : (float) $booking->damage_fee_amount;

            $totalAmount = (float) $booking->base_amount
                + (float) $booking->pricing_adjustments_amount
                + (float) $booking->one_way_fee_amount
                + (float) $booking->addon_amount
                - (float) $booking->discount_amount
                + (float) $booking->deposit_amount
                + $lateFee
                + $damageFee;

            $booking->update([
                'start_date' => $startDate,
                'end_date' => $endDate,
                'pickup_store_id' => (int) $validated['pickup_store_id'],
                'return_store_id' => (int) $validated['return_store_id'],
                'status' => BookingStatus::from($validated['status']),
                'late_fee_amount' => $lateFee,
                'damage_fee_amount' => $damageFee,
                'total_amount' => $totalAmount,
            ]);

            ActivityLog::create([
                'user_id' => $request->user()?->id,
                'store_id' => $booking->pickup_store_id,
                'action' => 'admin_booking_override',
                'subject_type' => Booking::class,
                'subject_id' => $booking->id,
                'old_values' => $oldValues,
                'new_values' => $booking->fresh()->only(array_keys($oldValues)),
            ]);
        });

        return redirect()->route('admin.bookings.index')
            ->with('success', "Booking '{$booking->booking_reference}' updated successfully.");
    }

    /**
     * Show the refund processing screen with policy calculations.
     */
    public function refundScreen(int $id, RefundService $refundService): Response
    {
        $booking = Booking::with([
            'bike.category',
            'user',
            'pickupStore',
            'returnStore',
            'payments',
            'refunds',
        ])->findOrFail($id);

        Gate::authorize('processRefund', $booking);

        $policyCalculation = $refundService->calculateRefundAmount($booking);

        $totalPaid = (float) $booking->payments->where('status', PaymentStatus::SUCCESS)->sum('amount');
        $totalRefunded = (float) $booking->refunds->where('status', RefundStatus::COMPLETED)->sum('amount');
        $maxRefundable = max(0.0, round($totalPaid - $totalRefunded, 2));

        return Inertia::render('Admin/Bookings/Refund', [
            'booking' => [
                'id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'channel' => $booking->channel instanceof BookingChannel ? $booking->channel->value : (string) $booking->channel,
                'status' => $booking->status instanceof BookingStatus ? $booking->status->value : (string) $booking->status,
                'start_date' => $booking->start_date?->toDateString(),
                'end_date' => $booking->end_date?->toDateString(),
                'total_amount' => (float) $booking->total_amount,
                'deposit_amount' => (float) $booking->deposit_amount,
                'rental_amount' => max(0.0, (float) $booking->total_amount - (float) $booking->deposit_amount),
                'user' => [
                    'id' => $booking->user?->id,
                    'name' => $booking->user?->name,
                    'email' => $booking->user?->email,
                    'phone' => $booking->user?->phone,
                ],
                'bike' => [
                    'id' => $booking->bike?->id,
                    'model' => $booking->bike?->model_name ?? 'Bike',
                    'registration_number' => $booking->bike?->registration_number,
                ],
                'pickup_store' => $booking->pickupStore?->name,
                'return_store' => $booking->returnStore?->name,
                'payments' => $booking->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => (float) $p->amount,
                    'type' => $p->type?->value ?? (string) $p->type,
                    'status' => $p->status?->value ?? (string) $p->status,
                    'payment_method' => $p->method?->value ?? (string) $p->method,
                    'created_at' => $p->created_at?->toIso8601String(),
                ]),
                'refunds' => $booking->refunds->map(fn ($r) => [
                    'id' => $r->id,
                    'amount' => (float) $r->amount,
                    'reason' => $r->reason,
                    'status' => $r->status?->value ?? (string) $r->status,
                    'gateway_reference' => $r->gateway_reference,
                    'created_at' => $r->created_at?->toIso8601String(),
                ]),
            ],
            'calculation' => $policyCalculation,
            'total_paid' => $totalPaid,
            'total_refunded' => $totalRefunded,
            'max_refundable' => $maxRefundable,
        ]);
    }

    /**
     * Process a refund for the booking via RefundService.
     */
    public function processRefund(int $id, ProcessRefundAdminRequest $request, RefundService $refundService): RedirectResponse
    {
        $booking = Booking::with('payments')->findOrFail($id);
        Gate::authorize('processRefund', $booking);

        $validated = $request->validated();
        $refundAmount = (float) $validated['amount'];

        $totalPaid = (float) $booking->payments->where('status', PaymentStatus::SUCCESS)->sum('amount');
        $totalRefunded = (float) $booking->refunds->where('status', RefundStatus::COMPLETED)->sum('amount');
        $maxRefundable = max(0.0, round($totalPaid - $totalRefunded, 2));

        if ($refundAmount > $maxRefundable) {
            throw ValidationException::withMessages([
                'amount' => "Requested refund (₹{$refundAmount}) exceeds maximum refundable amount of ₹{$maxRefundable}.",
            ]);
        }

        $paymentId = isset($validated['payment_id']) ? (int) $validated['payment_id'] : null;

        $refund = $refundService->processManualRefund(
            booking: $booking,
            amount: $refundAmount,
            reason: $validated['reason'],
            processedBy: $request->user()->id,
            paymentId: $paymentId
        );

        if (! empty($validated['mark_cancelled'])) {
            $booking->update(['status' => BookingStatus::CANCELLED]);
        }

        ActivityLog::create([
            'user_id' => $request->user()?->id,
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
                'amount' => $refundAmount,
                'reason' => $validated['reason'],
                'status' => $booking->fresh()->status?->value ?? (string) $booking->status,
            ],
        ]);

        return redirect()->route('admin.bookings.index')
            ->with('success', "Refund of ₹{$refund->amount} processed successfully for booking '{$booking->booking_reference}'.");
    }

    /**
     * Download official PDF rental agreement / voucher for fleet booking
     */
    public function downloadVoucher(int|string $id, \App\Services\VoucherService $voucherService, Request $request): \Illuminate\Http\Response
    {
        $booking = Booking::with(['bike.category', 'pickupStore', 'returnStore', 'addons', 'user'])
            ->where('id', $id)
            ->orWhere('booking_reference', $id)
            ->firstOrFail();

        return $voucherService->generateBikeVoucherPdf($booking, $request->boolean('stream'));
    }

    /**
     * Complete bike handover inspection and mark booking as handed_over.
     */
    public function handover(int $id, Request $request, BookingService $bookingService): RedirectResponse
    {
        $booking = Booking::with(['bike', 'pickupStore', 'returnStore'])->findOrFail($id);
        Gate::authorize('handover', $booking);

        if ($booking->status !== BookingStatus::CONFIRMED) {
            throw ValidationException::withMessages([
                'booking' => ["Booking must be in 'confirmed' status for handover. Current status: '{$booking->status->value}'."],
            ]);
        }

        $validated = $request->validate([
            'odometer_reading' => ['required', 'integer', 'min:0'],
            'condition_photos' => ['nullable', 'array', 'max:6'],
            'condition_photos.*' => ['image', 'max:10240'],
            'signature' => ['nullable', 'string'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'helmets_issued' => ['nullable', 'integer', 'min:1', 'max:2'],
            'fuel_level' => ['nullable', 'string', 'max:20'],
        ]);

        $photoPaths = [];
        if ($request->hasFile('condition_photos')) {
            foreach ($request->file('condition_photos') as $photoFile) {
                if ($photoFile instanceof UploadedFile) {
                    $photoPaths[] = $photoFile->store('condition/handover', 'public');
                }
            }
        }

        $signaturePath = null;
        if ($request->filled('signature')) {
            $sigData = (string) $request->input('signature');
            if (str_starts_with($sigData, 'data:image')) {
                $rawImage = preg_replace('#^data:image/\w+;base64,#i', '', $sigData);
                $decoded = base64_decode($rawImage, true);
                if ($decoded !== false) {
                    $filename = 'signatures/bookings/sig_'.Str::random(20).'.png';
                    Storage::disk('public')->put($filename, $decoded);
                    $signaturePath = $filename;
                }
            } else {
                $filename = 'signatures/bookings/sig_'.Str::random(20).'.png';
                Storage::disk('public')->put($filename, $sigData);
                $signaturePath = $filename;
            }
        }

        $inspectionNotes = trim(
            ($validated['notes'] ?? '').
            (isset($validated['helmets_issued']) ? " | Helmets Issued: {$validated['helmets_issued']}" : '').
            (isset($validated['fuel_level']) ? " | Fuel Level: {$validated['fuel_level']}" : '')
        );

        $bookingService->markHandedOver(
            booking: $booking,
            odometerReading: (int) $validated['odometer_reading'],
            signaturePath: $signaturePath,
            notes: $inspectionNotes !== '' ? $inspectionNotes : null,
            photoPaths: $photoPaths,
            staffId: $request->user()->id
        );

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $booking->pickup_store_id,
            'action' => 'booking_handed_over',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'new_values' => [
                'odometer_reading' => (int) $validated['odometer_reading'],
                'helmets_issued' => $validated['helmets_issued'] ?? 1,
                'condition_photos_count' => count($photoPaths),
                'signature_recorded' => $signaturePath !== null,
                'status' => 'handed_over',
            ],
        ]);

        return redirect()->back()->with('success', "Bike handed over successfully for booking '{$booking->booking_reference}'. Keys and helmet handed over to customer.");
    }

    /**
     * Process bike return inspection, update store relocation, and settle security deposit.
     */
    public function processReturn(
        int $id,
        Request $request,
        BookingService $bookingService,
        RefundService $refundService
    ): RedirectResponse {
        $booking = Booking::with(['bike', 'pickupStore', 'returnStore', 'user'])->findOrFail($id);
        Gate::authorize('processReturn', $booking);

        if ($booking->status !== BookingStatus::HANDED_OVER) {
            throw ValidationException::withMessages([
                'booking' => ["Booking must be in 'handed_over' status to process return. Current status: '{$booking->status->value}'."],
            ]);
        }

        $validated = $request->validate([
            'odometer_reading' => ['required', 'integer', 'min:0'],
            'damage_fee' => ['nullable', 'numeric', 'min:0'],
            'late_fee_override' => ['nullable', 'numeric', 'min:0'],
            'deposit_refund_amount' => ['nullable', 'numeric', 'min:0'],
            'return_store_id' => ['nullable', 'exists:stores,id'],
            'condition_photos' => ['nullable', 'array', 'max:6'],
            'condition_photos.*' => ['image', 'max:10240'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'fuel_level' => ['nullable', 'string', 'max:20'],
        ]);

        // Calculate late fee
        if ($request->filled('late_fee_override')) {
            $lateFee = max(0.0, (float) $validated['late_fee_override']);
        } else {
            $scheduledEnd = Carbon::parse($booking->end_date)->endOfDay();
            if (now()->greaterThan($scheduledEnd)) {
                $overdueDays = max(1, (int) ceil($scheduledEnd->diffInHours(now()) / 24));
                $dailyRate = (float) ($booking->bike?->base_daily_rate ?? $booking->bike?->category?->base_daily_rate ?? 500.0);
                $lateFee = round($overdueDays * $dailyRate, 2);
            } else {
                $lateFee = 0.0;
            }
        }

        $damageFee = max(0.0, (float) ($validated['damage_fee'] ?? 0.0));
        $odometerReading = (int) $validated['odometer_reading'];
        $returnStoreId = ! empty($validated['return_store_id'])
            ? (int) $validated['return_store_id']
            : $booking->return_store_id;

        $photoPaths = [];
        if ($request->hasFile('condition_photos')) {
            foreach ($request->file('condition_photos') as $photoFile) {
                if ($photoFile instanceof UploadedFile) {
                    $photoPaths[] = $photoFile->store('condition/return', 'public');
                }
            }
        }

        $returnNotes = trim(
            ($validated['notes'] ?? '').
            (isset($validated['fuel_level']) ? " | Return Fuel Level: {$validated['fuel_level']}" : '')
        );

        // Mark returned in BookingService (relocates bike, marks AVAILABLE, updates odometer)
        $bookingService->markReturned(
            booking: $booking,
            odometerReading: $odometerReading,
            lateFee: $lateFee,
            damageFee: $damageFee,
            notes: $returnNotes !== '' ? $returnNotes : null,
            photoPaths: $photoPaths,
            staffId: $request->user()->id,
            returnStoreId: $returnStoreId
        );

        // Process security deposit refund if applicable
        $depositAmount = (float) $booking->deposit_amount;
        $refund = null;
        if ($depositAmount > 0) {
            $refund = $refundService->createDepositRefund(
                booking: $booking,
                damageDeductions: $damageFee,
                lateFeeDeductions: $lateFee,
                reason: 'Deposit refund after bike return inspection',
                processedBy: $request->user()->id
            );

            if ($request->filled('deposit_refund_amount')) {
                $overrideRefundAmount = round(max(0.0, (float) $validated['deposit_refund_amount']), 2);
                $refund->update([
                    'amount' => $overrideRefundAmount,
                ]);
            }
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'store_id' => $returnStoreId,
            'action' => 'booking_returned',
            'subject_type' => Booking::class,
            'subject_id' => $booking->id,
            'new_values' => [
                'odometer_reading' => $odometerReading,
                'late_fee' => $lateFee,
                'damage_fee' => $damageFee,
                'deposit_amount' => $depositAmount,
                'deposit_refunded' => $refund ? (float) $refund->amount : 0.0,
                'return_store_id' => $returnStoreId,
                'status' => 'returned',
            ],
        ]);

        $msg = "Bike return processed successfully for booking '{$booking->booking_reference}'. Bike is now AVAILABLE at the selected store.";
        if ($refund && (float) $refund->amount > 0) {
            $msg .= " Security deposit refund of ₹{$refund->amount} settled.";
        }

        return redirect()->back()->with('success', $msg);
    }
}

