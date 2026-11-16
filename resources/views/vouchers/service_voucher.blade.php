<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trip Voucher #{{ $booking->booking_number }} - GK WhizWheels</title>
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
            background-color: #F8FAFC;
            color: #1E293B;
            font-size: 10.5px;
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

        /* Web Action Bar */
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
            background: #0284C7;
            color: #FFFFFF;
        }

        .btn-primary:hover {
            background: #0369A1;
        }

        .btn-secondary {
            background: #F1F5F9;
            color: #334155;
            border: 1px solid #CBD5E1;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #0284C7;
            padding-bottom: 10px;
            margin-bottom: 12px;
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
            font-size: 19px;
            font-weight: bold;
            color: #0F172A;
            letter-spacing: -0.3px;
        }

        .brand-subtitle {
            font-size: 9px;
            color: #0284C7;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }

        .contact-info {
            font-size: 9px;
            color: #64748B;
            line-height: 1.3;
        }

        .badge-confirmed {
            display: inline-block;
            background: #DCFCE7;
            color: #15803D;
            font-weight: bold;
            font-size: 9px;
            padding: 2px 7px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-top: 4px;
        }

        .qr-box {
            display: inline-block;
            text-align: center;
        }

        .qr-image {
            width: 65px;
            height: 65px;
            border: 1px solid #E2E8F0;
            border-radius: 5px;
            padding: 2px;
            background: #FFFFFF;
        }

        .qr-label {
            font-size: 8px;
            color: #64748B;
            font-weight: bold;
            margin-top: 2px;
        }

        /* Main Sections */
        .section-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0284C7;
            margin-bottom: 6px;
            border-bottom: 1px solid #F1F5F9;
            padding-bottom: 3px;
        }

        .grid-2 {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }

        .col-half {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 8px;
        }

        .col-half:last-child {
            padding-right: 0;
            padding-left: 8px;
        }

        .card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 8px;
        }

        .meta-row {
            margin-bottom: 4px;
            line-height: 1.25;
        }

        .meta-row:last-child {
            margin-bottom: 0;
        }

        .meta-label {
            font-size: 8.5px;
            font-weight: bold;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        .meta-value {
            font-size: 10.5px;
            font-weight: bold;
            color: #0F172A;
        }

        .meta-value-lg {
            font-size: 12px;
            font-weight: bold;
            color: #0284C7;
        }

        /* Table */
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .table th {
            background: #F1F5F9;
            color: #475569;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: left;
            padding: 5px 8px;
            border-top: 1px solid #E2E8F0;
            border-bottom: 1px solid #E2E8F0;
        }

        .table td {
            padding: 5px 8px;
            border-bottom: 1px solid #F1F5F9;
            font-size: 9.5px;
            color: #1E293B;
        }

        .text-right {
            text-align: right;
        }

        .tariff-total-row {
            background: #F8FAFC;
            font-weight: bold;
            font-size: 10.5px;
            color: #0F172A;
            border-top: 1.5px solid #CBD5E1 !important;
            border-bottom: 1.5px solid #CBD5E1 !important;
        }

        .highlight-balance {
            color: #E11D48;
            font-weight: bold;
        }

        .highlight-paid {
            color: #15803D;
            font-weight: bold;
        }

        /* Terms / Footer */
        .guidelines {
            background: #FFFBEB;
            border: 1px solid #FDE68A;
            border-radius: 6px;
            padding: 6px 10px;
            margin-top: 8px;
        }

        .guidelines-title {
            font-size: 9px;
            font-weight: bold;
            color: #B45309;
            text-transform: uppercase;
            margin-bottom: 3px;
        }

        .guidelines ul {
            padding-left: 14px;
            font-size: 8.5px;
            color: #78350F;
            line-height: 1.35;
        }

        .footer {
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px solid #E2E8F0;
            text-align: center;
            font-size: 8px;
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

    <!-- Web Navigation & Print Toolbar (Hidden when printing or in PDF download) -->
    @if(empty($isPdf))
    <div class="no-print">
        <a href="{{ route('services.booking.confirmation', $booking->booking_number) }}" class="btn btn-secondary">
            ← Back to Booking
        </a>
        <div style="display: flex; gap: 8px;">
            <a href="{{ route('services.booking.voucher', $booking->booking_number) }}" class="btn btn-primary" download>
                📥 Download PDF File
            </a>
            <button onclick="window.print()" class="btn btn-secondary">
                🖨️ Print Pass
            </button>
        </div>
    </div>
    @endif

    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <div class="brand-subtitle">G.K. WhizWheels &bull; Honnavar Coastal Tourism</div>
                <div class="brand-title">Official Travel Pass & Voucher</div>
                <div class="contact-info">
                    Palya Main Road Hub, Honnavar, Uttara Kannada, Karnataka - 581334<br>
                    24x7 Traveler Hotline: <strong>+91 86609 89586</strong> / <strong>+91 94815 12340</strong><br>
                    Website: gkwhizwheel.in &bull; Email: support@gkwhizwheel.com
                </div>
                <div>
                    <span class="badge-confirmed">&bull; {{ strtoupper($booking->status) }}</span>
                    @if($booking->payment_status === 'paid')
                        <span class="badge-confirmed" style="background:#E0F2FE; color:#0369A1;">&bull; FULLY SETTLED</span>
                    @else
                        <span class="badge-confirmed" style="background:#FEF3C7; color:#B45309;">&bull; PAY ON ARRIVAL</span>
                    @endif
                </div>
            </div>
            <div class="header-right">
                <div class="qr-box">
                    @if(!empty($qrDataUri))
                        <img src="{{ $qrDataUri }}" alt="Booking QR Verification" class="qr-image">
                    @endif
                    <div class="qr-label">SCAN TO VERIFY PASS</div>
                    <div style="font-size: 11px; font-weight: bold; color: #0F172A; margin-top: 2px;">
                        #{{ $booking->booking_number }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 2 Column Overview -->
        <div class="grid-2">
            <!-- Left Column: Travel Details -->
            <div class="col-half">
                <div class="section-title">Reserved Experience</div>
                <div class="card">
                    <div class="meta-row">
                        <div class="meta-label">Service Category</div>
                        <div class="meta-value-lg">
                            {{ ucwords(str_replace('_', ' ', $booking->service_type)) }}
                        </div>
                    </div>
                    @if($booking->serviceItem)
                    <div class="meta-row">
                        <div class="meta-label">Package / Vessel / Tour</div>
                        <div class="meta-value">{{ $booking->serviceItem->name }}</div>
                    </div>
                    @endif
                    <div class="meta-row">
                        <div class="meta-label">Scheduled Date & Time</div>
                        <div class="meta-value" style="color: #0284C7;">
                            {{ $booking->start_datetime ? $booking->start_datetime->format('D, d M Y') . ' &bull; ' . $booking->start_datetime->format('h:i A') : 'Confirmed on Schedule' }}
                        </div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Boarding / Reporting Point</div>
                        <div class="meta-value">{{ $booking->pickup_location }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Party / Guest Count</div>
                        <div class="meta-value">{{ $booking->quantity }} Person(s) / Units</div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Guest & Coordinator -->
            <div class="col-half">
                <div class="section-title">Lead Traveler</div>
                <div class="card" style="margin-bottom: 12px;">
                    <div class="meta-row">
                        <div class="meta-label">Guest Name</div>
                        <div class="meta-value">{{ $booking->customer_name }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label">Primary Mobile</div>
                        <div class="meta-value">{{ $booking->customer_phone }}</div>
                    </div>
                    @if($booking->customer_email)
                    <div class="meta-row">
                        <div class="meta-label">Email Address</div>
                        <div class="meta-value">{{ $booking->customer_email }}</div>
                    </div>
                    @endif
                </div>

                <div class="section-title">Assigned Operations Coordinator</div>
                <div class="card" style="background: #F0FDF4; border-color: #DCFCE7;">
                    <div class="meta-row">
                        <div class="meta-label" style="color: #15803D;">Desk Coordinator</div>
                        <div class="meta-value" style="color: #166534;">{{ $coordinator['name'] ?? 'WhizWheel Operations Desk' }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label" style="color: #15803D;">Direct Hotline / WhatsApp</div>
                        <div class="meta-value" style="color: #166534; font-weight: bold;">{{ $coordinator['phone'] ?? '+91 86609 89586' }}</div>
                    </div>
                    <div class="meta-row">
                        <div class="meta-label" style="color: #15803D;">Station / Dock Hub</div>
                        <div class="meta-value" style="color: #166534;">{{ $coordinator['spot'] ?? $booking->pickup_location }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tariff and Billing Breakdown -->
        <div class="section-title">Tariff & Payment Receipt</div>
        <table class="table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th>Qty / Pax</th>
                    <th class="text-right">Unit Rate</th>
                    <th class="text-right">Amount (INR)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $booking->serviceItem?->name ?? ucwords(str_replace('_', ' ', $booking->service_type)) }}</strong>
                        <div style="font-size: 11px; color: #64748B;">
                            Direct Honnavar local tariff &bull; Zero hidden commissions
                        </div>
                    </td>
                    <td>{{ $booking->quantity }}</td>
                    <td class="text-right">₹{{ number_format((float)($booking->base_amount / max(1, $booking->quantity)), 2) }}</td>
                    <td class="text-right">₹{{ number_format((float)$booking->base_amount, 2) }}</td>
                </tr>

                @if((float)$booking->discount_amount > 0)
                <tr>
                    <td colspan="3" style="color: #15803D;">Special Promotional Discount Applied</td>
                    <td class="text-right" style="color: #15803D;">-₹{{ number_format((float)$booking->discount_amount, 2) }}</td>
                </tr>
                @endif

                <tr class="tariff-total-row">
                    <td colspan="3">Total Package Tariff (Incl. of all taxes)</td>
                    <td class="text-right">₹{{ number_format((float)$booking->total_amount, 2) }}</td>
                </tr>
                <tr>
                    <td colspan="3" style="font-weight: bold;">Advance Paid Online</td>
                    <td class="text-right highlight-paid">₹{{ number_format((float)$booking->advance_paid, 2) }}</td>
                </tr>
                <tr>
                    <td colspan="3" style="font-weight: bold; font-size: 12px;">
                        Net Balance Due on Arrival / Boarding
                        <div style="font-size: 9.5px; color: #64748B; font-weight: normal;">
                            Payable via Cash / UPI (Google Pay, PhonePe, Paytm) at pickup
                        </div>
                    </td>
                    <td class="text-right highlight-balance" style="font-size: 13px;">
                        ₹{{ number_format((float)$booking->balance_due, 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Guidelines & Safety Policy -->
        <div class="guidelines">
            <div class="guidelines-title">Boarding Instructions & Traveler Guidelines</div>
            <ul>
                <li><strong>Reporting Time:</strong> Please arrive at least 15 minutes before your scheduled departure time.</li>
                <li><strong>Government ID:</strong> A valid photo ID (Aadhaar, Passport, Driving License) is mandatory for boat boarding and scuba diving.</li>
                <li><strong>Safety First:</strong> ISI-certified lifejackets are strictly provided and mandatory during all Sharavathi river safaris and coastal rides.</li>
                <li><strong>Zero Advance Policy:</strong> Pay on Arrival is accepted; zero advance cancellation or rescheduling assistance is available via our 24x7 desk.</li>
            </ul>
        </div>

        <!-- Footer -->
        <div class="footer">
            Thank you for booking with G.K. WhizWheels! This electronic pass serves as your confirmed voucher and valid tax receipt.<br>
            Emergency Contact: +91 86609 89586 &bull; Palya Main Rd Hub, Honnavar, Karnataka
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
