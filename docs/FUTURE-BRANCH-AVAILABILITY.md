# Phase 3 — future bike location safeguards

This branch stacks on **PR #6 (directional one-way fees)** and targets that branch, not `main`. It implements a conservative booking-location forecast; it does **not** yet implement manual transfer scheduling.

## Rules in this implementation

1. Existing physical location is `bikes.current_store_id`.
2. Future unexpired HELD, PENDING_PAYMENT, CONFIRMED and HANDED_OVER bookings are examined in date order, using each booking's pickup and return store IDs.
3. The proposed booking is inserted into that timeline. Each pickup must match the immediately preceding expected return location; a new booking must not strand a later existing booking at the wrong branch.
4. Dates are inclusive. Same-day return/pickup is deliberately rejected, leaving time for inspection and branch operations.
5. Cancelled, expired, no-show and completed bookings, and stale expired holds, are not active future commitments.
6. Physical pickup and both active-store requirements from PR #6 remain in place; future projected pickup locations may differ from the current physical store.
7. Public date-filtered fleet searches use the same availability checks. Pending-payment holds block those results too.
8. Booking holds continue locking the bike row before checking the full schedule and creating the hold.

### Example

A Honda Activa physically at Murudeshwar has a confirmed booking on Nov 8–9 from Murudeshwar to Honnavar. A new Nov 12–13 Honnavar pickup is permitted, assuming the vehicle is available and remains scheduled there. The same Nov 12–13 Murudeshwar pickup is refused. A newly inserted earlier one-way booking that would invalidate a later confirmed Murudeshwar pickup is also refused.

## Deliberate limits and remaining release blockers

- This is a forecast of **reserved returns**, not a guarantee that a bike was actually returned. Late returns, maintenance, breakdowns and changed return locations require operations intervention and revalidation.
- Manual **future bike transfers** are not represented. Until transfer plans, approvals, confirmation and audit logging are built, only a chain of existing bookings is projected.
- Public date search projects a same-branch return if no return destination is selected. The checkout must re-check the actual user-selected route and fee.
- The status=AVAILABLE guard from PR #6 is conservative: ON_RENT bikes are not newly bookable even for a future date. Relax this only after handling current active bookings and inspections correctly.
- The implementation assumes single-calendar-day pickup/return boundaries and inclusive dates. Real time-based handover windows and turnaround-buffer rules are a follow-up.
- Projection runs in the application layer per bike. It is suitable for the current small fleet, but should be optimized/batched and verified on MySQL under real concurrency before scaling.
- Operations workflows that change booked return branches, approve late returns or transfer bikes must rerun availability checks on the remaining booking chain. Do not allow arbitrary admin edits that silently break future pickups.
- Existing open PR #4 (public UI) and PR #7 (branch landing pages) have not been merged. Integrate, rebase, then run full CI before staging.
- No code was deployed to `staging.whizwheels.in` or production.

## Acceptance tests

- Murudeshwar → Honnavar booking determines the next pickup location.
- Date-filtered public catalog lists the bike in Honnavar, not Murudeshwar.
- Inserting an earlier route cannot invalidate an existing later pickup.
- Same-branch earlier booking can safely precede another same-branch booking.
- Pending payment blocks inventory and expired holds do not relocate it.
- Same-day turnarounds and overlapping dates are rejected.
