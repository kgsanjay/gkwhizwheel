<?php

declare(strict_types=1);

namespace App\Http\Controllers\Web;

use App\Enums\StoreStatus;
use App\Http\Controllers\Controller;
use App\Models\CabEnquiryDetail;
use App\Models\ServiceEnquiry;
use App\Models\ServiceItem;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class CabEnquiryWebController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        if (! $request->user()) {
            return redirect()->guest(route('login'));
        }

        $data = $request->validate([
            'service_item_id' => ['nullable', 'integer', 'exists:service_items,id'],
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'trip_type' => ['required', Rule::in(['one_way', 'round_trip', 'local', 'airport'])],
            'vehicle_class' => ['nullable', Rule::in(['hatchback', 'sedan', 'suv', 'mpv', 'van', 'tempo_traveller'])],
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_phone' => ['required', 'regex:/^[6-9]\d{9}$/'],
            'customer_email' => ['nullable', 'email', 'max:150'],
            'pickup_location' => ['required', 'string', 'max:255'],
            'drop_location' => ['required', 'string', 'max:255'],
            'start_datetime' => ['required', 'date', 'after:now'],
            'end_datetime' => ['nullable', 'date', 'after_or_equal:start_datetime'],
            'passengers' => ['required', 'integer', 'between:1,30'],
            'bags' => ['required', 'integer', 'between:0,30'],
            'travel_reference' => ['nullable', 'string', 'max:40'],
            'stops' => ['nullable', 'array', 'max:6'],
            'stops.*' => ['required', 'string', 'max:150'],
            'special_requests' => ['nullable', 'string', 'max:1200'],
            'terms_acknowledged' => ['required', 'accepted'],
        ]);

        $item = isset($data['service_item_id']) ? ServiceItem::findOrFail($data['service_item_id']) : null;
        $storeId = isset($data['store_id']) ? (int) $data['store_id'] : ($item?->store_id);
        if ($item !== null && ($item->service_type !== 'taxi' || ! $item->isAvailable()
            || ($storeId !== null && (int) $item->store_id !== (int) $storeId))) {
            throw ValidationException::withMessages([
                'service_item_id' => 'Select a published cab option in the correct branch.',
            ]);
        }
        if ($storeId !== null && ! Store::whereKey($storeId)->where('status', StoreStatus::ACTIVE->value)->exists()) {
            throw ValidationException::withMessages(['store_id' => 'The requested branch is not active.']);
        }

        $reference = DB::transaction(function () use ($request, $data, $item, $storeId): string {
            $reference = 'ENQ-'.now()->format('ymd').'-'.strtoupper(Str::random(8));
            $enquiry = ServiceEnquiry::create([
                'user_id' => $request->user()->id,
                'reference' => $reference,
                'service_type' => 'taxi',
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null,
                'pickup_location' => $data['pickup_location'],
                'drop_location' => $data['drop_location'],
                'start_datetime' => $data['start_datetime'],
                'end_datetime' => $data['end_datetime'] ?? null,
                'quantity' => 1,
                'customer_notes' => $data['special_requests'] ?? null,
                'status' => 'requested',
            ]);
            CabEnquiryDetail::create([
                'service_enquiry_id' => $enquiry->id,
                'service_item_id' => $item?->id,
                'store_id' => $storeId,
                'trip_type' => $data['trip_type'],
                'vehicle_class' => $data['vehicle_class'] ?? null,
                'passengers' => $data['passengers'],
                'bags' => $data['bags'],
                'travel_reference' => $data['travel_reference'] ?? null,
                'stops_json' => json_encode($data['stops'] ?? []),
                'special_requests' => $data['special_requests'] ?? null,
                'fare_state' => 'awaiting_verification',
                'terms_acknowledged' => true,
            ]);
            return $reference;
        });

        return back()->with('success',
            'Cab enquiry '.$reference.' received. Fare, vehicle, driver and trip availability are not confirmed. No payment has been taken.'
        );
    }
}
