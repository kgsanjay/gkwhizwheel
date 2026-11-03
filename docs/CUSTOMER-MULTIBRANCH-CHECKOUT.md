# Customer multi-branch booking — Phase 4

This branch is **stacked on Phase 3 / PR #8**, which depends on Phase 1 / PR #6. It is not based on `main`.

## End-to-end customer flow

1. Customer opens `/services/bikes`, selects **Pickup Branch**, optional **Return Branch**, and pickup/return dates.
2. Date-filtered public bike search checks the authoritative `AvailabilityService` using both branches and the planned future bike-location schedule. Same-branch is the default when no return branch is chosen.
3. The customer chooses a bike. Both branches and dates are passed in the URL query to its detail page.
4. The bike detail view allows editing dates, pickup and return branches. Selecting a different branch triggers a new server quote; the one-way fee is displayed distinctly.
5. Laravel's `/bikes/{id}/price-quote` rejects nonrentable combinations before calculating an amount. Any missing or disallowed one-way route results in a visible quote error, not a zero-fee promise.
6. The checkout modal shows pickup/return branches, breakdown including one-way charge and refundable deposit. Test payment simulation controls are restricted to development builds.
7. After login, the final `/bookings/hold` endpoint independently validates dates, branch movements, availability and fee **under the bike row lock**, then persists the fee and quoted total for payment.
8. The countdown comes from `held_until` returned by Laravel (normally 10 minutes), not a hardcoded frontend estimate.

## Manual acceptance scenarios

- Murudeshwar → Murudeshwar for 2 days, ₹500/day: rental ₹1,000, no one-way fee.
- Murudeshwar → Honnavar for 2 days with active flat-fee rule ₹200: ₹1,200 rental including one-way fee, before any separate deposit and taxes.
- Reverse direction: only allowed when an active matching rule or intentionally enabled generic rule exists.
- Changing return branch re-fetches quote, hides the prior amount while fetching, and disables checkout until validated.
- A branch where the bike cannot be collected on selected dates produces 422 and blocks checkout.
- Earlier one-way return that strands a subsequent reservation is blocked.
- Pending-payment holds remove a bike from date-filtered searches.
- Price and one-way fee are persisted by the backend; the client cannot set the amount.
- Actual expiry and payment retry behavior must be tested in a sandbox environment.
- Test desktop/mobile browser layouts and keyboard interaction with date and branch selectors.

## Remaining work before production

- PR #4 also modifies public bike cards and checkout wording; carefully integrate/rebase and retest instead of overwriting changes.
- PR #7 adds public location landing pages; link them into this shared pickup flow once merged.
- Transfer scheduling, confirmed physical handovers, late returns, maintenance and operational inspection may change expected future availability; build those workflows before unrestricted launch.
- The fleet-list page retains Honnavar-specific promotional sections, FAQs and hardcoded service claims. Those require an SEO/content pass against actual branch records.
- Live payment integration and device testing have **not** been run from this branch.
- PRs must be integrated in dependency order (6 → 8 → this PR); all PRs remain drafts and no environment was deployed.
