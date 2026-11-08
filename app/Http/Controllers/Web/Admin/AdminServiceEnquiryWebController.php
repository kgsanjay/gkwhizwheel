<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ServiceEnquiry;
use App\Models\ServiceBooking;
use App\Models\ServiceItem;
use App\Models\ActivityLog;
use App\Models\Store;
use App\Enums\StoreStatus;
use Illuminate\Validation\ValidationException;
use App\Exceptions\ServiceItemNotAvailableException;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use App\Services\ServiceEnquiryLifecycle;
use Inertia\Inertia;
use Inertia\Response;

class AdminServiceEnquiryWebController extends Controller
{
    /**
     * Explicitly create an unpaid, short-lived offline proposal.
     * This does not approve a tariff, allocate a physical resource, charge or notify.
     */
    public function createProposal(Request $request, int $id): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);
        $data = $request->validate([
            'service_item_id' => ['required', 'integer', 'exists:service_items,id'],
            'reviewed_total_paise' => ['required', 'integer', 'min:1', 'max:999999999'],
            'review_notes' => ['required', 'string', 'min:5', 'max:1200'],
        ]);

        try {
            $booking = DB::transaction(function () use ($id, $data, $request): ServiceBooking {
                $enquiry = ServiceEnquiry::whereKey($id)->lockForUpdate()->firstOrFail();
                if (! in_array($enquiry->status, ['requested', 'reviewing'], true)) {
                    throw ValidationException::withMessages(['enquiry' => 'Only active enquiries can become proposals.']);
                }
                if (ServiceBooking::where('service_enquiry_id', $enquiry->id)->exists()) {
                    throw ValidationException::withMessages(['enquiry' => 'This enquiry already has a proposal.']);
                }
                if ($enquiry->start_datetime === null || ! $enquiry->start_datetime->isFuture()
                    || $enquiry->end_datetime === null || ! $enquiry->end_datetime->gt($enquiry->start_datetime)) {
                    throw ValidationException::withMessages(['schedule' => 'A complete future start and end schedule is required.']);
                }
                $item = ServiceItem::whereKey($data['service_item_id'])->lockForUpdate()->firstOrFail();
                if ($item->service_type !== $enquiry->service_type || ! $item->isAvailable()
                    || $item->store_id === null || ! Store::whereKey($item->store_id)->where('status', StoreStatus::ACTIVE->value)->exists()) {
                    throw ValidationException::withMessages(['service_item_id' => 'Choose an active item assigned to an active branch and matching the enquiry service.']);
                }
                if (! $item->checkAvailability($enquiry->start_datetime, $enquiry->end_datetime, (int) $enquiry->quantity)) {
                    throw ValidationException::withMessages(['service_item_id' => 'Selected inventory has insufficient capacity for the enquiry schedule.']);
                }
                $total = number_format($data['reviewed_total_paise'] / 100, 2, '.', '');
                $booking = app(\App\Services\AvailabilityService::class)->holdServiceBooking([
                    'service_enquiry_id' => $enquiry->id,
                    'idempotency_key' => 'service-enquiry-'.$enquiry->id,
                    'store_id' => $item->store_id,
                    'service_item_id' => $item->id,
                    'service_type' => $enquiry->service_type,
                    'user_id' => $enquiry->user_id,
                    'customer_name' => $enquiry->customer_name,
                    'customer_phone' => $enquiry->customer_phone,
                    'customer_email' => $enquiry->customer_email,
                    'booking_channel' => 'offline_phone',
                    'start_datetime' => $enquiry->start_datetime,
                    'end_datetime' => $enquiry->end_datetime,
                    'pickup_location' => $enquiry->pickup_location,
                    'drop_location' => $enquiry->drop_location,
                    'quantity' => $enquiry->quantity,
                    'base_amount' => $total,
                    'tax_amount' => 0,
                    'discount_amount' => 0,
                    'total_amount' => $total,
                    'advance_paid' => 0,
                    'balance_due' => $total,
                    'payment_status' => 'pending',
                    'payment_method' => 'pay_on_arrival',
                    'customer_notes' => $enquiry->customer_notes,
                    'admin_notes' => $data['review_notes'],
                    'created_by' => $request->user()->id,
                ]);
                ActivityLog::create([
                    'user_id' => $request->user()->id,
                    'store_id' => $item->store_id,
                    'action' => 'service_enquiry.proposal_created',
                    'subject_type' => ServiceEnquiry::class,
                    'subject_id' => (string) $enquiry->id,
                    'old_values' => ['status' => $enquiry->status],
                    'new_values' => ['proposal_id' => $booking->id, 'service_item_id' => $item->id],
                ]);
                $enquiry->update(['status' => 'reviewing']);
                return $booking;
            }, 3);
        } catch (ServiceItemNotAvailableException $exception) {
            throw ValidationException::withMessages(['service_item_id' => $exception->getMessage()]);
        }

        return redirect()->route('admin.services.bookings.show', [$booking->service_type, $booking->id])
            ->with('success', 'Unpaid short-lived proposal created. It is not a confirmed reservation or approved commercial quote.');
    }

    public function updateStatus(Request $request, int $id, ServiceEnquiryLifecycle $lifecycle): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);
        $validated = $request->validate([
            'status' => ['required', 'in:requested,reviewing,closed,cancelled'],
        ]);

        DB::transaction(function () use ($id, $validated, $lifecycle): void {
            $enquiry = ServiceEnquiry::whereKey($id)->lockForUpdate()->firstOrFail();
            $lifecycle->assertTransition($enquiry, $validated['status']);
            // Lock the linked proposal before changing the enquiry, so an
            // operator cannot close it concurrently with booking approval.
            $proposal = ServiceBooking::where('service_enquiry_id', $enquiry->id)
                ->lockForUpdate()->first();
            if ($proposal !== null && $proposal->status === 'held'
                && ($proposal->held_until === null || $proposal->held_until->isPast())) {
                app(\App\Services\ServiceBookingLifecycle::class)->assertTransition($proposal, 'expired');
                $proposal->update(['status' => 'expired']);
                ActivityLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'service_booking.hold_expired',
                    'subject_type' => ServiceBooking::class,
                    'subject_id' => (string) $proposal->id,
                    'old_values' => ['status' => 'held'],
                    'new_values' => ['status' => 'expired'],
                ]);
            }
            if (in_array($validated['status'], ['closed', 'cancelled'], true)
                && ServiceBooking::where('service_enquiry_id', $enquiry->id)
                    ->where(function ($query): void {
                        $query->whereIn('status', ['confirmed', 'in_progress'])
                            ->orWhere(function ($holds): void {
                                $holds->where('status', 'held')
                                    ->where('held_until', '>', now());
                            });
                    })->exists()) {
                throw ValidationException::withMessages([
                    'status' => 'Resolve the linked booking before closing or cancelling this enquiry.',
                ]);
            }
            if ($enquiry->status !== $validated['status']) {
                $previousStatus = $enquiry->status;
                $enquiry->update(['status' => $validated['status']]);
                ActivityLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'service_enquiry.status_changed',
                    'subject_type' => ServiceEnquiry::class,
                    'subject_id' => (string) $enquiry->id,
                    'old_values' => ['status' => $previousStatus],
                    'new_values' => ['status' => $validated['status']],
                ]);
            }
        });

        return back()->with('success', 'Enquiry review status updated. This is not a booking confirmation.');
    }

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);

        return Inertia::render('Admin/ServiceEnquiries/Index', [
            'proposalItems' => ServiceItem::query()->whereNotNull('store_id')->whereIn('status', ['available', 'active'])
                ->whereHas('store', fn ($q) => $q->where('status', StoreStatus::ACTIVE->value))
                ->orderBy('service_type')->orderBy('name')
                ->get(['id', 'name', 'service_type', 'store_id']),
            'enquiries' => ServiceEnquiry::query()->with('proposal:id,service_enquiry_id,booking_number,status,held_until')->latest()
                ->paginate(30)
                ->through(fn (ServiceEnquiry $e): array => [
                    'id' => $e->id,
                    'proposal' => $e->proposal ? ['id' => $e->proposal->id, 'booking_number' => $e->proposal->booking_number, 'status' => $e->proposal->status, 'hold_expired' => $e->proposal->status === 'held' && ($e->proposal->held_until === null || $e->proposal->held_until->isPast())] : null,
                    'reference' => $e->reference,
                    'service_type' => $e->service_type,
                    'customer_name' => $e->customer_name,
                    'customer_phone' => $e->customer_phone,
                    'customer_email' => $e->customer_email,
                    'start_datetime' => $e->start_datetime?->format('Y-m-d H:i'),
                    'pickup_location' => $e->pickup_location,
                    'drop_location' => $e->drop_location,
                    'quantity' => $e->quantity,
                    'customer_notes' => $e->customer_notes,
                    'status' => $e->status,
                    'created_at' => $e->created_at?->format('Y-m-d H:i'),
                ]),
        ]);
    }
}
