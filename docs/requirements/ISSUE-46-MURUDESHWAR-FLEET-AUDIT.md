# Issue #46 — Murudeshwar ten-bike fleet audit

**Status: not verified on staging.** The groupings below come from the previously supplied vehicle mapping. They are not independently verified against Murudeshwar RC documents or a physical inspection.

| Provisional model | Count | Registrations |
|---|---:|---|
| Suzuki Access 125 | 4 | KA47A9088, KA47A9089, KA47A9090, KA47A9091 |
| Honda Activa 6G | 4 | KA47A8988, KA47A8989, KA47A9092, KA47A9053 |
| Yamaha Fascino 125 | 2 | KA47A8991, KA47A8999 |
| **Total** | **10** | |

## Implementation

The read-only command `php83 artisan fleet:audit-murudeshwar` checks these ten registrations across **all branches**, including soft-deleted records. It selects an active Murudeshwar branch only if unique, or one explicitly selected with `--store-id`.

For each registration it reports:
- Whether a record exists once, is absent, or has duplicates
- Home and current branch affiliation
- Reported brand and exact model description versus the **provisional** mapping
- Linked catalog model and category consistency
- Soft-deleted status and booking/availability state for manual review

A clean database match is **not** RC verification and is **not** permission to publish a bike for rental. The command performs no writes under any option; there is intentionally no `--apply`.

## Safe staging procedure

1. Confirm that Antigravity is on **staging.whizwheels.in only** and that the current database and branch IDs are identified without sharing credentials.
2. Back up the staging database and verify restore capability before deployment or any later data correction.
3. Pull reviewed `main` and run:
   ```bash
   php83 artisan fleet:audit-murudeshwar
   ```
4. If there are multiple stores with city Murudeshwar, identify the correct active branch, then run with `--store-id=<VERIFIED_MURUDESHWAR_ID>`.
5. Use `--strict` to fail if a listed registration is missing or has a conflicting, stale, unlinked, or soft-deleted database record:
   ```bash
   php83 artisan fleet:audit-murudeshwar --store-id=<VERIFIED_ID> --strict
   ```
6. Compare every registration **privately** with a current RC, insurance, emission/PUC validity, chassis/engine information, physical location, vehicle condition, existing bookings and catalog classification. Do not post sensitive RC details publicly or in GitHub.
7. Resolve any discrepant model labels only after documentary verification and explicit owner decision. In particular, do not confuse Honnavar *Activa STD* with Murudeshwar's provisionally mapped *Activa 6G*.
8. For an absent scooter, stop: create a separate approved inventory registration/remediation issue. Do not use unsafe seeders or overwrite existing bikes.
9. After corrections have been reviewed and applied separately, rerun the audit and collect sanitized aggregate evidence.
10. Leave Issue #46 open until ten physically verified bikes have a unique record in the correct branch with the correct model catalog, maintenance/readiness state, and staff sign-off.

## Security / operational boundaries

- No registration is automatically created, edited, deleted, moved, activated or priced by this command.
- The audit uses registration plates only, not RC scans or personal, bank, chassis or engine data.
- Preserve historical and soft-deleted records for booking/financial auditing.
- Never publish `available` merely because a row matches. Insurance, compliance, physical readiness and approved rates must be independently verified.
- The Honnavar dry-run-first reconciliation remains a separate command; neither command should affect the other branch.

## Definition of done

- [ ] Pull latest code to staging after backup
- [ ] Record actual store ID and all ten existing registration states
- [ ] Resolve missing, duplicate, cross-branch and catalog discrepancies
- [ ] Match all ten with real RCs and physical units (private evidence)
- [ ] Check availability readiness/document expiry and booking overlaps
- [ ] Confirm no legacy bookings or vehicle states were inadvertently modified
- [ ] Attach sanitized evidence, CI/PR and owner approval to Issue #46
