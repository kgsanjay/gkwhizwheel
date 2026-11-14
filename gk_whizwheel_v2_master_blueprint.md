# G.K. WhizWheel v2.0 — Enterprise Architecture & Feature Specification Blueprint

**Document Version:** 2.0.0  
**Project Subfolder Path:** `/gkwhizwheel` (inside existing repository)  
**Target Stack:** PHP 8.3+ (Laravel 11 REST API) | React 18 (Vite + TypeScript + Tailwind CSS) | MySQL 8.0 | Redis  
**Payment Gateway:** PhonePe PG V2 (Exclusive Online Gateway) + Branch POS (Cash/UPI)  
**Notification Channels:** Meta WhatsApp Cloud API + Transactional Email (SMTP/SES)

---

## 1. Executive Summary & Architectural Vision

**G.K. WhizWheel v2.0** is an industry-standard, multi-branch coastal mobility, stay, and tourism booking platform engineered for Coastal Karnataka (**Honnavar** and **Murudeshwar**, scalable to future branches like Gokarna, Udupi, and Karwar).

Built inside the `/gkwhizwheel` directory of your repository, v2 distills all operational R&D from v1 into a clean, decoupled **Laravel 11 REST API (`/api/v1`)** and **React 18 Single Page Application (SPA)** while eliminating legacy technical debt (removing Razorpay, removing coupled Inertia/Blade web controllers, and excluding legacy Android WebView binaries).

### Core Architectural Pillars
1. **Two Distinct UI Experiences:**
   * **Public Customer Website Layout (`CustomerWebsiteLayout`):** High-converting travel & rental storefront where customers browse by branch, view live unit availability, log in, pay via PhonePe, and manage bookings/KYC.
   * **Unified Admin Panel Layout (`AdminPanelLayout`):** A single cohesive back-office layout shared by **`SuperAdmin`**, **`Admin`**, and **`Manager`**, where sidebar navigation, actions, and branch data dynamically adapt to the user's role and assigned branch.
2. **Dynamic Branch-Service Matrix:** SuperAdmin creates branches and toggles which services belong to each branch:
   * **Honnavar Branch (`HNV`):** Bike Rental, Cab, Homestay, Backwater Boating, Guide.
   * **Murudeshwar Branch (`MRD`):** Bike Rental, Cab, Rooms, Scuba Diving, Guide.
3. **Unit-First Bike Rental & Cascading Pricing Engine:** Every physical bike is displayed with its **Registration Number (`KA-47-...`)** and has its own unique base price (`weekday_rate`, `weekend_rate`), paired with a **Bulk Price Update Engine** and **Weekend / Long-Weekend Surge Rules**.
4. **Atomic Inventory Locking & PhonePe Exclusive Checkout:** 10-minute reservation holds (`held_until`), immutable GST quote snapshots, and cryptographic PhonePe V2 webhook verification.
5. **Dual-Recipient Automated Notification Pipeline:** Instant WhatsApp and Email confirmations (with PDF QR Vouchers) sent simultaneously to the **Customer** AND the **SuperAdmin / Assigned Branch Admin & Manager**.

---

## 2. Role-Based Access Control (RBAC) & Branch Scoping

Powered by `spatie/laravel-permission` and enforced via `EnsureBranchAccess` middleware and the `BelongsToBranch` Eloquent global scope.

### 2.1 Role Hierarchy & Capabilities

| Feature / Capability | SuperAdmin | Branch Admin | Branch Manager | Customer |
| :--- | :---: | :---: | :---: | :---: |
| **UI Layout Used** | Admin Panel Layout | Admin Panel Layout | Admin Panel Layout | Customer Website |
| **Branch Management** (Create/Edit Honnavar, Murudeshwar) | Full Access | Read Assigned | Read Assigned | Public Switcher |
| **Branch-Service Matrix** (Enable/Disable Services per Branch) | Full Access | No | No | View Active |
| **Role-Based User Creation & Branch Assignment** | Full Access | View Branch Staff | No | No |
| **Fleet & Inventory CRUD** (Bikes, Cabs, Rooms, Boats, Scuba, Guides) | All Branches | Assigned Branch | Status Toggle | View Available |
| **Pricing Engine** (Per-Bike Price, Bulk Update, Long-Weekend Hike) | All Branches | Assigned Branch | No | View Live Quote |
| **Online Booking & PhonePe Checkout** | — | — | Send Pay Link | Full Access |
| **Walk-In POS Booking & Cash/UPI Receipt** | All Branches | Assigned Branch | Assigned Branch | No |
| **Daily Operations** (KYC Verify, Bike Handover/Return, Cab Dispatch) | All Branches | Assigned Branch | Assigned Branch | Track Status |
| **Compliance & Relocations** (Bike RC/PUC/Ins Gate, Branch Transfers) | All Branches | Assigned Branch | Assigned Branch | No |
| **Refunds, Overrides & Dispute Resolution** | All Branches | Assigned Branch | Request Only | Raise Request |
| **Receive New Booking WhatsApp & Email Alerts** | All Branches | Assigned Branch | Assigned Branch | Own Booking |

### 2.2 Multi-Branch Staff Assignment Flow
* **SuperAdmin** logs into `/admin/users`, creates a staff user, assigns a role (`admin` or `manager`), and binds them to a specific branch (`Honnavar` or `Murudeshwar`) via `branch_user`.
* When an **Admin** or **Manager** logs into `/admin`, the top header locks to their assigned branch, and every database query (`bikes`, `bookings`, `service_items`, `cab_dispatches`, `pricing_rules`) is automatically filtered to their `branch_id`.

---

## 3. Branch-Service Matrix & Service Booking Workflows

### 3.1 Branch Configuration
* **Honnavar (`HNV`):**
  1. `bike_rental` — Individual two-wheelers with Registration Number display, pickup/drop points, and dynamic pricing.
  2. `cab` — Point-to-point transfers, sightseeing packages, and outstation trips with driver dispatch.
  3. `homestay` — Nightly cottage/homestay stays with check-in/out dates and guest capacity.
  4. `backwater_boating` — Sharavathi backwater slot-based private & sharing boat bookings.
  5. `guide` — Certified local heritage & eco-tour guides booked by half-day/full-day slots.
* **Murudeshwar (`MRD`):**
  1. `bike_rental` — Individual two-wheelers with Registration Number display, temple/railway station pickup points, and dynamic pricing.
  2. `cab` — Temple/beach sightseeing, railway station transfers, and outstation drops.
  3. `rooms` — Standard, AC Deluxe, and Sea-View rooms booked nightly.
  4. `scuba` — Netrani Island scuba diving batch slots with diver count & medical declaration.
  5. `guide` — Temple & coastal tour guides booked by half-day/full-day slots.

---

## 4. Bike Rental & Three-Layer Dynamic Pricing Specification

### 4.1 Unit-Level Bike Display (`bikes` table)
* Each physical bike belongs to a `branch_id` (`Honnavar` or `Murudeshwar`), `bike_category_id` (`Scooter`, `Cruiser`, `Commuter`, `Adventure`), and `bike_model_id` (`Activa 6G`, `Access 125`, `Classic 350`, `Hunter 350`, `Himalayan`).
* **Customer Card Display:** Shows Bike Photo, Model Name, Manufacture Year, **Registration Number Badge (e.g., `KA-47-EA-1234`)**, Odometer, Included Free KMs, Refundable Security Deposit, and **Exact Calculated Rental Total** for the customer's selected pickup and return dates.
* **Unique Per-Bike Pricing:** Every bike record stores its own `weekday_rate` (Mon–Thu), `weekend_rate` (Fri–Sun), and `hourly_rate` so a brand-new 2026 bike can be priced higher than a 2023 bike of the same model.

### 4.2 Bulk Price Management Tool (`/admin/pricing/bulk`)
Available to `SuperAdmin` (all branches) and `Admin` (assigned branch):
1. **Filter & Select:** Filter bikes by Branch, Category, Model, or select specific registration numbers via checkboxes.
2. **Bulk Operations:**
   * **Set Exact Rate:** Set `weekday_rate = ₹450` and `weekend_rate = ₹550` on all selected bikes.
   * **Flat Amount Hike/Drop:** Add or subtract a fixed amount (e.g., `+₹100` on weekend rate).
   * **Percentage Hike/Drop:** Increase or decrease rates by a percentage (e.g., `+15%`).
3. **Inline Spreadsheet Editor:** Edit individual bike weekday/weekend rates directly in a table and save all rows in one atomic transaction with full `activity_logs` audit history.

### 4.3 Weekend & Long-Weekend Surge Rules (`pricing_rules` table)
* Admins can create calendar-bound surge rules (e.g., *"Dussehra Long Weekend"*, *"Christmas & New Year Peak Surge"*, *"Independence Day 4-Day Weekend"*).
* **Rule Parameters:**
  * `branch_id` (Specific branch or Global), `service_type_id` (Bike Rental, Rooms, Homestay, Scuba, etc.)
  * `target_scope` (`all_units`, `category`, `model`, `specific_bike`)
  * `start_date` & `end_date`
  * `adjustment_mode`: `flat_override` (e.g., flat `₹750/day`), `fixed_hike` (e.g., `+₹200/day`), or `percentage_hike` (e.g., `+25%`)
  * `min_rental_days`: Enforces minimum booking duration during long weekends (e.g., minimum 2 or 3 days).
* **Cascading Day-by-Day Calculation:** When a customer searches a multi-day range (e.g., Thursday to Monday), the engine evaluates each 24-hour bucket:
  $$\text{Day Rate}(d) = \begin{cases} \text{Apply Active Long-Weekend/Peak Rule} & \text{if } d \in [\text{start\_date}, \text{end\_date}] \\ \text{Bike } \texttt{weekend\_rate} & \text{if } d \in \{\text{Fri, Sat, Sun}\} \\ \text{Bike } \texttt{weekday\_rate} & \text{if } d \in \{\text{Mon, Tue, Wed, Thu}\} \end{cases}$$

### 4.4 Handover Compliance Gate & Directional One-Way Rentals
* **Compliance Gate (`BikeComplianceGate`):** Blocks bike handover if Customer KYC (`DL` + `Aadhaar`) is unverified OR if the bike's `insurance_expiry_date`, `puc_expiry_date`, or `rc_expiry_date` is expired.
* **Condition Photos:** Captures 4-side pre-handover and post-return photos, fuel level, and odometer readings (`bike_condition_logs`).
* **Directional Pickup/Drop Points:** Supports branch pickup points (e.g., *Murudeshwar Railway Station*, *Temple Stand*, *Honnavar Bus Stand*) and inter-branch one-way drop fees with automated `bike_relocation_tasks`.

---

## 5. Exclusive PhonePe Payment Gateway Integration

Razorpay is completely removed. All online payments process through **PhonePe PG V2 Standard Checkout**:
1. **Quote Lock & Hold:** Clicking "Proceed to Pay" creates a booking with `status = 'payment_held'` and `held_until = NOW() + 10 MINUTES`, locking the specific bike (`KA-47-...`), room unit, or activity slot capacity.
2. **Payload & X-VERIFY Checksum:**
   * Generates unique `merchantTransactionId` (e.g., `TXN-GKW-20261114-8891`).
   * Base64 encodes JSON payload (`/pg/v1/pay`) and signs header:
     $$\texttt{X-VERIFY} = \text{SHA256}(\texttt{base64Payload} + \texttt{"/pg/v1/pay"} + \texttt{saltKey}) + \texttt{"\#\#\#"} + \texttt{saltIndex}$$
3. **S2S Webhook & Fallback Polling:**
   * `POST /api/v1/webhooks/phonepe` verifies the cryptographic `X-VERIFY` header, locks the booking row (`SELECT ... FOR UPDATE`), updates `payments.status = 'SUCCESS'`, transitions `bookings.status = 'confirmed'`, and generates the immutable GST receipt & QR voucher.
   * Scheduled command `bookings:release-expired-holds` runs every minute to release any `payment_held` booking past `held_until`.

---

## 6. Automated Dual-Recipient Notification Pipeline (WhatsApp + Email)

Every confirmed booking triggers `DispatchBookingNotificationsJob` on the Redis queue:

1. **To Customer (WhatsApp + Email):**
   * **WhatsApp (`whizwheel_customer_booking_confirmed`):** Sends Booking ID, Branch (`Honnavar` / `Murudeshwar`), Service & Unit details (e.g., Bike `KA-47-EA-1234`), Pickup/Check-in Date & Time, Total Paid (`PhonePe`), Branch Google Maps URL, and downloadable PDF QR Voucher.
   * **Email:** Branded HTML confirmation with GST invoice attachment and digital KYC upload link.
2. **To Admin & Assigned Branch Manager (WhatsApp + Email):**
   * **WhatsApp (`whizwheel_admin_new_booking_alert`):** Dispatched immediately to **SuperAdmin WhatsApp** AND the **Branch's configured WhatsApp number (`branches.whatsapp_number`)**:
     > *"New Booking Alert! ID: #GKW-MRD-1042 | Branch: Murudeshwar | Service: Bike Rental (Activa 6G - KA-47-EA-1234) | Customer: Karthik Nayak (+91-98XXXXXXXX) | Dates: 15 Nov 09:00 AM - 17 Nov 09:00 AM | Paid: ₹1,180 via PhonePe."*
   * **Email:** Dispatched to SuperAdmin email and `branches.notification_email` with a direct action link to `/admin/bookings/{id}`.
3. **Notification Audit Trail:** Every message is recorded in `notification_logs` with delivery status and one-click retry in the Admin Panel.

---

## 7. Security & Production Hardening Standards

* **Authentication:** Laravel Sanctum (`HttpOnly` cookies for SPA + scoped API tokens), Mobile OTP rate limiting (`3/min`), and mandatory TOTP 2FA for `SuperAdmin` and `Admin` roles.
* **Private Document Vault:** Customer Driving License/Aadhaar (`kyc_documents`) and Bike RC/Insurance (`bike_documents`) stored on a private disk and served strictly via short-lived signed URLs (`URL::temporarySignedRoute`).
* **Log Sanitization:** `MaskSensitiveDataProcessor` masks Aadhaar numbers, DL numbers, phone numbers, and payment tokens before writing to logs.
* **Immutable Audit Trail:** All pricing changes, bulk updates, role assignments, and booking overrides are logged in `activity_logs` with actor ID, branch ID, IP address, and JSON diff.

---

## 8. Project Folder Structure Inside Current Repo (`/gkwhizwheel`)

```text
gkwhizwheel/                                # New Clean v2 Root Folder inside Repo
├── backend/                                # Laravel 11 REST API
│   ├── app/
│   │   ├── Console/Commands/               # ReleaseExpiredHolds, CheckBikeCompliance
│   │   ├── Domains/
│   │   │   ├── Auth/                       # RBAC, BranchScope Middleware, 2FA
│   │   │   ├── Branches/                   # Branch, ServiceType, BranchService, PickupPoint
│   │   │   ├── Fleet/                      # Bike, BikeModel, BulkPricingService, BikePricingCalculator
│   │   │   ├── Services/                   # Cab, Homestay, Rooms, Boating, Scuba, Guide Engines
│   │   │   ├── Bookings/                   # Unified BookingService, HoldLock, VoucherGenerator
│   │   │   ├── Payments/                   # PhonePeService, PhonePeWebhookController
│   │   │   └── Notifications/              # WhatsAppService, BookingMailables, NotificationRouter
│   │   └── Http/Controllers/Api/V1/
│   │       ├── Public/                     # Branch catalog, live availability, quote calculator
│   │       ├── Customer/                   # Checkout, PhonePe init, My Bookings, KYC upload
│   │       └── Admin/                      # Unified controller namespace for SuperAdmin, Admin, Manager
│   ├── database/
│   │   ├── migrations/                     # Clean consolidated v2 migrations
│   │   └── seeders/                        # Roles, Honnavar & Murudeshwar branches, fleet seeders
│   └── routes/api.php                      # Versioned /api/v1 routes
└── frontend/                               # React 18 + Vite + TypeScript + Tailwind CSS
    ├── src/
    │   ├── styles/theme.css                # Strict CSS Variables (--theme, --theme2, --header, etc.)
    │   ├── layouts/
    │   │   ├── CustomerWebsiteLayout.tsx   # Public Website & Customer Portal layout
    │   │   └── AdminPanelLayout.tsx        # Shared layout for SuperAdmin, Admin, and Manager
    │   ├── pages/
    │   │   ├── customer/                   # Home, Branch Services, Bike Grid, Checkout, MyBookings
    │   │   └── admin/                      # Dashboard, Branches, Staff RBAC, Bikes, BulkPricing, Bookings
    │   └── App.tsx
```