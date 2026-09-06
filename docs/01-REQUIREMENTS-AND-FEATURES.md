# Bike Rental Platform — Complete Requirement & Architecture Document

**Stack:** Laravel 11 (PHP 8.3) + Material UI (via Inertia.js or REST API) + MySQL/PostgreSQL
**Channels:** Website (public), Admin Web Panel, Store Manager Mobile App (offline operations)
**Hosting:** Shared hosting (current) with a noted upgrade path

---

## 1. Vision & Scope

One inventory. Three entry points into it:

1. **Public website** — customer books online, pays in advance.
2. **Admin panel** — owner/HQ manages bikes, pricing, reports, refunds.
3. **Store Manager mobile app** — staff at a physical location handles walk-in customers: pick a bike, verify ID, collect payment, hand over the bike — and the same bike instantly shows "unavailable" on the website for those dates.

The core engineering problem this creates: **a single, race-condition-safe availability engine** that both the website and the app read from and write to. Everything else in this doc supports that goal.

---

## 2. Important Hosting Reality Check (Read This First)

You mentioned shared hosting (cPanel-style, unlimited email/storage plans). Good for cost, but shared hosting **cannot**, in almost all cases:

| Feature | Shared hosting support |
|---|---|
| Persistent queue workers (`php artisan queue:work`) | ❌ Not allowed — process gets killed |
| Redis / Memcached | ❌ Usually unavailable |
| WebSockets (real-time push, e.g. Laravel Reverb/Pusher) | ❌ Not supported |
| Cron jobs | ✅ Yes, usually every 1–5 min minimum |
| MySQL with transactions/row locking | ✅ Yes |
| SSL, unlimited email/storage | ✅ Yes |

**What this means practically:**
- Use **cron-based scheduling** (`php artisan schedule:run` every minute via cPanel cron) instead of queue workers for things like sending emails, releasing expired holds, etc. Laravel's `sync` queue driver (runs jobs immediately, inline) works fine for low-medium traffic.
- **Real-time sync** between the app and website won't be instant-push. Instead, use **short polling** (app/website check "has anything changed?" every 15–30 seconds) or simply **rely on the database as the single source of truth** — since every booking (online or offline) writes to the same `bookings` table with a DB-level lock, there's no real conflict even without real-time push; the *next* person who tries to book that bike/date instantly sees it as unavailable because the availability check hits the live database every time.
- Bottom line: **you don't actually need real-time push for correctness** — you need atomic database writes. Push is only about how fast the *UI* reflects it. With polling every 15–20 seconds, that's more than good enough for a bike rental use case.
- **Upgrade path (only if you ever need it later):** a small VPS purely for Redis + queue worker + WebSocket server would give true real-time sync — but per your decision to skip optional paid add-ons, **this plan proceeds entirely on your shared hosting with polling-based sync**, which is fully sufficient for correctness (Section 4.3 covers why).

---

## 3. User Personas

| Persona | Where they operate | Core need |
|---|---|---|
| **Super Admin / Owner** | Admin web panel | Full control: inventory, pricing, reports, refunds, staff |
| **Branch/Store Manager** | Mobile app | Manage one store's bikes, walk-in bookings, handovers, returns |
| **Store Staff** | Mobile app (restricted) | Verify docs, mark handover/return, collect cash/card |
| **Public Customer** | Website | Browse, book online, pay advance, manage own bookings |
| **Walk-in Customer** | Physical store (via staff) | No app — handled entirely by staff on their behalf |

---

## 4. Unified Inventory & Booking Model (the core design)

### 4.1 Single source of truth
One `bikes` table, one `bookings` table — regardless of channel. Every booking row has a `channel` field: `online` or `offline`. This is the single most important design decision: **there is no separate "offline inventory"** — offline bookings are just bookings with `channel = offline` and `created_by_staff_id` set.

### 4.2 Booking states (state machine)
```
DRAFT/HELD → PENDING_PAYMENT → CONFIRMED → HANDED_OVER (bike out) → RETURNED → COMPLETED
                                    ↓
                                CANCELLED / EXPIRED / NO_SHOW
```

- **DRAFT/HELD**: bike is soft-locked for 5–10 minutes while customer completes payment (online) or while staff fills the walk-in form (offline). Prevents two people grabbing the same bike simultaneously.
- **PENDING_PAYMENT**: online only — waiting on payment gateway confirmation.
- **CONFIRMED**: payment received (online) or cash/card collected in-store (offline).
- **HANDED_OVER**: bike physically given to customer — bike status flips to "On Rent."
- **RETURNED**: bike physically back — triggers deposit refund workflow + condition check.
- **COMPLETED**: booking closed, invoice finalized.

### 4.3 Concurrency-safe availability check
When *anyone* (website visitor or store staff on the app) tries to book Bike #12 for Oct 10–11:
1. Query `bookings` table for Bike #12 where date range overlaps AND status is in (`HELD`, `CONFIRMED`, `HANDED_OVER`) — i.e., not cancelled/expired.
2. If none found → wrap the booking creation in a **database transaction with row-level locking** (`SELECT ... FOR UPDATE` on the bike row) so two simultaneous requests can't both succeed.
3. If found → reject with "not available for these dates," and the frontend/app should immediately show the bike as greyed out.

This is what makes offline and online "connected" — it's not two systems talking to each other, it's **one system, two front doors.**

### 4.4 Held/expired cleanup
A cron job (every 1–2 minutes) releases any `HELD` booking older than 10 minutes back to "Available" — handles abandoned checkouts and staff who started a walk-in form but didn't finish it.

---

## 5. Feature List — Public Website (Online Customer)

### Browsing & Booking
- Browse/filter bikes by category, brand, location/store, price, availability
- Real-time (per the polling note above) availability calendar per bike
- Date-range picker for 1-day, 2-day, multi-day rentals
- Dynamic price preview before checkout (see Section 8)
- Add-ons: helmet, extra rider, insurance, GPS

### Account & KYC
- Signup/login via **email OTP** (no SMS cost, since SMS gateways are pay-per-use and you've opted to skip optional paid services) — phone number is still collected as a profile field for WhatsApp/booking purposes, just not used for login OTP
- Upload driving license + government ID (mandatory before first booking)
- Admin/staff approval of uploaded documents (can also be verified physically if customer picks up from store)

### Payment
- Mandatory advance payment to confirm booking (Razorpay/Stripe)
- Multiple payment methods: UPI, card, net banking, wallet
- Clear breakdown: base rate + dynamic pricing adjustment + deposit + add-ons — no hidden fees, shown before payment

### Booking Management
- View upcoming/past bookings, download invoice
- **View the specific bike's legal documents (RC, Insurance, Emission Certificate) for any active/upcoming booking** — critical for roadside checks; customer can show these on their phone if stopped by police or in case of an accident/dispute
- Cancel with policy-based refund (e.g., >24h = full refund, <24h = partial)
- Request extension (subject to bike availability for extended dates)
- Choose "self pickup from store" (bike held, documents verified physically) vs full online flow

### Notifications (Email + WhatsApp)
- Booking confirmation, payment receipt, pickup reminder, return reminder, late-fee alert, refund status — sent via **email** (unlimited on your plan) and **WhatsApp** (booking confirmations and reminders especially — WhatsApp has far higher open rates than email for time-sensitive things like "your bike pickup is in 2 hours")
- WhatsApp message should include a **direct link to view the bike's documents** (RC/Insurance/Emission Certificate) for that specific booking — so the customer always has one tap to the exact document they'd need if stopped

---

## 6. Feature List — Admin Web Panel (Owner/HQ)

### Inventory
- Add/edit/delete bikes: model, brand, registration number, images, category, fuel/transmission type
- **Upload required legal documents per bike at the time of adding to inventory: RC (Registration Certificate), Insurance, Emission/PUC Certificate** — mandatory fields, with expiry dates tracked (see below)
- **Document expiry alerts** — admin gets notified (email/WhatsApp) when a bike's insurance or emission certificate is nearing expiry, and the bike can be auto-flagged/blocked from new bookings if a document has actually expired (configurable — you may want a grace-period warning instead of a hard block)
- Assign bikes to specific store/branch locations
- Bike status: Available / On Rent / Under Maintenance / Retired
- Maintenance log per bike + next-service-due alerts
- Bulk import via CSV

### Dynamic Pricing Engine
- Base price per bike (per day)
- Weekend rule (e.g., Fri–Sun +20%)
- Holiday/long-weekend rule — define specific date ranges with a multiplier or fixed override price
- Seasonal pricing (peak/off-peak)
- Category-based base pricing
- Coupons/discount codes (flat or %, expiry, usage limits, per-user limits)
- Security deposit configuration per bike category
- Late-return penalty rate (per hour/day late)

### Booking Oversight (Online + Offline, Unified View)
- Single calendar/list view of **all** bookings regardless of channel, filterable by store/channel/status/date
- Manually create, modify, or cancel any booking (including offline ones staff created)
- Approve/reject bookings needing manual review
- Handle extension requests
- Damage/late-fee charge entry
- Refund processing (full/partial) with reason logging

### Store & Staff Management
- **Superadmin can create new stores** and set/update each store's **address and geolocation** (map pin — latitude/longitude via **OpenStreetMap/Leaflet**, free with no API billing, so the website can show "nearest store" and accurate directions)
- Create Store Manager and Staff accounts, assign to specific store(s)
- Role-based permissions: who can edit pricing, who can only handle handovers, who can process refunds
- View staff activity log (who created/modified which booking, when)

### Customer Management
- View customer profiles, KYC documents (from both online uploads and in-store scans), booking history
- Blacklist/flag customers (e.g., past damage, no-shows)
- Manual KYC verification/approval

### Reports & Analytics
- Revenue by channel (online vs offline), by store, by bike, by date range
- Bike utilization rate (idle vs rented %)
- Most/least booked bikes
- Cancellation and refund reports
- Staff performance (bookings handled, upsells, etc.)

### Content & Settings
- **Manage store locations** — add new stores, update address text and map location (lat/long) for each
- Manage rental agreement / T&C text (must be accepted before every booking, online or offline — staff can show it on the app for walk-ins to sign digitally)
- Notification/email/WhatsApp template management
- Review/rating moderation

---

## 7. Feature List — Store Manager Mobile App (Offline Operations)

This is the piece that replaces "a system in the store" — everything runs from the manager's/staff's phone.

**Distribution: Android-only, sideloaded APK (no app store).** Since this app is internal-only and won't be published on Play Store or App Store:
- **Android** — install via APK works permanently and cleanly. Staff just needs "Install from unknown sources" enabled once on their phone. This is the standard approach for internal shop-floor/POS tools.
- **iOS is not practical for permanent sideloading** — Apple only allows installing apps outside the App Store via a paid Apple Developer Enterprise account (~$299/year) or free personal signing that expires and needs reinstalling every 7 days. Since you're avoiding store/account costs, **build this app Android-only** (still fully cross-platform-capable in Flutter/React Native if you ever change your mind later — you'd just also compile an iOS build and publish it).
- **Updates:** since there's no Play Store auto-update, build a simple **in-app version check** — on launch, the app pings your server for the latest APK version number; if outdated, it shows a "New version available" prompt with a direct download link to the new APK hosted on your own server (your shared hosting's unlimited storage is perfect for this — just host the APK file itself).

### Login & Role
- Secure login (email/phone + OTP or password + device-bound token)
- App shows only the store(s) this staff member is assigned to
- Two role tiers inside the app: **Store Manager** (full store control) and **Staff** (restricted — e.g., can't edit pricing or process refunds without manager approval)

### Walk-in Booking Flow (the core offline flow)
1. **Search by phone number (first step, always)** — staff enters the customer's phone number in the app.
   - **If a match exists** → customer's saved profile loads instantly: name, past KYC documents, booking history, any flags (e.g., past damage/no-show). Staff confirms it's the same person (optionally re-checks the physical ID against the photo on file) and proceeds straight to bike selection — no re-entry needed.
   - **If no match** → app flags this as a **new customer** and forces the full KYC capture step (below) before anything else can proceed. The customer account is created automatically the moment KYC is submitted — the customer never fills anything in themselves; the store staff does it all on their behalf.
2. **Select bike** — app shows only bikes physically at this store, with live availability (same engine as website)
3. **Capture ID/Document (new customers only)** — phone camera scan/photo of driving license + government ID; name/address entered manually by staff (no paid OCR service — keeping this manual avoids a per-verification API cost), saved to the newly created customer profile
4. **Select rental duration** — 1 day, 2 days, custom range; app shows the same dynamic price as the website would (weekend/holiday rules auto-applied)
5. **Collect payment** — record method (cash / card via POS machine / UPI QR); deposit + advance handled per Section 8.1 below; app marks booking as `CONFIRMED`
6. **Digital agreement signature** — customer signs on the phone screen (T&C acceptance) — legally covers you the same way an online checkbox does
7. **Handover checklist** — photo of bike condition (odometer reading, scratches/dents) before handover, then mark `HANDED_OVER`
8. **Bike instantly shows unavailable** on the website and admin panel for those dates — no separate sync step needed, it's the same database record

**Why phone-number-first matters:** it's the natural key tying a walk-in customer to their account without asking them to "sign up." Every operation (booking, KYC, history) is still performed *by staff*, never by the customer directly in this flow — but the underlying `users` record is the same one the website would use if that person ever books online later. One phone number = one customer = one history, across both channels.

### Return Flow
- Search active bookings at this store (by customer name/phone/bike)
- Return condition checklist + photos (compare against handover photos)
- Calculate late fee automatically if returned after scheduled time
- Calculate deposit refund (full/partial based on damage) — manager can adjust with a reason note, logged for HQ visibility
- Mark `RETURNED` → bike instantly becomes available again everywhere

### Store-Level Inventory View
- List of bikes at this store with live status (Available / On Rent / Maintenance)
- Mark a bike "Under Maintenance" (removes it from both app and website availability instantly)
- Request bike transfer to/from another store (HQ approval)

### Offline-Resilience (important for a store app)
- If internet drops momentarily, app should **queue the action locally** (booking creation, handover, return) and sync the moment connectivity returns — with clear "Pending Sync" indicators so staff aren't confused. Prevent duplicate submissions using a locally-generated unique request ID (idempotency key) that the server recognizes even if the same request is sent twice after reconnecting.

### Manager-Only Extras
- View store's daily/weekly revenue and booking count
- Approve staff-initiated refunds above a threshold
- View/manage staff shift activity log

---

## 8. Dynamic Pricing Logic (used identically by website, admin, and app)

A single backend **Pricing Service** — not duplicated logic in three places — that all three channels call:

```
Input: bike_id, start_date, end_date
Steps:
 1. Get base daily rate for the bike (or its category)
 2. For each day in range, check applicable rules in priority order:
    a. Holiday/special-date override (highest priority — e.g., Diwali week = fixed ₹X/day)
    b. Weekend rule (Fri/Sat/Sun = +X% or fixed rate)
    c. Seasonal rule (peak season = +X%)
    d. Default = base rate
 3. Sum daily rates across the range
 4. Add security deposit (fixed, per category)
 5. Add any selected add-ons
 6. Apply coupon (if valid) — online only, or manager-applied for walk-ins
Output: itemized price breakdown (shown identically on website checkout and app booking screen)
```

This guarantees a customer sees the exact same price whether they book online or a staff member calculates it in-store — no discrepancy, no "hidden cost" complaints.

### 8.1 Deposit & Advance Payment Handling (Razorpay / PhonePe)

Since both are confirmed as the payment gateways, here's the cleanest way to handle deposit + advance across both channels:

- **Advance rental payment** — a normal charge/capture via Razorpay or PhonePe, online or offline (staff generates a payment link or shows a dynamic QR from the gateway's in-store/POS API for walk-ins).
- **Security deposit** — two options, pick one as policy:
  - **Option A (simpler, recommended to start):** deposit is also charged upfront alongside the advance (one combined payment), and refunded via Razorpay/PhonePe's refund API after the bike is returned in good condition. Easiest to implement, works identically online and offline.
  - **Option B (cleaner, more advanced):** use a **pre-authorization hold** on the customer's card (Razorpay supports auth+capture flows) instead of an actual charge — the amount is blocked but not debited, and released automatically if no deduction is needed. Better customer experience but PhonePe's UPI flows generally don't support true pre-auth the way card networks do, so this only fully works for card payments — UPI/cash walk-ins would still need Option A.
  - **Recommendation:** launch with Option A for both channels (simpler, gateway-agnostic, works for cash too), and consider Option B later only for card-paying online customers if refund-cycle complaints come up.
- **Offline cash deposits** — recorded in the app as `payment_method = cash`, `type = deposit`, with no gateway reference; refund is simply staff handing cash back at return time, logged in the app with a photo/signature confirmation for the audit trail.
- Either way, the **same `payments` table** stores both online and offline entries (`gateway_reference` nullable for cash), so admin reporting/reconciliation is unified regardless of channel.

### 8.2 WhatsApp Integration Notes

- **Recommended route:** Meta's official **WhatsApp Cloud API** directly (free tier: 1,000 conversations/month, then a small per-conversation fee) — used directly, **not through a paid reseller**, since resellers (Gupshup, Interakt, etc.) add a monthly subscription/markup on top, which you've opted to skip. Direct integration takes a bit more setup (your own Meta Business Manager account) but has zero recurring platform fee beyond Meta's own per-conversation pricing.
- **Message templates require pre-approval** from Meta before they can be sent outside a 24-hour customer-initiated window — so "Booking Confirmed," "Pickup Reminder," "Return Reminder," and "Payment Receipt" templates need to be submitted and approved in advance (usually approved within a day).
- **Opt-in consent:** customer must consent to WhatsApp messages (a checkbox at signup/booking, or implied for transactional-only messages depending on your region's rules) — store this consent flag on the `users` table.
- **Fallback:** if a WhatsApp message fails to deliver (number not on WhatsApp, opted out, etc.), the same notification should automatically fall back to email so nothing is missed — the `notification_logs` table (Section 10) is what drives this fallback logic.

---

## 9. Security (applies across website, admin, and mobile app)

- **Auth:** Laravel Sanctum for API tokens (used by both the SPA/Inertia website and the mobile app), 2FA (TOTP) for Admin/Manager accounts
- **Authorization:** Laravel Policies — every action (edit price, process refund, view another store's data) checked server-side, never trust the app/frontend
- **Document access control:** bike documents (RC/Insurance/Emission) and customer KYC documents are two very different sensitivity levels — **bike documents are viewable by the customer who has an active/upcoming booking for that specific bike only** (signed, expiring temporary URL, not a public file link), while KYC documents are visible only to staff/admin, never to other customers
- **Device binding:** Mobile app tokens tied to device ID; manager can remotely revoke a lost phone's access from the admin panel
- **Document storage:** ID/license photos and signed agreements stored encrypted at rest, outside public web root, accessed only via signed temporary URLs
- **Idempotency keys:** every booking-creation request (online or from the app) carries a unique key so retries/poor connectivity never create duplicate bookings or double-charge
- **Rate limiting:** login, OTP, booking, and payment endpoints throttled
- **Audit log:** every price change, refund, booking edit, and document verification logged with who/when/what (old value → new value)
- **PCI compliance offload:** never store card numbers — use gateway-hosted checkout/tokenization (Razorpay/Stripe)
- **HTTPS + HSTS** everywhere, including the mobile app's API calls
- **Input validation:** Form Requests server-side for every field, on every channel
- **Backups:** automated daily DB backup via cron (shared hosting supports this), stored off-server (e.g., emailed to yourself using your unlimited email plan, or pushed to free-tier cloud storage)

---

## 10. Database Schema — Key Tables (high level)

- `users` — customers, staff, managers, admins (role field)
- `stores` — branch locations, **address (text), latitude, longitude** (map pin, set/updated by superadmin)
- `staff_store` — pivot table (staff `user_id` ↔ `store_id`), supports staff working across multiple stores
- `bikes` — model, category, registration, **current_store_id** (where it physically sits right now — changes on one-way returns), status
- `bike_categories`
- `bike_documents` — bike_id, document_type (**RC / Insurance / Emission Certificate**), file_path, issue_date, expiry_date, uploaded_by, verified — one bike has multiple rows here (one per document type); this is what the customer-facing "view my bike's documents" feature reads from
- `pricing_rules` — bike_id/category_id, rule_type (weekend/holiday/seasonal/**one_way_fee**), date_range or day_of_week or store-pair, rate_type (multiplier/fixed), value
- `bookings` — bike_id, user_id (nullable for pure walk-ins without app account), **pickup_store_id, return_store_id**, channel (online/offline), status, start_date, end_date, created_by (staff_id or null), completed_by (staff_id or null — may differ from created_by for one-way returns), price_breakdown (JSON), agreement_signed_at
- `payments` — booking_id, amount, method, gateway_reference, status
- `kyc_documents` — user_id or booking_id, document_type, file_path, verified_by, verified_at
- `bike_condition_logs` — booking_id, stage (handover/return), photos, odometer, notes
- `coupons`
- `refunds` — booking_id, amount, reason, processed_by
- `activity_logs` — polymorphic audit trail across all admin/manager/staff actions
- `sync_queue` (mobile app offline support) — pending local actions with idempotency keys, synced_at
- `notification_logs` — user_id, booking_id, channel (email/whatsapp), template, status (sent/failed/delivered), sent_at — lets admin see whether a WhatsApp reminder actually delivered, since WhatsApp API delivery isn't always guaranteed the way SMTP email is

---

## 11. Rollout Plan (suggested phases)

| Phase | Scope |
|---|---|
| **Phase 1** | Core DB design, unified availability engine, admin panel (inventory + basic bookings) |
| **Phase 2** | Public website — browsing, booking, payment integration |
| **Phase 3** | Dynamic pricing engine (weekend/holiday rules) wired into both website and admin |
| **Phase 4** | Store Manager mobile app — walk-in booking, handover, return flows |
| **Phase 5** | Offline-resilience (local queue + sync), reports/analytics, refund automation |
| **Phase 6** | Not planned — polling-based sync, manual KYC, and OpenStreetMap already cover this permanently on your current stack; no paid add-ons needed |

---

## 12. Decisions Confirmed

| Decision | Choice | Impact |
|---|---|---|
| Mobile app platform | **Cross-platform** (Flutter or React Native) | One codebase for Android + iOS; faster to build and maintain for an internal ops tool |
| Walk-in customers | **Always get an account** — looked up by phone number; if new, full KYC is captured by staff and the account is auto-created. Customer never operates the app themselves. | `users` table is the single customer identity across both channels from day 1 — no later migration needed to merge "guest" records |
| Payment gateway | **Razorpay and/or PhonePe** | See Section 8.1 for deposit/advance handling specifics with these gateways |
| Store count | **Multi-store from day 1** | `stores` table, `bikes.store_id`, and staff-to-store assignment are core schema from the start, not retrofitted later |
| One-way rentals | **Allowed** — pick up at one store, return at another, with an optional fee | Booking needs a `return_store_id` separate from `pickup_store_id`; pricing engine needs a one-way fee rule; the returning store's staff (not necessarily the pickup store) closes out the booking |
| Staff-to-store assignment | **Many-to-many** — a staff member can work across multiple stores | Needs a `staff_store` pivot table rather than a single `store_id` column on `users`; app must let staff switch between their assigned stores |

### 12.1 Design implications of these two follow-ons

**One-way rentals:**
- `bookings` table needs both `pickup_store_id` and `return_store_id` (instead of a single `store_id`)
- The availability engine's "is this bike free for these dates" check is unaffected — a bike is still tied to wherever it currently sits, but **the bike's "home store" changes on every one-way return** (it's now physically at the return store, not the pickup store), so the return flow must update `bikes.current_store_id`, not just the booking status
- Pricing engine gets a new rule type: **one-way fee** — flat amount, or based on distance/route between the two stores (start simple: flat fee per store-pair, configurable by admin)
- Admin panel needs a way to see "bikes that have drifted" — i.e., bikes currently sitting at a store different from where they're nominally assigned, so HQ can decide whether to relocate them back or leave them
- The **returning store's staff** completes the return checklist even if a different store handled the pickup — so the return flow in the app must be able to look up *any* active booking system-wide by customer phone/bike, not just bookings created at "this" store

**Staff working across multiple stores:**
- Replace a simple `store_id` column on staff `users` with a `staff_store` pivot table (many-to-many)
- On login, if a staff member is assigned to more than one store, the app shows a **store switcher** — they pick which store they're currently operating at for that session (bike lists, walk-in bookings, and returns are all scoped to whichever store is currently selected)
- Admin panel's "staff activity log" should show which store each action was performed at, not just which staff member did it — since the same person's actions may span stores over a week

---

Want me to proceed with **Phase 1** — the actual Laravel migrations for this schema and the Pricing Service class — or would you rather I first sketch the mobile app's screen flow / wireframe list so you can plan the Flutter/React Native build alongside it?
