# Phase 6 — Published branches, homepage search and local SEO

This PR is **stacked on PR #7**, the admin-publishable branch landing pages. It does not include PRs #6/#8/#9/#10, which implement directional pricing, future location availability, checkout and physical transfers.

## Completed

- Homepage branch search selects pickup branch, optional return branch, dates and submits numeric `store_id` and `return_store_id` (the final booking flow in PR #9 consumes these values).
- Homepage branch discovery cards now come exclusively from admin-published, active Store records. No fabricated station hub, hours, or secondary physical store is generated.
- Branch detail bike links preselect `pickup_store_id` and `return_store_id` using the real Store ID; the dedicated branch search links to the branch-filtered bike catalog.
- Homepage H1, metadata and main hero copy address both Honnavar and Murudeshwar without suggesting every service is available in every city.
- Homepage schema is an Organization representation, not a hardcoded Honnavar physical LocalBusiness with universal claimed hours and tariff.
- Removed unverified static customer testimonial cards and unsupported homepage Google review total/rating.
- Public homepage Inertia inventory uses an allowlist to avoid sending internal registration/odometer details.
- Dedicated branch pages already implement LocalBusiness structured data with real stored branch address, phone and coordinates, and staging `noindex` middleware from PR #7.
- Regression tests cover that public homepage cards include only active published branch records and do not leak internal vehicle data. Updated outdated static SEO tests that required fixed review counts, tariffs and geographic data.

## Critical integration requirements

1. PR #7 must be integrated before this branch; its migration introduces `stores.slug`, `publication_status` and SEO fields. All existing branches remain draft until content is approved and published.
2. PR #9 and its dependencies (#6 and #8) must be integrated before advertising customer one-way branch selection as fully operational. This branch supplies compatible query parameters, but PR #7's existing bike-list UI doesn't yet consume the independent return branch filter.
3. PR #10 adds transfer workflows and depends on #9. PR #4 has prior homepage and fleet data changes that overlap; reconcile and rerun CI, rather than merging all open feature branches without review.
4. The wider legacy public site still has Honnavar-specific contact copy and various fixed promotional statements/FAQs. These require a site-wide content audit and real verification before a production SEO sign-off. The branch schema and primary homepage experience are improved, not a claim that the *entire* website has completed SEO validation.
5. This phase does not make future date availability authoritative by itself. PR #8 / #9 and staging sandbox validation are still needed.

## Staging acceptance

- After branch records are published in staging, ensure both `/locations/honnavar` and `/locations/murudeshwar` display their own real address, hours, images, bikes and contact details.
- Homepage search Honnavar → Honnavar and Murudeshwar → Honnavar should preserve selected branches into public bike filter and detail, then validate dynamic one-way quotes when PR #9 is integrated.
- Confirm no hidden/draft branch appears on homepage, location index, sitemap or detail pages.
- Test mobile navigation and focus/keyboard usability of selectors.
- Confirm correct `noindex` on staging, production canonical host on production, and crawlable/unique branch pages.

No staging or production deployment performed.
