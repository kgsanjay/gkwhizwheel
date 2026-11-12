<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Bike rental billing statement {{ $booking->booking_reference }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #142335; font-size: 11px; line-height: 1.55; margin: 30px; }
        .title { font-size: 22px; font-weight: bold; margin: 0; }
        .muted { color: #526477; }
        .warning { border: 1px solid #bd6508; background: #fff8eb; color: #854400; padding: 10px; margin: 18px 0; }
        .split { width: 100%; }
        .split td { width: 50%; vertical-align: top; padding: 10px 0; }
        .label { text-transform: uppercase; font-size: 9px; color: #64748b; font-weight: bold; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .items th { padding: 9px; background: #ecf2f8; text-align: left; }
        .items td { padding: 9px; border-bottom: 1px solid #e5eaf0; }
        .right { text-align: right; }
        .sum { font-size: 14px; font-weight: bold; }
        .footer { margin-top: 24px; font-size: 10px; color: #526477; }
    </style>
</head>
<body>
    <p class="title">GK WhizWheel</p>
    <p class="muted">BIKE RENTAL BILLING STATEMENT</p>
    <div class="warning"><strong>NOT A GST TAX INVOICE.</strong> This statement summarizes your reservation and recorded payments.
    It has no tax invoice number and must not be used to claim input tax credit.</div>
    <table class="split">
        <tr>
            <td>
                <div class="label">Booking reference</div>
                <strong>{{ $booking->booking_reference }}</strong><br>
                <div class="label">Booking status</div>
                {{ $booking->status?->value ?? (string) $booking->status }}<br>
                <div class="label">Travel dates</div>
                {{ $booking->start_date?->format('d M Y') }} - {{ $booking->end_date?->format('d M Y') }}<br>
                <div class="label">Bike</div>
                {{ trim(($booking->bike?->brand ?? '').' '.($booking->bike?->model_name ?? '')) }}
            </td>
            <td>
                <div class="label">Customer billing details</div>
                <strong>{{ $billing['name'] ?? $booking->user?->name ?? 'Customer' }}</strong><br>
                {{ $billing['address'] ?? 'No billing address on this booking' }}<br>
                @if(!empty($billing['gstin']))
                    GSTIN provided by customer: {{ $billing['gstin'] }}<br>
                @endif
                <div class="label">Pickup / return</div>
                {{ $booking->pickupStore?->name ?? 'Pickup branch' }}
                / {{ $booking->returnStore?->name ?? 'Return branch' }}
            </td>
        </tr>
    </table>
    <table class="items">
        <thead><tr><th>Charge</th><th class="right">Amount (INR)</th></tr></thead>
        <tbody>
            <tr><td>Base rental</td><td class="right">{{ number_format((float) $booking->base_amount, 2) }}</td></tr>
            @if((float) $booking->pricing_adjustments_amount != 0)
                <tr><td>Pricing adjustments</td><td class="right">{{ number_format((float) $booking->pricing_adjustments_amount, 2) }}</td></tr>
            @endif
            @if((float) $booking->one_way_fee_amount != 0)
                <tr><td>One-way fee</td><td class="right">{{ number_format((float) $booking->one_way_fee_amount, 2) }}</td></tr>
            @endif
            @if((float) $booking->addon_amount != 0)
                <tr><td>Add-ons</td><td class="right">{{ number_format((float) $booking->addon_amount, 2) }}</td></tr>
            @endif
            @if((float) $booking->discount_amount != 0)
                <tr><td>Discount</td><td class="right">-{{ number_format((float) $booking->discount_amount, 2) }}</td></tr>
            @endif
            @if((float) ($booking->price_breakdown_json['location_fee_amount'] ?? 0) != 0)
                <tr><td>Pickup and return point fees</td><td class="right">{{ number_format((float) $booking->price_breakdown_json['location_fee_amount'], 2) }}</td></tr>
            @endif
            @if(($tax['status'] ?? null) === 'configured')
                <tr><td>GST included in final booking total ({{ $tax['gst_rate_percent'] }}%)</td>
                    <td class="right">{{ number_format((float) $tax['gst_amount'], 2) }}</td></tr>
            @else
                <tr><td>GST</td><td class="right">Not configured</td></tr>
            @endif
            @if((float) $booking->deposit_amount != 0)
                <tr><td>Refundable security deposit</td><td class="right">{{ number_format((float) $booking->deposit_amount, 2) }}</td></tr>
            @endif
            <tr class="sum"><td>Final booking total (GST included if configured)</td>
                <td class="right">{{ number_format((float) $booking->total_amount, 2) }}</td></tr>
            <tr><td>Successfully paid</td><td class="right">{{ number_format($paid, 2) }}</td></tr>
            <tr><td>Remaining booking balance</td><td class="right">{{ number_format($balance, 2) }}</td></tr>
        </tbody>
    </table>
    <p><strong>Recorded payments</strong></p>
    <table class="items">
        <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th class="right">INR</th></tr></thead>
        <tbody>
        @forelse($payments as $payment)
            <tr>
                <td>{{ $payment->created_at?->format('d M Y') }}</td>
                <td>{{ $payment->method?->value ?? (string) $payment->method }}</td>
                <td>{{ $payment->gateway_reference ?: '-' }}</td>
                <td class="right">{{ number_format((float) $payment->amount, 2) }}</td>
            </tr>
        @empty
            <tr><td colspan="4">No successful payments recorded yet.</td></tr>
        @endforelse
        </tbody>
    </table>
    <p class="footer">Generated from the current booking and payment ledger. Additional charges, cancellations or refunds may change the balance.
    A GST tax invoice, if applicable, is issued separately by the registered supplier.</p>
</body>
</html>
