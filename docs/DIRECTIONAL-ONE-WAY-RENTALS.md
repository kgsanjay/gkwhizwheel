# Directional one-way bike rentals — implementation phase 1

## Existing data model
- Stores are physical branches; bikes have home_store_id and current_store_id.
- Bookings store pickup_store_id, return_store_id, and one_way_fee_amount.
- PricingRule supports ONE_WAY_FEE, directional from_store_id/to_store_id, priority, rate_type, and active status.
- BookingService updates the bike's physical store on return.

## Phase 1 safeguards in this branch
- Same-branch return: no one-way fee.
- Different-branch return: the active rule for the selected direction is required; missing rule yields HTTP 422 rather than an implicit free transfer.
- An exact directional rule takes precedence over a generic legacy fallback, even when its priority is lower.
- Fee is computed on the server, persisted in the booking total, and included in the itemized quote.
- Booking hold locks the bike and rejects an unavailable bike, a pickup at a branch other than its current location, or inactive branches.
- Admin pricing simulator can accept optional pickup_store_id and return_store_id (without frontend controls yet).

## Configuring the example
The admin can create one active pricing rule:
- rule_type = one_way_fee
- from_store_id = Murudeshwar store ID
- to_store_id = Honnavar store ID
- rate_type = flat_addon
- value = 200
- is_active = true

For a ₹1,000 rental (before separate deposit, discounts or taxes), returning to the pickup branch costs ₹1,000; returning to Honnavar costs ₹1,200. The reverse Honnavar → Murudeshwar direction requires a separate enabled pricing rule unless an explicitly authorized generic rule exists.

## Release / compatibility warnings
- This **changes** the behavior of unconfigured different-branch bookings from implicit zero fee to explicit rejection. Audit existing active routes and add authorized rules before enabling it in production.
- Existing generic origin/destination-null one-way rules still permit all branch pairs. Review/remove these if the business requires an explicit allowlist.
- A booking hold currently assumes the current physical bike location will still be valid at the future pickup date. That is not always true after future one-way bookings; a future location projection/transfer scheduler is required before full multi-branch availability rollout.
- Existing checkAvailability and list APIs use different overlapping booking rules. Unify them before launching dates-based cross-branch search.
- Admin quote simulator accepts branch IDs, but dedicated UI controls still need to be built.
- A later phase must implement route editing, customer UI, branch landing pages/SEO, and permissions tests.
- Do not deploy to production until the route fee matrix is populated and a sandbox payment plus actual cross-branch return test passes.
