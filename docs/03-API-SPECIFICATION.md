# API Specification

**Base URL:** `https://yourdomain.com/api/v1`
**Auth:** Bearer token (Laravel Sanctum) in `Authorization: Bearer {token}` header for all authenticated routes.
**Format:** JSON in/out. Every response wrapped as:
```json
{ "success": true, "data": { ... }, "message": "" }
```
Errors:
```json
{ "success": false, "data": null, "message": "Human-readable error", "errors": { "field": ["validation message"] } }
```

This doc defines the contract so the website, admin panel, and mobile app all talk to **one** consistent backend — an AI coding tool should implement routes/controllers matching this exactly, not invent its own shapes per client.

---

## Auth

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| POST | `/auth/register` | Public | name, email, phone, password |
| POST | `/auth/login` | Public | email/phone + password → returns token |
| POST | `/auth/otp/request` | Public | email OTP (login without password) |
| POST | `/auth/otp/verify` | Public | verify OTP → returns token |
| POST | `/auth/logout` | Authenticated | revokes current token |
| GET | `/auth/me` | Authenticated | current user profile |

## Bikes (Public + Admin)

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| GET | `/bikes` | Public | filters: `store_id`, `category_id`, `start_date`, `end_date`, `min_price`, `max_price` — only returns bikes available for the given date range if dates passed |
| GET | `/bikes/{id}` | Public | full bike detail + images |
| GET | `/bikes/{id}/availability` | Public | query param `month=2026-09` → returns array of unavailable date ranges |
| GET | `/bikes/{id}/price-quote` | Public | query: `start_date`, `end_date`, `pickup_store_id`, `return_store_id`, `coupon_code` (optional) → returns full itemized price breakdown (calls the shared Pricing Service — see Section 8 of the main requirements doc) |
| GET | `/pickup-points?store_id={id}` | Public | requires an active Store ID (`store_id`); returns landmark pickup and return locations configured for that store along with directional relocation fees (`pickup_fee`, `return_fee`) and flags (`supports_pickup`, `supports_return`) |
| POST | `/admin/bikes` | Admin | create bike (multipart form: fields + images + documents) |
| PUT | `/admin/bikes/{id}` | Admin | update bike |
| DELETE | `/admin/bikes/{id}` | Admin | soft delete |
| POST | `/admin/bikes/{id}/documents` | Admin | upload RC/Insurance/Emission cert |
| POST | `/admin/bikes/bulk-import` | Admin | CSV upload |

## Bookings — Customer (Website + App)

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| POST | `/bookings/hold` | Authenticated customer | creates a `held` booking (5–10 min lock); body: bike_id, start_date, end_date, pickup_store_id, return_store_id, addons[], coupon_code; **must include `Idempotency-Key` header** |
| POST | `/bookings/{id}/confirm-payment` | Authenticated customer | called after gateway payment success, with gateway_reference — server verifies with gateway before flipping status to `confirmed` (never trust client-side "payment succeeded" alone) |
| GET | `/bookings` | Authenticated customer | own booking history |
| GET | `/bookings/{id}` | Authenticated customer | own booking detail |
| GET | `/bookings/{id}/documents` | Authenticated customer | **returns signed temporary URLs for the booked bike's RC/Insurance/Emission Certificate** — only if this user owns an active/upcoming booking for that bike |
| POST | `/bookings/{id}/cancel` | Authenticated customer | applies cancellation policy, triggers refund calc |
| POST | `/bookings/{id}/extend` | Authenticated customer | requests new end_date, re-checks availability + re-prices |

## Bookings — Staff/Store Manager App (Offline)

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| GET | `/staff/customers/lookup?phone=` | Staff | returns existing customer profile or `{found: false}` |
| POST | `/staff/customers` | Staff | creates new customer + KYC docs in one call (walk-in flow) |
| POST | `/staff/bookings` | Staff | same as `/bookings/hold` but channel=offline, includes `created_by` = staff id, **must include `Idempotency-Key` header** for offline-resilience |
| POST | `/staff/bookings/{id}/collect-payment` | Staff | records cash/card/UPI payment, marks `confirmed` |
| POST | `/staff/bookings/{id}/handover` | Staff | body: odometer_reading, condition_photos[], signature — marks `handed_over` |
| GET | `/staff/bookings/active?store_id=` | Staff | list of bikes currently out from this store (for return lookup) |
| POST | `/staff/bookings/{id}/return` | Staff | body: odometer_reading, condition_photos[], late_fee_override, damage_fee, deposit_refund_amount — marks `returned`, updates `bikes.current_store_id` to the returning store |
| GET | `/staff/bikes?store_id=` | Staff | bikes currently at this store with live status |
| POST | `/staff/bikes/{id}/maintenance` | Staff/Manager | toggle maintenance status |
| POST | `/staff/sync` | Staff (offline queue flush) | body: array of queued actions with idempotency keys — server processes each, returns per-item success/failure so the app knows what to retry |

## Ground Check-In & Offline Queue Sync (`/admin/check-in`)

Operated by ground staff and store managers for scanning booking QR passes, completing handovers, boarding multi-vertical passengers, and syncing offline queues when network connectivity drops.

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| GET | `/admin/check-in` | Staff/Admin | Ground Pass scanner & check-in console view |
| POST | `/admin/check-in/lookup` | Staff/Admin | Lookup booking by booking reference, QR pass token, or customer 10-digit phone number |
| POST | `/admin/check-in/process` | Staff/Admin | Direct online check-in / handover execution with optional balance collection |
| POST | `/admin/check-in/sync` | Staff/Admin | Batch sync offline check-in inspections recorded in IndexedDB queue |

### Offline IndexedDB Payload Contract (`POST /admin/check-in/sync`)

When ground staff operate in coastal blind spots (e.g., Mavinkurve jetty, Netrani dive boats), check-in actions are persisted locally to browser IndexedDB (`GKWhizWheelOfflineDB`, store: `checkin_queue`, keyPath: `client_id`). When connectivity restores, the PWA automatically flushes all queued items in a batch to `POST /admin/check-in/sync`.

#### Request Payload
```json
{
  "items": [
    {
      "client_id": "offline-1731671234567-abc123",
      "type": "service",
      "id": 42,
      "action": "board",
      "payment_method": "cash",
      "amount_collected": 1500,
      "ground_notes": "Queued at Mavinkurve jetty offline",
      "queued_at": "10 Sep 02:30"
    },
    {
      "client_id": "offline-1731671234568-xyz890",
      "type": "bike",
      "id": 108,
      "action": "check_in",
      "queued_at": "10 Sep 02:35"
    }
  ]
}
```

#### Field Specifications:
* `items`: Array of 1 to 100 queued check-in objects.
* `client_id` (string, required): Unique client-generated identifier generated in IndexedDB (e.g., `offline-${Date.now()}-${random}`). Used by the client to correlate and purge successfully synced entries from local storage.
* `type` (string, required): Booking vertical — either `service` (boating, scuba, cab, homestay, tour guide) or `bike` (two-wheeler rental).
* `id` (integer/string, required): Booking primary key ID.
* `action` (string, required): Allowed values: `check_in`, `board`, `collect_balance`, or `complete`.
  * For `service`: `complete` marks status `completed`; `check_in` / `board` / `collect_balance` marks status `in_progress`.
  * For `bike`: `complete` marks status `completed`; `check_in` marks status `handed_over`.
* `payment_method` (string, optional): Payment mode used on ground (`cash`, `upi`, `card`).
* `amount_collected` (numeric, optional, min: 0): Balance amount collected on the ground. Updates `advance_paid` and reduces `balance_due`.
* `ground_notes` (string, optional, max 1000 chars): Operational notes entered by ground staff.
* `queued_at` (string, optional): Timestamp recorded when the action took place offline. Accepts human-readable formats (e.g., `"10 Sep 02:30"`, `"2026-11-15 14:30:00"`, or ISO 8601 strings). The backend records this in `admin_notes` as `[Offline Check-in queued at {queued_at}, synced {time} by {staff_name}]` and attaches it to the `ActivityLog` (`is_offline_sync: true`, `queued_at: {queued_at}`) for audit integrity.

#### Response Schema
```json
{
  "success": true,
  "synced_count": 2,
  "synced_ids": [
    "offline-1731671234567-abc123",
    "offline-1731671234568-xyz890"
  ],
  "errors": [],
  "message": "Synced 2 offline check-in actions successfully."
}
```

#### Frontend Client ID Mapping & Reconnection Flow:
1. When offline, each inspection is written to IndexedDB store `checkin_queue` with a unique `client_id`.
2. When `window.addEventListener('online')` fires or during scheduled heartbeat retries, the queued array is submitted to `POST /admin/check-in/sync`.
3. The server processes each valid item, records staff audit trails, and returns `synced_ids` matching the successfully processed `client_id`s.
4. The frontend iterates over `response.data.synced_ids` and deletes those specific records from IndexedDB via `store.delete(id)`. Any items that encountered server errors remain in the queue for manual inspection or retry, ensuring zero data loss and preventing double processing.

## Admin — Pricing

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| GET | `/admin/pricing-rules` | Admin | list, filterable by bike/category |
| POST | `/admin/pricing-rules` | Admin | create weekend/holiday/seasonal/one_way_fee rule |
| PUT | `/admin/pricing-rules/{id}` | Admin | update |
| DELETE | `/admin/pricing-rules/{id}` | Admin | remove |
| POST | `/admin/coupons` | Admin | create coupon |
| GET | `/admin/coupons` | Admin | list |

## Admin — Stores & Staff

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| POST | `/admin/stores` | Super Admin | create store (name, address, lat, long) |
| PUT | `/admin/stores/{id}` | Super Admin | update address/location |
| POST | `/admin/staff` | Super Admin | create staff/manager account |
| POST | `/admin/staff/{id}/stores` | Super Admin | assign staff to store(s) — many-to-many |
| DELETE | `/admin/staff/{id}/stores/{storeId}` | Super Admin | unassign |

## Admin — Bookings, Refunds, Reports

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| GET | `/admin/bookings` | Admin | filterable by store/channel/status/date, paginated |
| PUT | `/admin/bookings/{id}` | Admin | manual override (date, status, amounts) |
| POST | `/admin/bookings/{id}/refund` | Admin | full/partial refund with reason |
| GET | `/admin/reports/revenue` | Admin | query: date range, group_by (store/channel/bike) |
| GET | `/admin/reports/utilization` | Admin | bike utilization % |
| GET | `/admin/activity-logs` | Admin | filterable audit trail |

## Webhooks (server-to-server, not client-facing)

| Endpoint | From | Purpose |
|---|---|---|
| `/webhooks/razorpay` | Razorpay | payment success/failure confirmation — signature-verified, this is what actually flips `pending_payment` → `confirmed`, never the client callback alone |
| `/webhooks/phonepe` | PhonePe | same purpose |
| `/webhooks/whatsapp` | Meta Cloud API | delivery status updates for `notification_logs` |

---

## Critical Rules for Implementation

1. **Never confirm a booking or release inventory based on a client-side call alone.** Payment confirmation always goes through the gateway's server-to-server webhook with signature verification.
2. **Every booking-creation endpoint requires an `Idempotency-Key` header.** If the same key is sent twice (e.g., app retried after a timeout), return the original result instead of creating a duplicate.
3. **Availability checks and booking creation happen inside one DB transaction with row-level locking** (`SELECT ... FOR UPDATE` on the bike row) — see main requirements doc Section 4.3.
4. **Bike document URLs (`/bookings/{id}/documents`) are always short-lived signed URLs**, never permanent public links — regenerate on each request.
5. **Rate limit:** `/auth/*` and `/bookings/hold` endpoints should be throttled (e.g., 10 requests/minute per IP) to prevent abuse.
