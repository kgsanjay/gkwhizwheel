# Issue #47 — Bike pickup/return points and directional fees

## Business rules

- There are **two intended active branches**, Honnavar and Murudeshwar. Historical Honnavar railway hub stays available as an inactive reference, not a third active branch; staging must verify actual branch records.
- Published customer pickup/return points are expected to include **three Honnavar and four Murudeshwar** choices, subject to actual staging configuration and operational approval. Do not invent fees.
- Each selected point has **independent pickup_fee and return_fee**; null is **unknown**, not free. Explicit zero means free.
- A new online booking must choose pickup and return points **when the branch has published eligible points**. This prevents bypassing approved location fees by omitting point IDs. Legacy rows and branches not yet configured are preserved without a fabricated location.
- **Cross-branch one-way fee is directional**, via active pricing rules with matching exact `from_store_id` and `to_store_id`. A generic fallback is not accepted for new quotes: Honnavar → Murudeshwar approval does not imply Murudeshwar → Honnavar approval.
- Server-side total = base rental + day/pricing adjustments + direction-specific one-way charge + selected pickup fee + selected return fee + add-ons − approved discount; online bike rentals **waive legacy security deposit**. Fees and adjustments must be displayed from the persisted server quote, never browser-supplied totals.
- Online checkout offers a **₹100 advance (capped at actual total)** or **full-payment** option. No ₹500 security deposit or 25% advance is added for bike rental.
- Staff can edit the two point fees independently through Super Admin pickup point management; newly issued booking holds reflect new rates; existing booking snapshots must not be retroactively rewritten.

## Safety checks and staging acceptance

1. Confirm staging host, backup and migration state; pull verified `main`, never change production inadvertently.
2. Verify branch #1/#3 only after querying actual staging database, verify 3/4 published customer points, phone numbers, maps, central WhatsApp and point flags. Do not automatically assume seeded ID mapping.
3. Confirm pickup/return fees are explicitly configured. A null fee must make hold fail; zero must remain free.
4. Configure and verify **both** directional one-way rules independently. Example ₹200 is not a hardcoded default. Verify reverse can differ.
5. Test same-branch, forward cross-branch, reverse cross-branch, and different pickup/return points; compare line items to persisted `price_breakdown_json`.
6. Attempt omission, wrong-branch point, inactive point, null fee, missing directional rule and altered frontend total; all must reject correctly without charging money.
7. Test Razorpay/PhonePe sandbox (no real card charges), ₹100 advance and full payment, duplicate requests, no security deposit and final balance before handover.
8. Test backend and web customer forms, responsive UX, bike-model allocation, account, admin and other six travel services.
9. Record screenshots, redacted log evidence, tester, reviewer and staging SHA on GitHub Issue #47; keep open until acceptance.

## Implementation scope

PR for this task only hardens **server-side rules** against omitting published point selections and accepting unapproved global one-way charge fallback; adds regression tests. Existing point management, one-way pricing, customer advance/full options and quote snapshots are reused. No point fees, branch records, or payment configurations are seeded or modified in this PR.

**Issue remains open until exact 3/4 point publication, approved directional values and end-to-end staging payment acceptance have been verified.**
