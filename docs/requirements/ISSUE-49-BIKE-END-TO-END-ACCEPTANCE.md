# Issue #49 — Bike customer checkout and full staging acceptance

## Implemented in PR

The handover and return service now locks the **booking** row, rechecks its current status **inside the transaction** and locks the bike before changing inventory. This prevents duplicate handovers/returns from stale operator screens and double-applying late/damage fees. The online advance balance is also rechecked transactionally immediately before bike release. Direct service invocations reject negative or nonfinite fees. Tests simulate stale booking models and verify preserved totals, relocation and one inspection log per stage.

This is an automated service-layer integrity improvement. **It is not evidence of completed real-browser, external gateway or ServerByt staging acceptance.**

## Staging acceptance matrix — QA operator evidence required

| Journey | Expected behavior | Evidence |
|---|---|---|
| Seven-service landing/home | Bike CTA routes to bike catalog without affecting cab, boat, scuba, stay, guide, tour enquiry paths | Desktop and mobile screenshots |
| Branch and model selection | Honnavar/Murudeshwar show only approved catalog models and physically available individual bikes, correct date calendar | Screenshots and sanitized inventory counts |
| Pickup and return points | Point mandatory when published; pickup and return fees independently applied, no fee if **configured** zero, missing rule blocks charge | Two branches × same/forward/reverse quote captures |
| One-way example | An admin-approved directional ₹200 adds exactly ₹200 for selected origin→destination; reverse may differ | Server quote comparison, no hardcoded example persisted |
| Customer ₹100 advance | For deposit-free rental, checkout creates ₹100 gateway order (or total when under ₹100), booking confirms **only after verified server webhook**; balance remains collectible | Sandbox order and paid ledger record, redacted |
| Customer full payment | Gateway order equals complete verified total; no ₹500 deposit or 25% non-bike deposit | Sandbox order, voucher and account screenshot |
| Browser / API tampering | Changing payment amount, bike id, route, booked dates or same idempotency key cannot bypass server controls | HTTP 4xx, no additional charges |
| Hold expiry | Expired held / pending-payment booking cannot start a new gateway order; schedule releases only according to recorded hold | API traces (redacted) |
| Retry / webhook | Same gateway event or user retry does not produce duplicate confirmed booking, success payment, or notification; mismatched order ID/amount rejected | Sandbox webhook logs and DB counts |
| Privacy / account | Customer sees own bookings/KYC only; no other customer's booking visible by guessing number/phone | Two test users and permission tests |
| Handover | Staff in assigned active branch checks private verified RC/insurance/PUC, vehicle maintenance, original odometer, fuel, condition photos, helmets, signed agreement; **advance remaining balance collected first** | Staff browser screenshots with sensitive details redacted |
| Return and relocation | Authorized receiving branch, updated odometer, documented damage/late fee, state returned, future relocation warnings; duplicate staff submissions do not add fees twice | Return log and branch inventory counts |
| Refund/cancellation | Policy, paid minus refunded cap, gateway refund idempotency and partial refund verified; no fictitious refund marked complete | Sandbox refund and ledger reconciliation |
| Accessibility | Keyboard navigation, focus, touch controls, responsive mobile-web layouts and sensible status announcements | Manual WCAG 2.2 AA review notes |
| Other six services | Their enquiries remain unconfirmed and unpaid until assigned/approved; bike changes do not affect forms | Quick smoke-test screenshots |

## Safe order of operations

1. Confirm Antigravity SSH target is **staging.whizwheels.in**, compare deployed Git SHA, take and restore-test a restricted DB backup, and run read-only audits (`audit:legacy-services`, `fleet:audit-compliance`, `fleet:audit-murudeshwar`).
2. Review/apply pending migrations on staging only after backup; do **not** run migrate:fresh, seeders or any `--apply` fleet command without owner approval.
3. Verify approved catalog models, real bike records, current/private compliance docs, branch pickup point fees and the two directional one-way rules.
4. Use gateway **sandbox only**. Never run tests against customer money or production keys.
5. Execute the acceptance matrix on desktop and mobile web and capture sanitized screenshots, response codes, totals and non-PII before/after counts.
6. Attach CI URL, deployed SHA, observations, payment/refund reconciliation and explicit named reviewer acceptance to [Issue #49](https://github.com/kgsanjay/gkwhizwheel/issues/49); close only when criteria are met.
7. Record blockers in separate GitHub tasks where independent implementation is needed (e.g. document privacy, gateway refund semantics, real browser QA).

## Remaining high-risk work

- Verified concurrency under actual MySQL/PostgreSQL with separate connections and competing requests (SQLite unit tests alone do not prove cross-worker serializability).
- End-to-end Razorpay/PhonePe sandbox webhook order/amount verification, retries and refund reconciliation, including production webhook delivery resilience.
- Complete mandatory helmet/fuel/photo/signature and private document delivery process from #48; manual review of legal compliance requirements.
- Confirm operational branch fees and pickup points on staging; avoid inventing rate values.
- Formal user-browser accessibility and UX acceptance.

**No ServerByt deployment, customer payment, real-browser QA or fleet modification was performed by this GitHub PR.**
