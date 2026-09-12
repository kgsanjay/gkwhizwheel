# GK WhizWheels — Complete Platform Features & Capabilities Matrix

> **Enterprise Coastal Bike Rental & Multi-Service Tourism Marketplace Platform**  
> **Headquarters / Operational Hub:** Honnavar, Coastal Uttara Kannada, Karnataka  
> **Tech Stack:** Laravel 11 (PHP 8.3) • Inertia.js • React 18 • Material UI 5 • Tailwind CSS • Vite • SQLite / MySQL / PostgreSQL • PWA

---

## Executive Summary & Architecture

GK WhizWheels is a unified coastal mobility and tourism marketplace built specifically for tourist hubs, island crossings, and coastal towns (Honnavar, Mavinkurve Jetty, Murudeshwar, Gokarna, Sharavathi Backwaters). 

The platform operates on a **Single Source of Truth** architecture: all inventory, bookings, and operations across web, admin, and counter staff share a concurrency-safe, row-locked availability engine.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GK WHIZWHEELS PLATFORM                             │
├───────────────────────┬─────────────────────────────┬───────────────────────┤
│  CUSTOMER WEB & PWA   │     ADMIN & OPERATIONS      │  GROUND PASS & STAFF  │
│  - Bike Rentals       │  - Executive KPI Analytics  │  - QR Pass Scanner    │
│  - Boating & Scuba    │  - Fleet Lifecycle & Stores │  - Offline Queue (IDB)│
│  - Homestays & Cabs   │  - Dynamic Pricing & Rules  │  - Handover Wizard    │
│  - KYC & Digital Pay  │  - Dispatch & Calendar      │  - Return Settlement  │
└───────────────────────┴─────────────────────────────┴───────────────────────┘
                                   │
      ┌────────────────────────────┴────────────────────────────┐
      ▼                                                         ▼
[ Core DB & Availability Engine ]               [ Background & Multi-Service ]
- Row-level lock concurrency                     - Razorpay & PhonePe Gateways
- Multi-store relocation                         - WhatsApp & Email Notifications
- Strict booking state machine                   - DomPDF Rental Vouchers
```

---

## Complete Role-Based Feature Matrix

| Feature Area | Customer | Ground Staff | Store Manager | Super Admin |
|---|:---:|:---:|:---:|:---:|
| **Browse Bikes & Tourism Marketplace** | ✅ | ✅ | ✅ | ✅ |
| **Instant Online Booking & Advance Pay** | ✅ | — | — | — |
| **Customer Digital KYC Upload** | ✅ | View & Verify | View & Verify | Full Audit |
| **My Bookings & Trip Voucher Download** | ✅ | ✅ (Lookup) | ✅ (Lookup) | Full Control |
| **Ground QR Pass Scanning & Check-In** | — | ✅ | ✅ | ✅ |
| **Offline Pass Verification Queue (PWA)** | — | ✅ | ✅ | ✅ |
| **Bike Handover Inspection Wizard** | — | ✅ | ✅ | ✅ |
| **Bike Return & Deposit Settlement Wizard** | — | ✅ | ✅ | ✅ |
| **Multi-Store Relocation & Drop-Off** | — | ✅ | ✅ | ✅ |
| **Dispatch & Fleet Turnaround Board** | — | ✅ (Read) | ✅ | ✅ |
| **Store-Scoped Bookings & Calendar** | — | — | ✅ (Assigned Store) | ✅ (All Stores) |
| **Manual Booking Edits & Date Overrides** | — | — | ✅ (Assigned Store) | ✅ (All Stores) |
| **Multi-Service Catalog & Booking Ops** | Book | Manifest Check | Manage Bookings | Full Catalog |
| **Dynamic Pricing & Surge Management** | — | — | — | ✅ |
| **Coupons & Promotional Rules** | Apply | — | — | ✅ |
| **Fleet Inventory (Add / Edit / Retire)** | — | — | Status Update | Full Lifecycle |
| **Store & Hub Network Setup** | View | — | View Own Store | Full Management |
| **Staff Accounts & RBAC Assignment** | — | — | View Store Staff | Full Management |
| **Financial Audit & Manual Refunds** | Receive | — | View Own Store | Full Control |

---

## Module 1: Customer Portal & Public Web Experience

### 1.1 Landing Page & Coastal Hero Experience (`/`)
- **Coastal Brand Identity:** High-impact hero section tailored to coastal Karnataka travel with quick booking search.
- **Smart Date & Store Search Widget:** Select pickup store, return store (one-way support), pickup date, and return date.
- **Vehicle Category Carousel:** Commuter bikes, touring cruisers, premium sports bikes, automatic scooters, and electric bikes.
- **Honnavar & Coastal Attractions Guide:** Interactive destination highlights including Sharavathi Backwaters, Mavinkurve Island, Eco Beach, and Murudeshwar Temple.
- **Customer Testimonials & Verified Reviews:** Real-time social proof and local rental advantages.
- **FAQ & Local Riding Guidelines:** Coastal speed limits (50 km/h), helmet rules, ferry crossing guidelines, and monsoon precautions.

### 1.2 Bike Fleet Explorer (`/bikes`)
- **Real-Time Live Availability:** Automatically filters out bikes currently held, on rent, or undergoing maintenance.
- **Multi-Filter Sidebar:** Filter by Category, Transmission (Automatic vs Manual), Fuel Type (Petrol vs EV), Brand (Honda, Royal Enfield, Yamaha, etc.), and Daily Rate range.
- **Vehicle Specification Badges:** Engine displacement (cc), mileage (km/l), fuel capacity, and deposit requirements.
- **Sort Controls:** Sort by price (low-high, high-low), popularity, and newest additions.

### 1.3 Bike Detail & Multi-Step Booking Flow (`/bikes/{id}`)
- **High-Resolution Photo Gallery:** Exterior photos, side profiles, and instrument cluster views.
- **Interactive Date Picker:** Visual validation of available vs booked date windows.
- **Rental Add-Ons Selection:**
  - Standard Helmet (Solo Rider) / Extra Sanitized Helmet (Pillion).
  - Mobile Phone Mount with vibration dampening.
  - Monsoon Riding Raincoats / Waterproof Covers.
  - Riding Gloves & Coastal Windcheaters.
- **Coupon Code Validation:** Real-time discount application with instant calculation of savings.
- **Live Transparent Price Breakdown:**
  - Base Daily Rate × Number of Days.
  - Applicable Weekend / Peak Surge Multipliers.
  - Duration Discounts (e.g. 10% off for 3+ days, 20% off for 7+ days).
  - Add-on fees.
  - Refundable Security Deposit (highlighted clearly).
  - Total Advance Due vs Balance Payable at Counter.
- **Hold Reservation Timer:** 10-minute concurrency lock during checkout to prevent double-booking.

### 1.4 Multi-Service Tourism Marketplace (`/services/*`)
GK WhizWheels extends beyond two-wheelers into a complete coastal experience ecosystem:

1. **Boating & Mangrove Cruises (`/services/boating`):**
   - Sharavathi River estuary cruises, island boat transfers, and mangrove tunnel tours.
   - Private boat charters vs per-person passenger bookings.
   - Mandatory life jacket & safety protocol briefing.
2. **Scuba Diving & Netrani Island Expeditions (`/services/scuba`):**
   - PADI certified diving slots, snorkeling gear rental, and underwater photography packages.
   - Medical self-declaration checklist and swimmer/non-swimmer screening.
3. **Coastal & Forest Homestays (`/services/homestays`):**
   - Beach cottages, heritage village homes, and nature plantation stays.
   - Room capacity, meal preferences (Karavali seafood / Veg), check-in / check-out times.
4. **Cabs & Island Taxi Transfers (`/services/cabs`):**
   - Railway station (Honnavar / Bhatkal / Kumta) and airport (Goa / Mangalore) transfers.
   - Sedan, SUV, and Tempo Traveller options with verified local chauffeurs.
5. **Guided Local Tours (`/services/tours`):**
   - Apsarakonda waterfalls tour, Gersoppa Jain heritage trail, and sunset photography tours.
   - Multilingual local guides (Kannada, English, Hindi).
6. **Universal Service Booking Modal (`ServiceBookingModal.jsx`):**
   - Dynamic schema-driven modal adapting seamlessly to each service type.
   - Real-time pricing calculation based on passengers, duration, or dates.
   - Instant PDF pass generation with verification QR code.

### 1.5 Customer Authentication & Digital Identity
- **Multi-Method Sign-In:** Mobile OTP authentication, Email + Password, and Google 1-Tap OAuth.
- **Account Dashboard (`/account`):** View personal profile, active bookings, completed trips, and saved payment methods.
- **Digital KYC Management (`/account/kyc`):**
  - Secure upload of Driving License (front & back), Aadhaar Card, or Passport.
  - Live status tracking: `Unverified`, `Under Review`, `Verified`, `Rejected`.
  - Re-upload capability with rejection feedback notes.
- **My Bookings History (`/account/bookings`):**
  - Categorized into *Upcoming*, *Active Rental*, *Completed*, and *Cancelled*.
  - Detailed rental summary with pickup/return locations, odometer logs, and invoice breakdown.
  - One-click PDF Rental Agreement & Boarding Voucher download.
  - Print-friendly thermal receipt view.

### 1.6 Payment Gateways & Secure Transactions
- **Dual Payment Gateway Support:**
  - **Razorpay Integration:** UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Wallets.
  - **PhonePe Direct SDK:** Direct UPI intent flow for mobile users.
- **Payment Options:**
  - 100% Full Payment Online.
  - Partial Advance (e.g. 20% online booking hold + balance at store counter).
  - Pay at Counter (Cash / POS on arrival).
- **Security & Idempotency:**
  - Cryptographic HMAC-SHA256 webhook verification.
  - Idempotency keys on all payment calls to prevent accidental double charges.
  - Automated hold release cron job for abandoned checkouts.

---

## Module 2: Super Admin Operations Console

### 2.1 Executive KPI & Revenue Analytics Dashboard (`/admin/dashboard`)
- **Key Metrics Overview:**
  - Total Fleet Size & Active Utilization Rate (%).
  - Monthly & Lifetime Gross Revenue (INR).
  - Active Rentals currently out on the road.
  - Pending Handovers today & Expected Returns today.
  - Total Security Deposits currently held in escrow.
- **Store-Wise Revenue Comparison Chart:** Side-by-side performance across Honnavar Town, Mavinkurve, Murudeshwar, etc.
- **Booking Channel Breakdown:** Online Direct Website vs Counter Walk-In bookings.
- **Fleet Maintenance Warnings:** Instant alerts for bikes approaching service intervals or expiring documents.

### 2.2 Complete Fleet Lifecycle Management (`/admin/bikes`)
- **Inventory Registry:** Complete catalog of all vehicles with registration numbers, chassis numbers, engine numbers, and color.
- **Category & Spec Configuration:** Hourly rates, daily rates, excess km rates, and default security deposit amounts.
- **Document Expiry & Compliance Tracker:**
  - Insurance policy numbers and renewal expiry dates.
  - Pollution Under Control (PUC) certificate validity dates.
  - Fitness Certificate (FC) validity.
  - Automated alert flags when documents expire within 15 days.
- **Odometer & Usage Tracking:** Running lifetime mileage and trip meter logs.
- **Vehicle Status Lifecycle:** `AVAILABLE` ⇄ `ON_RENT` ⇄ `MAINTENANCE` ⇄ `RESERVED` ⇄ `RETIRED`.

### 2.3 Multi-Store Hub Network (`/admin/stores`)
- **Hub Profile Management:** Store name, physical address, landmark, contact phone, and operating hours.
- **Geo-Location Coordinates:** Latitude and Longitude pins for store locator and distance routing.
- **Store Status:** Toggle hubs between Active, Temporarily Closed, and Seasonal.
- **Store-Level Stock Allocations:** Instant view of bikes assigned to and currently parked at each store.

### 2.4 Staff & Role-Based Access Control (RBAC) (`/admin/staff`)
- **Hierarchical Personas:**
  1. `super_admin`: Full system control across all stores, finances, pricing, and system configurations.
  2. `store_manager`: Scoped to assigned stores for booking management, fleet updates, and dispatch.
  3. `staff`: Ground counter personnel for fast pass check-in, bike handovers, and return inspections.
- **Store Assignments:** Multi-store assignment capability (e.g. a manager overseeing both Honnavar Town and Mavinkurve Jetty).
- **Staff Status Control:** Instantly activate, suspend, or revoke staff credentials.

### 2.5 Dynamic Pricing & Surge Rule Engine (`/admin/pricing`)
- **Rule Priorities:** Stacking order of pricing rules from highest to lowest.
- **Surge Types Supported:**
  - **Weekend Surge:** Automatic % markup on Saturdays and Sundays.
  - **Seasonal Peak:** Date-range pricing for Diwali, New Year, Coastal Temple Festivals, and Summer holidays.
  - **Duration Discount:** Volume discounts for long-term rentals (e.g. 3–6 days = 10% off, 7+ days = 20% off).
  - **Multi-Service Rule Support:** Custom pricing rules targetable to specific service categories (Boating, Scuba, Cabs, Homestays).
- **Condition Matchers:** Store specific, bike category specific, minimum duration, and booking channel.

### 2.6 Coupon & Promotional Engine (`/admin/coupons`)
- **Discount Types:** Flat rupee discount (e.g. ₹200 off) or percentage discount (e.g. 15% off).
- **Guardrails:** Minimum rental value threshold, maximum discount cap, total usage limit, and per-user usage cap.
- **Validity Dates:** Scheduled start and expiry dates with active/inactive toggles.

### 2.7 Financial Control & Manual Refund Center (`/admin/bookings/{id}/refund`)
- **Security Deposit Ledger:** Track collected deposits vs returned deposits.
- **Manual Refund Screen:**
  - Full or partial refund processing for cancellations or service adjustments.
  - Itemized deduction recording (cancellation charge, fuel adjustment, or damage).
  - Direct integration with payment gateway refund API.
  - Automated activity log entry documenting admin ID and reason.

### 2.8 Audit Trails & Security Activity Logs (`/admin/reports`)
- **Immutable System Log:** Records `user_id`, `store_id`, `action`, `subject_type`, `subject_id`, `old_values`, and `new_values`.
- **Sensitive Action Coverage:** Booking updates, status overrides, price changes, refund issuances, handovers, and returns.

---

## Module 3: Store & Branch Manager Console

### 3.1 Store-Scoped Unified Bookings & Calendar (`/admin/bookings`)
- **Dual View Modes:**
  - **List View:** Paginated searchable table with multi-criteria filters (Date range, Status, Channel, Store).
  - **Interactive Month Calendar:** Visual day grid with color-coded booking chips, daily booking counts, and quick event popovers.
- **Quick Search:** Live lookup by customer name, phone number, booking reference, or bike registration number.
- **Action Triggers:** Direct access to Handover Wizard, Return Wizard, Edit Details, and Refunds from any row or calendar card.

### 3.2 Manual Booking Modifications & Conflict Prevention (`/admin/bookings/{id}/edit`)
- **Booking Overrides:** Adjust rental start/end dates, change assigned bike, or update return hub.
- **Race-Condition Safety:** Validates overlapping reservations for the same bike in real time; rejects conflicting dates.
- **Financial Auto-Recalculation:** Adjusts base rental charges and deposits when rental duration changes.

### 3.3 Dispatch & Fleet Turnaround Board (`/admin/dispatch`)
- **Fleet Availability Matrix:** Visual breakdown of bikes categorized into Available, On Rent, Due for Return Today, and Cleaning / In-Transit.
- **Turnaround Monitoring:** Identifies bikes requiring inspection before the next scheduled customer pickup.

### 3.4 Multi-Service Operations Desk (`/admin/services/{serviceType}/*`)
- **Service Inventory Management:** Add, edit, and toggle service items (boats, scuba slots, cab fleets, homestay rooms).
- **Manifests & Passenger Lists:** View confirmed passenger rosters for daily boat trips or scuba expeditions.
- **Counter Cash Collection:** Record walk-in cash payments for tourist activities and generate instant printed tickets.

---

## Module 4: Ground Staff & Jetty Counter Operations

### 4.1 Ground Pass Scanner & Fast Check-In (`/admin/check-in`)
- **High-Speed Camera Scanner:** Native browser QR scanner with rear/environment camera auto-selection.
- **Sound Feedback System:** Audio beeps for successful scan, invalid code, or warning.
- **Fast Lookup Fallbacks:** Search instantly by 6-character booking reference, full pass URL, or customer 10-digit mobile number.
- **Passenger Boarding & Balance Collection:**
  - Displays customer name, party size, service booked, and balance due.
  - One-click "Collect ₹X & Board Passenger" button with cash receipt notes.
  - Automatic transition to `COMPLETED` / `BOARDED`.

### 4.2 Offline Pass Verification Queue (PWA + IndexedDB)
- **Zero-Connectivity Architecture:** Designed specifically for remote coastal jetties (e.g. Mavinkurve, Sharavathi islands) where cellular connectivity drops.
- **Local IndexedDB Database:** Automatically stores offline pass validations locally on the staff device.
- **Smart Connectivity Detection:** Real-time online/offline banner indicating pending offline validations.
- **Background Auto-Sync:** Automatically transmits queued check-ins to `POST /admin/check-in/sync` when connectivity restores.
- **Manual Batch Sync & Inspector Dialog:** Ground staff can review queued records, timestamps, and trigger one-click manual sync.

### 4.3 Bike Handover Inspection Wizard (`HandoverWizardModal.jsx`)
A four-step structured workflow for physical vehicle delivery:
1. **Step 1: Customer & Helmets Verification:**
   - Identity confirmation and physical Driving License (DL) verification.
   - Sanitized helmet allocation selector (1 Helmet for solo rider vs 2 Helmets for rider + pillion).
   - Coastal speed limit safety briefing check (50 km/h speed limit).
2. **Step 2: Starting Odometer & Fuel Check:**
   - Odometer reading verification (prefilled with vehicle master reading).
   - Fuel gauge level selector (Full 100%, 3/4, Half, 1/4, Low/Reserve).
   - Pre-existing scratches / dent notes recording.
3. **Step 3: Vehicle Condition Photos:**
   - Multi-photo camera upload (up to 6 photos: Front, Rear, Sides, Meter cluster, Helmets).
   - Live thumbnail previews with deletion controls.
4. **Step 4: Digital Signature & Release:**
   - **Native HTML5 Canvas Pad:** Customer draws digital signature directly on staff touchscreen.
   - **Staff Witness Fallback:** One-click in-person counter verification for non-tech-savvy tourists.
   - Real-time summary of deposit held and rental parameters.
   - Submits handover, acquires DB row lock, flips bike status to `ON_RENT`, and creates condition log.

### 4.4 Multi-Store Return & Settlement Wizard (`ReturnInspectionWizardModal.jsx`)
A five-step structured workflow for vehicle check-in and financial settlement:
1. **Step 1: Ending Odometer & Mileage Calculation:**
   - Compares return odometer with handover reading and calculates net trip distance (`+X km`).
   - Prevents entry of odometer readings lower than starting reading.
2. **Step 2: Store Hub Relocation & Fuel Check:**
   - **Multi-Store Drop-Off Support:** Drop-off store selector allowing tourists to pick up at Honnavar Town and drop off at Mavinkurve Jetty.
   - Automatically relocates vehicle inventory to the drop-off store and sets status to `AVAILABLE`.
   - Fuel return level verification and sanitized helmet return confirmation.
3. **Step 3: Damage Inspection & Return Photos:**
   - Damage assessment input (₹) deducted directly from security deposit.
   - Damage description and condition photos for dispute defense.
4. **Step 4: Overdue & Late Fee Auto-Calculation:**
   - Compares return timestamp against scheduled return window.
   - Automatically computes late fees (`days_overdue × bike_daily_rate`).
   - Counter staff override & "Waive Fee" options for genuine delays (e.g. ferry delays).
5. **Step 5: Instant Security Deposit Settlement:**
   - Clear breakdown table: `Net Refund = Security Deposit Held - Damage Deduction - Late Fee`.
   - Settlement mode selector: Original Online Mode / Cash at Counter / Instant UPI Handover.
   - Creates completed refund ledger record via `RefundService`.

### 4.5 Official PDF Rental Agreement & Boarding Voucher (`/bookings/{id}/voucher`)
- **Vector Branded Document:** Generated on-the-fly using DomPDF.
- **Embedded Security Elements:**
  - Machine-readable QR verification code linked to check-in endpoint.
  - Customer DL number, vehicle registration number, and fuel/odometer readings.
  - Complete Karavali coastal rental terms and emergency breakdown helpline numbers.
- **Printing Modes:** Direct browser PDF stream, download, or compact thermal receipt print.

---

## Module 5: Cross-Cutting & Technical Infrastructure

### 5.1 Concurrency Safety & Availability Engine
- **Database-Level Row Locking:** Uses `DB::transaction()` with `lockForUpdate()` during critical state transitions (`HELD`, `CONFIRMED`, `HANDED_OVER`, `RETURNED`).
- **Overlap Prevention:** Checks for conflicting date ranges at the database layer before any hold or booking is confirmed.
- **Zero Race Conditions:** Ensures website and counter staff cannot simultaneously book the same vehicle for overlapping dates.

### 5.2 Progressive Web App (PWA) Capabilities
- **Web App Manifest (`public/manifest.json`):** Full standalone app experience with coastal theme colors and mobile icons.
- **Service Worker (`public/sw.js`):** Asset caching, offline fallback screens, and network-first sync strategies.

### 5.3 Notifications & Communications Engine
- **WhatsApp Channel (`WhatsAppChannel.php`):** Sends booking confirmations, pickup directions, and return receipts directly to customer WhatsApp.
- **Email Notifications (Mailable):** Rich HTML email receipts with attached PDF rental agreement vouchers.
- **Notification Log Audit (`NotificationLog`):** Tracks delivery attempts, status, recipient phone/email, and timestamps.

### 5.4 Staff REST API (Mobile App Ready) (`/api/v1/staff/*`)
- Sanctum token authentication.
- Offline hold creation and walk-in reservation endpoints.
- Cash / POS payment collection endpoints.
- Active rental status queries and sync endpoints.

### 5.5 Quality Assurance & Test Coverage
- **Feature & Unit Tests:** 57+ automated test suites.
- **Assertion Coverage:** Over 2,770 automated test assertions.
- **Test Scenarios Covered:**
  - Complete booking lifecycle (Hold ➔ Pay ➔ Confirm ➔ Handover ➔ Return ➔ Settle).
  - Conflict detection for overlapping bookings.
  - Dynamic pricing surge and coupon validation.
  - Offline pass synchronization and conflict handling.
  - Multi-store bike relocation and deposit calculations.
  - Security role enforcement (RBAC).

---

## File Architecture Map

```
app/
├── Enums/                     # BookingStatus, BikeStatus, UserRole, PaymentStatus, etc.
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/Staff/     # REST API for staff app operations
│   │   └── Web/
│   │       ├── Admin/         # Admin & Manager web controllers (Bookings, Check-in, Bikes, Stores, Pricing)
│   │       └── Customer/      # Public customer controllers (Bikes, Services, KYC, Checkout)
│   ├── Middleware/            # EnsureAdminOrStaff, EnsureServiceAccess, HandleInertiaRequests
│   └── Requests/              # Form request validation classes
├── Models/                    # Bike, Booking, Store, ServiceItem, ServiceBooking, ActivityLog, etc.
├── Policies/                  # BookingPolicy, BikePolicy (RBAC rules)
├── Services/                  # BookingService, AvailabilityService, RefundService, PricingService, VoucherService
└── Notifications/             # WhatsApp, Email, and SMS notification classes

resources/
├── js/
│   ├── Components/
│   │   ├── BookingModals/     # HandoverWizardModal, ReturnInspectionWizardModal, Service Modals
│   │   └── MapPicker.jsx      # Interactive store geo-picker
│   ├── Layouts/               # AdminLayout (with active badges) & AppLayout (coastal theme)
│   ├── Pages/
│   │   ├── Admin/             # Dashboard, Bookings, CheckIn, Dispatch, Bikes, Stores, Staff, Pricing
│   │   └── ...                # Public pages (Bikes, Boating, Scuba, Cabs, Homestays, Tours, KYC)
│   └── utils/
│       └── offlineQueue.js    # IndexedDB offline pass verification queue helper
└── views/
    ├── app.blade.php          # Main Inertia root view with PWA links
    └── vouchers/              # DomPDF Blade templates for rental agreements & boarding passes
```

---

*GK WhizWheels Platform — Engineered for coastal terrain reliability, offline jetty operations, and multi-service tourism.*
