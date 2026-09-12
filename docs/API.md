# GK WhizWheel — Implemented API Reference

**Base URL:** `https://yourdomain.com/api/v1`  
**Authentication:** Bearer token via Laravel Sanctum (`Authorization: Bearer {token}`).  
**Standard Response Envelope:**
```json
{
  "success": true,
  "data": { ... },
  "message": ""
}
```

**Standard Error Envelope (HTTP 4xx / 5xx):**
```json
{
  "success": false,
  "data": null,
  "message": "Human-readable explanation of error",
  "errors": {
    "field_name": [
      "Validation or constraint failure details"
    ]
  }
}
```

---

## 1. Specification Diff Summary

This document reflects the **actual implemented endpoints** in `routes/api.php` cross-referenced against the original [`03-API-SPECIFICATION.md`](03-API-SPECIFICATION.md).

### Diff Status Matrix
* **Planned in `03-API-SPECIFICATION.md` but not built:** **0 endpoints** (100% of planned endpoints are built and tested).
* **Built and added to meet real application needs (originally unlisted):** **15 endpoints**.

| Status Legend | Meaning |
|---|---|
| `[PLANNED & BUILT]` | Specified in original `03-API-SPECIFICATION.md` and fully implemented in `routes/api.php`. |
| `[BUILT - ADDED]` | Built during development to satisfy complete client/operational journeys; not in initial 03 table. |

---

## 2. Authentication (`/api/v1/auth`)

Rate limited by `throttle:auth` (10 requests/minute per IP/account).

| Method | Endpoint | Status | Who | Notes |
|---|---|---|---|---|
| `POST` | `/auth/register` | `[PLANNED & BUILT]` | Public | Register customer (`name`, `email`, `phone`, `password`, `password_confirmation`). |
| `POST` | `/auth/login` | `[PLANNED & BUILT]` | Public | Authenticate via email or phone + password. Returns Sanctum token. |
| `POST` | `/auth/otp/request` | `[PLANNED & BUILT]` | Public | Request email OTP for passwordless login. |
| `POST` | `/auth/otp/verify` | `[PLANNED & BUILT]` | Public | Verify 6-digit OTP code and exchange for Sanctum token. |
| `POST` | `/auth/logout` | `[PLANNED & BUILT]` | Authenticated | Revoke current personal access token. |
| `GET` | `/auth/me` | `[PLANNED & BUILT]` | Authenticated | Get current authenticated user profile, roles, and assigned stores. |

---

## 3. Public Discovery, Availability & Pricing

| Method | Endpoint | Status | Who | Notes |
|---|---|---|---|---|
| `GET` | `/bikes` | `[PLANNED & BUILT]` | Public | Filters: `store_id`, `category_id`, `min_price`, `max_price`, `start_date`, `end_date`. Excludes maintenance & overlapping active bookings. |
| `GET` | `/bikes/{id}` | `[PLANNED & BUILT]` | Public | Full bike details, specifications, images, category, and current store. |
| `GET` | `/bikes/{id}/availability` | `[PLANNED & BUILT]` | Public | Query param `month=YYYY-MM`. Returns list of unavailable start/end date ranges. |
| `GET`/`POST` | `/bikes/{id}/price-quote` | `[PLANNED & BUILT]` | Public | Query/body: `start_date`, `end_date`, `pickup_store_id`, `return_store_id`, `coupon_code` (optional). Returns itemized pricing breakdown. |
| `GET` | `/stores` | `[BUILT - ADDED]` | Public | Returns active stores for website/app store pickers and location finders. |
| `GET` | `/bike-categories` | `[BUILT - ADDED]` | Public | Returns bike categories for catalog filtering and rate references. |

---

## 4. Customer Bookings & Payments (`/api/v1/bookings`)

All customer booking routes require Sanctum authentication (`auth:sanctum`) and are throttled (`throttle:bookings`).

| Method | Endpoint | Status | Who | Notes |
|---|---|---|---|---|
| `POST` | `/bookings/hold` | `[PLANNED & BUILT]` | Customer | Concurrency-safe hold (5-10 min) using row locks. Requires `Idempotency-Key` header. |
| `GET` | `/bookings` | `[PLANNED & BUILT]` | Customer | Paginated booking history of authenticated customer. |
| `GET` | `/bookings/{id}` | `[PLANNED & BUILT]` | Customer | Detailed view of customer's own booking. |
| `POST` | `/bookings/{id}/checkout` | `[BUILT - ADDED]` | Customer | Creates Razorpay order for advance + security deposit. Throttled by `throttle:payments`. |
| `POST` | `/bookings/{id}/checkout/phonepe` | `[BUILT - ADDED]` | Customer | Creates PhonePe payment request for advance + security deposit. Throttled by `throttle:payments`. |
| `POST` | `/bookings/{id}/confirm-payment` | `[PLANNED & BUILT]` | Customer | Client-side payment callback handler. Verifies gateway status. |
| `POST` | `/bookings/{id}/cancel` | `[PLANNED & BUILT]` | Customer | Cancels booking and applies cancellation refund policy based on hours to pickup. |
| `POST` | `/bookings/{id}/extend` | `[PLANNED & BUILT]` | Customer | Requests extension to new `end_date`, re-checks availability, and re-prices additional duration. |
| `GET` | `/bookings/{id}/documents` | `[PLANNED & BUILT]` | Customer | Returns short-lived signed URLs for bike RC, Insurance, and PUC certificates for active/confirmed bookings. |

---

## 5. Customer Self-Service KYC (`/api/v1/customer`)

| Method | Endpoint | Status | Who | Notes |
|---|---|---|---|---|
| `GET` | `/customer/kyc-documents` | `[BUILT - ADDED]` | Customer | Retrieves the authenticated customer's uploaded identity documents and verification statuses. |
| `POST` | `/customer/kyc-documents` | `[BUILT - ADDED]` | Customer | Uploads Aadhaar, Passport, or Driving License (`document_type`, `document_number`, `document_file`). |

---

## 6. Staff & Store Operations (`/api/v1/staff`)

Designed for the React Native store manager app with offline resilience.

| Method | Endpoint | Status | Who | Notes |
|---|---|---|---|---|
| `GET` | `/staff/customers/lookup` | `[PLANNED & BUILT]` | Staff | Lookup customer by `phone`. Returns profile, KYC docs, and risk flags or `{found: false}`. |
| `POST` | `/staff/customers` | `[PLANNED & BUILT]` | Staff | Creates walk-in customer profile and uploads initial KYC documents in one request. |
| `GET` | `/staff/bookings/active` | `[PLANNED & BUILT]` | Staff | Lists active rentals for the staff member's store (filterable by `store_id`). |
| `POST` | `/staff/bookings` | `[PLANNED & BUILT]` | Staff | Creates booking hold on behalf of a walk-in customer. Requires `Idempotency-Key` header. |
| `POST` | `/staff/bookings/{id}/collect-payment` | `[PLANNED & BUILT]` | Staff | Records offline cash, card, or store UPI payment; moves booking to `confirmed`. |
| `POST` | `/staff/bookings/{id}/handover` | `[PLANNED & BUILT]` | Staff | Records odometer, condition inspection photos, and customer digital signature. Marks `handed_over`. |
| `POST` | `/staff/bookings/{id}/return` | `[PLANNED & BUILT]` | Staff | Return inspection: updates odometer, photos, calculates late fee, damage deductions, updates `current_store_id`. |
| `GET` | `/staff/bikes` | `[PLANNED & BUILT]` | Staff | Lists inventory located at `store_id` with live operational statuses. |
| `POST` | `/staff/bikes/{id}/maintenance` | `[PLANNED & BUILT]` | Staff | Toggles maintenance flag (`in_service` vs `under_maintenance`) with audit reason. |
| `POST` | `/staff/sync` | `[PLANNED & BUILT]` | Staff | Batched offline queue flush. Processes array of queued actions with per-item success/failure statuses. |
| `GET` | `/staff/app-version` | `[BUILT - ADDED]` | Public/Staff | In-app update check endpoint returning `latest_version`, `min_version`, and direct APK download URL. |

---

## 7. Admin Management (`/api/v1/admin`)

Requires authenticated user with `admin` or `super_admin` role.

### Fleet Management
| Method | Endpoint | Status | Notes |
|---|---|---|---|
| `POST` | `/admin/bikes` | `[PLANNED & BUILT]` | Create bike with specs, registration, store assignment, and documents. |
| `PUT` | `/admin/bikes/{id}` | `[PLANNED & BUILT]` | Update bike attributes, store assignment, or status. |
| `DELETE` | `/admin/bikes/{id}` | `[PLANNED & BUILT]` | Soft-deletes a bike from active inventory. |
| `POST` | `/admin/bikes/{id}/documents` | `[PLANNED & BUILT]` | Upload RC, Insurance, or PUC cert for a specific bike. |
| `POST` | `/admin/bikes/bulk-import` | `[PLANNED & BUILT]` | Bulk CSV import of new fleet inventory with validation. |

### Pricing Rules & Coupons
| Method | Endpoint | Status | Notes |
|---|---|---|---|
| `GET` | `/admin/pricing-rules` | `[PLANNED & BUILT]` | List pricing rules (weekend, holiday, seasonal, one-way fees). |
| `POST` | `/admin/pricing-rules` | `[PLANNED & BUILT]` | Create pricing rule with category/store scopes and multipliers. |
| `GET` | `/admin/pricing-rules/{id}` | `[BUILT - ADDED]` | View details of a specific pricing rule. |
| `PUT` | `/admin/pricing-rules/{id}` | `[PLANNED & BUILT]` | Update rule dates, multipliers, or applicability. |
| `DELETE` | `/admin/pricing-rules/{id}` | `[PLANNED & BUILT]` | Delete pricing rule. |
| `GET` | `/admin/coupons` | `[PLANNED & BUILT]` | List discount coupons. |
| `POST` | `/admin/coupons` | `[PLANNED & BUILT]` | Create coupon with flat or percentage discount and usage limits. |
| `GET` | `/admin/coupons/{id}` | `[BUILT - ADDED]` | View coupon statistics and settings. |
| `PUT` | `/admin/coupons/{id}` | `[BUILT - ADDED]` | Update coupon parameters or active status. |
| `DELETE` | `/admin/coupons/{id}` | `[BUILT - ADDED]` | Soft delete coupon. |

### Stores & Staff Administration
| Method | Endpoint | Status | Notes |
|---|---|---|---|
| `GET` | `/admin/stores` | `[BUILT - ADDED]` | List all stores with operational hours and location coordinates. |
| `POST` | `/admin/stores` | `[PLANNED & BUILT]` | Create new store location. |
| `GET` | `/admin/stores/{id}` | `[BUILT - ADDED]` | Store details and inventory count. |
| `PUT` | `/admin/stores/{id}` | `[PLANNED & BUILT]` | Update store address, operational status, or geolocation. |
| `GET` | `/admin/staff` | `[BUILT - ADDED]` | List staff members and their store assignments. |
| `POST` | `/admin/staff` | `[PLANNED & BUILT]` | Create staff or store manager account. |
| `GET` | `/admin/staff/{id}` | `[BUILT - ADDED]` | View staff profile and permissions. |
| `POST` | `/admin/staff/{id}/stores` | `[PLANNED & BUILT]` | Assign staff to store(s) (many-to-many pivot). |
| `DELETE` | `/admin/staff/{id}/stores/{storeId}` | `[PLANNED & BUILT]` | Remove store assignment from staff member. |

### Bookings, Reports & Audit
| Method | Endpoint | Status | Notes |
|---|---|---|---|
| `GET` | `/admin/bookings` | `[PLANNED & BUILT]` | List bookings with store, date, channel, and status filters. |
| `GET` | `/admin/bookings/{id}` | `[BUILT - ADDED]` | Full booking detail, payment audit, and handover logs. |
| `PUT` | `/admin/bookings/{id}` | `[PLANNED & BUILT]` | Manual administrative override of booking parameters. |
| `POST` | `/admin/bookings/{id}/refund` | `[PLANNED & BUILT]` | Process partial or full manual refund with mandatory audit note. |
| `GET` | `/admin/reports/revenue` | `[PLANNED & BUILT]` | Aggregated revenue report grouped by store, bike, or channel. |
| `GET` | `/admin/reports/utilization` | `[PLANNED & BUILT]` | Fleet utilization percentages over specified date ranges. |
| `GET` | `/admin/activity-logs` | `[PLANNED & BUILT]` | Comprehensive audit trail of all money, inventory, and status mutations. |

---

## 8. Signed Document Downloads (Protected URLs)

These endpoints require valid HMAC signature parameters (`?signature=...&expires=...`) generated by the backend. Direct unauthenticated access without signature returns HTTP 403.

| Method | Endpoint | Status | Notes |
|---|---|---|---|
| `GET` | `/bike-documents/{id}` | `[BUILT - ADDED]` | Streams bike RC, Insurance, or PUC document securely. |
| `GET` | `/kyc-documents/{id}` | `[BUILT - ADDED]` | Streams customer identity documents securely. |

---

## 9. Server-to-Server Webhooks

Registered at both `/api/v1/webhooks/*` and root `/webhooks/*` for payment gateway compatibility.

| Method | Endpoint | Status | Provider | Purpose |
|---|---|---|---|---|
| `POST` | `/webhooks/razorpay` | `[PLANNED & BUILT]` | Razorpay | Confirms payments via HMAC-SHA256 signature verification. Moves booking to `confirmed`. |
| `POST` | `/webhooks/phonepe` | `[PLANNED & BUILT]` | PhonePe | Confirms payments via X-VERIFY checksum verification. Moves booking to `confirmed`. |
| `GET` | `/webhooks/whatsapp` | `[BUILT - ADDED]` | Meta Cloud API | Webhook challenge response for initial Meta handshake verification. |
| `POST` | `/webhooks/whatsapp` | `[PLANNED & BUILT]` | Meta Cloud API | Delivery status receipts (`sent`, `delivered`, `read`, `failed`) updated in `notification_logs`. |

---

## 10. Multi-Service & Ground Check-In Operations

### Ground Check-In & Fast Pass (`/admin/check-in`)
| Method | Endpoint | Status | Purpose |
|---|---|---|---|
| `GET` | `/admin/check-in` | `[BUILT - ADDED]` | Ground Pass QR scanner view with integrated camera feed. |
| `POST` | `/admin/check-in/lookup` | `[BUILT - ADDED]` | Look up customer booking via decoded QR pass token or phone number. |
| `POST` | `/admin/check-in/{type}/{id}/process` | `[BUILT - ADDED]` | Verify deposit and execute one-tap vehicle handover release. |
| `POST` | `/admin/check-in/sync` | `[BUILT - ADDED]` | Sync batch offline check-in inspections recorded in IndexedDB queue. |

### Multi-Service Bookings (`/admin/services`)
| Method | Endpoint | Status | Purpose |
|---|---|---|---|
| `GET` | `/admin/services/{type}/bookings` | `[BUILT - ADDED]` | List bookings for cars, used vehicle sales, or workshop repairs. |
| `POST` | `/admin/services/{type}/bookings` | `[BUILT - ADDED]` | Record offline counter booking for an assigned service type. |
| `GET` | `/admin/services/{type}/bookings/{id}` | `[BUILT - ADDED]` | View service booking detail with audit history. |
| `POST` | `/admin/services/{type}/bookings/{id}/payment` | `[BUILT - ADDED]` | Settle balance payment for service booking. |
| `POST` | `/admin/services/{type}/bookings/{id}/status` | `[BUILT - ADDED]` | Update service booking progression lifecycle. |
| `GET` | `/admin/services/{type}/bookings/{id}/voucher` | `[BUILT - ADDED]` | Render or download printable PDF confirmation voucher. |
| `GET` | `/admin/services/{type}/items` | `[BUILT - ADDED]` | Manage service catalog items, pricing tiers, and descriptions. |
| `POST` | `/admin/services/{type}/items` | `[BUILT - ADDED]` | Create new service catalog item. |
| `PUT` | `/admin/services/{type}/items/{id}` | `[BUILT - ADDED]` | Update service catalog item attributes. |
| `DELETE` | `/admin/services/{type}/items/{id}` | `[BUILT - ADDED]` | Soft-delete service catalog item. |

---

## 11. Mobile Apps API Integration & Rate Limiting

Dedicated rate limiting tier `throttle:mobile-api` is enforced for:
* **Block F:** Customer Mobile App (120 requests/minute)
* **Block G:** Store Operations Mobile App (180 requests/minute)
* **Guest / App Launch Checks:** 60 requests/minute (`/api/v1/staff/app-version`, `/api/v1/customer/app-version`)

Detailed versioning, deprecation handling, client headers, and offline retry policies are documented in [`MOBILE_INTEGRATION_NOTES.md`](MOBILE_INTEGRATION_NOTES.md).

