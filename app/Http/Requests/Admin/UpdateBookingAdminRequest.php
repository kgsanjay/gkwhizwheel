<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\BookingStatus;
use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateBookingAdminRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $booking = $this->route('booking');
        if (! $booking instanceof Booking) {
            $bookingId = (int) $this->route('id');
            $booking = Booking::find($bookingId);
        }

        return $booking !== null && ($this->user()?->can('update', $booking) ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'pickup_store_id' => ['required', 'integer', 'exists:stores,id'],
            'return_store_id' => ['required', 'integer', 'exists:stores,id'],
            'status' => ['required', new Enum(BookingStatus::class)],
            'late_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'damage_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
