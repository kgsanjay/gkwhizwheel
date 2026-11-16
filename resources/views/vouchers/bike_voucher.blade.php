@php
    $ref = $booking->booking_reference ?: "BK-{$booking->id}";
    $breakdown = is_array($booking->price_breakdown_json) ? $booking->price_breakdown_json : json_decode($booking->price_breakdown_json ?? '[]', true);
    
    // Dates & Times
    $pickupTime = $breakdown['pickup_time'] ?? '09:00';
    $returnTime = $breakdown['return_time'] ?? '17:00';
    $startDateStr = $booking->start_date ? $booking->start_date->format('Y-m-d') : now()->format('Y-m-d');
    $endDateStr = $booking->end_date ? $booking->end_date->format('Y-m-d') : $startDateStr;
    
    try {
        $startDt = \Carbon\Carbon::parse($startDateStr . ' ' . $pickupTime);
    } catch (\Throwable $e) {
        $startDt = $booking->start_date ? \Carbon\Carbon::parse($booking->start_date) : now();
    }
    
    try {
        $endDt = \Carbon\Carbon::parse($endDateStr . ' ' . $returnTime);
    } catch (\Throwable $e) {
        $endDt = $booking->end_date ? \Carbon\Carbon::parse($booking->end_date) : $startDt;
    }
    
    $days = (int) ($breakdown['days'] ?? (max(1, $booking->start_date ? $booking->start_date->diffInDays($booking->end_date) + 1 : 1)));
    $hours = $breakdown['hours'] ?? null;
    $durationText = $days . ' ' . \Illuminate\Support\Str::plural('Day', $days) . ($hours ? " ({$hours}h)" : '');
    
    // Renter details
    $billing = $breakdown['checkout_billing'] ?? [];
    $customerName = $billing['name'] ?? $booking->customer_name ?? $booking->user?->name ?? 'Valued Customer';
    $customerPhone = $booking->customer_phone ?? $booking->user?->phone ?? '—';
    $customerAddress = $billing['address'] ?? $booking->user?->address ?? 'Kumta, Karnataka';
    
    // Financials & Tax
    $tax = $breakdown['bike_gst'] ?? null;
    $taxAmount = (float) ($tax['gst_amount'] ?? 0);
    $taxableAmount = (float) ($tax['taxable_amount'] ?? ((float)$booking->base_amount + (float)($booking->pricing_adjustments_amount ?? 0)));
    $ratePercent = $tax['gst_rate_percent'] ?? 18;
    $cgst = $taxAmount / 2;
    $sgst = $taxAmount / 2;
    
    // Payments & balance
    $paid = (float) ($booking->payments ? $booking->payments->where('status', 'success')->sum('amount') : 0);
    if ($paid <= 0 && isset($breakdown['checkout_amount'])) {
        $paid = (float) $breakdown['checkout_amount'];
    }
    if ($paid <= 0 && !empty($booking->advance_amount)) {
        $paid = (float) $booking->advance_amount;
    }
    $totalAmount = (float) $booking->total_amount;
    $balanceDue = max(0, $totalAmount - $paid);
    
    // Vehicle details
    $bikeModel = trim(($booking->bike?->brand ?? '') . ' ' . ($booking->bike?->model_name ?? $booking->bike?->category?->name ?? 'Two-Wheeler'));
    $regNumber = $booking->bike?->registration_number ?? 'KA-47-E-0104';
    $fuelType = ucfirst($booking->bike?->fuel_type?->value ?? (string)($booking->bike?->fuel_type ?? 'Petrol'));
    $transmission = ucfirst($booking->bike?->transmission?->value ?? (string)($booking->bike?->transmission ?? 'Automatic'));
    $odometer = $booking->bike?->odometer_reading ? number_format($booking->bike->odometer_reading) . ' km' : 'Verified Standard';
    
    // Hubs
    $pickupHubName = $booking->pickupStore?->name ?? 'Palya Main Rd Hub, Honnavar';
    $pickupHubPhone = $booking->pickupStore?->phone ?? '+91 86609 89586';
    $returnHubName = $booking->returnStore?->name ?? $pickupHubName;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rental Voucher #{{ $ref }} - GK WhizWheels</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 6mm 8mm;
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
            background-color: #F8FAFC;
            color: #0F172A;
            font-size: 10px;
            line-height: 1.35;
            padding: 12px;
        }

        .container {
            max-width: 790px;
            margin: 0 auto;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 16px 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            page-break-inside: avoid;
        }

        .no-print {
            max-width: 790px;
            margin: 0 auto 12px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            font-size: 12px;
            font-weight: bold;
            border-radius: 6px;
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

        /* Header Layout */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0F766E;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .brand-name {
            font-size: 20px;
            font-weight: bold;
            color: #0F766E;
            letter-spacing: -0.3px;
            line-height: 1.1;
        }

        .brand-sub {
            font-size: 9px;
            font-weight: bold;
            color: #D97706;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 1px;
            margin-bottom: 3px;
        }

        .contact-line {
            font-size: 9px;
            color: #64748B;
            line-height: 1.3;
        }

        .doc-title {
            font-size: 13px;
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
            font-size: 11px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
            margin-top: 3px;
        }

        .badge-status {
            display: inline-block;
            background: #DCFCE7;
            color: #15803D;
            font-weight: bold;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 12px;
            text-transform: uppercase;
            margin-top: 3px;
        }

        .badge-payment {
            display: inline-block;
            background: #FEF3C7;
            color: #B45309;
            font-weight: bold;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 12px;
            text-transform: uppercase;
            margin-top: 3px;
        }

        .qr-img {
            width: 60px;
            height: 60px;
            border: 1px solid #CBD5E1;
            border-radius: 4px;
            padding: 2px;
            background: #FFFFFF;
            vertical-align: middle;
        }

        /* 3-Column Info Grid */
        .info-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .info-col {
            width: 33.33%;
            vertical-align: top;
            padding-right: 8px;
        }

        .info-col:last-child {
            padding-right: 0;
            padding-left: 4px;
        }

        .info-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 8px 10px;
            min-height: 110px;
        }

        .card-header {
            font-size: 9.5px;
            font-weight: bold;
            color: #0F766E;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 3px;
            margin-bottom: 5px;
        }

        .meta-line {
            margin-bottom: 4px;
            line-height: 1.25;
        }

        .meta-line:last-child {
            margin-bottom: 0;
        }

        .meta-lbl {
            font-size: 8px;
            font-weight: bold;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .meta-val {
            font-size: 10.5px;
            font-weight: bold;
            color: #0F172A;
        }

        .plate-box {
            display: inline-block;
            background: #FEF08A;
            color: #000000;
            font-family: "DejaVu Sans Mono", monospace;
            font-size: 11px;
            font-weight: bold;
            padding: 1px 6px;
            border-radius: 3px;
            border: 1px solid #CA8A04;
            letter-spacing: 0.5px;
        }

        /* Financial Statement Table */
        .tariff-title {
            font-size: 10px;
            font-weight: bold;
            color: #0F766E;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .tariff-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .tariff-table th {
            background: #F1F5F9;
            color: #475569;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 5px 8px;
            border-top: 1px solid #CBD5E1;
            border-bottom: 1px solid #CBD5E1;
            text-align: left;
        }

        .tariff-table td {
            padding: 4px 8px;
            border-bottom: 1px solid #F1F5F9;
            font-size: 9.5px;
            color: #1E293B;
            line-height: 1.25;
        }

        .tar-right {
            text-align: right;
            white-space: nowrap;
        }

        .row-subtotal {
            background: #F8FAFC;
            font-weight: bold;
            border-top: 1px solid #E2E8F0;
        }

        .row-total {
            background: #F1F5F9;
            font-weight: bold;
            font-size: 10.5px;
            color: #0F172A;
            border-top: 1.5px solid #CBD5E1 !important;
            border-bottom: 1.5px solid #CBD5E1 !important;
        }

        .row-balance {
            background: #FFFBEB;
            font-weight: bold;
            font-size: 11.5px;
            color: #B45309;
            border-top: 1px solid #FDE68A !important;
            border-bottom: 1px solid #FDE68A !important;
        }

        .balance-highlight {
            font-size: 13px;
            font-weight: bold;
            color: #B45309;
        }

        /* Guidelines & Terms */
        .rules-box {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            border-radius: 6px;
            padding: 6px 10px;
            margin-bottom: 10px;
        }

        .rules-title {
            font-size: 9px;
            font-weight: bold;
            color: #166534;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 3px;
        }

        .rules-list {
            margin-left: 14px;
            font-size: 8.5px;
            color: #14532D;
            line-height: 1.35;
        }

        /* Signatures */
        .sign-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .sign-col {
            width: 50%;
            vertical-align: bottom;
            padding-right: 12px;
        }

        .sign-col:last-child {
            padding-right: 0;
            padding-left: 12px;
        }

        .sign-box {
            border: 1px dashed #CBD5E1;
            border-radius: 4px;
            padding: 6px 10px;
            background: #FAFAFA;
            min-height: 48px;
        }

        .sign-lbl {
            font-size: 8.5px;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
        }

        .sign-disclaimer {
            font-size: 7.5px;
            color: #64748B;
            margin-top: 2px;
        }

        .sign-line {
            margin-top: 26px;
            border-top: 1px solid #94A3B8;
            font-size: 8px;
            color: #64748B;
            padding-top: 2px;
        }

        /* Footer */
        .voucher-footer {
            border-top: 1px solid #E2E8F0;
            padding-top: 5px;
            text-align: center;
            font-size: 8px;
            color: #94A3B8;
            line-height: 1.3;
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
            ← Back to Booking Confirmation
        </a>
        <div style="display: flex; gap: 8px;">
            <a href="{{ route('bookings.voucher', $booking->id) }}" class="btn btn-primary" download>
                📥 Download PDF Agreement
            </a>
            <button onclick="window.print()" class="btn btn-secondary">
                🖨️ Print Agreement Pass
            </button>
        </div>
    </div>
    @endif

    <div class="container">
        <!-- Header -->
        <table class="header-table">
            <tr>
                <td style="width: 58%; vertical-align: top;">
                    <div class="brand-name">G.K. WHIZWHEELS</div>
                    <div class="brand-sub">Coastal Self-Drive Rentals &bull; Honnavar & Murudeshwar</div>
                    <div class="contact-line">
                        Palya Main Road Hub, Honnavar, Uttara Kannada, Karnataka - 581334<br>
                        <strong>GSTIN:</strong> 29BHQPC0339C1ZK &bull; <strong>24x7 Roadside Helpdesk:</strong> +91 86609 89586 / +91 94815 12340<br>
                        <strong>Email:</strong> support@gkwhizwheels.in &bull; <strong>Web:</strong> gkwhizwheel.in
                    </div>
                </td>
                <td style="width: 27%; vertical-align: top; text-align: right; padding-right: 8px;">
                    <div class="doc-title">Rental Pass & Voucher</div>
                    <div class="ref-badge">#{{ $ref }}</div>
                    <div>
                        <span class="badge-status">&bull; {{ strtoupper($booking->status->value ?? (string)$booking->status) }}</span>
                        @if($paid > 0)
                            <span class="badge-payment">&bull; ADVANCE VERIFIED</span>
                        @else
                            <span class="badge-payment">&bull; PAY AT HUB</span>
                        @endif
                    </div>
                    <div style="font-size: 8px; color: #64748B; margin-top: 2px;">
                        Date: {{ now()->format('d M Y') }}
                    </div>
                </td>
                <td style="width: 15%; vertical-align: middle; text-align: right;">
                    @if(!empty($qrDataUri))
                        <img src="{{ $qrDataUri }}" alt="QR Verification" class="qr-img">
                        <div style="font-size: 7.5px; font-weight: bold; color: #64748B; text-align: center; margin-top: 2px;">
                            SCAN HANDOVER
                        </div>
                    @endif
                </td>
            </tr>
        </table>

        <!-- 3 Column Overview: Rider, Vehicle, Schedule -->
        <table class="info-grid">
            <tr>
                <!-- Col 1: Renter -->
                <td class="info-col">
                    <div class="info-card">
                        <div class="card-header">1. Verified Renter</div>
                        <div class="meta-line">
                            <div class="meta-lbl">Full Name</div>
                            <div class="meta-val">{{ $customerName }}</div>
                        </div>
                        <div class="meta-line">
                            <div class="meta-lbl">Contact Phone</div>
                            <div class="meta-val">{{ $customerPhone }}</div>
                        </div>
                        <div class="meta-line">
                            <div class="meta-lbl">City / Billing Address</div>
                            <div class="meta-val" style="font-size: 9.5px; color: #475569;">{{ $customerAddress }}</div>
                        </div>
                        <div class="meta-line">
                            <div class="meta-lbl">Driver License & KYC</div>
                            <div class="meta-val" style="color: #15803D; font-size: 9.5px;">&bull; Verified Driver Profile</div>
                        </div>
                    </div>
                </td>

                <!-- Col 2: Vehicle -->
                <td class="info-col">
                    <div class="info-card">
                        <div class="card-header">2. Assigned Vehicle</div>
                        <div class="meta-line">
                            <div class="meta-lbl">Model & Make</div>
                            <div class="meta-val" style="color: #0F766E;">{{ $bikeModel }}</div>
                        </div>
                        <div class="meta-line">
                            <div class="meta-lbl">Registration Number</div>
                            <div><span class="plate-box">{{ $regNumber }}</span></div>
                        </div>
                        <div class="meta-line">
                            <div class="meta-lbl">Fuel & Transmission</div>
                            <div class="meta-val" style="font-size: 9.5px;">{{ $fuelType }} &bull; {{ $transmission }}</div>
                        </div>
                        <div class="meta-line">
                            <div class="meta-lbl">Complimentary Gear</div>
                            <div class="meta-val" style="color: #15803D; font-size: 9.5px;">2 ISI Clean Helmets Included</div>
                        </div>
                    </div>
                </td>

                <!-- Col 3: Schedule -->
                <td class="info-col">
                    <div class="info-card">
                        <div class="card-header">3. Schedule & Hub</div>
                        <div class="meta-line">
                            <div class="meta-lbl">Pickup Date & Time</div>
                            <div class="meta-val" style="color: #D97706;">{{ $startDt->format('D, d M Y') }} &bull; {{ $startDt->format('h:i A') }}</div>
                            <div style="font-size: 8px; color: #64748B;">{{ $pickupHubName }}</div>
                        </div>
                        <div class="meta-line">
                            <div class="meta-lbl">Return Date & Time</div>
                            <div class="meta-val">{{ $endDt->format('D, d M Y') }} &bull; {{ $endDt->format('h:i A') }}</div>
                            <div style="font-size: 8px; color: #64748B;">{{ $returnHubName }}</div>
                        </div>
                        <div class="meta-line">
                            <div class="meta-lbl">Rental Duration</div>
                            <div class="meta-val" style="font-weight: bold;">{{ $durationText }}</div>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Tariff & Payment Breakdown -->
        <div class="tariff-title">Rental Tariff & Payment Statement</div>
        <table class="tariff-table">
            <thead>
                <tr>
                    <th style="width: 60%;">Item Description</th>
                    <th class="tar-right" style="width: 18%;">Rate</th>
                    <th class="tar-right" style="width: 22%;">Amount (INR)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Rental Fare: {{ $bikeModel }}</strong>
                        <div style="font-size: 8px; color: #64748B;">{{ $durationText }} coastal rental &bull; Unlimited km Honnavar riding &bull; Helmets included</div>
                    </td>
                    <td class="tar-right">₹{{ number_format((float)($breakdown['base_daily_rate'] ?? ($booking->base_amount / max(1, $days))), 2) }}/day</td>
                    <td class="tar-right">₹{{ number_format((float)$booking->base_amount, 2) }}</td>
                </tr>

                @if((float)($booking->pricing_adjustments_amount ?? 0) != 0)
                <tr>
                    <td>
                        <strong>Weekend / Seasonal Tariff Surcharge</strong>
                        <div style="font-size: 8px; color: #64748B;">Dynamic rate adjustment for weekend peak coastal demand</div>
                    </td>
                    <td class="tar-right">—</td>
                    <td class="tar-right">+₹{{ number_format((float)$booking->pricing_adjustments_amount, 2) }}</td>
                </tr>
                @endif

                @if(!empty($booking->addons) && count($booking->addons) > 0)
                    @foreach($booking->addons as $addon)
                    <tr>
                        <td>Addon: {{ ucwords(str_replace('_', ' ', $addon->addon_type ?? 'Accessory')) }} (x{{ $addon->quantity ?? 1 }})</td>
                        <td class="tar-right">₹{{ number_format((float)($addon->unit_price ?? 0), 2) }}</td>
                        <td class="tar-right">₹{{ number_format((float)($addon->total ?? $addon->unit_price ?? 0), 2) }}</td>
                    </tr>
                    @endforeach
                @endif

                @if((float)($booking->discount_amount ?? 0) > 0)
                <tr>
                    <td style="color: #15803D;">Promotional Coupon Discount</td>
                    <td class="tar-right">—</td>
                    <td class="tar-right" style="color: #15803D;">-₹{{ number_format((float)$booking->discount_amount, 2) }}</td>
                </tr>
                @endif

                <tr class="row-subtotal">
                    <td colspan="2">Taxable Rental Subtotal</td>
                    <td class="tar-right">₹{{ number_format($taxableAmount, 2) }}</td>
                </tr>

                @if($taxAmount > 0)
                <tr>
                    <td colspan="2">GST 18% (CGST 9% ₹{{ number_format($cgst, 2) }} + SGST 9% ₹{{ number_format($sgst, 2) }})</td>
                    <td class="tar-right">₹{{ number_format($taxAmount, 2) }}</td>
                </tr>
                @endif

                @if((float)($booking->deposit_amount ?? 0) > 0)
                <tr>
                    <td colspan="2" style="color: #0284C7;">Refundable Security Deposit (100% Refundable at Return)</td>
                    <td class="tar-right" style="color: #0284C7;">₹{{ number_format((float)$booking->deposit_amount, 2) }}</td>
                </tr>
                @else
                <tr>
                    <td colspan="2" style="color: #15803D; font-size: 8.5px;">
                        <strong>Security Deposit:</strong> ₹0.00 (Waived via Instant Digital KYC Verification)
                    </td>
                    <td class="tar-right" style="color: #15803D;">₹0.00</td>
                </tr>
                @endif

                <tr class="row-total">
                    <td colspan="2">Total Rental Invoice Amount (Incl. 18% GST)</td>
                    <td class="tar-right">₹{{ number_format($totalAmount, 2) }}</td>
                </tr>

                <tr>
                    <td colspan="2" style="font-weight: bold; color: #15803D;">
                        &bull; Online Advance Payment Received (PhonePe Direct)
                    </td>
                    <td class="tar-right" style="color: #15803D; font-weight: bold;">
                        ₹{{ number_format($paid, 2) }}
                    </td>
                </tr>

                <tr class="row-balance">
                    <td colspan="2" style="font-weight: bold;">
                        NET BALANCE DUE AT HUB HANDOVER (Cash / UPI / Card)
                    </td>
                    <td class="tar-right balance-highlight">
                        ₹{{ number_format($balanceDue, 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Essential Rental Guidelines -->
        <div class="rules-box">
            <div class="rules-title">Key Rental Rules & Rider Safety Requirements</div>
            <ul class="rules-list">
                <li><strong>Helmet & License:</strong> Wearing an ISI-approved helmet is strictly compulsory by Karnataka Law for rider & pillion. Present physical original Driving License during vehicle key handover.</li>
                <li><strong>Speed Limits & Geofence:</strong> Strictly adhere to 50 km/h coastal speed limits. Riding on beach sand or inter-state travel without written permit is strictly prohibited.</li>
                <li><strong>Fuel Policy & Delays:</strong> Return vehicle with the same fuel level as handed over. Please notify the hub desk at least 2 hours prior for trip extensions to avoid late surcharges.</li>
                <li><strong>24x7 Emergency Assistance:</strong> Coastal roadside breakdown & accident helpline: <strong>+91 86609 89586</strong> / <strong>+91 94815 12340</strong>.</li>
            </ul>
        </div>

        <!-- Signatures & Acceptance -->
        <table class="sign-table">
            <tr>
                <td class="sign-col">
                    <div class="sign-box">
                        <div class="sign-lbl">Hirer / Rider Acceptance</div>
                        <div class="sign-disclaimer">I inspected and accepted the vehicle in roadworthy condition and agree to rental terms.</div>
                        <div class="sign-line">Rider Signature / Date</div>
                    </div>
                </td>
                <td class="sign-col">
                    <div class="sign-box">
                        <div class="sign-lbl">GK WhizWheels Hub Officer</div>
                        <div class="sign-disclaimer">Verified original Driving License, received advance, and handed over key with 2 helmets.</div>
                        <div class="sign-line">Authorized Signature & Store Seal</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="voucher-footer">
            G.K. WhizWheels Self-Drive Two-Wheeler Rentals &bull; Palya Main Road Hub, Honnavar, Uttara Kannada, Karnataka - 581334<br>
            Computer-generated verified rental pass. Valid for handover upon presentation at GK WhizWheels Hub.
        </div>
    </div>

    @if(empty($isPdf) && request()->has('autoprint'))
    <script>
        window.addEventListener('load', function() {
            setTimeout(function() {
                window.print();
            }, 300);
        });
    </script>
    @endif
</body>
</html>