<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ServiceEnquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Enquiry only. Does not allocate inventory, confirm slots or accept payment.
 * All prices/availability require later server-side verified quotation.
 */
class ServiceEnquiryWebController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()) {
            return redirect()->guest(route('login'));
        }

        $data = $request->validate([
            'service_type' => ['required', 'in:taxi,boating,scuba,homestay,guide,tours'],
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_phone' => ['required', 'string', 'regex:/^[6-9]\d{9}$/'],
            'customer_email' => ['nullable', 'email', 'max:150'],
            'start_datetime' => ['required', 'date', 'after:now'],
            'end_datetime' => ['nullable', 'date', 'after_or_equal:start_datetime'],
            'pickup_location' => ['required', 'string', 'max:255'],
            'drop_location' => ['nullable', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'between:1,50'],
            'customer_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        // Explicitly whitelist data: custom_amount, client totals, and injected
        // payment/status/assignment identifiers are never stored or trusted.
        $reference = 'ENQ-'.now()->format('ymd').'-'.strtoupper(Str::random(8));
        ServiceEnquiry::create([
            ...$data,
            'user_id' => $request->user()->id,
            'reference' => $reference,
            'status' => 'requested',
        ]);

        return back()->with('success',
            'Your enquiry '.$reference.' was received. Availability and pricing are not yet confirmed; our team will review the request.'
        );
    }
}
