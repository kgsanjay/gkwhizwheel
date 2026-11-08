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

## Slice 5: cab staff operations desk

- `GET /admin/cab-operations` renders a responsive Inertia/MUI staff page via `AdminCabOperationsController`, using branch-filtered taxi booking, vehicle, driver, dispatch, pending reschedule and refund review data. A dedicated sidebar link is added under Taxi Bookings.
- UI actions call existing branch-authorized JSON endpoints; the interface cannot bypass compliance, booking lifecycle, schedule overlap or refund guards. Shows explicit confirmations for high-impact operations; errors are displayed rather than assuming success.
- Cab assignment selection includes matching branch and service item only; server remains authoritative on document validity and exact availability. Dashboard is deliberately limited to the latest 100 dispatches/proposals/reviews; pagination and search are later enhancements.
- Rescheduling UI describes proposal vs approval; approval requires explicit staff attestation of customer consent and unchanged fare, limited by backend to unpaid offline cab bookings. The system does not itself collect a customer e-signature.
- Refund action is labeled **review only/no payout**. No payment gateway or refund API is exposed in the interface.
- Feature tests cover customer denial and branch-scoped Inertia content. CI + manual keyboard/mobile/staging verification and real staff acceptance still required.

## Slice 6: internal dispute and incident register

- New additive `cab_disputes` table tracks taxi booking ID, branch, actor, classified incident (`billing`, `refund`, `service_quality`, `schedule`, `safety`, `other`), narrative and an open status. No PII or private documents are required in text.
- Authenticated `POST /admin/cab-bookings/{bookingId}/disputes` records incidents only for authorized taxi branch bookings. No booking, payment, cancellation or refund changes are performed.
- Cab operations desk displays branch-scoped dispute metadata and allows staff to log incidents. Free-text narrative remains server-side and is deliberately not exposed through dashboard listing.
- Tests verify role/branch boundary, unchanged booking/payment state, required narrative and fixed incident categories.
- This is **not** a finalized dispute resolution system. Owner-approved review escalation, append-only actions, evidence retention, notification and customer access are outstanding. Staging and real staff acceptance remain necessary.

## Slice 7: internal dispute review lifecycle

- Add `cab_dispute_events` append-only log: staff actor, from/to state, review notes and timestamp. All changes are serialized under a dispute row lock, preserving a non-overwritable history of recorded transitions.
- Authorized cab staff may move `open → reviewing → closed_internal` with required 10–2000 character review notes. Cannot skip states, replay transitions, or alter another branch's dispute.
- **Billing and refund disputes must stay under review** until future payment reconciliation and settlement controls exist. They are blocked from `closed_internal` to prevent false claims that money was returned.
- UI displays internal review control on the Cab Operations Desk. `closed_internal` means only incident triage is complete; it cannot confirm customer communication, payment or external resolution.
- No customer notifications, refunds, payment changes or sensitive evidence uploads are triggered. Requires staged role and browser tests before acceptance.

## Slice 8: cab customer-confirmation contact accuracy

- Cab-specific `ServiceBookingConfirmedNotification::getCoordinatorDetails()` now derives its desk name, contact number and meeting spot from the actual `ServiceBooking.store` and explicitly saved pickup location. Never use old unverified fixed taxi coordinator phone/spot for taxi messages.
- When branch phone is absent, message states contact details are pending verification. When pickup spot is absent, state that the pickup point needs staff confirmation. Do not claim assigned driver identity.
- Both mail and WhatsApp use the same cab-specific contact metadata. Existing notification templates for the other six service types are unchanged.
- Added cab feature tests for approved branch phone/pickup and unknown contact fallback.
- **This does not authorize automatic notification dispatch** on cancellation, reschedule proposal, disputed payment or refund. Before enabling new sends: verify customer consent, notification provider/templates, approved branch contacts and event deduplication. Do not publicize customer document details.

## Slice 9: notification intent tracking, no delivery

- A separate `cab_notification_events` ledger stores durable intent records, with globally unique `event_key`, booking ID, event type, recorded timestamp and `pending_approval` status.
- Successful pre-departure cancellation and approved unpaid offline rescheduling atomically record the matching event in the same database transaction. Failed operations roll back intents as well as bookings.
- Unique keys (`dispatch_cancelled:<dispatch_id>` and `reschedule_approved:<proposal_id>`) prevent duplicate event records from retries/replay. No attempts are made to send email, WhatsApp, SMS or mobile push from this ledger.
- Staff Cab Operations Desk displays branch-scoped notification intents, explicitly marked not sent. No attempt is made to infer delivery from a pending event.
- Tests cover cancellation intent, idempotent re-recording, rejected event types and non-taxi booking protection.
- **Future authorization requirements:** verified recipient and opt-in, approved copy/WhatsApp templates, outbox dispatch with delivery-provider idempotency and webhook tracking, retry/backoff policy and explicit customer-facing notification status. Do NOT mark pending intents as delivered without provider receipt.
- The shared cab email fallback was corrected after CI identified that its second coordinator-info use still inserted empty parentheses for a missing branch phone. CI needs to be rerun before acceptance.

## Slice 10: read-only settlement reconciliation (no transfers)

- Branch-authorized `GET /admin/cab-bookings/{bookingId}/settlement-preview` calculates amounts from the current taxi `service_bookings` record and `service_payment_receipts` ledger (paise integers); returns booking amount, recorded advance, recorded balance, receipt total/count, review status and explicit discrepancy flags.
- Flags: receipt/advance mismatch, invalid booking arithmetic, receipt total over booking total, booked advance without a gateway receipt, and cancelled paid booking without a refund-review request. A cash/manual payment can create a flagged mismatch; this is **not** an assertion of fraud or proof of error.
- `refund_eligible` and `refund_amount_paise` remain explicitly **null**, while `payout_status` is `not_supported`. No finance policy can be inferred and no gateway calls are issued.
- Staff dashboard provides a read-only per-refund-review inspection action and shows reconciliation issues without marking money refunded.
- Owner must approve cancellation policy and finance controls, independent payment verification and refund ledger before any actual settlement workflow. Browser, MySQL and branch-scope tests remain acceptance gates.

## Still required for Issue #56

- Proposed new schedule request with approval, driver/vehicle re-availability and all-or-nothing reassignment; never edit a running trip's booking window silently.
- Explicit owner-approved cancellation cutoffs, penalties, waiting rates, tolls and outstation inclusion policy (none can be inferred).
- Settlement records for approved actuals, payment source/receipt matching, refunds through gateway ledger and idempotent webhook handling.
- Dispute log and evidence privacy, finance reconciliation export, customer/staff UI, mobile browser and real staging end-to-end tests.
- Link CI + staging acceptance evidence and reviewer sign-off before closing #56 or parent epic #29.

No live or staging database updates have been executed by this PR.
