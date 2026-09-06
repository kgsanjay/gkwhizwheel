# Prompt Playbook — Full Build, Start to End

How to use this: go **in order**. Each prompt assumes everything before it is already built. Attach the referenced doc file(s) to the coding tool's context for that prompt (upload or paste them in) — don't rely on it remembering earlier sessions. After each prompt's output, review before moving to the next one; don't batch multiple prompts into one message even though it's tempting.

Reference docs to have available throughout: `01-REQUIREMENTS-AND-FEATURES.md`, `02-DATABASE-SCHEMA.md`, `03-API-SPECIFICATION.md`, `04-CODING-STANDARDS-AND-STRUCTURE.md`, `05-ENVIRONMENT-SETUP.md`.

---

## PHASE 0 — Project Setup

### 0.1 — Initialize the Laravel project
```
Set up a new Laravel 11 project for a bike rental platform. Configure it for
PHP 8.3, strict types, and PSR-12. Set up the folder structure exactly as
described in the attached 04-CODING-STANDARDS-AND-STRUCTURE.md (Section 2) —
create the empty Services/, Enums/, Policies/ directories with .gitkeep files
so the structure exists from commit one. Configure config/database.php,
config/cache.php, config/queue.php, config/session.php to match the shared-
hosting-appropriate drivers in the attached 05-ENVIRONMENT-SETUP.md
(.env.example section) — file driver for cache, database driver for
sessions, sync for queue. Generate the .env.example file with every variable
listed in that doc. Set up Laravel Sanctum for API authentication.
```

### 0.2 — Install and configure core packages
```
Install and configure: laravel/sanctum, spatie/laravel-backup (for the
free backup strategy described in 05-ENVIRONMENT-SETUP.md Section 4),
spatie/laravel-permission (for role-based access control matching the
role enum in 02-DATABASE-SCHEMA.md users table), and a PHP enum-friendly
package if needed for native enum casting in Eloquent. Set up Pest for
testing per 04-CODING-STANDARDS-AND-STRUCTURE.md Section 6.
```

---

## PHASE 1 — Database Layer

### 1.1 — Core migrations (no dependencies)
```
Using the attached 02-DATABASE-SCHEMA.md as the exact spec, create Laravel
migrations for these tables in this order, matching every field name, type,
and constraint precisely — do not rename or add fields not listed:
users, stores, bike_categories.
Follow the migration-order notes at the bottom of that doc. Use enums where
specified. Add the indexes listed under each table.
```

### 1.2 — Bike-related migrations
```
Continuing from the same schema doc, create migrations for: staff_store,
bikes, bike_images, bike_documents, pricing_rules, coupons, coupon_usages.
These depend on the tables from the previous prompt — make sure foreign
keys reference them correctly.
```

### 1.3 — Booking-related migrations
```
Create migrations for: bookings, booking_addons, payments, refunds,
kyc_documents, bike_condition_logs, bike_condition_photos, reviews.
Match 02-DATABASE-SCHEMA.md exactly, including the composite indexes on
the bookings table used for availability checks.
```

### 1.4 — Supporting/logging migrations
```
Create migrations for: activity_logs, notification_logs, sync_queue.
These are the last group per the schema doc's migration-order notes.
```

### 1.5 — Eloquent models + relationships
```
Create Eloquent models for every table created so far. Wire up the
relationships exactly as described in the "Relationship Summary" section
of 02-DATABASE-SCHEMA.md. Add PHP enum casts for every enum column (status,
role, channel, document_type, etc. — define these as native PHP 8.1 enums
in app/Enums/ per 04-CODING-STANDARDS-AND-STRUCTURE.md, not as plain
strings). Add $fillable/$guarded appropriately, and soft-delete traits
where the schema specifies deleted_at.
```

### 1.6 — Seeders for local development
```
Create database seeders with realistic sample data: 2 stores, 3 bike
categories, 10 bikes distributed across the stores with sample RC/
Insurance/Emission document placeholder records, 2 admin users, 3 staff
users assigned across stores via staff_store, and a handful of sample
pricing_rules (one weekend rule, one holiday rule) so the pricing engine
has something to test against once built.
```

---

## PHASE 2 — Core Business Logic (Services)

### 2.1 — Pricing Service
```
Build app/Services/PricingService.php implementing the dynamic pricing
logic described in 01-REQUIREMENTS-AND-FEATURES.md Section 8 (and 8.1 for
deposit handling). Given a bike_id, start_date, end_date, pickup_store_id,
return_store_id, and optional coupon_code, it must return a full itemized
price breakdown (base amount, per-rule adjustments, one-way fee if
applicable, deposit, coupon discount, total) matching the price_breakdown_json
shape implied by the bookings table in 02-DATABASE-SCHEMA.md. Apply pricing_rules
in priority order as described in the schema. Write Pest unit tests covering:
plain weekday booking, weekend rule applied, holiday rule overriding weekend,
one-way fee applied when pickup/return stores differ, and coupon discount
applied correctly.
```

### 2.2 — Availability Service (the concurrency-critical piece)
```
Build app/Services/AvailabilityService.php implementing the concurrency-safe
booking-hold logic from 01-REQUIREMENTS-AND-FEATURES.md Section 4.3. It must:
check for overlapping bookings in status held/confirmed/handed_over, use a DB
transaction with SELECT ... FOR UPDATE row-level locking on the bike record,
and create a 'held' booking with a held_until timestamp (10 minutes out).
Write a Pest test that simulates two concurrent requests attempting to book
the same bike for overlapping dates and asserts exactly one succeeds — this
is the most important test in the whole project, per
04-CODING-STANDARDS-AND-STRUCTURE.md Section 6.
```

### 2.3 — Booking state machine service
```
Build app/Services/BookingService.php that manages the booking status
transitions described in 01-REQUIREMENTS-AND-FEATURES.md Section 4.2:
held → pending_payment → confirmed → handed_over → returned → completed,
plus cancelled/expired/no_show branches. Each transition should be a
named method (e.g., confirmPayment(), markHandedOver(), markReturned())
that validates the current state allows that transition before proceeding,
and throws a clear exception otherwise.
```

### 2.4 — Scheduled cleanup command
```
Build an Artisan command (app/Console/Commands/) that releases any 'held'
booking past its held_until timestamp back to an implicit available state
(i.e., updates its status to 'expired'). Register it in the scheduler to
run every minute, matching the cron setup described in
05-ENVIRONMENT-SETUP.md Section 3, step 7.
```

### 2.5 — Refund Service
```
Build app/Services/RefundService.php that calculates refund amounts based
on cancellation timing (>24h = full refund, <24h = partial — make the
threshold and percentage configurable, not hardcoded) and creates the
corresponding refunds record. It should not call the payment gateway
directly — that's a separate integration in Phase 6 — for now, stub the
actual gateway call and just get the calculation and DB record right.
```

---

## PHASE 3 — Public & Customer APIs

### 3.1 — Auth endpoints
```
Implement the Auth endpoints listed in 03-API-SPECIFICATION.md (register,
login, OTP request/verify, logout, me). Use email OTP only, not phone/SMS,
per the earlier decision to avoid SMS costs. Use Form Requests for
validation and return responses in the standard envelope shape shown at
the top of that doc.
```

### 3.2 — Public bike browsing endpoints
```
Implement the public Bikes endpoints from 03-API-SPECIFICATION.md: list
with filters, detail view, availability calendar, and price-quote (which
should call the PricingService built in Phase 2). Use API Resources for
response shaping per 04-CODING-STANDARDS-AND-STRUCTURE.md.
```

### 3.3 — Customer booking endpoints
```
Implement the customer-facing booking endpoints from
03-API-SPECIFICATION.md: hold, confirm-payment (stub gateway verification
for now, real integration comes in Phase 6), list, detail, cancel, extend.
The hold endpoint must require and respect the Idempotency-Key header as
described in that doc's "Critical Rules for Implementation" section — if
the same key arrives twice, return the original booking instead of
creating a duplicate.
```

### 3.4 — Bike documents endpoint (customer-facing)
```
Implement GET /bookings/{id}/documents from 03-API-SPECIFICATION.md. It
must verify the requesting user actually owns an active/upcoming booking
for that specific bike, then return short-lived signed URLs (not
permanent public paths) for the bike's RC, Insurance, and Emission
Certificate documents. Write a test confirming a user who does NOT own
the booking gets a 403, not the documents.
```

---

## PHASE 4 — Admin Panel Backend

### 4.1 — Admin bike inventory endpoints
```
Implement the /admin/bikes endpoints from 03-API-SPECIFICATION.md: create
(with image + document upload), update, delete, document upload, bulk CSV
import. Restrict to admin role via a Policy per
04-CODING-STANDARDS-AND-STRUCTURE.md Section 7 checklist.
```

### 4.2 — Admin pricing & coupons endpoints
```
Implement /admin/pricing-rules and /admin/coupons endpoints (CRUD) from
03-API-SPECIFICATION.md.
```

### 4.3 — Admin stores & staff management endpoints
```
Implement /admin/stores (create/update, including lat/long fields) and
/admin/staff (create staff/manager, assign/unassign to stores via the
staff_store pivot) endpoints from 03-API-SPECIFICATION.md. Restrict store
creation specifically to the super_admin role, per
01-REQUIREMENTS-AND-FEATURES.md Section 6.
```

### 4.4 — Admin booking oversight, refunds, reports endpoints
```
Implement /admin/bookings (list/filter/update), /admin/bookings/{id}/refund
(wiring to the RefundService from Phase 2), /admin/reports/revenue,
/admin/reports/utilization, and /admin/activity-logs endpoints from
03-API-SPECIFICATION.md.
```

---

## PHASE 5 — Offline/Staff APIs

### 5.1 — Customer lookup & walk-in creation
```
Implement /staff/customers/lookup (phone search) and POST /staff/customers
(create new customer + KYC docs in one call) from 03-API-SPECIFICATION.md,
matching the walk-in flow described in 01-REQUIREMENTS-AND-FEATURES.md
Section 7's "Walk-in Booking Flow."
```

### 5.2 — Staff booking, payment, handover endpoints
```
Implement POST /staff/bookings (offline channel, using the same
AvailabilityService and Idempotency-Key requirement as the customer flow),
/staff/bookings/{id}/collect-payment, and /staff/bookings/{id}/handover
(odometer + condition photos + signature) from 03-API-SPECIFICATION.md.
```

### 5.3 — Staff return flow
```
Implement GET /staff/bookings/active and POST /staff/bookings/{id}/return
from 03-API-SPECIFICATION.md. The return endpoint must update
bikes.current_store_id to the returning store (supporting one-way rentals
per 01-REQUIREMENTS-AND-FEATURES.md Section 12.1), calculate late fees,
and record the condition log/photos.
```

### 5.4 — Store-level bike management + offline sync endpoint
```
Implement GET /staff/bikes, POST /staff/bikes/{id}/maintenance, and
POST /staff/sync (batch processing of queued offline actions with
per-item success/failure response) from 03-API-SPECIFICATION.md.
```

---

## PHASE 6 — Payments & Notifications

### 6.1 — Razorpay integration
```
Integrate Razorpay: create the checkout/order creation flow for the
customer advance+deposit payment (Option A from
01-REQUIREMENTS-AND-FEATURES.md Section 8.1 — combined charge, not
pre-auth), and implement the /webhooks/razorpay endpoint with signature
verification that actually flips a booking from pending_payment to
confirmed. Never trust a client-side "payment succeeded" callback alone —
enforce that the webhook is the only thing that confirms a booking.
```

### 6.2 — PhonePe integration
```
Integrate PhonePe following the same pattern as the Razorpay integration
in the previous prompt — order creation, webhook verification, booking
confirmation.
```

### 6.3 — Email notifications
```
Build Laravel Notification classes for: booking confirmation, payment
receipt, pickup reminder, return reminder, late-fee alert, refund status —
using the email channel via the SMTP config in 05-ENVIRONMENT-SETUP.md.
Log every send attempt to the notification_logs table per
02-DATABASE-SCHEMA.md.
```

### 6.4 — WhatsApp notifications
```
Build a custom Laravel Notification channel for WhatsApp using Meta's
Cloud API directly (not a reseller), per
01-REQUIREMENTS-AND-FEATURES.md Section 8.2. Reuse the same notification
classes from the previous prompt but add the WhatsApp channel alongside
email, with automatic fallback to email-only if the WhatsApp send fails
(check notification_logs to detect this). Include the bike documents
deep-link in the pickup reminder template as described in
01-REQUIREMENTS-AND-FEATURES.md Section 5. Implement the
/webhooks/whatsapp endpoint for delivery status updates.
```

### 6.5 — Document expiry alerts
```
Build a scheduled Artisan command that checks bike_documents for
insurance/emission certificates nearing or past expiry, flags the bike
appropriately (per the configurable grace-period/hard-block behavior in
01-REQUIREMENTS-AND-FEATURES.md Section 6), and notifies admin via email
+ WhatsApp.
```

---

## PHASE 7 — Website Frontend (Material UI)

### 7.1 — Project setup
```
Set up the frontend using React + Material UI (MUI) with Inertia.js
connected to the Laravel backend (or as a separate SPA consuming the API
if you prefer full separation — confirm which approach before starting).
Set up the API client module (Axios + interceptor for auth token) and
React Query as described in 04-CODING-STANDARDS-AND-STRUCTURE.md Section 3.
Apply MUI theming (colors, typography) — ask for brand colors if not yet
decided, otherwise use a sensible default MUI theme.
```

### 7.2 — Bike browsing & detail pages
```
Build the bike listing page (filters: category, store, price, date range)
and bike detail page, consuming the /bikes endpoints from Phase 3. Show
the live price-quote breakdown when a customer selects dates.
```

### 7.3 — Booking & checkout flow
```
Build the booking flow: date selection → price preview → add-ons →
account login/signup if needed → Razorpay/PhonePe checkout →
confirmation page. Wire this to the hold/confirm-payment endpoints from
Phase 3, generating a client-side Idempotency-Key (UUID) at the moment
"Book Now" is clicked.
```

### 7.4 — Customer account pages
```
Build the customer account section: booking history, booking detail page
(including the "view bike documents" feature per
01-REQUIREMENTS-AND-FEATURES.md Section 5), cancel/extend actions, KYC
document upload.
```

---

## PHASE 8 — Admin Web Panel Frontend

### 8.1 — Admin dashboard shell + auth
```
Build the admin panel shell (MUI-based dashboard layout, sidebar
navigation, role-based menu visibility per role: super_admin vs
store_manager vs staff) and admin login.
```

### 8.2 — Inventory management screens
```
Build bike inventory screens: list/grid view, add/edit bike form
(including image and RC/Insurance/Emission document upload with expiry
date fields), bulk CSV import UI.
```

### 8.3 — Pricing engine screens
```
Build the pricing rules management UI: create/edit weekend, holiday,
seasonal, and one-way-fee rules; coupon management screen.
```

### 8.4 — Store & staff management screens
```
Build the store creation/edit screen with a map picker (OpenStreetMap/
Leaflet, not Google Maps, per the cost decision) for setting store
lat/long, and the staff management screen (create staff, assign to
multiple stores).
```

### 8.5 — Booking oversight & reports screens
```
Build the unified booking calendar/list view (filterable by
store/channel/status), manual booking edit, refund processing screen,
and the revenue/utilization report dashboards (charts using MUI +
a charting library like Recharts).
```

---

## PHASE 9 — Store Manager Mobile App (React Native, Android-only)

### 9.1 — Project setup
```
Set up a React Native project targeting Android-only builds (no iOS
config needed), per 01-REQUIREMENTS-AND-FEATURES.md Section 7's
distribution note. Set up local SQLite storage for the offline action
queue as described in 04-CODING-STANDARDS-AND-STRUCTURE.md Section 4.
Set up the API client with the same Idempotency-Key generation pattern
used on the website.
```

### 9.2 — Login & store switcher
```
Build the login screen and, for staff assigned to multiple stores, a
store switcher that scopes all subsequent screens to the selected store,
per 01-REQUIREMENTS-AND-FEATURES.md Section 12.1.
```

### 9.3 — Walk-in booking flow screens
```
Build the walk-in flow screens matching
01-REQUIREMENTS-AND-FEATURES.md Section 7 exactly: phone lookup →
existing-customer-loads OR new-customer-KYC-capture (camera integration
for ID photos) → bike selection (live availability) → duration + price
preview → payment collection recording → digital signature capture →
handover checklist (odometer + condition photos).
```

### 9.4 — Return flow screens
```
Build the return flow: search active bookings by phone/bike, condition
checklist with photo comparison against handover photos, late fee
calculation display, deposit refund recording.
```

### 9.5 — Offline queue & sync UI
```
Implement the offline-resilience behavior from
01-REQUIREMENTS-AND-FEATURES.md Section 7: when network is unavailable,
queue actions locally with a "Pending Sync" indicator, and automatically
flush the queue via /staff/sync when connectivity returns. Handle
per-item failure responses from that endpoint gracefully (retry vs. show
error to staff).
```

### 9.6 — In-app version check
```
Implement the in-app update check described in
01-REQUIREMENTS-AND-FEATURES.md Section 7: on launch, call
/staff/app-version, and if a newer APK is available, show a prompt with
a direct download link.
```

---

## PHASE 10 — Testing, Hardening, and Launch

### 10.1 — Security pass
```
Review the entire codebase against the Security section
(01-REQUIREMENTS-AND-FEATURES.md Section 9) and the code review checklist
(04-CODING-STANDARDS-AND-STRUCTURE.md Section 7). Specifically verify:
rate limiting on auth/booking endpoints, signed URLs on all document
access, DB transactions with locking on every availability-affecting
write, no raw card data ever touching the server, audit logging on every
admin/staff action that changes money or inventory state.
```

### 10.2 — End-to-end test pass
```
Write Pest feature tests covering full user journeys: (1) a customer
browses, books, pays online, and views their bike documents; (2) a staff
member processes a full walk-in booking from phone lookup through
handover; (3) a one-way rental where pickup and return stores differ,
confirming current_store_id updates correctly on return; (4) two
simultaneous booking attempts for the same bike/dates, confirming only
one succeeds.
```

### 10.3 — Deployment
```
Following 05-ENVIRONMENT-SETUP.md exactly, prepare the production
deployment package: finalize .env for production, confirm cache/session/
queue drivers match shared-hosting constraints, set up the cron entry,
run migrations, set up the storage symlink, and configure the
spatie/laravel-backup schedule.
```

---

## PHASE 11 — GitHub, README & Documentation

### 11.1 — Git setup and .gitignore
```
Initialize a git repository for this project if not already done. Create
a proper .gitignore for a Laravel + React Native monorepo (or separate
.gitignore files if the mobile app is a separate repo) covering: vendor/,
node_modules/, .env, storage/*.key, storage/logs/*, storage/framework/
cache/*, storage/framework/sessions/*, storage/framework/views/*,
bootstrap/cache/*.php, .phpunit.result.cache, build/, android build
artifacts (*.apk in build folders, but NOT the final release APK if you
intend to commit it — decide and note that decision), .DS_Store,
Thumbs.db, and any IDE folders (.vscode/, .idea/). Confirm .env is not
already tracked — if it is, remove it from tracking (git rm --cached .env)
without deleting the local file, and commit that removal separately with
a clear message.
```

### 11.2 — Repository structure check
```
Review the repository root and confirm it's organized cleanly for a
public or private GitHub repo: /app (Laravel backend), /resources or
/frontend (website), /mobile-app (React Native staff app), /docs
(all six numbered planning docs: 01 through 06), and a top-level
.env.example. Move any of the planning docs currently sitting loose in
the root into /docs/ and update any relative links between them if they
reference each other.
```

### 11.3 — Main README.md
```
Write a README.md for the repository root covering: project name and a
2-3 sentence description of what it does (unified online/offline bike
rental platform with dynamic pricing); tech stack summary (Laravel 11,
PHP 8.3, MySQL, React + MUI, React Native for the staff app); a "Getting
Started" section with exact local setup steps (clone, composer install,
npm install, copy .env.example to .env, generate app key, run migrations,
run seeders, start dev server); a "Project Structure" section briefly
explaining each top-level folder; a "Documentation" section linking to
each file in /docs with a one-line description of what's in it; and a
"Deployment" section pointing to docs/05-ENVIRONMENT-SETUP.md rather than
repeating it. Keep it scannable — headers and short paragraphs, not walls
of text. Do not include real credentials or production URLs anywhere in
this file.
```

### 11.4 — API documentation from the spec
```
Generate a docs/API.md (or expand 03-API-SPECIFICATION.md in place) that
reflects the ACTUAL implemented endpoints, not just the planned ones —
diff the current routes/api.php against 03-API-SPECIFICATION.md and flag
any endpoint that was planned but not yet built, or built but not
originally planned, so the documentation matches reality rather than the
original spec.
```

### 11.5 — Environment variables documentation
```
Create docs/ENV-VARIABLES.md listing every variable actually used in the
codebase (grep for env() and config() calls referencing them), with a
one-line description of what each does and which are required vs
optional vs have safe defaults. Cross-check this against
05-ENVIRONMENT-SETUP.md's .env.example and flag any variables that exist
in code but were missing from that template, or vice versa.
```

### 11.6 — Contribution/setup notes for future-you or other devs
```
Create a CONTRIBUTING.md covering: coding standards (link to
04-CODING-STANDARDS-AND-STRUCTURE.md rather than repeating it), branch
naming convention, commit message format (Conventional Commits), and how
to run the test suite locally before pushing. Also create a short
CHANGELOG.md seeded with a single "0.1.0 - Initial MVP" entry listing the
features actually completed so far, so future changes have somewhere to
be logged going forward.
```

### 11.7 — License and repo metadata
```
Add a LICENSE file — ask me which license I want (e.g., proprietary/
all-rights-reserved since this is a commissioned client project, vs MIT
if I want it open) before generating one, since this materially affects
what the client and I can each do with the code. Do not default to MIT
without confirming, since this is client work, not an open-source
project.
```

### 11.8 — First commit and push to GitHub
```
Stage all files, excluding anything matched by .gitignore, and create an
initial commit with the message "chore: initial commit - MVP bike rental
platform". Then walk me through creating a new GitHub repository (private,
since this is a paid client project) and pushing this commit to it,
including the exact git remote add and git push commands to run. Remind
me to double check that no .env file or API secret ended up in the commit
before pushing, by running git show --stat HEAD and scanning the file
list.
```
