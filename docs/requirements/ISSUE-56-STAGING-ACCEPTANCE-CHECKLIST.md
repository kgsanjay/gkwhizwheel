# Issue #56 — Cab Operations staging acceptance checklist

**Status:** not accepted. This is a test plan; no claims of staging deployment or actual external payment/notification delivery.

## Prerequisites
- Confirm the test deployment uses a **staging-only** hostname, test database, test credentials and captured DB backup.
- Confirm Laravel migration files `000005` through `000011` have been reviewed for additive compatibility, indexes, foreign keys and rollback safety.
- Deploy only after latest CI green, reviewer approval, and backup verification. Never deploy unreviewed changes to `main` or production.
- Seed or create **test** Honnavar and Murudeshwar branches with separately authorized staff and verified cab/driver records. No real customer PII or real transactions.

## Booking and cab lifecycle
- Assign an approved cab+driver to a confirmed, future, priced taxi booking; reject duplicate assignments, missing eligibility, wrong branch/service item and passenger count above seats.
- Simultaneously allocate the same cab/driver in overlapping bookings using **real MySQL transactions in separate connections**; exactly one succeeds and the other fails without partial allocations.
- Confirm adjacent half-open time slots are accepted. Confirm active-trip start, completion and resource release; reject forbidden state transitions and decreasing odometer.
- Confirm pre-departure cancellation requires a reason, releases both allocations, records an audit event and cannot be repeated. Reject cancellation after departure.

## Rescheduling
- Submit future reschedule proposal and verify original booking, dispatch and allocations stay unchanged until approval.
- Reject duplicated pending proposals, expired windows, stale original slots and cross-branch operations.
- For an **unpaid offline** booking, attest customer consent and unchanged fare; successful approval moves both resource allocations, booking and dispatch together.
- Simultaneously attempt conflicting new allocation and reschedule approval in separate real MySQL connections. Assert no double booking or half-updated resources.
- Reject paid/online bookings without a separately approved quote/repricing. **Also reject a nominally unpaid offline booking if service payment receipts exist despite zero cached advance, or an accepted quote snapshot exists.** Rejecting a proposal must preserve original itinerary.
- Force a driver-only conflict after the cab vehicle has passed availability checks; assert rollback of **both** allocations and absence of a reschedule notification event. Local SQLite rollback tests complement, but do not replace, real concurrent MySQL connection tests.

## Finance and disputes
- Cancel a test booking, request internal refund review twice; verify one review only and no gateway call or payout record.
- Inspect `settlement-preview` on authorized branch booking: verify total/advance/balance arithmetic, multiple payment receipt sum, stale review snapshot indicators and missing/overpaid receipt scenarios.
- Verify outputs `refund_eligible=null`, `refund_amount_paise=null`, `payout_status=not_supported` regardless of any recorded payment.
- Verify financial dispute cannot move to `closed_internal`. Non-financial triage transitions should create immutable audit events, and cross-branch access must be denied.
- Confirm no bike-specific refund service is invoked and no approved refund policy has been assumed.

## Notifications and privacy
- Verify internal notification intents are recorded once for successful cab cancellations and approved reschedules; failed transactions create none.
- Verify every intent remains `pending_approval`: **no WhatsApp/email/push/SMS send**, no success label indicating delivery.
- Cab confirmation templates should use the real booking branch contact and saved pickup; unknown values show pending verification instead of hardcoded phone/location.
- Test anonymous/customer roles, authorized branch-scoped staff, super admin, and a cross-branch staff member. No leakage of unmasked ID documents, personal mobile numbers, dispute descriptions or payment gateway references in the dashboard.

## Browser/accessibility/operational acceptance
- Verify Cab Operations Desk on desktop and narrow mobile browser: keyboard navigation, visible focus, form validation, toast/error state, reload after successful action, and no double-click duplicate actions.
- Validate labels for `refund review`, `reschedule proposal`, `notification pending approval`, and `closed internally` avoid suggesting paid refunds or already-delivered notifications.
- Capture screenshots, exact test date, build commit SHA, approver identity, recorded defects and remediations.
- Owner/finance must approve cancellation/refund/notification policies **before** any gateway refund, pricing adjustment or automated delivery work. Only close #56 after sign-off and accepted staging evidence.
