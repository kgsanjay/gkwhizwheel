# Changelog

All notable changes to the GK WhizWheel platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-09-06

### Initial MVP Release

Initial release of the GK WhizWheel unified online and offline bike rental platform.

#### Added
- **Fleet & Multi-Store Management:**
  - Dynamic store management supporting custom operating hours, geolocations, and staff store assignment pivots.
  - Comprehensive bike inventory management with category pricing, document tracking (RC, Insurance, PUC), and maintenance status toggles.
  - CSV bulk import endpoint for rapid fleet onboarding.
- **Dynamic Tiered Pricing Engine:**
  - Centralized `PricingService` calculating 24-hour block durations, hourly grace periods, and tiered volume discounts.
  - Support for holiday, weekend, and seasonal price multipliers, plus one-way rental return fees.
  - Coupon discount system supporting fixed amount and percentage discounts with usage restrictions.
- **Concurrency-Safe Availability & Holds:**
  - Row-level database locks (`SELECT ... FOR UPDATE`) in `AvailabilityService` preventing double-booking during peak checkout.
  - 10-minute temporary reservation holds with automated background release via `bookings:release-expired-holds` scheduled every minute.
- **Customer Web Booking & Payments:**
  - Interactive bike catalog, real-time availability calendar, and itemized price quote calculator.
  - Payment gateway integrations for Razorpay and PhonePe with cryptographic webhook signature verification (`X-Razorpay-Signature` and `X-VERIFY`).
  - Strict client-callback protection: bookings only confirm upon verified gateway webhook receipt.
  - Self-service booking cancellation with automated refund tier calculation (`RefundService`) and rental duration extension.
- **Staff Store Manager App (React Native):**
  - Walk-in customer lookup by phone with unified KYC document upload.
  - Walk-in booking creation and in-person payment collection (Cash, Card, Store UPI).
  - Digital vehicle handover flow capturing starting odometer, condition inspection photos, and customer digital signature.
  - Return inspection flow calculating automatic late fees, damage deduction overrides, and updating `bikes.current_store_id` for one-way rentals.
  - Offline-resilient queue with persistent local storage, "Pending Sync" visual badges, and automatic batch reconciliation via `/staff/sync`.
  - In-app version check against `/staff/app-version` prompting staff to update when a new APK build is released.
- **Document Security & Compliance:**
  - HMAC-signed temporary URLs for all vehicle compliance documents (RC, Insurance, PUC) and customer KYC files.
  - Automated compliance alert command (`compliance:check-expiries`) flagging documents approaching expiration (30-day alert) and enforcing hard booking blocks on expired bikes.
- **Notifications & Multi-Channel Delivery:**
  - Multi-channel notification pipeline sending transactional emails via SMTP and instant WhatsApp messages via Meta Cloud API.
  - Automatic fallback to email when WhatsApp delivery fails or recipient lacks a mobile number.
  - Comprehensive webhook receiver logging WhatsApp delivery receipts (`sent`, `delivered`, `read`, `failed`) into `notification_logs`.
- **Administrative Audit & Reporting:**
  - Audit logging of all critical mutations (inventory changes, price overrides, manual refunds, and store assignments) via `spatie/laravel-activitylog`.
  - Aggregated revenue reports and fleet utilization analytics endpoints.
- **Production Shared-Hosting Optimization:**
  - Configured for zero-daemon shared cPanel hosting using `file` cache, `database` session, and `sync` queue drivers.
  - Automated Spatie database and file backup schedules.
  - Complete Pest feature test suite passing 312 tests (2,445 assertions).
