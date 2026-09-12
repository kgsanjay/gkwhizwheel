# GK WhizWheel

A unified online and offline bike & multi-service mobility platform designed for coastal multi-store operations with dynamic tiered pricing. The platform seamlessly bridges customer web bookings with on-ground store operations, featuring concurrency-safe reservation holds, one-way rentals, offline-resilient staff handovers, ground pass QR scanning, and a compiled native Android APK.

---

## Key Highlights

- **Multi-Service Mobility**: Bike rentals, coastal car rentals, pre-owned vehicle sales marketplace, and motorcycle workshop repair/servicing scheduling.
- **Ground Pass QR Fast Check-In (`/admin/check-in`)**: High-speed camera scanner that resolves customer QR passes, verifies deposits, and initiates instant handovers.
- **Digital Handover & Return Inspection Wizards**: Interactive motorcycle damage diagram mapping, odometer & fuel tracking, photo capture, and customer digital signatures.
- **Native Android APK (`gkwhizwheels.apk`)**: Standalone Android application with hardware camera permissions, GPS store locator, offline PWA cache, and configurable server switcher.
- **Concurrency-Safe Availability Engine**: Pessimistic database locks (`SELECT ... FOR UPDATE`) preventing double-booking during peak checkout.
- **Production-Ready & Fully Tested**: 61 automated test suites (385 test cases) with 2,829 passing assertions across RBAC, payments, notifications, and offline sync.

---

## Tech Stack

- **Backend:** Laravel 11, PHP 8.3, MySQL 8.0 / MariaDB
- **Web Frontend:** React 18, Inertia.js, Material UI (MUI) & Tailwind CSS
- **Mobile Android App:** Native Android (Gradle 8.7, Android SDK 34, Java 21) & React Native PWA wrapper
- **Payment Gateway:** Razorpay with cryptographic webhook verification & idempotency
- **Communication:** Multi-channel notification pipeline (WhatsApp Cloud API & SMTP Email fallback)
- **Offline Sync:** IndexedDB local queue with automatic reconciliation upon network reconnect

---

## Getting Started

### Prerequisites
- PHP 8.3+ with `pdo_mysql`, `mbstring`, `openssl`, `curl` extensions
- Composer 2.x
- Node.js 18+ and npm
- MySQL 8.0+
- (Optional for Android builds) Java 21 & Android SDK 34

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kgsanjay/gkwhizwheel.git
   cd gkwhizwheel
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Install JavaScript dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Update your database credentials (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) and Razorpay keys in `.env`.*

5. **Generate application key:**
   ```bash
   php artisan key:generate
   ```

6. **Run database migrations and seeders:**
   ```bash
   php artisan migrate --seed
   ```

7. **Create the storage symlink:**
   ```bash
   php artisan storage:link
   ```

8. **Start local development servers:**
   - Run Laravel backend:
     ```bash
     php artisan serve --port=8000
     ```
   - In a separate terminal, run Vite dev server:
     ```bash
     npm run dev
     ```

9. **Run automated tests:**
   ```bash
   php artisan test
   ```

---

## Staff Mobile Application (Expo / React Native)

The repository includes a dedicated native app for Staff operations in `/mobile-ops`.

- **Source Code**: [`mobile-ops/`](mobile-ops/)

### Building and Distributing:
The app uses Expo Application Services (EAS) for internal distribution.

```bash
cd mobile-ops
eas build --profile preview --platform android
```

This will generate an APK URL that can be shared with staff for direct installation. See the [Mobile Ops README](mobile-ops/README.md) for full setup instructions.

---

## Role-Based Access Control (RBAC)

The application provides strictly scoped access control for four user roles:

| Role | Core Interfaces | Responsibilities |
|---|---|---|
| **Super Admin** | `/admin/dashboard`, `/admin/pricing`, `/admin/coupons`, `/admin/reports`, `/admin/staff` | Full platform control, cross-store analytics, dynamic surge pricing rules, coupon creation, staff accounts. |
| **Store Manager** | `/admin/bookings`, `/admin/bikes`, `/admin/services` | Local store operations, counter offline bookings, maintenance tracking, fleet availability. |
| **Staff / Ground Crew** | `/admin/check-in`, `/admin/dispatch`, Handover & Return Modals | Ground Pass QR scanning, vehicle condition photo logging, customer signature capture, return settlement. |
| **Customer** | `/`, `/bikes`, `/services`, `/account/bookings`, `/account/kyc` | Fleet browsing, date-hour quote calculations, Razorpay payment, KYC upload, PDF booking vouchers. |

---

## Project Structure

```
.
├── archive/android-webview-legacy/ # Legacy Android WebView app (deprecated)
├── mobile-ops/           # Native Expo/React Native app for staff operations
├── app/                  # Laravel core: Models, Controllers, Services, Enums, Policies
│   ├── Http/Controllers/ # Web, Admin, and API controllers
│   ├── Models/           # Eloquent models (Bike, Booking, ServiceBooking, Store, User)
│   ├── Notifications/    # WhatsApp & Email notification classes
│   └── Services/         # Business logic: PricingService, AvailabilityService, QrCodeService
├── database/             # Migrations, model factories, and database seeders
├── docs/                 # Architecture specifications, API catalogs, and operational guides
├── public/               # Static assets, PWA manifest, service worker (sw.js)
├── resources/            # React 18 + Inertia.js frontend components, pages, and layouts
│   └── js/
│       ├── Components/   # Reusable UI, Handover & Return Inspection Modals, Booking Modals
│       ├── Layouts/      # AppLayout (Customer) & AdminLayout (Staff/Admin)
│       └── Pages/        # Customer pages, Admin dashboard, Check-in, Dispatch, Services
├── routes/               # Route definitions: web.php, api.php, console.php
├── tests/                # 61 Pest feature and unit test suites (385 test cases, 2,829 assertions)
├── DETAILED_FEATURE_SPECIFICATION.md # Deep-dive architectural and state machine spec
├── FULL_FEATURE_LIST.md  # Comprehensive module matrix and persona breakdown
├── gkwhizwheels.apk      # Compiled Android debug APK
└── .env.example          # Baseline environment configuration template
```

---

## Documentation

- **[`FULL_FEATURE_LIST.md`](FULL_FEATURE_LIST.md)**: High-level complete feature catalog across Customer, Staff, Store Manager, and Super Admin personas.
- **[`DETAILED_FEATURE_SPECIFICATION.md`](DETAILED_FEATURE_SPECIFICATION.md)**: Comprehensive 558-line architectural specification detailing state machines, business formulas, database schemas, and APIs.
- **[`docs/API.md`](docs/API.md)**: Actual implemented REST API endpoints, response envelopes, and webhook contracts.
- **[`docs/ENV-VARIABLES.md`](docs/ENV-VARIABLES.md)**: Environment variable catalog and requirement classifications.
- **[`docs/01-REQUIREMENTS-AND-FEATURES.md`](docs/01-REQUIREMENTS-AND-FEATURES.md)**: Business requirements, booking state machine, and pricing algorithms.
- **[`docs/02-DATABASE-SCHEMA.md`](docs/02-DATABASE-SCHEMA.md)**: Schema definitions, table relationships, enums, and composite indexes.
- **[`docs/04-CODING-STANDARDS-AND-STRUCTURE.md`](docs/04-CODING-STANDARDS-AND-STRUCTURE.md)**: Code standards, service boundaries, authorization house standards (`role:...` middleware & policies), and review checklists.
- **[`docs/05-ENVIRONMENT-SETUP.md`](docs/05-ENVIRONMENT-SETUP.md)**: Server setup guide, cron scheduling, and backup procedures.

---

## License

Copyright © 2026 GK WhizWheel. All rights reserved.  
This software and documentation are proprietary and confidential. Unauthorized copying, distribution, or transfer is strictly prohibited. See [`LICENSE`](LICENSE) for details.
