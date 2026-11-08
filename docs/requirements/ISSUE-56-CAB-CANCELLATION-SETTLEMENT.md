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

## Still required for Issue #56

- Proposed new schedule request with approval, driver/vehicle re-availability and all-or-nothing reassignment; never edit a running trip's booking window silently.
- Explicit owner-approved cancellation cutoffs, penalties, waiting rates, tolls and outstation inclusion policy (none can be inferred).
- Settlement records for approved actuals, payment source/receipt matching, refunds through gateway ledger and idempotent webhook handling.
- Dispute log and evidence privacy, finance reconciliation export, customer/staff UI, mobile browser and real staging end-to-end tests.
- Link CI + staging acceptance evidence and reviewer sign-off before closing #56 or parent epic #29.

No live or staging database updates have been executed by this PR.
