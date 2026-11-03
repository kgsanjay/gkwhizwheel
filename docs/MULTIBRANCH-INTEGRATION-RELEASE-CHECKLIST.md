# GK WhizWheel — Consolidated multi-branch release candidate

## Source and scope

This integration branch combines the feature-chain changes **PR #6 → #8 → #9 → #10**, the branch publishing/SEO chain **PR #7 → #11**, and compatible public service and inventory presentation fixes from **PR #4**.

No source PR is merged into `main`; this integration branch has **not** been deployed to either staging or production. Original draft PRs remain open.

### Included functional areas
- Directional configurable one-way return fees and server-owned rental quote totals.
- Projected future bike location derived from active reservation sequence; customer search and hold reject incompatible routes.
- Separate pickup/return selectors, server-validated quote and accurate hold expiry.
- Manual source-to-destination bike transfers (request, superadmin approval, dispatch, receiving confirmation), audit history and store-scoped staff controls.
- Admin-publishable branch pages using the existing Store model, original content, SEO metadata and unique slugs.
- Dynamic Honnavar/Murudeshwar homepage branch discovery, branch-specific bike links, locations sitemap, staging noindex, current fleet cards and admin-backed service prices.
- Approved/in-transit bikes hidden from homepage, branch pages and public API booking catalog.
- Tests from the feature branches and the public-data regression tests consolidated.

## Required QA BEFORE ANY staging deployment

1. Confirm repository CI passes on the exact integration head (Laravel tests and Vite build, both mobile TS checks).
2. Code review permissions and validate all database migrations on an isolated **staging-only** database, with backup and rollback. Never point staging to production DB.
3. Ensure at least two real Store records exist for Honnavar/Murudeshwar, with correct address and contact details. New branch public pages remain **draft** until published explicitly.
4. Configure active, directional one-way rules; a missing route rejects checkout. Test two-day ₹1,000 same-branch vs ₹1,200 with ₹200 return fee, plus reverse-direction fees.
5. Browser test homepage, locations index, each branch page, bike catalog, bike detail and checkout on mobile/desktop; validate no blank images, console errors or stale price.
6. Test multiple overlapping and chained future bookings, payment holds, payment webhook retries, refunds, late returns, one-way handovers and receiving branch inventory updates under realistic conditions.
7. Test transfer request/approve/dispatch/receive with source/destination staff and confirm restricted users cannot change other branch data.
8. Test robots `X-Robots-Tag` on staging, canonical production domain, published sitemap URLs, LocalBusiness data and real branch info.

## Release blockers and known limitations

- **Staging deployment has not happened**, and browser/payment sandbox checks have not been performed on this combined branch.
- Booking-based one-way returns and manual branch transfers use separate workflows. Operational exceptions (late return, maintenance, ad hoc return-branch change, transfer while bike on rent) need verified handling.
- Current future-location forecast is reservation-date based (not GPS-confirmed or scheduled future manual transfers).
- Original site-wide marketing pages and footer still contain Honnavar-specific contact, availability, price, hours and service claims. Conduct page-by-page editorial verification before claiming complete SEO optimization.
- The current staging server previously returned automated clients 401/429 after repeated probes; browser smoke tests should be rate-aware and distinguish security controls from UI defects.
- The production canonical domain and real branch addresses/hours/phone/GBP links need manual business verification.
- Check open PRs against the integration branch before merge: changes from PR #4 in overlapping pages may need a final content-design review.

## Safe deployment order (only after review and explicit approval)

1. Freeze the integration SHA and review a single diff against main.
2. Backup **staging** DB/files and validate staging config, HTTPS, API secrets and isolated DB.
3. Deploy the exact tested release SHA to isolated staging, run migrations, build assets, clear/rebuild Laravel caches.
4. Populate and publish actual branch content; configure route fees and staff permissions.
5. Perform customer/admin/staff/payment sandbox acceptance tests. Revalidate CI, security and monitoring.
6. Only after written approval create a production release/rollback plan; production remains untouched otherwise.
