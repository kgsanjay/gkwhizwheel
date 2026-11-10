# Release baseline — 8 November 2026

Master tracker: [#39](https://github.com/kgsanjay/gkwhizwheel/issues/39).

## Release trees

- Main: `abada3836cb5c905a5baf237ca85d425dfc6a04e`, PR #129. Last inspected main CI passed 898 tests / 6,171 assertions, using SQLite.
- Existing development candidate: `feat/issue-56-cab-cancellation-audit-20261108`, PR #131. Starting head for this reconciliation: `d56198ca840f2c4161390d5cb69cc5498f3d1c07`. This branch contains main, the shorter MySQL allocation index name, current locking-read correction, and cab cancellation/reschedule/review workflows. Its baseline MySQL gate passed five race cases ten times and two cancellation rollback cases.
- Neither this record nor green CI authorizes merge or deployment. Current development head must pass its own CI; baseline results do not certify later commits.
- `dev`, `ui-preview`, old integration/design branches, and older stacked PRs are not the release baseline. PR #130 targets the preview. Several older merged PRs are not ancestors of current main. Compare actual files before reusing them; do not wholesale merge outdated UI or overwrite completed seven-service pages.

## Acceptance accounting

The canonical 62 tasks are #40–#91 and #102–#111. Exclude 12 epics, master #39 and duplicate issues #92–#101 from the denominator. Current evidence does not establish full requirement acceptance for any canonical task; this is not a statement that no code or automated subfeatures are complete.

Reopened #43, #47, #48, #49, #50, #51, #52, #54 and #87: their implementation reports explicitly retain unfinished scope, staging/business acceptance and reviewer sign-off. Preserve existing CI/implementation evidence, but do not count the closures as acceptance. Epics inherit pending acceptance from their children.

## Current priorities

1. Private-document and credential controls (#105/#91); preserve uploaded data and require operator review for legacy remediation.
2. MySQL allocation/migration correctness (#42/#44/#55/#56): candidate includes short index names/current reads; main does not. Fresh CI migration success does not prove upgrade/recovery of an already partially migrated database.
3. Confirmed/payable service readiness and full quote contracts (#41/#43/#51), including actual resource allocation and duration.
4. Isolated staging backup/restore and legacy reconciliation (#44); authorized branch/fleet/rate verification (#45/#46/#47/#87).
5. Complete bike customer/admin/staff/payment acceptance, then cab approval-to-checkout; later guides, boating, stays, scuba and tours subject to real dependencies and owner policy.

Six service forms are enquiry-first; the original null-ID mismatch is no longer the current public-form implementation. The generic quote/book/payment endpoints still require operational-readiness review. Enquiries do not reserve resources or collect payment.

## Operating boundary

No production/staging database or hosting changes, actual credential rotation, customer notifications, charges, refunds, forced history rewrite or automatic merge are performed by this development reconciliation. Deployment requires verified encrypted database/private-file backup and restore, schema preflight, reviewed migration/recovery plan, sandbox acceptance, current-head CI and explicit release approval.
