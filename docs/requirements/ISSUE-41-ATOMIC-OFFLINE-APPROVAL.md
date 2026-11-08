# Issue #41: atomic unpaid offline reservation approval

Implemented on PR #131; main and deployed systems are unchanged. This is a bounded operational approval backend, not completion of the seven-service booking requirements.

## Contract

Admin counter creation and the staff creation API create unpaid, expiring holds. Positive advances, online booking channels and direct confirmed counter creation are rejected. No confirmation notification is sent for a proposal. Creation itself does not reserve typed capacity.

A manager assigned to the service and active branch, or an active super administrator, can approve through:

- `POST /admin/services/{serviceType}/bookings/{id}/approve`
- `POST /api/v1/staff/service-bookings/{id}/approve`

Required review fields: `expected_total_paise`, `expected_starts_at`, `expected_ends_at`, and `approval_notes` (5–1200 characters). Non-cab services require one `resource_ids` entry of the appropriate type. Cab approvals require `cab_vehicle_id` and `cab_driver_id`, reusing document, branch, seat and paired-capacity checks. Generic two-wheelers records cannot be approved; bike rentals retain their dedicated workflow.

Approval locks the booking, validates the reviewed amount and complete future interval, rejects expired holds and historical paid/online/quote-linked records, allocates typed resources, verifies reservation readiness, and records `service_booking.approved` in one transaction. Failure restores the proposal and removes all tentative allocations/dispatch data. Identical authorized replay returns the existing confirmation without extra allocation/audit. Changed inputs or unaudited legacy confirmations cannot be adopted through replay.

Stored financial fields remain unchanged. This explicitly approves the existing proposed amount; it does not calculate duration-aware fares, approve commercial policy, take payment, reconcile historical money or issue refunds. Notes are masked by the existing audit sanitizer.

Generic staff/admin status changes cannot confirm or skip lifecycle stages. Starting/completing non-cab reservations requires ready resources; completion/cancellation releases this booking's allocation transactionally with its status audit. Confirmed/in-progress cabs must use the dedicated dispatch workflow to preserve paired trip state. No customer messages or external financial operations are added by approval.

## Evidence and remaining acceptance

`ServiceBookingApprovalTest` covers role/branch checks, stale/expired/paid/online/legacy records, malformed schedules, wrong resources, overlap, audit rollback, replay and lifecycle release. `CabDispatchFlowTest` covers successful paired approval/replay and rejected driver eligibility. `ServiceApprovalMySqlConcurrencyTest` uses independent processes to race different proposals and identical approval retries on the disposable `gkw_cab_race_ci` database. CI explicitly runs these on MySQL; SQLite cannot verify row locking.

Remaining: operator resource-selection/review UI, enquiry-to-proposal handoff, full service-specific commercial rules and immutable accepted pricing/terms, customer consent/notification acceptance, staging acceptance across every service, historical-data review and deployment rehearsal. Approval of legacy records with money or missing ownership remains a separate controlled workflow. Do not mark #41 or #51 completed from this backend slice alone.
