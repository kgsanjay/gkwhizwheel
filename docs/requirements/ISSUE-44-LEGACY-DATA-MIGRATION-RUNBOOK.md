# Issue #44 — Legacy service bookings & staging migration safety

## Scope and limits

This runbook is for the **actual ServerByt STAGING DB**, not production.
The additive migrations introduced in issues #40–#43 create
\`service_enquiries\`, \`service_resources\`,
\`service_resource_allocations\`, and \`service_quote_snapshots\`.
They must **not** convert or overwrite historical \`service_bookings\`.

This repository contains a **read-only** check:
\`php83 artisan audit:legacy-services\`.
It reads counts and structural relationships only. It never logs customer
names, contacts, registration numbers, payment references, document details,
or database credentials.

The user-provided SQL export reviewed in the planning phase is a snapshot,
**not proof of the current ServerByt DB contents or current schema**.
Do not assume staging has the same counts or IDs.

## Risk inventory / guardrails

1. \`service_booking\` records may be \`confirmed\` without a valid
   \`service_item_id\`, a positive approved price, or proper capacity allocation.
   **Do not automatically cancel, modify or retroactively confirm them.**
   Produce a remediation register for manual business review.
2. \`ServiceItem::getCapacityUnits()\` has a legacy **20-unit fallback** when
   capacity is undefined. This is **not verified physical capacity**.
   New typed service resources are intentionally independent until inventories
   are approved, and must not double-count old bookings.
3. \`stores\` #2 is a historic Honnavar railway hub and can retain older
   bookings, pricing rules and audit references. Preserve the row as inactive
   after explicit branch reconciliation; do not delete it.
4. Physical-bike imports must match registration identities and existing
   booking documents. Never run destructive bike seeders.
5. \`ServiceResourceAllocator\` uses row locks for reservations on real
   resources; do not mark all unverified legacy inventory as available.
6. \`ServiceQuoteSnapshot\` captures **new** approved customer quotes.
   Do not backfill fabricated quote snapshots for old bookings.
7. Payment settlement history must be reconciled with the actual gateway
   and operational ledger before any financial status changes.
8. Historical quote totals, booking numbers, service type, branch IDs,
   and customer-facing vouchers remain unchanged without approved data
   remediation.
9. Any orphaned or inconsistent record reported below is a **blocker to
   automated transformation**, not an instruction to delete data.

## Deployment checklist

- [ ] Confirm staging host path and \`APP_ENV\`, \`APP_URL\`, database host/name
      (do not print secrets), and PHP 8.3 executable.
- [ ] Confirm clean worktree and verify required commit SHA in \`main\`.
- [ ] Identify an authorized maintenance window and full DB restore point.
- [ ] Create a timestamped encrypted database backup outside the public webroot.
      Validate successful completion and test restoration on a disposable DB
      (not the running staging DB).
- [ ] Save a **restricted** baseline report of row counts by table and
      status. Do not publish PII.
- [ ] \`php83 artisan migrate:status\` and
      \`php83 artisan audit:legacy-services --strict\`. Before migrations the
      audit may fail solely because additive module tables are missing; record
      this as an expected staging migration warning rather than dropping data.
- [ ] Review **all pending migration code**, not just the latest four.
      Confirm no \`drop\`, \`truncate\`, \`migrate:fresh\`, destructive
      seeder, data rewrite, or unexpected environmental dependency.
- [ ] Apply \`php83 artisan migrate --force\` **only after** review and verified
      backup. Do not run this command unattended against production.
- [ ] Rerun \`php83 artisan audit:legacy-services --strict\` and save
      aggregate report. Strict failure requires issue review, not silent fix.
- [ ] Compare baseline and after counts / sums / statuses across:
      \`service_items\`, \`service_bookings\`, \`bookings\`, \`bikes\`,
      \`stores\`, \`pricing_rules\`, payments, documents, and notifications.
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
   Do not run \`migrate:fresh\` or blindly roll back existing migrations.
4. Restore from the **verified** backup only through an authorized,
   documented procedure; reconcile staging writes since the backup.
5. Escalate to the owner before restarting customer tests.

## Review questions / evidence

- Do legacy \`service_bookings\` have unknown \`service_item_id\` or invalid
  positive amounts? Count/describe by **aggregate status/service_type**.
- Are any historic branch #2 reservations still open?
- Do any resource allocations overlap confirmed reservations after import?
- Do service booking balances reconcile to payments and refunds?
- Are \`ServiceItem\` prices and capacities verified by branch managers?
- Is there sufficient evidence to migrate a given service to the new typed
  resource system without duplicating historical reservations?

Do not create an automated backfill or compatibility rewrite until all of
these can be answered from actual staging data.
