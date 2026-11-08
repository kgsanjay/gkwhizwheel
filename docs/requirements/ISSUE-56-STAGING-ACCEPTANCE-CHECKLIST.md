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


## CI: real MySQL race gate

- `.github/workflows/cab-mysql-concurrency.yml` starts a **disposable MySQL 8.0 service** with a CI-only database; it does not connect to staging or production.
- `tests/Feature/CabMySqlConcurrencyTest.php` migrates this isolated database, creates two confirmed taxi bookings competing for a single capacity-one cab resource, forks two independent PHP processes with separate DB connections, and simultaneously calls `ServiceResourceAllocator::allocate`. Accept only exactly one successful reservation and exactly one capacity rejection, with one confirmed allocation in storage.
- The CI test explicitly **fails** if the required MySQL driver or process-fork extension is missing; silent SQLite-only success is not acceptable.
- The MySQL workflow now includes **two distinct cross-process races**: allocator capacity-one contention and a full `CabDispatchService::assign` race for the same cab plus driver. The paired test requires exactly one dispatch, one allocation per resource, and matching booking IDs for both allocations. Approval is contingent on a green workflow for this added test.
- **Full rescheduling vs competing assignment**, and real staging browser/transaction tests, remain blocking acceptance requirements.
- The CI MySQL service credentials are disposable test values, never credentials for the real business servers.


## Discovered MySQL isolation issue — November 8, 2026

- The first paired dispatch race **failed**: both workers reported success despite overlapping bookings. This is a real overbooking blocker; SQLite-only CI had passed.
- Root-cause hypothesis: a plain aggregate overlap read inside `ServiceResourceAllocator` can reuse a REPEATABLE READ snapshot established before waiting for the resource row lock. The allocator now uses `lockForUpdate()->get(['quantity'])->sum('quantity')` after resource locking to obtain a current read. The cab reschedule conflict query similarly uses `lockForUpdate()->first(['id'])` instead of a snapshot `exists()`.
- Neither fix should be accepted merely on code review. **Block merge until green independent-process MySQL race runs on the corrected head.** Retest full cab+driver dispatch, allocation counts, and then add reschedule-vs-assignment concurrency on actual MySQL.

## MySQL reschedule-versus-dispatch race

- Added a third disposable MySQL integration scenario: an existing assigned taxi trip requests an unpaid offline move into tomorrow's slot while a competing confirmed booking attempts to assign the **same** documented cab and driver to that slot simultaneously.
- Children use separate MySQL connections and a start barrier. Exactly one operation must succeed, no overlapping confirmed allocations for the target slot, both resource allocations must follow the same booking, and a rescheduling notification intent can exist only if the reschedule was approved.
- This is a **blocking CI assertion**; do not infer safety from SQLite or the earlier paired assignment check. It is not an external payment settlement test, customer-notification delivery test, or staging acceptance.

## Repeated MySQL gate and retry checks

- Baseline `c30b0fc`: CI and MySQL run [42442620327](https://github.com/kgsanjay/gkwhizwheel/actions/runs/42442620327) passed all three race scenarios (29 assertions). This verifies the reschedule-versus-assignment test on that exact commit.
- The MySQL workflow now executes ten separate suite processes, stopping on the first failure; each starts with a fresh migrated disposable database through RefreshDatabase. This is bounded repeatability coverage, not long-running load or staging acceptance.
- Workers must reject on the expected capacity validation field; unrelated business validation errors fail the race assertion. Unexpected exceptions and database errors remain failures.
- The allocator winner is replayed twice after the race and must return the original allocation ID with exactly one allocation row.
- The strengthened gate requires its own current-head green run before acceptance. Cancellation-versus-assignment coverage, longer stress runs, staging checks and owner sign-off remain pending.

## Cancellation versus assignment and durable recording failure

- Independent MySQL workers now race cancellation of an assigned pre-departure trip against another booking assigning (a) the same cab and driver, or (b) a separate cab with the same driver. The existing ten-repetition gate includes both cases.
- Cancellation must succeed. Assignment may succeed after release or reject on capacity before release; a rejected assignment must leave no dispatch or allocation and must succeed when retried after cancellation. Both original allocations remain released and both replacement allocations belong to the competing booking.
- The shared-driver fixture creates the free cab resource before the driver resource; an explicit pre-race attempt verifies rollback of the first allocation when the driver is occupied.
- Cancellation creates one audit transition and one pending, unsent notification intent. Duplicate cancellation cannot add either record or release the replacement booking's allocations.
- Injected audit-row and notification-intent insert failures must roll back booking/dispatch status, both releases, audit and notification intent together; retry must then complete once. These failure-injection cases run on SQLite in standard CI and on MySQL in the dedicated gate.
- This slice awaits its own green CI evidence. Staging/role/browser acceptance, long-running stress, owner-approved policy and customer notification delivery remain pending. No real sends, refunds, database deployment or merge is authorized by these tests.
