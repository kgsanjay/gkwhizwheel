# Bike branch transfers — Phase 5

This branch stacks on PR #9 (customer multi-branch checkout), which stacks on PRs #8 and #6. It is **not** based on main.

## Operational lifecycle

1. Manager/staff assigned to the **source** branch creates a transfer request to a distinct active branch, including a reason.
2. A super admin approves the request. Approval revalidates the physical bike location, its availability, any open transfer and all active/future customer reservations.
3. Once approved, the bike is excluded from public fleet search and blocked from new booking holds and price quotes. Physical `current_store_id` remains the source.
4. Assigned source staff confirms dispatch. The transfer becomes `in_transit`, still blocked from booking.
5. Assigned destination staff confirms physical receipt. In one transaction the bike's `current_store_id` becomes the destination and the transfer becomes `received`.
6. Requested/approved transfers can be cancelled by source branch personnel. Already-dispatched transfers cannot be cancelled in this version; staff must resolve the physical shipment through a controlled operations process.
7. Every state change creates an `ActivityLog` record, plus explicit actor and timestamp fields in `bike_transfers`. Past transfer records remain immutable apart from lifecycle fields.

## Security

- Super admin approval required.
- Store managers and staff can request/dispatch only from their assigned source branch and receive only into their assigned destination branch.
- Users with no assigned stores are denied transfer operations (fail closed).
- Transfer state is rechecked under row locks. Booking holds lock the same bike row before checking transfer status.
- Existing web and API bike edit endpoints reject changing `current_store_id` directly; use the transfer workflow.
- Inactive source/destination branches, already-transferring bikes, non-AVAILABLE bikes, and bikes with current or future active reservations are not transfer eligible.

## Important limitations and release gates

- This release is for **immediate/manual operational transfers only**, not future-dated transfer plans. A transfer cannot be started when the bike has any confirmed future customer bookings or unexpired hold/payment in progress.
- `current_store_id` is only changed after receipt. No automatic GPS confirmation, loading inspection photos or transfer vehicle/driver assignment is included yet.
- Admin stores must have genuinely assigned staff at both locations. Super admin may act on both sides in exceptional cases.
- Existing operational scripts or other staff APIs that mutate `current_store_id` must be audited before enabling this on production.
- Any currently active bike on rent must be returned and inspected before manual transfer.
- Booking-driven one-way returns are **separate** from these manual transfer records. Later work may reconcile the operational movement history across both types.
- PR #7 (branch landing pages) and PR #4 (public content fixes) must be integrated and tested separately.
- Deploy only on isolated staging with backups, migration verification, cross-store permission tests and a complete real-browser operational exercise.
