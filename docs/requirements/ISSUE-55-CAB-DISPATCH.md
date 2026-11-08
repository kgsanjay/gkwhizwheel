# Issue #55 — Cab dispatch, driver assignment and trip timeline

## Delivered in this PR

- Additive `cab_dispatches` (one per confirmed service booking), `cab_dispatch_events` (append-only chronological transitions).
- `CabDispatchService::assign` requires a future confirmed, priced cab booking with selected service item/active branch, explicit start and end, branch/role authorization, an independently verified cab and licensed driver with active linked resource and capacity. Online confirmed bookings also need a consistent owned quote snapshot.
- Vehicle capacity is checked against booking passenger quantity. Driver and vehicle must belong to the same branch and same cab service item; both must have current approved documents, an active status and capacity-one resource.
- The two resources are reserved through existing `ServiceResourceAllocator` **inside one DB transaction**, with deterministic resource lock order. Overlapping vehicles/drivers are rejected; any failure rolls back all allocations, dispatch and events. A unique booking key forbids multiple dispatch records.
- Authorized staff-only JSON endpoints: `GET /admin/cab-dispatches`; `POST /admin/cab-dispatches`; `POST /admin/cab-dispatches/{id}/start`; `POST /admin/cab-dispatches/{id}/complete`; `POST /admin/cab-dispatches/{id}/cancel`. List is scoped to active assigned branches, excludes raw driver licence and customer contacts.
- Trip start/complete follow existing `ServiceBookingLifecycle` from `confirmed` to `in_progress` to `completed`; cancellation only allowed before trip starts, releases both allocations. A running trip cannot be silently cancelled or freed.
- Optional trip odometer: arrival cannot be less than departure. Operations staff action and timestamp are recorded in an event table. No staff-entered fee or customer payment is created by this feature.

## Important remaining work

1. Build a staff-facing responsive dispatch screen with matching vehicle/driver selector, schedule and status controls. These are authenticated API contracts only.
2. Integrate approved non-bike customer quotes, actual cab checkout, and explicit staff promotion of enquiries. Customer cab requests still remain requests. No fake guaranteed dispatch.
3. Audit customer notification process; issue #55 requires notification after assignment, but this PR intentionally does not send a **confirmed driver** message until consent/verified dispatch contact/privacy/notification delivery have been accepted.
4. Capture actual trip notes, pickup verification, optional odometer with receipt, handover/time logs, cancellation reason, driver earnings and payment settlement. No payouts are automatically generated.
5. Race test under the actual staging database with separate workers/connections; SQLite feature tests do not prove production row-lock behaviour. Check same resource overlapping windows and rollback, staff branch access, cancellation and rebooking.
6. Document genuine cab insurance/permit/fitness/driver licence validity, owner/partner agreements and capacity. No documents, fare rates, cab vehicles or drivers are seeded or auto-activated.
7. Confirm active branch staffing and operational contact details on staging. Take a verified backup before migrations; preserve old bookings and history.
8. Verify corresponding customer page, staff/mobile web, keyboard accessibility, actual sandbox checkout, refund and operational reports. Attach staging SHA, screenshots, redacted audit evidence and owner signoff to Issue #55. Keep OPEN until definition of done.

No ServerByt deployment, live database write, customer payment, or automatic vehicle-driver dispatch occurred.
