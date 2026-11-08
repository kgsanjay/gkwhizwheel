# Issue #44 — Legacy service bookings & staging migration safety

## Scope and limits

This runbook is for the **actual ServerByt STAGING DB**, not production.
The additive migrations introduced in issues #40–#43 create
`service_enquiries`, `service_resources`,
`service_resource_allocations`, and `service_quote_snapshots`.
They must **not** convert or overwrite historical `service_bookings`.

This repository contains a **read-only** check:
`php83 artisan audit:legacy-services`.
It reads counts and structural relationships only. It never logs customer
names, contacts, registration numbers, payment references, document details,
or database credentials.

The user-provided SQL export reviewed in the planning phase is a snapshot,
**not proof of the current ServerByt DB contents or current schema**.
Do not assume staging has the same counts or IDs.

## Risk inventory / guardrails

1. `service_booking` records may be `confirmed` without a valid
   `service_item_id`, a positive approved price, or proper capacity allocation.
   **Do not automatically cancel, modify or retroactively confirm them.**
   Produce a remediation register for manual business review.
2. `ServiceItem::getCapacityUnits()` has a legacy **20-unit fallback** when
   capacity is undefined. This is **not verified physical capacity**.
   New typed service resources are intentionally independent until inventories
   are approved, and must not double-count old bookings.
3. `stores` #2 is a historic Honnavar railway hub and can retain older
   bookings, pricing rules and audit references. Preserve the row as inactive
   after explicit branch reconciliation; do not delete it.
4. Physical-bike imports must match registration identities and existing
   booking documents. Never run destructive bike seeders.
5. `ServiceResourceAllocator` uses row locks for reservations on real
   resources; do not mark all unverified legacy inventory as available.
6. `ServiceQuoteSnapshot` captures **new** approved customer quotes.
   Do not backfill fabricated quote snapshots for old bookings.
7. Payment settlement history must be reconciled with the actual gateway
   and operational ledger before any financial status changes.
8. Historical quote totals, booking numbers, service type, branch IDs,
   and customer-facing vouchers remain unchanged without approved data
   remediation.
9. Any orphaned or inconsistent record reported below is a **blocker to
   automated transformation**, not an instruction to delete data.

## Deployment checklist

- [ ] Confirm staging host path and `APP_ENV`, `APP_URL`, database host/name
      (do not print secrets), and PHP 8.3 executable.
- [ ] Confirm clean worktree and verify required commit SHA in `main`.
- [ ] Identify an authorized maintenance window and full DB restore point.
- [ ] Create a timestamped encrypted database backup outside the public webroot.
      Validate successful completion and test restoration on a disposable DB
      (not the running staging DB).
- [ ] Save a **restricted** baseline report of row counts by table and
      status. Do not publish PII.
- [ ] Run `php83 artisan audit:resource-schema --require-mysql` first. Stop on partial/history/constraint blockers and follow the recovery section below.
- [ ] `php83 artisan migrate:status` and
      `php83 artisan audit:legacy-services --strict`. Before migrations the
      audit may fail solely because additive module tables are missing; record
      this as an expected staging migration warning rather than dropping data.
- [ ] Review **all pending migration code**, not just the latest four.
      Confirm no `drop`, `truncate`, `migrate:fresh`, destructive
      seeder, data rewrite, or unexpected environmental dependency.
- [ ] Apply `php83 artisan migrate --force` **only after** review and verified
      backup. Do not run this command unattended against production.
- [ ] Rerun `php83 artisan audit:legacy-services --strict` and save
      aggregate report. Strict failure requires issue review, not silent fix.
- [ ] Compare baseline and after counts / sums / statuses across:
      `service_items`, `service_bookings`, `bookings`, `bikes`,
      `stores`, `pricing_rules`, payments, documents, and notifications.
      **All unchanged unless the migration explicitly and safely requires it.**
- [ ] Verify the four new tables exist and start empty unless staged tests
      have deliberately created audit records.
- [ ] Smoke-test seven service pages, six enquiry forms, quote issuance,
      one sample new booking with fake/test gateway, bike checkout and staff
      permissions. Do not charge a real payment card.
- [ ] Attach restricted aggregate comparison and verification evidence to
      GitHub Issue #44 (never raw production DB dumps or personal documents).
- [ ] Get business owner acceptance **before** closing #44.

## Rollback / incident procedure

If a migration fails or legacy bookings change unexpectedly:
1. Stop further writes and record error, timestamps, migration step and logs
   without exposing secrets.
2. Keep the prior DB backup untouched.
3. Revert application code only if compatible with the current DB schema.
   Do not run `migrate:fresh` or blindly roll back existing migrations.
4. Restore from the **verified** backup only through an authorized,
   documented procedure; reconcile staging writes since the backup.
5. Escalate to the owner before restarting customer tests.

## Review questions / evidence

- Do legacy `service_bookings` have unknown `service_item_id` or invalid
  positive amounts? Count/describe by **aggregate status/service_type**.
- Are any historic branch #2 reservations still open?
- Do any resource allocations overlap confirmed reservations after import?
- Do service booking balances reconcile to payments and refunds?
- Are `ServiceItem` prices and capacities verified by branch managers?
- Is there sufficient evidence to migrate a given service to the new typed
  resource system without duplicating historical reservations?

Do not create an automated backfill or compatibility rewrite until all of
these can be answered from actual staging data.

## Resource-foundation MySQL preflight and partial-DDL recovery

New command (read-only, no repair mode):

```sh
php83 artisan audit:resource-schema --require-mysql
php83 artisan audit:resource-schema --require-mysql --json
```

This inspects the versioned `2026_11_07_000011_create_service_resources_and_allocations` foundation only. It reads prerequisite/table existence, aggregate row counts, exact ordered index column sets and uniqueness, restrictive foreign keys, InnoDB engines and migration-history presence. It never prints customer records, connection names/credentials, payment references or raw SQL exception messages. It never adds tables/indexes, updates migration history, backfills rows or invokes a migration. Database inspection errors fail closed.

| State | Meaning | Operator decision |
|---|---|---|
| `fresh_pending` | Prerequisites exist, both foundation tables absent and no history row | Foundation can be scheduled for reviewed migration after backup/restore and complete migration preflight. This is not whole-release readiness. |
| `applied` | Both tables and required structural constraints exist with one history row | Continue the separate column-definition/data/backup/all-migrations checks. No rerun of this migration is needed. |
| `blocked` | Missing prerequisites/constraints, duplicate history, non-InnoDB table, unrecorded existing schema, recorded missing table, partial state or inspection error | Stop automatic deployment and blind `migrate` retries. Preserve the state and investigate on a disposable restored copy. |

A zero exit code proves only these structural checks; it does not compare exact column types/defaults, certify existing data/financial integrity, verify restore capability, approve all pending migrations or authorize deployment. `--require-mysql` intentionally rejects SQLite as MySQL release evidence.

### Known failure and why a simple retry is unsafe

Main's unnamed composite unique key generates the 74-character identifier `service_resource_allocations_service_resource_id_service_booking_id_unique`, exceeding MySQL's 64-character limit (error 1059). PR #131 uses the short `resource_booking_unique` name for fresh installations. MySQL DDL is not transactionally rolled back: tables/foreign keys may already exist after an index statement fails, while Laravel has not recorded the migration. Merely checking the migration-history row or patching the source and rerunning can fail with an existing-table error. Likewise, manually marking the migration complete could hide missing constraints.

### Recovery gate for existing/partial installations

1. Stop target application/worker writes through the approved maintenance procedure. Record target/release identity and failure stage privately; do not paste raw DB errors or credentials into GitHub.
2. Preserve the failed state. Take an encrypted full backup, retain the pre-deployment restore point and account for writes since that point. Rehearse restoration on an isolated disposable database first.
3. Run the read-only preflight and `migrate:status`. Retain aggregate evidence. Review exact columns/types/defaults, indexes, foreign keys, engines, duplicate resource/booking pairs, orphaned relationships and every pending migration on the restored copy. Do not treat an index-only correction as a complete schema audit.
4. Preferred recovery is the verified pre-deployment backup plus replay of the reviewed corrected migrations on the disposable copy, with before/after financial/booking/inventory comparisons. Restoration on the actual target requires owner authorization and reconciliation of intervening writes.
5. If restoration cannot preserve intervening data, prepare a separately reviewed, state-specific additive repair and migration-history reconciliation plan on the disposable copy. This command deliberately does not implement generic history adoption or automatic repair. Do not add a unique index until duplicate pairs have been reviewed; do not delete genuine allocations to make it succeed. A fully structured but unrecorded schema remains blocked until history is independently reviewed.
6. Never run `migrate:fresh`, drop production/staging tables, delete migration history, disable target foreign keys, seed defaults or blindly roll back to make this audit pass. These are not recovery instructions for a deployed database.
7. After authorized recovery, rerun both schema and legacy-data audits, compare baseline counts/totals/statuses, test current-head MySQL concurrency and obtain reviewer/owner acceptance before resuming operations.

### Disposable CI evidence

`tests/Integration/ServiceResourceMySqlRecoveryTest.php` is invoked explicitly by the MySQL workflow, outside the ordinary feature-suite transaction wrapper. Its per-test fresh schemas deliberately exercise real MySQL DDL/implicit commits. Before any schema reset it requires all of: explicit `RESOURCE_SCHEMA_RECOVERY_TESTS=1`, application environment `testing`, MySQL driver, and exact disposable CI database name `gkw_cab_race_ci`. Never enable it on a deployed database.

Cases cover existing-row preservation and ordinary applied migration rerun; actual oversized-index failure; partial/unrecorded tables; complete unrecorded schema; recorded missing table; missing foreign key; nontransactional/incomplete table; and fresh-pending foundation. Standard feature tests verify read-only applied inspection, missing uniqueness, duplicate/unrecorded history, and the SQLite release-evidence refusal. CI evidence must be attached for the actual development head; test definitions alone are not a pass.

No staging/production backup restoration, DDL repair, migration-history modification or deployment has been performed by this development slice. Issue #44 remains open pending actual data review and staged acceptance.
