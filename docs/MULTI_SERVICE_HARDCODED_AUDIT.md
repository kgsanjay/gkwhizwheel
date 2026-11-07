# G.K. WhizWheel — Multi-Service Hardcoded Data Audit

Date: 2026-11-07  
Scope: public web pages, common site layout, bike rental catalog, service-booking entry points, and the draft bike checkout/payment PR.  
Status: **partial remediation on a development branch**; not a production verification.

## Platform model

The website sells and coordinates **seven categories of services**, not just bike rentals:
two-wheelers, taxis, boating, scuba, homestays, guides, and tour packages.
The `₹100 advance / full rental / no refundable deposit` policy in PR #20 applies to
**new online bike rental bookings**, not automatically to other `ServiceBooking` types.
Existing bookings and other service payment policies are not rewritten.

## Confirmed findings addressed in this branch

1. **Shared shell:** `AppLayout.jsx` had Honnavar-only messaging in several
   global header, footer and mobile navigation elements; fixed rating counts,
   "open 24 hours", a bike-only WhatsApp message and a hardcoded bike call to action.
   The branch/location label now comes from admin-managed active `stores` shared by
   `HandleInertiaRequests`. Unverified review/availability claims were removed
   from the most prominent common shell sections. The general WhatsApp inquiry
   is no longer explicitly about a bike in Honnavar.
2. **Marketing prices:** `Welcome.jsx` and `Services.jsx` advertised fixed
   starting prices, stale promotional percentages and fleet/customer numbers.
   Prominent price/fleet claims were changed to quote/availability prompts.
   The existing visual layout is intentionally unchanged.
3. **Bike comparison table:** `Bikes/Index.jsx` had nine literal models,
   invented daily/weekend rates and a fixed `₹1,000 refundable deposit`. The
   comparison now uses the public bike API's registered inventory and configured
   daily/weekend amounts. These remain **indicative** until booking dates and
   route are supplied; new online bike bookings show no security deposit.
4. **Deposit FAQs:** Homepage FAQ/SEO FAQ and bike FAQ described `₹500–₹1,500`
   deposits and fixed refund timelines inconsistent with the new online bike
   policy. These entries now describe deposit-free online bike bookings.
5. **Universal service booking modal:** `ServiceBookingModal.jsx` previously
   posted `service_item_id: null` despite `/services/book` requiring an active,
   matching service item. Its price quote also sent client-generated `base_price`
   but omitted the required `service_item_id`. The homepage now provides
   active service items; the modal lets customers select an item and obtains
   the quote from the server. Laravel continues to calculate the authoritative
   booking price and ignores frontend `custom_amount`.

## Hardcoded values still requiring business verification and an admin-managed source

| Priority | Location | Remaining issue | Recommended authority |
| --- | --- | --- | --- |
| P0 | `ServiceBookingModal.jsx` | Fixed optional package/tier names and prices (diving, meals, room types, popular taxi routes), which may not correspond to a configured `ServiceItem`. | Active service item, configured variants/add-ons and `PricingService`; remove hardcoded numeric upsells until they are bookable server-side. |
| P0 | `CabsPage.jsx` | Hardcoded per-kilometre rates, fixed point-to-point route prices and mileage/time estimates. | Taxi service items plus admin-manageable rate/route rules, calculated quote. |
| P0 | `BoatingPage.jsx` | Fixed `₹1,500` promotional bundle, crossed-out `₹1,600`, advertised `₹600` SEO floor. | Boating packages and validated promotional pricing. |
| P0 | `ScubaPage.jsx` | Hardcoded dive-package rates, hotel transfer fees, claimed certifications and schedule; SEO prices may disagree with offers. | Admin-managed dive packages, operator compliance and schedules. |
| P1 | `HomestaysPage.jsx` | Fixed room rates, meal charges, property listings and operating terms. | Accommodation item variants, availability calendar and house rules. |
| P1 | `GuidePage.jsx` / `ToursPage.jsx` | Static guided-trip price tiers, package multipliers and bundle-rate calculator. | Guide package inventory and server-side itinerary quote. |
| P1 | `Welcome.jsx`, `Services.jsx`, `Bikes/Index.jsx` | Additional detailed promotional/FAQ claims, static partner badges, timings and service-specific marketing guarantees beyond the corrected major callouts. | Verified operating policy and content records. |
| P1 | `Contact.jsx`, `About.jsx`, `HowItWorks.jsx` | Honnavar-only labels, station/hub details, fixed phone/opening-hour promises; some refer to historical two-Honnavar-hub topology. | Active branch records, verified contact channels, branch operating hours. |
| P1 | `Welcome.jsx` / SEO JSON-LD across specialized pages | Locally assumed minimum/maximum price, fixed `AggregateRating` / review count, operating hours and location. | Live catalog prices, confirmed review data, Store opening hours and branch identity. |
| P2 | `AppLayout.jsx` `servicesList` | Service categories are a manually curated seven-item navigation registry. | Keep as a brand navigation taxonomy unless new service categories need CMS management. |
| P2 | Static sample testimonials, sample trip distances and photos | May be mistaken for verified actual transactions or exact driving times. | Verified editorial records and accurate destination data. |

## Next implementation requirements

- Create explicit admin settings / content structures for public offers and service item variants.
- Move all displayed **transaction prices** and upsells to `ServiceItem` plus
  server-side `PricingService`; never accept browser-supplied totals.
- Differentiate general service inquiries from bookable inventory, and show
  an unavailable state when no matching active service item exists.
- Associate service availability, pickup, fulfilment, address, phone number
  and service-specific operating hours with the appropriate branch/provider.
- Avoid inventing review counts, live availability, exact durations or
  third-party certifications without verifiable records.
- Keep existing public homepage layout and all deployed environments unchanged
  until the changes pass CI, staging acceptance and business content approval.
- Test full payment, advances, offline balances and refunds separately for bike
  bookings and for the multi-service booking pipeline.

## Release boundary

Development branch: `fix/multiservice-hardcoded-public-copy-20261107`, stacked on
`feat/web-advance-full-no-deposit-20261107` (draft PR #20). This audit is
not an authorization to merge or deploy either branch.
