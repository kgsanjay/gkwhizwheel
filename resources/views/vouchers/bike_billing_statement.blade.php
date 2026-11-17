<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Billing Statement #{{ $booking->booking_reference }} - GK WhizWheels</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm 10mm;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: "DejaVu Sans", sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        body, table, td, th, div, span, strong, b, p, a, li, ul {
            font-family: "DejaVu Sans", sans-serif;
        }

        body {
            color: #0F172A;
            font-size: 10px;
            line-height: 1.35;
            background: #FFFFFF;
            padding: 0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0F766E;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .brand-name {
            font-size: 19px;
            font-weight: bold;
            color: #0F766E;
            letter-spacing: -0.3px;
            line-height: 1.1;
        }

        .brand-sub {
            font-size: 8.5px;
            font-weight: bold;
            color: #D97706;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 1px;
            margin-bottom: 3px;
        }

        .contact-line {
            font-size: 8.5px;
            color: #64748B;
            line-height: 1.3;
        }

        .doc-title {
            font-size: 12px;
            font-weight: bold;
            color: #0F172A;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: right;
        }

        .ref-badge {
            display: inline-block;
            background: #0F172A;
            color: #FFFFFF;
            font-size: 10.5px;
            font-weight: bold;
            padding: 2px 7px;
            border-radius: 4px;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }

        .badge-status {
            display: inline-block;
            background: #DCFCE7;
            color: #15803D;
            font-weight: bold;
            font-size: 8.5px;
            padding: 2px 6px;
            border-radius: 12px;
            text-transform: uppercase;
            margin-top: 2px;
        }

        .qr-img {
            width: 58px;
            height: 58px;
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            padding: 2px;
            background: #FFFFFF;
            vertical-align: middle;
        }

        .warning-box {
            border: 1px solid #FCD34D;
            background: #FFFBEB;
            color: #92400E;
            padding: 5px 8px;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 8.5px;
            line-height: 1.3;
        }

        .split-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .split-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 5px;
            padding: 7px 9px;
            font-size: 9px;
            line-height: 1.35;
        }

        .split-title {
            font-size: 8.5px;
            font-weight: bold;
            color: #0F766E;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 2px;
            margin-bottom: 4px;
        }

        .section-header {
            font-size: 9.5px;
            font-weight: bold;
            color: #0F766E;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 4px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .items-table th {
            padding: 5px 7px;
            background: #F1F5F9;
            color: #475569;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: left;
            border-top: 1px solid #CBD5E1;
            border-bottom: 1px solid #CBD5E1;
        }

        .items-table td {
            padding: 4px 7px;
            border-bottom: 1px solid #F1F5F9;
            font-size: 9px;
            color: #1E293B;
            line-height: 1.25;
        }

        .right {
            text-align: right;
            white-space: nowrap;
        }

        .row-sub {
            background: #F8FAFC;
            font-weight: bold;
            border-top: 1px solid #E2E8F0;
        }

        .row-total {
            background: #F1F5F9;
            font-size: 10px;
            font-weight: bold;
            color: #0F172A;
            border-top: 1.5px solid #CBD5E1 !important;
            border-bottom: 1.5px solid #CBD5E1 !important;
        }

        .row-paid {
            color: #15803D;
            font-weight: bold;
        }

        .row-balance {
            background: #FFFBEB;
            font-size: 11px;
            font-weight: bold;
            color: #B45309;
            border-top: 1px solid #FDE68A !important;
            border-bottom: 1px solid #FDE68A !important;
        }

        .footer {
            margin-top: 10px;
            font-size: 8px;
            color: #64748B;
            border-top: 1px solid #E2E8F0;
            padding-top: 4px;
            text-align: center;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <table class="header-table">
        <tr>
            <td style="width: 58%; vertical-align: top;">
                <div class="brand-name">G.K. WHIZWHEELS</div>
                <div class="brand-sub">Coastal Fleet Rentals &bull; Honnavar & Murudeshwar Hubs</div>
                <div class="contact-line">
                    Palya Main Road Hub, Honnavar, Uttara Kannada, Karnataka - 581334<br>
                    <strong>GSTIN:</strong> {{ config('bike_gst.supplier_gstin', '29BHQPC0339C1ZK') }} &bull; <strong>Proprietor:</strong> {{ config('bike_gst.supplier_legal_name', 'G VINAYAK') }}<br>
                    <strong>Helpdesk:</strong> +91 86609 89586 / +91 94815 12340 &bull; <strong>Email:</strong> support@gkwhizwheels.in
                </div>
            </td>
            <td style="width: 27%; vertical-align: top; text-align: right; padding-right: 6px;">
                <div class="doc-title">Billing Statement</div>
                <div class="ref-badge">#{{ $booking->booking_reference }}</div>
                <div>
                    <span class="badge-status">&bull; {{ strtoupper($booking->status?->value ?? (string) $booking->status) }}</span>
                </div>
                <div style="font-size: 8px; color: #64748B; margin-top: 2px;">
                    Date: {{ now()->format('d M Y') }}
                </div>
            </td>
            <td style="width: 15%; vertical-align: middle; text-align: right;">
                @if(!empty($qrDataUri))
                    <img src="{{ $qrDataUri }}" alt="QR Verification" class="qr-img">
                    <div style="font-size: 7px; font-weight: bold; color: #64748B; text-align: center; margin-top: 1px;">
                        SCAN CHECK-IN
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <div class="warning-box">
        <strong>STATEMENT SUMMARY:</strong> This document summarizes your booking tariff, recorded payments, and remaining balance at vehicle handover. A GST tax invoice, if applicable, is issued upon completion of rental.
    </div>

    <!-- 2 Column Split: Reservation & Customer -->
    <table class="split-table">
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 6px;">
                <div class="split-card">
                    <div class="split-title">Rental Schedule & Vehicle</div>
                    <div><strong>Vehicle:</strong> {{ trim(($booking->bike?->brand ?? '').' '.($booking->bike?->model_name ?? 'Fleet Vehicle')) }} ({{ $booking->bike?->registration_number ?? 'KA-47' }})</div>
                    <div><strong>Rental Period:</strong> {{ $booking->start_date?->format('d M Y') }} &mdash; {{ $booking->end_date?->format('d M Y') }}</div>
                    <div><strong>Pickup Hub:</strong> {{ $booking->pickupStore?->name ?? 'Palya Main Rd Hub, Honnavar' }}</div>
                    <div><strong>Return Hub:</strong> {{ $booking->returnStore?->name ?? 'Palya Main Rd Hub, Honnavar' }}</div>
                </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 6px;">
                <div class="split-card">
                    <div class="split-title">Customer Billing Details</div>
                    <div><strong>Customer Name:</strong> {{ $billing['name'] ?? $booking->user?->name ?? 'Valued Customer' }}</div>
                    <div><strong>Address:</strong> {{ $billing['address'] ?? 'Honnavar, Karnataka' }}@if(!empty($billing['state_code'])) (State Code: {{ $billing['state_code'] }})@endif</div>
                    @if(!empty($billing['gstin']))
                        <div><strong>Customer GSTIN:</strong> {{ $billing['gstin'] }}</div>
                    @endif
                    @php
                        $contactParts = array_filter([
                            !empty($booking->user?->phone) ? '+91 '.$booking->user->phone : null,
                            $booking->user?->email ?? null,
                        ]);
                    @endphp
                    @if(!empty($contactParts))
                        <div><strong>Contact:</strong> {{ implode(' • ', $contactParts) }}</div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <!-- Itemized Tariff Charges -->
    <div class="section-header">Rental Fare Breakdown</div>
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 70%;">Charge Description</th>
                <th class="right" style="width: 30%;">Amount (INR)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Base Rental Fare</td>
                <td class="right">₹{{ number_format((float) $booking->base_amount, 2) }}</td>
            </tr>
            @if((float) $booking->pricing_adjustments_amount != 0)
                <tr>
                    <td>Weekend / Seasonal Tariff Surcharge</td>
                    <td class="right">+₹{{ number_format((float) $booking->pricing_adjustments_amount, 2) }}</td>
                </tr>
            @endif
            @if((float) $booking->one_way_fee_amount != 0)
                <tr>
                    <td>One-Way Branch Relocation Fee</td>
                    <td class="right">+₹{{ number_format((float) $booking->one_way_fee_amount, 2) }}</td>
                </tr>
            @endif
            @if((float) $booking->addon_amount != 0)
                <tr>
                    <td>Addon Accessories & Gear</td>
                    <td class="right">+₹{{ number_format((float) $booking->addon_amount, 2) }}</td>
                </tr>
            @endif
            @if((float) $booking->discount_amount != 0)
                <tr>
                    <td style="color: #15803D;">Promotional Coupon Discount</td>
                    <td class="right" style="color: #15803D;">-₹{{ number_format((float) $booking->discount_amount, 2) }}</td>
                </tr>
            @endif
            @if((float) ($booking->price_breakdown_json['location_fee_amount'] ?? 0) != 0)
                <tr>
                    <td>Pickup / Landmark Relocation Fee</td>
                    <td class="right">+₹{{ number_format((float) $booking->price_breakdown_json['location_fee_amount'], 2) }}</td>
                </tr>
            @endif
            @if(($tax['status'] ?? null) === 'configured')
                @php
                    $gstRate = (float) ($tax['gst_rate_percent'] ?? 18);
                    $halfRate = $gstRate / 2;
                    $isInclusive = ($tax['price_mode'] ?? 'exclusive') === 'inclusive';
                @endphp
                <tr>
                    <td>GST ({{ $gstRate }}% &mdash; CGST {{ $halfRate }}% + SGST {{ $halfRate }}%{{ $isInclusive ? ', Included' : '' }})</td>
                    <td class="right">{{ $isInclusive ? '' : '+' }}₹{{ number_format((float) $tax['gst_amount'], 2) }}</td>
                </tr>
            @endif
            @if((float) $booking->deposit_amount != 0)
                <tr>
                    <td style="color: #0284C7;">Refundable Security Deposit (100% Refundable at Return)</td>
                    <td class="right" style="color: #0284C7;">₹{{ number_format((float) $booking->deposit_amount, 2) }}</td>
                </tr>
            @else
                <tr>
                    <td style="color: #15803D; font-size: 8px;">Refundable Security Deposit (Waived via Instant Digital KYC)</td>
                    <td class="right" style="color: #15803D;">₹0.00</td>
                </tr>
            @endif
            <tr class="row-total">
                <td>Total Booking Tariff @if(($tax['status'] ?? null) === 'configured')(Incl. {{ $tax['gst_rate_percent'] }}% GST)@endif</td>
                <td class="right">₹{{ number_format((float) $booking->total_amount, 2) }}</td>
            </tr>
            <tr class="row-paid">
                <td>Online Payment Received</td>
                <td class="right">-₹{{ number_format((float) $paid, 2) }}</td>
            </tr>
            @if((float) $balance > 0)
                <tr class="row-balance">
                    <td>NET BALANCE DUE AT HUB HANDOVER</td>
                    <td class="right" style="font-size: 12px; font-weight: bold; color: #B45309;">₹{{ number_format((float) $balance, 2) }}</td>
                </tr>
            @else
                <tr style="background: #ECFDF5; font-size: 10.5px; font-weight: bold; color: #065F46; border-top: 1px solid #A7F3D0; border-bottom: 1px solid #A7F3D0;">
                    <td>NET BALANCE DUE (PAID IN FULL)</td>
                    <td class="right" style="font-size: 11.5px; font-weight: bold; color: #15803D;">₹0.00</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- Recorded Payment Ledger -->
    <div class="section-header">Recorded Payment Transactions</div>
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 25%;">Transaction Date</th>
                <th style="width: 25%;">Method</th>
                <th style="width: 30%;">Gateway Reference</th>
                <th class="right" style="width: 20%;">Amount (INR)</th>
            </tr>
        </thead>
        <tbody>
        @forelse($payments as $payment)
            <tr>
                <td>{{ $payment->created_at?->format('d M Y, h:i A') }}</td>
                <td>{{ strtoupper($payment->method?->value ?? (string) $payment->method) }} ({{ strtoupper($payment->type?->value ?? (string) $payment->type) }})</td>
                <td style="font-family: monospace;">{{ $payment->gateway_reference ?: '-' }}</td>
                <td class="right" style="font-weight: bold; color: #15803D;">₹{{ number_format((float) $payment->amount, 2) }}</td>
            </tr>
        @empty
            <tr><td colspan="4" style="color: #64748B; text-align: center;">No online payment recorded yet. Balance payable at hub counter.</td></tr>
        @endforelse
        </tbody>
    </table>

    <div class="footer">
        G.K. WhizWheels Self-Drive Two-Wheeler Rentals &bull; Honnavar Hub, Uttara Kannada, Karnataka - 581334<br>
        Generated from booking & payment ledger. For 24x7 roadside assistance or queries, call <strong>+91 86609 89586</strong>.
    </div>
</body>
</html>