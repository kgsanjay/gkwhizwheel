<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;

class ProcessRefundAdminRequest extends FormRequest
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

        return $booking !== null && ($this->user()?->can('processRefund', $booking) ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'payment_id' => ['nullable', 'integer', 'exists:payments,id'],
            'mark_cancelled' => ['nullable', 'boolean'],
        ];
    }
}
