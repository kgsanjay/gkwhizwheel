<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rental Voucher #{{ $booking->booking_number }} - GK WhizWheels</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background-color: #F8FAFC;
            color: #1E293B;
            font-size: 13px;
            line-height: 1.5;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .no-print {
            max-width: 800px;
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 8px;
            text-decoration: none;
            cursor: pointer;
            border: none;
        }

        .btn-primary {
            background: #D97706;
            color: #FFFFFF;
        }

        .btn-primary:hover {
            background: #B45309;
        }

        .btn-secondary {
            background: #F1F5F9;
            color: #334155;
            border: 1px solid #CBD5E1;
        }

        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }

        .header-left {
            display: table-cell;
            vertical-align: top;
            width: 70%;
        }

        .header-right {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 30%;
        }

        .brand-title {
            font-size: 24px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: -0.5px;
        }

        .brand-subtitle {
            font-size: 12px;
            color: #D97706;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }

        .contact-info {
            font-size: 11px;
            color: #64748B;
            line-height: 1.4;
        }

        .badge-confirmed {
            display: inline-block;
            background: #DCFCE7;
            color: #15803D;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 6px;
        }

        .qr-box {
            display: inline-block;
            text-align: center;
        }

        .qr-image {
            width: 95px;
            height: 95px;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 3px;
            background: #FFFFFF;
        }

        .qr-label {
            font-size: 9px;
            color: #64748B;
            font-weight: 700;
            margin-top: 3px;
        }

        .section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #D97706;
            margin-bottom: 10px;
            border-bottom: 1px solid #F1F5F9;
            padding-bottom: 4px;
        }

        .grid-2 {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }

        .col-half {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 12px;
        }

        .col-half:last-child {
            padding-right: 0;
            padding-left: 12px;
        }

        .card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 16px;
        }

        .meta-row {
            margin-bottom: 8px;
        }

        .meta-row:last-child {
            margin-bottom: 0;
        }

        .meta-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .meta-value {
            font-size: 13px;
            font-weight: 700;
            color: #0F172A;
        }

        .meta-value-lg {
            font-size: 15px;
            font-weight: 900;
            color: #D97706;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .table th {
            background: #F1F5F9;
            color: #475569;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 9px 12px;
            border-top: 1px solid #E2E8F0;
            border-bottom: 1px solid #E2E8F0;
        }

        .table td {
            padding: 10px 12px;
            border-bottom: 1px solid #F1F5F9;
            color: #1E293B;
        }

        .text-right {
            text-align: right;
        }

        .tariff-total-row {
            background: #F8FAFC;
            font-weight: 900;
            font-size: 14px;
            color: #0F172A;
            border-top: 2px solid #CBD5E1 !important;
            border-bottom: 2px solid #CBD5E1 !important;
        }

        .highlight-balance {
            color: #E11D48;
            font-weight: 900;
        }

        .highlight-paid {
            color: #15803D;
            font-weight: 900;
        }

        .guidelines {
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 8px;
            padding: 12px 16px;
            margin-top: 16px;
        }

        .guidelines-title {
            font-size: 11px;
            font-weight: 800;
            color: #B45309;
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .guidelines ul {
            padding-left: 16px;
            font-size: 11px;
            color: #78350F;
            line-height: 1.5;
        }

        .footer {
            margin-top: 24px;
            padding-top: 14px;
            border-top: 1px solid #E2E8F0;
            text-align: center;
            font-size: 10px;
            color: #94A3B8;
        }

        @media print {
            body {
                background: #FFFFFF !important;
                padding: 0 !important;
            }
            .container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100% !important;
            }
            .no-print {
                display: none !important;
            }
        }
    </style>
</head>
<body>

    @if(empty($isPdf))
    <div class="no-print">
        <a href="{{ route('bookings.confirmation', $booking->id) }}" class="btn btn-secondary">
            ← Back to Booking
        </a>
        <div style="display: flex; gap: 8px;">
            <a href="{{ route('bookings.voucher', $booking->id) }}" class="btn btn-primary" download>
                📥 Download PDF Agreement
            </a>
            <button onclick="window.print()" class="btn btn-secondary">
                🖨️ Print Agreement
            </button>
        </div>
    </div>
    @endif

    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <div class="brand-subtitle">G.K. WhizWheels • Two-Wheeler Fleet Rentals</div>
                <div class="brand-title">Rental Agreement & Tax Voucher</div>
                <div class="contact-info">
                    Palya Main Road Hub, Honnavar, Uttara Kannada, Karnataka - 581334<br>
                    24x7 Roadside Assistance: <strong>+91 86609 89586</strong> / <strong>+91 94815 12340</strong><br>
                    Website: gkwhizwheel.in • Email: support@gkwhizwheel.com
                </div>
                <div>
                    <span class="badge-confirmed">● {{ strtoupper($booking->status->value ?? (string)$booking->status) }}</span>
                    @if($booking->payment_status === 'paid' || $booking->payment_status?->value === 'paid')
                        <span class="badge-confirmed" style="background:#E0F2FE; color:#0369A1;">● ADVANCE VERIFIED</span>
                    @else
                        <span class="badge-confirmed" style="background:#FEF3C7; color:#B45309;">● COUNTER HANDOVER</span>
                    @endif
                </div>
            </div>
            <div class="header-right">
                <div class="qr-box">
                    @if(!empty($qrDataUri))
                        <img src="{{ $qrDataUri }}" alt="Rental QR Verification" class="qr-image">
                    @endif
                    <div class="qr-label">SCAN FOR HANDOVER</div>
                    <div style="font-size: 11px; font-weight: 800; color: #0F172A; margin-top: 2px;">
                        #{{ $booking->booking_number }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 2 Column Overview -->
        <div class="grid-2">
            <!-- Left Column: Vehicle & Rental Window -->
            <div class="col-half">
                <div class="section-title">Assigned Vehicle & Schedule</div>
                <div class="card">
                    <div class="meta-row">
                        <div class="meta-label">Vehicle Model</div>
                        <div class="meta-value-lg">
                            {{ trim(($booking->bike?->brand ?? '') . ' ' . ($booking->bike?->model_name ?? $booking->bike?->category?->name ?? 'Premium Two-Wheeler')) }}
                        </div>
                    </div>
                    @if($booking->bike?->registration_number)
                    <div class="meta-row">
                        <div class="meta-label">Registration Plate</div>
                        <div class="meta-value" style="color: #0F172A; font-family: monospace; font-size: 14px;">
                            {{ $booking->bike->registration_number }}
                        </div>
                    </div>
                    @endif
                    <div class="meta-row">
                        <div class="meta-label">Pickup Schedule & Hub</div>
                        <div class="meta-value" style="color: #D97706;">
                            {{ $booking->start_datetime ? \Carbon\Carbon::parse($booking->start_datetime)->format('D, d M Y • h:i A') : '—' }}
                        </div>
                        <div style="font-size: 11px; color: #64748B;">{{ $booking->pickupStore?->name ?? 'Palya Main Rd Hub, Honnavar' }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Return Schedule & Hub</div>
                        <div class="meta-value">
                            {{ $booking->end_datetime ? \Carbon\Carbon::parse($booking->end_datetime)->format('D, d M Y • h:i A') : '—' }}
                        </div>
                        <div style="font-size: 11px; color: #64748B;">{{ $booking->returnStore?->name ?? 'Palya Main Rd Hub, Honnavar' }}</div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Renter & Store Details -->
            <div class="col-half">
                <div class="section-title">Verified Renter</div>
                <div class="card" style="margin-bottom: 12px;">
                    <div class="meta-row">
                        <div class="meta-label">Full Name</div>
                        <div class="meta-value">{{ $booking->customer_name ?? $booking->user?->name ?? 'Valued Customer' }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Contact Number</div>
                        <div class="meta-value">{{ $booking->customer_phone ?? $booking->user?->phone ?? '—' }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">KYC / Driving License</div>
                        <div class="meta-value" style="color: #15803D;">● Verified Driver Profile</div>
                    </div>
                </div>

                <div class="section-title">Pickup Station Desk</div>
                <div class="card" style="background: #FFFBEB; border-color: #FDE68A;">
                    <div class="meta-row">
                        <div class="meta-label" style="color: #B45309;">Hub Manager Phone</div>
                        <div class="meta-value" style="color: #92400E; font-weight: 800;">
                            {{ $booking->pickupStore?->phone ?? '+91 86609 89586' }}
                        </div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label" style="color: #B45309;">Hub Address</div>
                        <div class="meta-value" style="color: #92400E; font-size: 11px;">
                            {{ $booking->pickupStore?->address_line ?? 'Opp. Sharavathi Bridge, Palya, Honnavar' }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tariff and Billing Breakdown -->
        <div class="section-title">Rental Fare & Deposit Receipt</div>
        <table class="table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Amount (INR)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Rental Fare ({{ $booking->bike?->model_name ?? 'Bike Rental' }})</strong>
                        <div style="font-size: 11px; color: #64748B;">
                            Unlimited km Honnavar coastal riding • Clean helmet included
                        </div>
                    </td>
                    <td class="text-right">₹{{ number_format((float)($booking->base_amount ?? $booking->total_amount), 2) }}</td>
                    <td class="text-right">₹{{ number_format((float)($booking->base_amount ?? $booking->total_amount), 2) }}</td>
                </tr>

                @if(!empty($booking->addons) && count($booking->addons) > 0)
                    @foreach($booking->addons as $addon)
                    <tr>
                        <td>Addon: {{ ucwords(str_replace('_', ' ', $addon->addon_type ?? 'Accessory')) }} (x{{ $addon->quantity ?? 1 }})</td>
                        <td class="text-right">₹{{ number_format((float)($addon->unit_price ?? 0), 2) }}</td>
                        <td class="text-right">₹{{ number_format((float)($addon->total ?? $addon->unit_price ?? 0), 2) }}</td>
                    </tr>
                    @endforeach
                @endif

                @if((float)($booking->discount_amount ?? 0) > 0)
                <tr>
                    <td colspan="2" style="color: #15803D;">Promotional Coupon Discount</td>
                    <td class="text-right" style="color: #15803D;">-₹{{ number_format((float)$booking->discount_amount, 2) }}</td>
                </tr>
                @endif

                <tr class="tariff-total-row">
                    <td colspan="2">Total Rental Tariff (Incl. GST)</td>
                    <td class="text-right">₹{{ number_format((float)$booking->total_amount, 2) }}</td>
                </tr>
                @if((float)($booking->deposit_amount ?? 0) > 0)
                <tr>
                    <td colspan="2" style="font-weight: 700; color: #0284C7;">Refundable Security Deposit (100% Refundable at Return)</td>
                    <td class="text-right" style="color: #0284C7; font-weight: 700;">₹{{ number_format((float)$booking->deposit_amount, 2) }}</td>
                </tr>
                @endif
                <tr>
                    <td colspan="2" style="font-weight: 700;">Advance Paid</td>
                    <td class="text-right highlight-paid">₹{{ number_format((float)($booking->advance_amount ?? $booking->advance_paid ?? 0), 2) }}</td>
                </tr>
                <tr>
                    <td colspan="2" style="font-weight: 900; font-size: 13px;">
                        Net Balance Payable at Handover
                    </td>
                    <td class="text-right highlight-balance" style="font-size: 14px;">
                        ₹{{ number_format(max(0, (float)$booking->total_amount - (float)($booking->advance_amount ?? $booking->advance_paid ?? 0)), 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Safety & Rental Terms -->
        <div class="guidelines">
            <div class="guidelines-title">Rental Terms & Rider Safety Conditions</div>
            <ul>
                <li><strong>Helmet Mandatory:</strong> Wearing an ISI-approved helmet is strictly mandatory by Karnataka Police law for rider and pillion.</li>
                <li><strong>Driving License:</strong> Original physical Driving License must be presented at vehicle key handover.</li>
                <li><strong>Fuel Policy:</strong> Vehicle is provided with adequate fuel to reach the nearest fuel station; please return with similar fuel level.</li>
                <li><strong>Speed Limits & Zones:</strong> Strictly adhere to 50 km/h coastal speed limits. Riding on beach sand is strictly forbidden by coastal regulation.</li>
            </ul>
        </div>

        <!-- Footer -->
        <div class="footer">
            G.K. WhizWheels Self-Drive Two-Wheeler Rentals • Honnavar, Karnataka 581334<br>
            24x7 Breakdown & Roadside Assistance: +91 86609 89586
        </div>
    </div>

</body>
</html>
