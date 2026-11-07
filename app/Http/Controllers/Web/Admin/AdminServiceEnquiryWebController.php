<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\ServiceEnquiry;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use App\Services\ServiceEnquiryLifecycle;
use Inertia\Inertia;
use Inertia\Response;

class AdminServiceEnquiryWebController extends Controller
{
    public function updateStatus(Request $request, int $id, ServiceEnquiryLifecycle $lifecycle): RedirectResponse
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);
        $validated = $request->validate([
            'status' => ['required', 'in:requested,reviewing,closed,cancelled'],
        ]);

        DB::transaction(function () use ($id, $validated, $lifecycle): void {
            $enquiry = ServiceEnquiry::whereKey($id)->lockForUpdate()->firstOrFail();
            $lifecycle->assertTransition($enquiry, $validated['status']);
            if ($enquiry->status !== $validated['status']) {
                $enquiry->update(['status' => $validated['status']]);
            }
        });

        return back()->with('success', 'Enquiry review status updated. This is not a booking confirmation.');
    }

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->role === UserRole::SUPER_ADMIN, 403);

        return Inertia::render('Admin/ServiceEnquiries/Index', [
            'enquiries' => ServiceEnquiry::query()->latest()
                ->paginate(30)
                ->through(fn (ServiceEnquiry $e): array => [
                    'id' => $e->id,
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
