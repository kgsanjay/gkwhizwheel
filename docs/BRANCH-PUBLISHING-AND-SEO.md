# Branch landing pages — implementation guide

## Design

Existing `stores` records are authoritative branches. No duplicate branches table is introduced.

Each branch receives a unique `slug`, public display name, description, hero image URL, pickup instructions, SEO title/description, and a separate `publication_status`. Existing operational `status` continues to control whether the physical branch can take new business.

New records start **draft**, including existing records after the migration. Existing Honnavar and Murudeshwar stores **must be intentionally edited and published** through admin once their authentic content is entered; the migration does not create fictitious pages or publicize historical stores automatically.

## Administrative flow

1. Super Admin creates a store through `/admin/stores/create`. Leaving slug blank generates a unique slug from the city, such as `honnavar` or `honnavar-2`.
2. Set genuine address, coordinates, pickup instructions, an approved hosted photo and an original branch description.
3. Choose **Published**; publication requires an active branch and nonempty description. Only users who can create stores (superadmins) can change publication state on an existing store.
4. The page becomes available at `/locations/{slug}`, appears on `/locations` and is added to `/sitemap.xml`.
5. The public location page displays only bikes in `BikeStatus::AVAILABLE` with `current_store_id` equal to the branch ID. Each card links to existing bike detail and live quote; listings are **not** a promise of future-date availability.
6. Mark the branch draft or inactive to remove its public location page and sitemap listing. Existing bookings must be handled separately.

Published URLs are intentionally immutable until a redirect management feature is added. Do not rename slugs in the database without issuing permanent redirects from their previous paths.

## Search engine and staging safety

- Branch landing pages render a unique page title, description, canonical URL and LocalBusiness JSON-LD from actual store fields; no fabricated reviews/ratings.
- `X-Robots-Tag: noindex, nofollow, noarchive` is set on all responses served from **exactly** `staging.whizwheels.in`.
- Sitemap entry URLs are built from the current configured request URL. On production, configure the approved canonical domain and appropriate `APP_URL`.
- For SEO, fill branch-specific descriptions, real storefront photos and exact operating hours. Some branch details remain optional until verified.
- Existing site-wide hardcoded address/contact information in AppLayout is still Honnavar-specific; future homepage/footer CMS should dynamically display the full branch list rather than mixing physical addresses.

## Not included / release gates

- **Not** a completed cross-branch availability projection, transfer scheduling or one-way route fee editor. These are covered separately by draft PR #6 and subsequent work.
- **Not** a real-time inventory count for arbitrary future dates: the cards represent current physically located and status-available bikes.
- No image uploads: hero image field expects a public HTTPS image URL. An authenticated media manager can follow.
- Public branch pages must be visually tested on desktop and mobile, and branch staff must confirm real pickup directions.
- Coordinate with pending PR #4 before merging public homepage/fleet changes. Both branches are based on current main; merge/rebase and retest to avoid overwriting unrelated changes.
- Apply the database migration and Vite build to **isolated staging** before previewing new branch URLs. Never migrate production from an unreviewed PR.
