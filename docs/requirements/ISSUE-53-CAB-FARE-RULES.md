# Issue #53 — Cab fare rules and server-authoritative quote preview

## Development foundation

- New additive `cab_fare_rules` table, scoped to one active branch and one taxi `service_item`, uniquely keyed by service item + trip type + route class. Types: `one_way`, `round_trip`, `local`, `airport`.
- Configurable **admin-authored** rate data (no prefilled production rates): fixed-route price, distance rate, time rate, minimum hours, minimum trip and daily minimum, included and additional kilometres/hours, daily driver allowance, toll and parking policy and interstate permit amount.
- `CabFareQuoteEngine` calculates a **server-side itemized breakdown** for approved/active rules: base, extra distance, extra time, driver, permit, toll and parking. Browser-supplied total, base price and discount are never used.
- A meter/distance is a **preview of a staff-entered estimate**, not measured actual kilometres or a fully verified price. Exact toll/parking charges must be assessed operationally. The quote preview cannot be used to charge customers.
- Cab rule authoring has branch-specific permission checks for taxi-assigned staff and creates **draft, unapproved and inactive** records regardless of submitted approval flags.
- Admin JSON endpoints: `GET /admin/cab-fares`, `POST /admin/cab-fares`, `POST /admin/cab-fares/simulate`. The simulator only uses separately approved and active rules; there is deliberately **no approval endpoint** in this issue.
- No static amounts from `CabsPage.jsx` are trusted or used to create a charge. The currently public cab flow remains enquiry-only from Issue #40; a separate responsive quote/customer integration must be validated before publication.

## Remaining blockers / acceptance

1. Build reviewer-only approval/activation controls and immutable tariff-version history; restrict staff from approving their own rates.
2. Define exact route classes, fixed packages, kilometre estimation source, late night/interstate rules, toll and parking evidence, taxes and permitted customer changes with business manager. Do not invent real prices.
3. Integrate verified distance/route inputs into a server-signed, customer-owned cab quote that expires, then ensure final booking uses that exact signed quote and allocates approved real driver and vehicle resources atomically.
4. Add cancellation/release and concurrency tests under staging DB, so single driver/vehicle cannot be oversold.
5. Verify approved cab rates from both Honnavar and Murudeshwar, with tests for one-way, return, local and airport; check extras and explicit zero against null.
6. Implement responsive customer UX and test mobile web/keyboard, service availability, privacy and payment sandbox with operational teams.
7. Take verified DB backup before running migrations; no data seeds, no `migrate:fresh`, and no production writes. Reconcile prior `service_bookings` and financial rows before and after changes.
8. Attach PR/green CI, staging SHA, redacted fare comparisons and staff/business sign-off to Issue #53. Keep OPEN until every definition-of-done criterion is accepted.

## Integrity considerations

Do not treat client-entered `estimated_km` or `estimated_hours` as measured/verified quantities for final payment. No public payment API was added. An active/approved flag must be set only in a separately audited approval workflow with server-side authorization; direct DB adjustments are an administrator operation, not part of this feature's success criteria. Values of toll/parking `exact` are not charged from browser parameters.

**No ServerByt deployment or live fare data changed in this PR.**
