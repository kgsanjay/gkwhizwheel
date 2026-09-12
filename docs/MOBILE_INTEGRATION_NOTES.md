# GK WhizWheel — Mobile Apps API Integration Notes

This document provides architectural, rate limiting, versioning, and deprecation integration guidelines for the two mobile applications:
* **Block F:** Customer Mobile App (Android / iOS)
* **Block G:** Store Manager & Staff Operations Mobile App (Android / iOS)

---

## 1. Overview & Separation from Web API

The GK WhizWheel backend serves three primary client types:
1. Public Customer Website & Admin Web Panel
2. **Customer Mobile App (Block F)**
3. **Store Staff Operations Mobile App (Block G)**

To prevent web browser traffic surges from interfering with physical store operations and mobile customer bookings, a dedicated rate limiting tier is enforced via `throttle:mobile-api`.

### Rate Limit Quota Comparison

| Client Category | Throttle Middleware | Rate Limit Quota | Key Isolation Pattern |
|---|---|---|---|
| **Staff Mobile App (Block G)** | `throttle:mobile-api` | **180 requests/min** (3 req/sec) | `mobile-api:{platform}:user:{staff_id}` |
| **Customer Mobile App (Block F)** | `throttle:mobile-api` | **120 requests/min** (2 req/sec) | `mobile-api:{platform}:user:{customer_id}` |
| **Guest Mobile App** | `throttle:mobile-api` | **60 requests/min** (1 req/sec) | `mobile-api:{platform}:ip:{ip_address}` |
| **Web Customer Bookings** | `throttle:bookings` | 60 requests/min | `bookings:{user_id\|ip}` |
| **Web Gateway Payments** | `throttle:payments` | 30 requests/min | `payments:{user_id\|ip}` |

---

## 2. Why the Mobile Limits are Sized This Way

### Block G: Staff Operations App (180 req/min)
* Store staff handle rapid walk-in customers during peak hours.
* Continuous QR code/barcode scanning of bikes and helmets.
* Real-time customer phone number lookup (`/api/v1/staff/customers/lookup?phone=`).
* Uploading multi-angle vehicle handover condition photos.
* Batch synchronization from the offline SQLite queue (`/api/v1/staff/sync`) where multiple pending transactions are flushed concurrently upon network reconnection.

### Block F: Customer Mobile App (120 req/min)
* Interactive map browsing and availability queries across multiple stores and dates.
* Quick price quotes with instant coupon recalculations.
* Polling payment confirmation status after UPI or card intent completion.

### Key Isolation (Anti-Starvation)
All mobile rate limit buckets are isolated by platform and user ID:
`mobile-api:{platform}:{user_id|ip}`
This guarantees that multiple store employees or customers connected to the same store Wi-Fi network (sharing one public IP) do not exhaust each other's rate limit quotas.

---

## 3. Required Mobile Request Headers

Every request sent by the Block F and Block G mobile applications must include the following identification headers:

```http
Authorization: Bearer <sanctum_token>
X-App-Platform: android | ios
X-App-Version: 1.2.0
X-Client-Type: staff_app | customer_app
Accept: application/json
Content-Type: application/json
```

For offline-resilient write operations (such as creating bookings or syncing pending offline items), the request must also include:
```http
Idempotency-Key: <unique_uuid_v4>
```

---

## 4. App Versioning & Deprecation Safety

### Version & Deprecation Check Endpoints

Both mobile applications should check their version compatibility on app launch:

* **Staff Operations App:**
  ```http
  GET /api/v1/staff/app-version
  ```
  Response:
  ```json
  {
    "success": true,
    "data": {
      "latest_version": "1.2.0",
      "min_required_version": "1.0.0",
      "apk_url": "https://yourdomain.com/downloads/gkwhizwheel-staff-v1.2.0.apk",
      "release_notes": "Enhanced offline sync resilience and instant handover baseline.",
      "published_at": "2026-09-06"
    },
    "message": "Staff app version information retrieved successfully."
  }
  ```

* **Customer Mobile App:**
  ```http
  GET /api/v1/customer/app-version
  ```
  Response:
  ```json
  {
    "success": true,
    "data": {
      "latest_version": "1.0.0",
      "min_required_version": "1.0.0",
      "download_url": "https://yourdomain.com/downloads/gkwhizwheel-customer-v1.0.0.apk",
      "release_notes": "Initial release with live bike search, instant availability, and KYC verification.",
      "published_at": "2026-09-12"
    },
    "message": "Customer app version information retrieved successfully."
  }
  ```

### Deprecation Response Headers

When an outdated mobile app version (`X-App-Version < min_required_version`) hits the API or exceeds limits, the response includes explicit deprecation metadata:
* `X-API-Deprecated: true`
* `X-API-Minimum-Version: 1.0.0`

### Rate Limit Exceeded (HTTP 429) Response Structure

When mobile rate limits are breached, the server returns a structured, mobile-safe JSON envelope:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 180
X-RateLimit-Remaining: 0
X-API-Deprecated: true
X-API-Minimum-Version: 1.0.0
Content-Type: application/json
```

```json
{
  "success": false,
  "message": "Too many mobile API requests. Please slow down and try again later.",
  "errors": {
    "code": "MOBILE_RATE_LIMIT_EXCEEDED",
    "retry_after": 60,
    "client_version": "0.9.0",
    "min_supported_version": "1.0.0",
    "is_deprecated_client": true
  }
}
```

---

## 5. Mobile App Offline Sync & Retry Best Practices

1. **Exponential Backoff:** If the app receives HTTP 429 or HTTP 503, pause sync operations for the number of seconds specified in the `Retry-After` header or `errors.retry_after` before retrying.
2. **Idempotency Safeguard:** When retrying failed requests (e.g. offline queue flush), never generate a new `Idempotency-Key`. Always reuse the original UUID stored in the local SQLite `sync_queue` table.
3. **Forced Upgrade Prompt:** If `data.min_required_version` exceeds the current installed version or `is_deprecated_client` is `true`, display a non-dismissible modal directing the user to update the app.
