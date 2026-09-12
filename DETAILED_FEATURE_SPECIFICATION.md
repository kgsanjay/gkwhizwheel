# GK WhizWheels — Comprehensive Feature Specification & System Documentation

> **Platform:** Enterprise Coastal Bike Rental & Multi-Service Tourism Marketplace  
> **Operational Base:** Honnavar, Coastal Uttara Kannada, Karnataka, India  
> **Technology Stack:** Laravel 11 (PHP 8.3) • Inertia.js • React 18 • Material UI 5 • Tailwind CSS • Vite • SQLite / MySQL / PostgreSQL • Progressive Web App (PWA)

---

# Table of Contents
1. [Architecture & Concurrency Philosophy](#1-architecture--concurrency-philosophy)
2. [Role-Based Access Control (RBAC) Matrix](#2-role-based-access-control-rbac-matrix)
3. [Module 1: Customer & Public Web Portal](#3-module-1-customer--public-web-portal)
   - 3.1 [Landing Page & Coastal Experience Engine](#31-landing-page--coastal-experience-engine)
   - 3.2 [Bike Fleet Catalog & Live Filter System](#32-bike-fleet-catalog--live-filter-system)
   - 3.3 [Real-Time Availability & Race-Condition Safe Booking Engine](#33-real-time-availability--race-condition-safe-booking-engine)
   - 3.4 [Transparent Pricing Calculator & Dynamic Rate Breakdown](#34-transparent-pricing-calculator--dynamic-rate-breakdown)
   - 3.5 [Rental Add-Ons Allocation System](#35-rental-add-ons-allocation-system)
   - 3.6 [Coupon & Promotional Code Validator](#36-coupon--promotional-code-validator)
   - 3.7 [Dual Payment Gateway Integration (Razorpay & PhonePe)](#37-dual-payment-gateway-integration-razorpay--phonepe)
   - 3.8 [Instant Boarding Pass & DomPDF Rental Agreement Generator](#38-instant-boarding-pass--dompdf-rental-agreement-generator)
   - 3.9 [Multi-Service Tourism Marketplace](#39-multi-service-tourism-marketplace)
   - 3.10 [Universal Service Booking Modal](#310-universal-service-booking-modal)
   - 3.11 [Customer Authentication & Social Sign-In](#311-customer-authentication--social-sign-in)
   - 3.12 [Digital KYC Document Verification Portal](#312-digital-kyc-document-verification-portal)
   - 3.13 [Customer Bookings Dashboard & Trip Lifecycle Tracker](#313-customer-bookings-dashboard--trip-lifecycle-tracker)
   - 3.14 [Automated WhatsApp & Email Notifications](#314-automated-whatsapp--email-notifications)
4. [Module 2: Ground Staff & Jetty Counter Operations](#4-module-2-ground-staff--jetty-counter-operations)
   - 4.1 [Fast Pass Scanner & QR Code Boarding Console](#41-fast-pass-scanner--qr-code-boarding-console)
   - 4.2 [Offline Pass Verification Queue (PWA + IndexedDB)](#42-offline-pass-verification-queue-pwa--indexeddb)
   - 4.3 [Interactive Bike Handover Inspection Wizard](#43-interactive-bike-handover-inspection-wizard)
   - 4.4 [Multi-Store Bike Return & Settlement Wizard](#44-multi-store-bike-return--settlement-wizard)
   - 4.5 [Instant Counter Cash Balance Collection](#45-instant-counter-cash-balance-collection)
5. [Module 3: Store & Branch Manager Console](#5-module-3-store--branch-manager-console)
   - 5.1 [Store-Scoped Bookings Management & Interactive Month Calendar](#51-store-scoped-bookings-management--interactive-month-calendar)
   - 5.2 [Manual Booking Rescheduling & Collision Prevention](#52-manual-booking-rescheduling--collision-prevention)
   - 5.3 [Dispatch & Fleet Turnaround Board](#53-dispatch--fleet-turnaround-board)
   - 5.4 [Multi-Service Operations & Passenger Manifests](#54-multi-service-operations--passenger-manifests)
   - 5.5 [Store Fleet Inventory & Parking Allocation](#55-store-fleet-inventory--parking-allocation)
6. [Module 4: Super Admin Operations & Platform Governance](#6-module-4-super-admin-operations--platform-governance)
   - 6.1 [Executive KPI & Revenue Analytics Dashboard](#61-executive-kpi--revenue-analytics-dashboard)
   - 6.2 [Fleet Lifecycle, Compliance & Maintenance Management](#62-fleet-lifecycle-compliance--maintenance-management)
   - 6.3 [Multi-Store Hub Network Setup](#63-multi-store-hub-network-setup)
   - 6.4 [Staff Accounts & RBAC Assignment](#64-staff-accounts--rbac-assignment)
   - 6.5 [Dynamic Pricing & Surge Rule Engine](#65-dynamic-pricing--surge-rule-engine)
   - 6.6 [Coupon & Promotional Rule Management](#66-coupon--promotional-rule-management)
   - 6.7 [Financial Control & Manual Refund Center](#67-financial-control--manual-refund-center)
   - 6.8 [Immutable System Audit Trails & Activity Logging](#68-immutable-system-audit-trails--activity-logging)
7. [Module 5: Cross-Cutting Technical Infrastructure](#7-module-5-cross-cutting-technical-infrastructure)
   - 7.1 [Database Concurrency & Row-Level Locking Engine](#71-database-concurrency--row-level-locking-engine)
   - 7.2 [Progressive Web App (PWA) Engine](#72-progressive-web-app-pwa-engine)
   - 7.3 [Automated Cron Commands & Background Tasks](#73-automated-cron-commands--background-tasks)
   - 7.4 [Staff Mobile REST API](#74-staff-mobile-rest-api)
   - 7.5 [Automated Test Suite & Quality Verification](#75-automated-test-suite--quality-verification)

---

# 1. Architecture & Concurrency Philosophy

GK WhizWheels is built specifically to address the complex reality of coastal tourism operations where internet connectivity is intermittent at boat jetties and island crossings (e.g., Mavinkurve Island, Sharavathi backwaters, Honnavar port).

### 1.1 Single Source of Truth
There is **no split inventory**. Whether a customer books a bike on the website from Bengaluru or a walk-in tourist arrives at the Mavinkurve jetty counter, both operations write to the exact same `bikes` and `bookings` database tables. Every booking record tracks its origin channel via the `channel` column (`online` vs `offline`).

### 1.2 Concurrency & Race-Condition Elimination
To eliminate double-bookings across concurrent website users and counter staff:
- All state transitions acquire a database row-level lock (`lockForUpdate()`) inside an ACID database transaction.
- When a customer begins checkout, the system places a temporary 10-minute `HELD` lock on the bike.
- If payment fails or is abandoned, an automated scheduler releases the hold, restoring the bike to `AVAILABLE`.
- Date range overlap checks use strict SQL boundary logic:
  $$\text{Overlap} \iff (\text{Existing Start} < \text{Requested End}) \land (\text{Existing End} > \text{Requested Start})$$

### 1.3 State Machine Flow
```
                 ┌────────────────────────────────────────────────┐
                 │                                                │
                 ▼                                                │
[ AVAILABLE ] ──────► [ HELD ] (10-min hold) ──────► [ CONFIRMED ] (Paid / Approved)
      ▲                     │                              │
      │                     ▼ (Timeout)                    ▼
      │               [ EXPIRED ]                    [ HANDED_OVER ] (On Rent / In Use)
      │                                                    │
      │                                                    ▼
      └────────────────────────────────────────────── [ RETURNED ] (Inspected / Settled)
                                                           │
                                                           ▼
                                                     [ COMPLETED ]
```

---

# 2. Role-Based Access Control (RBAC) Matrix

The system implements four distinct user personas, enforced via Laravel Policies (`BookingPolicy`, `BikePolicy`), middleware (`EnsureAdminOrStaff`, `EnsureServiceAccess`), and Inertia shared props:

| Capability / Action | Customer | Ground Staff | Store Manager | Super Admin |
|---|:---:|:---:|:---:|:---:|
| Browse Public Fleet & Marketplace | ✅ | ✅ | ✅ | ✅ |
| Book Vehicle & Pay Online | ✅ | — | — | — |
| Upload & View Own KYC Documents | ✅ | — | — | — |
| View Customer KYC Submissions | — | ✅ (Read) | ✅ (Verify) | ✅ (Full Audit) |
| Scan & Board Passengers (QR Code) | — | ✅ | ✅ | ✅ |
| Offline Pass Validation Queue | — | ✅ | ✅ | ✅ |
| Execute Bike Handover Wizard | — | ✅ | ✅ | ✅ |
| Execute Return & Deposit Settlement | — | ✅ | ✅ | ✅ |
| Multi-Store Relocation Drop-Off | — | ✅ | ✅ | ✅ |
| View Dispatch Turnaround Board | — | ✅ (Read) | ✅ | ✅ |
| View Bookings Calendar | — | — | ✅ (Assigned Store) | ✅ (All Stores) |
| Edit Booking Dates / Vehicle Reassign | — | — | ✅ (Assigned Store) | ✅ (All Stores) |
| Process Manual Refunds | — | — | — | ✅ |
| Configure Dynamic Pricing & Surges | — | — | — | ✅ |
| Manage Coupons & Promo Rules | — | — | — | ✅ |
| Create / Edit / Retire Bikes | — | — | Status Update | ✅ (Full Lifecycle) |
| Create / Edit Store Locations | — | — | View Own Store | ✅ (Full Management) |
| Manage Staff Accounts & Scopes | — | — | View Store Staff | ✅ (Full Management) |
| View Financial Reports & Audit Logs | — | — | Store Metrics | ✅ (Global Audit) |

---

# 3. Module 1: Customer & Public Web Portal

## 3.1 Landing Page & Coastal Experience Engine
- **Target URL:** `/`
- **Controller:** `app/Http/Controllers/Web/BookingWebController.php`
- **View:** `resources/js/Pages/Welcome.jsx`
- **Detailed Explanation:**
  - **Coastal Visual Identity:** Designed with modern aesthetics specifically showcasing coastal Karnataka (Honnavar mangrove forests, Sharavathi suspension bridge, Eco Beach, Murudeshwar temple).
  - **Interactive Search Widget:** Customers select Pickup Store, Return Store (supporting one-way rentals across hubs), Pickup Date & Time, and Return Date & Time.
  - **Category Highlights:** Direct links to Commuter Scooters, Royal Enfield Touring Bikes, and Electric Scooters.
  - **Honnavar Attractions Carousel:** Educational destination guides highlighting driving distances, ferry timings, and recommended bikes for each terrain.
  - **Local Tourism Safety FAQ:** Informs tourists about coastal monsoon rules, mandatory helmet guidelines, and speed regulations.

## 3.2 Bike Fleet Catalog & Live Filter System
- **Target URL:** `/bikes`
- **Controller:** `app/Http/Controllers/Web/BikeWebController.php`
- **View:** `resources/js/Pages/Bikes/Index.jsx`
- **Detailed Explanation:**
  - **Dynamic Multi-Criteria Filtering:**
    - **Category:** Scooters, Cruisers, Sports, Commuters, Adventure.
    - **Transmission:** Automatic (CVT scooters) vs Manual (Geared motorcycles).
    - **Fuel Type:** Petrol vs Electric (EV).
    - **Brand:** Honda, Royal Enfield, Yamaha, Suzuki, TVS, Ather, Ola.
    - **Price Slider:** Interactive range slider filtering by daily rate (₹300 to ₹3,000+).
  - **Real-Time Stock Counters:** Displays remaining available bikes per model at the selected store hub.
  - **Specification Cards:** Highlighting engine displacement (cc), real-world fuel economy (km/l), fuel tank capacity, and luggage rack availability.

## 3.3 Real-Time Availability & Race-Condition Safe Booking Engine
- **Service:** `app/Services/AvailabilityService.php`
- **Detailed Explanation:**
  - **Algorithm:** When a customer searches for a date range $[T_{\text{start}}, T_{\text{end}}]$, the engine executes an optimized SQL exclusion query:
    ```sql
    SELECT * FROM bikes 
    WHERE current_store_id = :pickup_store_id 
      AND status = 'available'
      AND id NOT IN (
          SELECT bike_id FROM bookings 
          WHERE status IN ('held', 'confirmed', 'handed_over')
            AND start_date < :end_date 
            AND end_date > :start_date
      );
    ```
  - **Concurrency Hold:** When checkout begins, `AvailabilityService::holdBooking()` inserts a record with status `HELD` and a `held_until` timestamp set to 10 minutes into the future. A database row lock prevents any other customer or counter staff from selecting that bike during the hold window.

## 3.4 Transparent Pricing Calculator & Dynamic Rate Breakdown
- **Service:** `app/Services/PricingService.php`
- **Detailed Explanation:**
  - **Base Calculation:** $\text{Days} \times \text{Base Daily Rate}$.
  - **Weekend Surge:** Automatically detects Saturdays and Sundays within the booking range and applies configured surge multipliers (e.g., $1.25\times$).
  - **Seasonal Surge:** Matches booking dates against active seasonal peak rules (e.g., Diwali, Christmas/New Year, Coastal Temple festivals).
  - **Duration Discounts:** Automatically rewards multi-day bookings (e.g., 3–6 days = 10% off; 7+ days = 20% off).
  - **Security Deposit:** Transparently listed as a refundable deposit (held in escrow, not counted as revenue).
  - **GST & Taxes (Planned / Not Yet Implemented):** Statutory GST breakdown on rental services (with security deposits remaining tax-exempt) is planned for a future release; current rental tariffs are all-inclusive without an explicit tax line item in `PricingService::calculateQuote()` output.

## 3.5 Rental Add-Ons Allocation System
- **Models:** `Addon`, `BookingAddon`
- **Detailed Explanation:**
  - During checkout, customers customize their rental with optional physical equipment:
    1. **Extra Helmet:** Certified sanitized helmet for the pillion passenger (₹50/day).
    2. **Waterproof Mobile Phone Mount:** Handlebar-mounted shock-absorbing phone holder with rain hood (₹30/day).
    3. **Monsoon Rain Gear:** Heavy-duty riding raincoats and waterproof backpack covers (₹80/day).
    4. **Luggage Bungee Cords:** Set of 4 high-tensile cords for touring luggage (₹20/day).
  - Add-on fees are itemized in the price breakdown and tracked on the physical handover checklist.

## 3.6 Coupon & Promotional Code Validator
- **Controller:** `app/Http/Controllers/Web/BookingWebController.php@applyCoupon`
- **Model:** `Coupon`
- **Detailed Explanation:**
  - Validates user input coupon codes against:
    - Active status and date validity range.
    - Minimum booking cart value.
    - Maximum discount ceiling (e.g., 20% off up to a maximum of ₹500).
    - Global usage count limit and per-customer usage count limit.
  - Re-validates coupon validity on final payment submission to prevent stale checkout manipulation.

## 3.7 Dual Payment Gateway Integration (Razorpay & PhonePe)
- **Services:** `app/Services/RazorpayService.php`, `app/Services/PhonePeService.php`
- **Controllers:** `app/Http/Controllers/Web/BookingWebController.php` (Web Checkout & Simulation), `app/Http/Controllers/Api/V1/Customer/BookingController.php` (API Checkout & Verification), `app/Http/Controllers/Api/V1/Webhooks/RazorpayWebhookController.php`, `app/Http/Controllers/Api/V1/Webhooks/PhonePeWebhookController.php`
- **Detailed Explanation:**
  - **Razorpay Checkout:** Generates cryptographic Razorpay Orders; renders unified modal supporting UPI Intent, Cards, Net Banking, and Wallets. Webhook listener verifies `X-Razorpay-Signature` using HMAC-SHA256.
  - **PhonePe Direct SDK:** Initiates server-to-server UPI intent payload for mobile devices; decodes PhonePe webhook responses with base64 SHA256 checksum validation.
  - **Advance vs Full Payment:** Customers can pay 100% online or opt for a 20% advance booking hold with the remaining 80% payable at the counter.
  - **Idempotency Protection:** Every payment request includes a unique UUID idempotency key stored in the `payments` table to prevent duplicate charges on network retries.

## 3.8 Instant Boarding Pass & DomPDF Rental Agreement Generator
- **Service:** `app/Services/VoucherService.php`
- **Routes:** `/bookings/{id}/voucher`, `/bookings/{id}/print`
- **Detailed Explanation:**
  - Generates an official, vector-quality PDF Rental Agreement & Boarding Pass using DomPDF.
  - **Embedded Elements:**
    - High-density QR verification code pointing to `/admin/check-in?code=WHIZ-XXXX`.
    - Customer photo and Driving License number.
    - Assigned vehicle details (Make, Model, Registration Number, Starting Odometer).
    - Pickup and drop-off store contact details and operating hours.
    - Legal rental terms (coastal speed limit 50 km/h, helmet mandate, insurance coverage details, emergency breakdown hotline).
  - Offers instant browser viewing, PDF file download, or compact thermal receipt printing.

## 3.9 Multi-Service Tourism Marketplace
- **Routes:** `/services/{boating|scuba|homestays|cabs|tours}`
- **Controllers:** `app/Http/Controllers/Web/CustomerServiceBookingController.php`
- **Detailed Explanation:**
  - Broadens the platform into a unified coastal tourism portal:
    1. **Boating & Mangrove Cruises:** Sharavathi estuary boat tours, island ferry crossings, and sunset mangrove boat trips.
    2. **Scuba Diving & Snorkeling:** PADI certified diving trips at Netrani Island with medical declaration forms.
    3. **Coastal Homestays:** Village homestays and beach cottages with meal selection (Karavali seafood / vegetarian).
    4. **Cabs & Sightseeing:** Station pickups and coastal tour packages with verified local chauffeurs.
    5. **Guided Tours:** Local expert-led heritage walks, temple circuits, and waterfall treks.

## 3.10 Universal Service Booking Modal
- **Component:** `resources/js/Components/ServiceBookingModal.jsx`
- **Detailed Explanation:**
  - A responsive modal that dynamically renders form fields depending on the selected service type:
    - Boating: Passenger count, life jacket sizes, slot time.
    - Scuba: Swimmer status, shoe/fin sizes, emergency contact.
    - Homestay: Number of guests, check-in/out dates, extra beds.
    - Cabs: Pickup landmark, passenger count, luggage count.
  - Performs client-side instant pricing calculations and seamlessly connects to Razorpay/PhonePe checkout.

## 3.11 Customer Authentication & Social Sign-In
- **Routes:** `/login`, `/register`, `/auth/google`
- **Controllers:** `app/Http/Controllers/Api/V1/AuthController.php` (API OTP & Password Auth), `app/Http/Controllers/Web/Auth/GoogleAuthController.php` (Customer Google OAuth), `app/Http/Controllers/Web/Admin/AdminAuthController.php` (Admin Session Auth)
- **Detailed Explanation:**
  - Support for Email & Password authentication with strong password rules.
  - Mobile OTP login for fast field registration.
  - Google 1-Tap OAuth login via Laravel Socialite with automatic customer account creation.
  - Session security with CSRF protection and rate limiting (5 attempts/minute).

## 3.12 Digital KYC Document Verification Portal
- **Route:** `/account/kyc`
- **Controller:** `CustomerAccountWebController.php`
- **View:** `resources/js/Pages/Account/Kyc.jsx`
- **Detailed Explanation:**
  - Allows customers to upload government-issued photo identity documents prior to vehicle pickup:
    - Driving License (Mandatory for two-wheelers; front and rear photos).
    - Aadhaar Card / Passport (Secondary ID).
  - Documents are stored in secure, private storage disks with signed temporary URLs.
  - Tracks document verification statuses (`PENDING`, `VERIFIED`, `REJECTED`) with rejection reason notes shown to the customer.

## 3.13 Customer Bookings Dashboard & Trip Lifecycle Tracker
- **Route:** `/account/bookings`
- **View:** `resources/js/Pages/Account/Bookings.jsx`
- **Detailed Explanation:**
  - Real-time customer trip portal displaying current rental status (`Confirmed`, `Active On Road`, `Completed`, `Cancelled`).
  - Access to pickup directions, store contact phone numbers, emergency roadside assistance contact.
  - One-click PDF download and print options.
  - Customer cancellation request submission with automatic refund eligibility calculation based on cancellation policy hours.

## 3.14 Automated WhatsApp & Email Notifications
- **Channel:** `app/Channels/WhatsAppChannel.php`
- **Notifications:** `BookingConfirmedNotification`, `ServiceBookingConfirmedNotification`, `ServiceManagerBookingAlertNotification`
- **Detailed Explanation:**
  - Dispatches automated WhatsApp messages with template parameters:
    - Booking Confirmation with booking reference, bike model, and pickup location Google Maps link.
    - Pickup Reminder sent 2 hours before scheduled pickup time.
    - Return Receipt sent upon return inspection showing final odometer and settled deposit refund.
  - Parallel rich HTML emails generated via Laravel Mailables with PDF vouchers attached.
  - All delivery attempts, status codes, and timestamps are logged in the `notification_logs` table.

---

# 4. Module 2: Ground Staff & Jetty Counter Operations

## 4.1 Fast Pass Scanner & QR Code Boarding Console
- **Route:** `/admin/check-in`
- **Controller:** `app/Http/Controllers/Web/Admin/AdminCheckInWebController.php`
- **View:** `resources/js/Pages/Admin/CheckIn/Index.jsx`
- **Detailed Explanation:**
  - **Camera Scanner:** Built-in high-speed QR code scanner utilizing the device's rear environment camera.
  - **Audio Feedback System:** Synthesized Web Audio API sound feedback: positive chime for successful verification, warning sound for balance due, error buzzer for invalid codes.
  - **Multi-Factor Search:** When camera scanning is not possible (e.g., cracked phone screens or low light), staff can instantly search by:
    - 6-character booking reference (e.g., `WHIZ-4821`).
    - Full voucher URL scanned from external scanners.
    - Customer 10-digit mobile phone number.
  - **One-Click Boarding:** Displays customer party size, remaining balance due, and provides a single "Collect Cash & Board Passenger" button.

## 4.2 Offline Pass Verification Queue (PWA + IndexedDB)
- **Helper:** `resources/js/utils/offlineQueue.js`
- **Endpoint:** `POST /admin/check-in/sync`
- **Detailed Explanation:**
  - **Zero-Connectivity Resilience:** Solves the critical operational challenge of remote boat jetties and coastal backwaters with no cellular data coverage.
  - **Local IndexedDB Store:** When ground staff verifies passes while offline, the verification payload (pass ID, staff ID, balance collected, timestamp) is stored in a local browser IndexedDB database (`gkwhizwheel_offline_db`).
  - **Visual Offline Banner:** Displays amber status banner indicating offline mode and the exact number of unsynced validations currently queued.
  - **Automatic Background Sync:** As soon as the staff member's device reconnects to Wi-Fi or cellular network, a background event triggers `offlineQueue.sync()` to send all queued records in a batch to `/admin/check-in/sync`.
  - **Manual Sync & Inspector Dialog:** Staff can open the offline queue inspector modal at any time to review queued records and trigger manual synchronization.

## 4.3 Interactive Bike Handover Inspection Wizard
- **Component:** `resources/js/Components/BookingModals/HandoverWizardModal.jsx`
- **Route:** `POST /admin/bookings/{id}/handover`
- **Controller:** `AdminBookingWebController.php@handover`
- **Detailed Explanation:**
  A structured, four-step digital workflow that replaces paper agreements:
  1. **Step 1: Customer & Helmets Verification:**
     - Confirms customer identity and validates physical driving license.
     - Selects number of sanitized helmets allocated (1 Helmet for solo rider vs 2 Helmets for rider + pillion).
     - Confirms vehicle controls & coastal safety briefing (50 km/h speed limit).
  2. **Step 2: Starting Odometer & Fuel Check:**
     - Records starting odometer reading (prefilled from vehicle database).
     - Selects starting fuel level (Full 100%, 3/4, Half, 1/4, Low/Reserve).
     - Notes pre-existing scratches, scuffs, or minor mechanical notes.
  3. **Step 3: Vehicle Condition Photos:**
     - Multi-photo camera upload (up to 6 photos: Front, Rear, Left Side, Right Side, Meter Cluster, Helmets).
     - Live image preview grid with deletion controls.
  4. **Step 4: Digital Signature Canvas & Bike Release:**
     - **Interactive HTML5 Canvas:** Customer signs directly on the staff touchscreen device.
     - **Staff In-Person Bypass:** Optional checkbox for counter staff verification if a tourist is unable to sign digitally.
     - Displays live summary of deposit held and rental parameters.
     - On submission: acquires row lock, flips bike status to `ON_RENT`, saves digital signature image to disk, creates `BikeConditionLog` and `BikeConditionPhoto` records, and logs audit activity.

## 4.4 Multi-Store Bike Return & Settlement Wizard
- **Component:** `resources/js/Components/BookingModals/ReturnInspectionWizardModal.jsx`
- **Route:** `POST /admin/bookings/{id}/return`
- **Controller:** `AdminBookingWebController.php@processReturn`
- **Detailed Explanation:**
  A structured, five-step return inspection and deposit refund settlement workflow:
  1. **Step 1: Ending Odometer & Mileage Calculation:**
     - Captures ending odometer reading; validates that ending reading $\ge$ starting reading.
     - Live calculation of trip distance traveled ($\Delta \text{ km}$).
  2. **Step 2: Store Hub Relocation & Fuel Check:**
     - **Multi-Store One-Way Drop-Off:** Staff selects the return store hub (e.g., bike picked up at Honnavar Town Hub and dropped off at Mavinkurve Jetty Hub).
     - The engine automatically updates `bikes.current_store_id` to the return hub and resets vehicle status to `AVAILABLE`.
     - Checks return fuel gauge level and confirms sanitized return of all issued helmets.
  3. **Step 3: Damage Inspection & Return Photos:**
     - Enter assessed damage deduction amount (₹), with detailed description.
     - Upload photographic evidence of damage (up to 6 photos).
  4. **Step 4: Overdue & Late Fee Auto-Calculation:**
     - Compares return timestamp with scheduled rental end time.
     - Automatically calculates overdue late fee:
       $$\text{Late Fee} = \text{Overdue Days} \times \text{Bike Base Daily Rate}$$
     - Staff override field and "Waive Fee (₹0)" button for authorized delays (e.g., ferry disruptions).
  5. **Step 5: Instant Security Deposit Settlement:**
     - Live interactive settlement breakdown table:
       $$\text{Net Refundable Deposit} = \max(0, \text{Deposit Held} - \text{Damage Deductions} - \text{Late Fees})$$
     - Settlement mode selector (Original Online Payment Gateway / Cash Refund at Counter / Instant UPI Handover).
     - Automatically creates a completed `Refund` record via `RefundService`.

## 4.5 Instant Counter Cash Balance Collection
- **Controller:** `AdminBookingWebController.php`, `AdminCheckInWebController.php`
- **Detailed Explanation:**
  - For bookings with remaining balance (e.g., 20% advance paid online or 100% pay-at-counter walk-ins), counter staff can record full or partial cash/POS collections with one click.
  - Generates an immediate digital payment receipt linked to the booking, updates payment status to `SUCCESS`, and records the staff ID for cash drawer balancing.

---

# 5. Module 3: Store & Branch Manager Console

## 5.1 Store-Scoped Bookings Management & Interactive Month Calendar
- **Route:** `/admin/bookings`
- **Controller:** `AdminBookingWebController.php@index`
- **View:** `resources/js/Pages/Admin/Bookings/Index.jsx`
- **Detailed Explanation:**
  - **Scoped Access:** Store managers automatically see bookings associated with their assigned store hubs (`pickup_store_id` or `return_store_id`).
  - **Dual Mode Interface:**
    - **List View:** Searchable table with quick filters for Status, Channel (Online vs Walk-In), Date Range, and Store Hub.
    - **Month Calendar View:** Visual calendar displaying booking density, color-coded status chips, and daily booking totals.
  - **Calendar Event Popovers:** Clicking any calendar chip opens a detailed quick-view popover showing customer phone, bike registration, store route, and direct action triggers (Handover Wizard, Return Wizard, Edit, Refund).

## 5.2 Manual Booking Rescheduling & Collision Prevention
- **Route:** `/admin/bookings/{id}/edit`
- **Controller:** `AdminBookingWebController.php@update`
- **View:** `resources/js/Pages/Admin/Bookings/Edit.jsx`
- **Detailed Explanation:**
  - Allows managers to adjust booking dates, change assigned bikes, or modify pickup/return store hubs upon customer request.
  - **Collision Prevention Guard:** Validates whether the newly selected bike has any overlapping reservations during the revised date window; strictly rejects conflicts with clear error messages.
  - Recomputes base amounts and security deposits when rental duration changes (statutory tax itemization planned / not yet implemented).

## 5.3 Dispatch & Fleet Turnaround Board
- **Route:** `/admin/dispatch`
- **Controller:** `app/Http/Controllers/Web/Admin/AdminDispatchWebController.php`
- **View:** `resources/js/Pages/Admin/Dispatch/Index.jsx`
- **Detailed Explanation:**
  - Operational Kanban-style board categorizing vehicles into:
    - **Available for Dispatch:** Cleaned, fueled, inspected bikes ready for immediate handover.
    - **Active on Road:** Currently rented vehicles with expected return times.
    - **Due for Return Today:** Vehicles scheduled to return within the current operational shift.
    - **Turnaround & Cleaning:** Vehicles recently returned requiring wash, refueling, and pre-rental mechanical checks.

## 5.4 Multi-Service Operations & Passenger Manifests
- **Route:** `/admin/services/{serviceType}/bookings`
- **Controller:** `app/Http/Controllers/Web/Admin/AdminServiceWebController.php`
- **View:** `resources/js/Pages/Admin/Services/Bookings.jsx`
- **Detailed Explanation:**
  - Manages non-bike coastal tourism activities:
    - Boating manifests: View list of passengers booked for each boat departure slot.
    - Scuba diving manifests: Track swimmer status and equipment assignments.
    - Homestay reservations: Track guest check-ins, room assignments, and meal requests.
    - Cab dispatches: Assign drivers and vehicles to scheduled airport/station transfers.
  - Action buttons to mark bookings as `CONFIRMED`, `BOARDED`, `COMPLETED`, or `CANCELLED`.

## 5.5 Store Fleet Inventory & Parking Allocation
- **Controller:** `AdminBikeWebController.php`
- **Detailed Explanation:**
  - Live count of physical vehicles currently parked at the store hub.
  - Automatic relocation tracking when bikes are dropped off by customers arriving from other stores.
  - Facility for managers to flag a bike for localized maintenance (e.g., puncture repair, brake adjustment).

---

# 6. Module 4: Super Admin Operations & Platform Governance

## 6.1 Executive KPI & Revenue Analytics Dashboard
- **Route:** `/admin/dashboard`
- **Controller:** `app/Http/Controllers/Web/Admin/AdminDashboardController.php`
- **View:** `resources/js/Pages/Admin/Dashboard.jsx`
- **Detailed Explanation:**
  - Real-time aggregation of enterprise metrics:
    - Total Fleet Size, Fleet Utilization Percentage, and Fleet on Road.
    - Gross Rental Revenue, Add-on Revenue, and Net Security Deposits Held.
    - Today's Handovers, Today's Returns, and Overdue Rental Alerts.
  - Interactive Revenue Trends Chart (Daily, Weekly, Monthly).
  - Store Performance Breakdown ranking hubs by revenue and fleet turnover.
  - Quick action alerts for pending KYC reviews and expiring vehicle documents.

## 6.2 Fleet Lifecycle, Compliance & Maintenance Management
- **Route:** `/admin/bikes`
- **Controller:** `app/Http/Controllers/Web/Admin/AdminBikeWebController.php`
- **Views:** `resources/js/Pages/Admin/Bikes/{Index,Create,Edit}.jsx`
- **Detailed Explanation:**
  - **Full Asset Registry:** Manages Brand, Model, Registration Number, Chassis Number, Engine Number, Fuel Type, Transmission, and Tank Capacity.
  - **Statutory Document Tracking:**
    - Motor Insurance Policy Number and Expiry Date.
    - Pollution Under Control (PUC) Certificate Expiry Date.
    - Fitness Certificate (FC) Expiry Date.
  - **Automated Expiry Warnings:** Console highlights vehicles whose compliance certificates expire within 15 days, with automated console banners.
  - **Lifecycle States:** Admin can transition vehicles between `AVAILABLE`, `ON_RENT`, `MAINTENANCE`, `RESERVED`, and `RETIRED`.

## 6.3 Multi-Store Hub Network Setup
- **Route:** `/admin/stores`
- **Controller:** `AdminStoreWebController.php`
- **Views:** `resources/js/Pages/Admin/Stores/{Index,Create,Edit}.jsx`
- **Detailed Explanation:**
  - Setup and management of physical rental hubs:
    - Hub Name, Physical Address, City, State, Pincode, and Direct Contact Phone.
    - Latitude and Longitude coordinates with interactive map picker (`MapPicker.jsx`).
    - Operating Hours (Open Time and Close Time).
    - Status toggle (`Active`, `Inactive`, `Seasonal`).

## 6.4 Staff Accounts & RBAC Assignment
- **Route:** `/admin/staff`
- **Controller:** `AdminStaffWebController.php`
- **Views:** `resources/js/Pages/Admin/Staff/{Index,Create,Edit}.jsx`
- **Detailed Explanation:**
  - Create and manage employee user accounts.
  - Assign system roles: `super_admin`, `store_manager`, or `staff`.
  - Assign specific store scopes: multi-store assignment using the `store_user` pivot table.
  - Instant account deactivation / password reset controls.

## 6.5 Dynamic Pricing & Surge Rule Engine
- **Route:** `/admin/pricing`
- **Controller:** `AdminPricingRuleWebController.php`
- **Views:** `resources/js/Pages/Admin/Pricing/Index.jsx`
- **Detailed Explanation:**
  - Configure sophisticated automated rate rules:
    - **Rule Priority:** Stackable priority ordering.
    - **Rule Types:** Weekend Surge, Seasonal Peak, Duration Discount, Category Surge, Store Surge.
    - **Multi-Service Rules:** Rules targetable to non-bike services (e.g., 20% peak surge on Boating during festival weekends).
    - **Date Windows:** Specific calendar windows (e.g., Dec 20 to Jan 5 for New Year peak).
    - **Adjustment Format:** Percentage multiplier (e.g., +25% or -15%) or flat amount modifier.

## 6.6 Coupon & Promotional Rule Management
- **Route:** `/admin/coupons`
- **Controller:** `AdminCouponWebController.php`
- **View:** `resources/js/Pages/Admin/Coupons/Index.jsx`
- **Detailed Explanation:**
  - Create promotional promo codes for marketing campaigns.
  - Configure discount type (Percentage vs Flat INR).
  - Define minimum cart spend and maximum discount ceiling.
  - Set overall campaign usage limits and single-user usage limits.
  - Scheduled activation and expiry dates with instant deactivate switch.

## 6.7 Financial Control & Manual Refund Center
- **Route:** `/admin/bookings/{id}/refund`
- **Controller:** `AdminBookingWebController.php@{refundScreen,processRefund}`
- **View:** `resources/js/Pages/Admin/Bookings/Refund.jsx`
- **Detailed Explanation:**
  - View full transaction history for a booking (Advance Payments, Counter Collections, Security Deposits).
  - Process authorized full or partial refunds directly back to customer's payment method via payment gateway APIs.
  - Document refund categorization: Customer Cancellation, Vehicle Breakdown, Weather/Ferry Cancellation, Goodwill Adjustment.
  - Itemize cancellation deductions and record administrative audit reasons.

## 6.8 Immutable System Audit Trails & Activity Logging
- **Model:** `ActivityLog`
- **Controller:** `AdminReportWebController.php`
- **Detailed Explanation:**
  - Automatically records all sensitive mutations across the platform.
  - Stores `user_id`, `store_id`, `action`, `subject_type`, `subject_id`, `old_values` (JSON), `new_values` (JSON), and timestamp.
  - Covers price rule changes, manual booking edits, refund transactions, staff creations, handovers, and returns.

---

# 7. Module 5: Cross-Cutting Technical Infrastructure

## 7.1 Database Concurrency & Row-Level Locking Engine
- **Implementation:** `DB::transaction(fn() => ...)` with `Bike::where(...)->lockForUpdate()->firstOrFail()`
- **Detailed Explanation:**
  - Guarantees absolute transactional consistency during high-concurrency booking and inspection operations.
  - Eliminates deadlocks by ordering lock acquisitions consistently.
  - Idempotency keys prevent duplicate records on intermittent network retries.

## 7.2 Progressive Web App (PWA) Engine
- **Manifest:** `public/manifest.json`
- **Service Worker:** `public/sw.js`
- **Detailed Explanation:**
  - Provides a full app-like experience on Android, iOS, and desktop browsers without requiring app store installation.
  - Caches application shell assets (CSS, JS, fonts, icons) for instant cold loading.
  - Enables offline access to ground check-in consoles and the IndexedDB offline verification queue.

## 7.3 Automated Cron Commands & Background Tasks
- **Scheduled in:** `routes/console.php` / `app/Console/Kernel.php`
- **Detailed Explanation:**
  1. `bookings:release-expired-holds`: Runs every minute to find bookings with status `HELD` whose 10-minute hold window has elapsed, restoring the bikes to `AVAILABLE`.
  2. `bikes:check-document-expiry`: Runs daily at midnight to scan vehicle insurance, PUC, and FC expiry dates; flags expiring vehicles and generates admin console alerts.

## 7.4 Staff Mobile REST API
- **Namespace:** `App\Http\Controllers\Api\V1\Staff`
- **Authentication:** Laravel Sanctum token authentication
- **Detailed Explanation:**
  - Clean, versioned REST endpoints designed for native staff mobile applications:
    - `POST /api/v1/staff/login`: Staff authentication and store scope retrieval.
    - `POST /api/v1/staff/bookings/hold`: Create offline walk-in booking holds.
    - `POST /api/v1/staff/bookings/{id}/payment`: Collect cash / POS payments.
    - `POST /api/v1/staff/bookings/{id}/handover`: Complete vehicle handover inspection.
    - `POST /api/v1/staff/bookings/{id}/return`: Process return, relocation, and deposit settlement.
    - `GET /api/v1/staff/sync`: Fetch synchronized fleet and booking updates.

## 7.5 Automated Test Suite & Quality Verification
- **Framework:** Pest PHP & PHPUnit
- **Detailed Explanation:**
  - 61 dedicated feature and unit test suites (385 test cases) covering the entire platform.
  - 2,829 automated test assertions validating:
    - Full customer booking journey (Search ➔ Hold ➔ Pay ➔ Confirm).
    - Concurrency lock integrity and collision prevention.
    - Ground QR pass lookup, boarding, and offline queue synchronization.
    - Bike handover inspection, photo storage, and digital canvas signature recording.
    - Bike return inspection, one-way multi-store relocation, and automated deposit refund calculation.
    - RBAC enforcement across Customer, Staff, Store Manager, and Super Admin roles.

---

*GK WhizWheels System Documentation — Authored for enterprise reliability, coastal terrain resilience, and operational clarity.*
