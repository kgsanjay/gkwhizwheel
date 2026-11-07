# Issue #45 — Honnavar RC Fleet Reconciliation

**Scope:** Ten Honnavar RC-documented scooters, **not** a blind import and **not** a claim of roadworthiness or rental readiness. This document contains registration identifiers and model labels only. Never copy uploaded RC scans, chassis/engine numbers, owners' private data, bank details, insurance documents or financial receipts into GitHub.

## Source-derived inventory and approval

| RC vehicle description | Number of RC registrations | Registrations |
|---|---:|---|
| Honda Dio DLX | 5 | KA47A4047, KA47A4052, KA47A4054, KA47A4056, KA47A4057 |
| Honda Activa STD | 3 | KA47A8004, KA47A8005, KA47A8006 |
| Suzuki Access 125 | 2 | KA47A8011, KA47A8012 |

The uploaded RC description **Activa STD is not automatically Activa 6G**. The command intentionally requires an active Honda **Activa STD** catalog model. If the owner verifies a different manufacturer designation using an authoritative record, update catalog/manifest through a reviewed PR **before** executing writes. Do not assume model mapping.

## Technical behavior

- `php83 artisan fleet:reconcile-honnavar` is **read-only** and reports all ten plates as MISSING, MATCH EXISTING, REVIEW EXISTING or DUPLICATE. Optionally supply a verified `--store-id` and three catalog model IDs to make the preflight meaningful.
- The write path requires `--apply`, explicit **active Honnavar** `--store-id`, and all three explicitly approved catalog model IDs.
- No missing category/model is fabricated; no rate card is invented.
- Preflight includes **soft-deleted** bikes; any conflicting registration, wrong branch/model or duplicate blocks the entire apply.
- Existing correctly assigned bike records are **never updated**, regardless of availability or documents.
- Missing registrations are inserted only as `maintenance`, with the approved bike model and both home/current Honnavar branch IDs. Staff must validate RC, insurance, PUC, physical availability, photographs and rate plan before publishing availability separately.
- No automatic website/frontend publish, no branch migration, no import of Murudeshwar records and no mutation of existing booking history.
- The command uses a transaction and locks the branch/model rows, but for a production-safe roll-out, maintenance windows and DB constraints are still essential; avoid simultaneous manual bike registration.

## Execution process — only after staging backup and owner approval

1. Confirm active branch record for Honnavar using read-only database queries. Never assume `store_id = 1` without verifying the actual staging schema.
2. Check catalog models and select their correct IDs; **stop if Activa STD only matches a displayed Activa 6G entry**.
3. Take and verify a restricted staging database backup; preserve bookings and registration identity.
4. Run **dry-run first**, with IDs substituted from *verified staging records*:

```bash
php83 artisan fleet:reconcile-honnavar \
  --store-id=<HONNAVAR_ID> \
  --dio-model-id=<APPROVED_DIO_DLX_MODEL_ID> \
  --activa-model-id=<APPROVED_ACTIVA_STD_MODEL_ID> \
  --access-model-id=<APPROVED_ACCESS_125_MODEL_ID>
```

5. Review **each** registration, catalog match, existing branch and row state with owner/staff. Do **not** apply on any REVIEW EXISTING or DUPLICATE.
6. If explicitly approved, rerun with `--apply` appended. **Never automate --apply** as part of deployment.
7. Dry-run again. Check exactly ten target registrations have correct model, branch and no duplicates. Existing state and booking records must be unchanged; newly inserted units are maintenance-only.
8. Attach aggregate evidence (no RC docs/PII) to GitHub Issue #45, with test evidence, staging SHA and owner sign-off. Only then close #45.

## Cross-service non-regression

The entire website remains seven-service and the existing bike inventory/booking records must be preserved. In particular do not run `BikeSeeder`, `migrate:fresh`, `db:wipe`, row deletions, or unreviewed branch consolidation. The Murudeshwar ten-scooter verification is a separate Issue #46.

## Current status

**Code and tests provide a dry-run-first safe importer. This does not mean the ten Honnavar bikes have been written to ServerByt, checked for road readiness, or made bookable.**
