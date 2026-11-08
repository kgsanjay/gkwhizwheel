# Issue #56 — Cab cancellation, rescheduling, settlement and QA

## Slice 1: pre-start cancellation reasons (this PR)

- Authorized cab staff must submit a non-empty 5–1000 character reason to the existing **pre-start** cancellation endpoint.
- Existing transaction and role/branch eligibility checks remain in `CabDispatchService`. Booking cancellation and paired vehicle/driver allocation release remain atomic.
- Append-only `cab_dispatch_events` now optionally store the cancellation reason. Pre-existing event records are preserved with NULL reason; no sensitive customer documents are recorded.
- Existing service-level `cancel(...)` call sites remain backwards-compatible. The HTTP endpoint requires a reason; cancellations of running trips remain blocked.
- This change **does not** refund payments, impose penalties, approve trip fees, or notify customers. Cancellation state is not synonymous with money refunded.

## Before staging

1. Take a verified and restorable database backup. Confirm MySQL/PHP migration version and latest deployment SHA.
2. Execute targeted tests: `php artisan test tests/Feature/CabDispatchFlowTest.php`, then full suite and CI; confirm migration on isolated staging copy.
3. Verify staff same-branch authorization, inaccessible cross-branch records, blank/invalid reason validation, audit event persistence, cancellation allocation release, duplicate cancel rejection, and running-trip denial.
4. Deploy to staging only after review; preserve all historical bookings and payment/ledger records. Capture redacted screenshots/logs and exact SHA.
5. Request owner acceptance and verify customer notification/financial policy before changing any refund or settlement behaviour.

## Slice 2: cab rescheduling proposal intake

- Branch-authorized POST `/admin/cab-dispatches/{id}/reschedule-requests` records a future, valid new start/end schedule and required reason for an assigned, confirmed, not-yet-started cab trip.
- Pending requests block duplicate outstanding proposals; immutable original and proposed schedules are recorded separately.
- This is **proposal-only**: booking/dispatch schedule, allocations, vehicle/driver assignment, price and payment remain unchanged. The requested period is NOT confirmed or held. Customer must not be told the changed time is approved.
- Automated coverage checks pending duplicate, cross-branch/customer 403, invalid dates, in-progress rejection and no existing schedule/allocation mutations.
- Before implementing approval: add resource-level transactional reallocation with locked vehicle and driver, conflict detection, explicit customer consent, tariff difference review, acceptance/rejection audit and notification.

## Slice 3: guarded reschedule approval and rejection

- Authorized admin/staff resolves proposals at `POST /admin/cab-reschedule-requests/{id}/resolve` with `decision=approved|rejected`. Reject requires reason; approval requires explicit confirmed customer consent and unchanged-fare authorization.
- Approval is limited to **unpaid offline** cab bookings (walk-in/phone); online priced snapshots and any paid booking require a future repricing/settlement integration and are rejected.
- While holding a database transaction, lock dispatch, booking and assigned vehicle/driver resources in stable resource ID order; reject overlaps with other confirmed or unexpired held allocations; update *both* allocation windows, dispatch and booking times together. Failure reverts everything. Reviewed actor/time/reason retained.
- Rejection leaves the confirmed booking and allocations untouched. Duplicate or stale decisions are rejected. No automatic customer notification is generated, so staff must inform customer through approved communication procedures.
- **Staging MySQL concurrency test required** before operational use. Staff attestations are not independently verified; enforce owner policy and document approval procedures before accepting requests.

## Slice 4: cab-specific refund review intake (no refund execution)

- Bike `RefundService` and `refunds` records belong to bike `Booking` / `Payment`, and MUST NOT be used for cab `ServiceBooking` refunds.
- Additive `cab_refund_reviews` table with unique `service_booking_id`, requester, reason, server-summed verified `service_payment_receipts.amount_paise`, and the separately recorded `advance_paid` snapshot.
- Branch-authorized POST `/admin/cab-bookings/{bookingId}/refund-reviews` only accepts cancelled taxi bookings, returns the existing review on repeat submissions (idempotent); never invokes Razorpay, PhonePe or changes `payment_status`, booking amounts or ledger receipts.
- `reconciliation_required` flags a difference between recorded advance and gateway receipts. These can represent legitimate offline/manual payments: mismatch is **not** a financial fraud claim, nor is agreement proof of payout eligibility. Finance must reconcile all sources.
- **No refund amount, cancellation fee, percentage or entitlement is calculated or promised.** Payout approval requires published owner policy, verified captured payment and any prior refunds, dedicated idempotent service-refund ledger, gateway authorization and webhook reconciliation.
- Tests cover cancellation-only/branch guards, repeat requests without duplicate records, receipt reconciliation, and unchanged booking payment state. Verify again on staging database.

## Still required for Issue #56

- Proposed new schedule request with approval, driver/vehicle re-availability and all-or-nothing reassignment; never edit a running trip's booking window silently.
- Explicit owner-approved cancellation cutoffs, penalties, waiting rates, tolls and outstation inclusion policy (none can be inferred).
- Settlement records for approved actuals, payment source/receipt matching, refunds through gateway ledger and idempotent webhook handling.
- Dispute log and evidence privacy, finance reconciliation export, customer/staff UI, mobile browser and real staging end-to-end tests.
- Link CI + staging acceptance evidence and reviewer sign-off before closing #56 or parent epic #29.

No live or staging database updates have been executed by this PR.
