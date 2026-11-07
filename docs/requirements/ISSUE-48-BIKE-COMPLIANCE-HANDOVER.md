# Issue #48 — Bike compliance, maintenance and handover

## Verified requirements and existing implementation

The platform already stores private bike document records (RC, insurance, emission/PUC), a `verified` flag, issue/expiry dates, bike maintenance due date, handover/return condition photos, odometer and optional helmets/fuel notes. The bike state machine already tracks `confirmed → handed_over → returned → completed` and blocks handover of advance-only reservations with an outstanding balance.

**Problem identified:** booking handover previously had no server-side check for a verified, current set of compliance documents. Return could automatically republish a vehicle as `available` even if compliance expired.

## Implemented in this PR

- `BikeComplianceGate` blocks handover if the physical bike is not `available`, if its privately stored documents are missing/unverified, if insurance or PUC expiry is missing/expired, or if maintenance is overdue.
- RC requires verified private document metadata. If the RC has an expiry date, it must be current; some RCs may not have expiry metadata, so missing RC expiry alone is not treated as approval or expiry.
- Return retains the existing state transition and branch relocation, but sets the bike to **maintenance**, not `available`, if required document/maintenance metadata is absent or expired. Existing reservation locations and relocation checks remain; staff must review any upcoming affected bookings.
- New read-only `php83 artisan fleet:audit-compliance [--strict]` displays vehicle IDs, states and compliance-problem categories, **never private document file paths**. `--strict` fails if any currently `available` bike has unresolved compliance metadata.
- Existing successful payment and ₹100 advance/full checkout rules are unchanged; no refundable ₹500 deposit is added.

## Still required before full acceptance

1. **Private physical verification:** RC, insurance and PUC authenticity, registered vehicle identity, validity and service schedule must be checked by staff. An uploaded file or `verified=1` flag by itself is not legal proof.
2. **Fitness applicability:** The current bike document types do not distinguish transport/commercial permit or fitness certificates. Agree the actual regulatory applicability for each vehicle class and add permissioned fields if needed; never infer validity from an RC alone.
3. **Handover UX:** require a clearly captured departure odometer, fuel level, helmet quantity, signed agreement and condition photo evidence at the staff interface, and verify this behaves correctly on mobile web. The current controller takes optional photo/signature/helmet/fuel and must not be presented as completed enforcement.
4. **Return UX:** capture return photos, fuel, condition/damage reason, actual receiving branch and paid/late fee settlement; cross-branch relocation requires future-booking availability check. Damage fees must have supporting evidence and owner approval.
5. **Privacy:** existing condition photos and signature data may be stored on `public` disk; verify actual access controls and move sensitive images/signatures to authenticated/private storage in a separate security task before live acceptance.
6. **Reminders:** no scheduled expiry reminder/notification is provided by this audit command. Implement secure staff reminders separately and confirm notification channels.
7. **Historical data:** do not mark the fleet verified automatically, rewrite older bookings or disclose RC/engine/chassis numbers in GitHub.

## Staging procedure (after approved backup)

- Confirm staging DB, PHP executable and clean `main` commit before testing.
- Run `php83 artisan fleet:audit-compliance` and retain sanitized report; review differences by bike ID without publicly exposing private documents.
- Run `php83 artisan fleet:audit-compliance --strict`, verify positive and negative cases, confirm handover is refused when RC is missing, insurance/PUC expired or bike maintenance overdue, and verify a genuinely approved bike can be handed over after collecting its balance.
- On return, confirm an expired document results in **maintenance**, not available; verify future-booking impact, authorized staff, branch assignment and no unexpected price changes.
- Test proper staff handover permissions, status transitions, odometer monotonicity, helmet/fuel/condition capture and private photo/document access.
- Attach redacted verification results and sign-off to <https://github.com/kgsanjay/gkwhizwheel/issues/48>; leave issue **OPEN** until the entire requirement and privacy/physical checks are accepted.

No production or ServerByt data is modified by the GitHub PR.
