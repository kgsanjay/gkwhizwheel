# G.K. WhizWheel — Multi-branch staging acceptance runbook

This is an **operator checklist**, not evidence of a completed deployment. All commands must be executed against the intended **staging environment** only, by a person with authorized server/database access.

## 0. Release protection

- Preserve the approved UI and existing production release.
- PR #18 (security baseline) must be merged before PR #19 (branch ownership); PR #19 is stacked on PR #18.
- Do not deploy this feature branch directly to production.
- Back up the staging database and verify that a restore can be performed.
- Record deployed commit, database version, environment URL and backup reference (without exposing credentials).
- Review pending migrations using `php artisan migrate:status` before applying any migrations.
- Confirm background workers, queue retry handling, scheduler and payment sandbox credentials are configured for staging.

## 1. Baseline smoke checks

- Verify `/up`, `/`, `/services` and `/services/bikes` over HTTPS on staging.
- Verify the existing homepage UI and all service image assets remain unchanged.
- Confirm that staging is not accidentally pointed at the live payment credentials or production database.
- Run the existing CI suite and `php artisan test` in the intended release environment.

## 2. Database ownership audit — read only

After migration has added nullable branch keys:

```bash
php artisan migrate:status
php artisan services:audit-branches
php artisan services:audit-branches --strict
```

The normal audit reports unresolved service inventory and booking ownership without changing records. The strict version exits with a failure when unassigned or inconsistent records remain. Record counts and IDs only; do not publish customer details in audit output.

Resolve each service record against the actual branch inventory ledger and original booking notes, not by guessing from the place-name string. Preserve and review disputed records; never silently assign everything to Honnavar.

## 3. Explicit legacy assignment — dry run first

The following IDs are **placeholders**. Replace them only after reviewing actual staging records.

```bash
# Sample dry run (no changes)
php artisan services:assign-branch 1 --items=10 --items=11 --bookings=25

# Do not add --apply until the assignment has been reviewed
php artisan services:assign-branch 1 --items=10 --items=11 --bookings=25 --apply

# Check for unresolved rows after each approved batch
php artisan services:audit-branches --strict
```

Reject conflicting booking and inventory branch associations. Capture the approved item/booking-to-store mapping before applying it. For rollback, restore verified backup data or use an explicitly reviewed correction script; do **not** blindly reverse reassignment on bookings that may have changed since the audit.

## 4. Role and privacy acceptance

Use dedicated staging users for each role. Test both regular requests and forged IDs/branch query parameters.

- Superadmin: all branches, all service types; can see unresolved legacy records for review.
- Honnavar manager: only Honnavar service inventory, bookings and dashboard metrics.
- Murudeshwar manager: only Murudeshwar service inventory, bookings and metrics.
- Unassigned manager: no branch records; forged store ID rejected.
- Staff: permitted services and assigned branch only; cross-branch records denied unless an approved role-specific workflow exists.
- Customer: own booking, voucher, payment and confirmation only.
- Verify service booking amounts from server-side pricing rather than browser-controlled amount fields.
- Verify duplicate Razorpay payment notifications do not increase the paid amount twice.

## 5. Booking and vehicle operations

- Book a bike with pickup and return at Honnavar: no one-way charge.
- Book a bike with pickup Murudeshwar and return Honnavar: configured directional fee added.
- Reverse the route: verify independently configured fee.
- Attempt overlapping reservations for the same bike and dates: second one must be refused.
- Handover and receive an interbranch bike; verify actual current location and future availability.
- Reserve each non-bike service with an inventory item at the selected branch; reject a forged item/branch pair.
- Test payment failure, cancellation, voucher access, offline counter booking, and refund reconciliation.

## 6. Relocation task acceptance and obsolete-alert closure

- Admin panel: visit `/admin/relocations` and confirm visible tasks are branch-scoped.
- A superadmin may confirm physical receipt only after verifying the bike at the specified receiving branch. Confirm only once; the operation must audit the change.
- Confirmations for inactive branches, wrong destinations, unfulfillable future pickups or bikes currently on rent must fail without relocating the vehicle.
- If the affected future booking was cancelled, expired, marked no-show, returned or completed, a superadmin may choose **Dismiss obsolete** and enter a meaningful audit reason (at least ten characters).
- A confirmed or still-active affected booking cannot be dismissed just because the relocation is inconvenient.
- Closing a relocation alert must not modify the bike location, cancel bookings, or issue a refund.
- Validate both JSON and browser flows; branch staff can review but cannot confirm or dismiss.
- Check `activity_logs` for `bike_relocation_receipt_confirmed` and `bike_relocation_dismissed` and confirm no sensitive customer data is added.

## 7. Fleet location readiness audit — read only

After the two branch migrations are present, review every bike's upcoming scheduled pickup against its recorded current location:

```bash
php artisan fleet:audit-relocations
php artisan fleet:audit-relocations --strict
```

This audit identifies (a) bikes whose upcoming pickup is unfulfillable from the current branch, (b) such conflicts that lack an open matching relocation task, and (c) open tasks that no longer match an active conflict. It performs **no writes**. The strict variant is a release gate, not an instruction to auto-assign bikes or close tasks.

For each failure, review the bike and booking record using the admin operations workflow. Confirm actual physical bike location before approving a transfer. Never resolve a conflict merely by modifying its database location without physical verification. Dismiss an obsolete alert only after verifying the affected booking is inactive.

## 8. Combined release preflight — read only

After the migration status and database backup have been reviewed, execute:

```bash
php artisan app:branch-preflight
```

This single read-only command checks that the necessary service ownership and bike relocation database schema exists, then runs both strict service ownership and fleet location audits. Any unresolved branch ownership, pickup mismatch or stale relocation task produces a nonzero exit status. It never creates, moves, confirms, refunds or cancels records, and must not be treated as a deployment authorization.

If the schema is missing, stop and review `php artisan migrate:status`. Do not attempt to repair migrations or assign legacy records automatically. Preserve the audit results and have authorized branch staff review discrepancies.

## 9. Release gate

Do not consider PR #19 ready until:
- CI passes on the exact release commit.
- No unresolved cross-branch data mismatches remain.
- Any legacy unassigned records have an explicitly reviewed handling policy.
- Four-role staging acceptance tests pass.
- Real payment capture and webhook reconciliation are checked with sandbox/test credentials.
- No unintended public UI changes are present.
- Rollback/recovery instructions and staging deployment commit are documented.

This runbook does **not** authorize production deployment or migration.
