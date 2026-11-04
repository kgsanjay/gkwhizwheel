# G.K. WhizWheel — 2027 UI and Image Replacement Plan

## Design policy

- Official customer-supplied G.K. WhizWheel logo is the only approved logo. Do not recreate or change it.
- Website sells seven services: bikes, cabs, stays, boating, scuba diving, local guides, and tours; do not present it solely as a scooter site.
- Original approved palette: deep teal `#07565B`, navy `#073642`, CTA orange `#E77700`, cream `#FFF9F1`.
- Editorial photography, natural light, clean details, restrained motion, 8–16px corner radii.
- No unverified certifications, 25,000+ customers, fake five-star reviews, instant availability or payment claims.
- Replace visuals progressively on `ui-preview`, validate mobile/desktop, then implement approved designs in Laravel `dev`. `main` requires manual approval.
- Do not edit original fleet, property, guide, vehicle or location photos to imply a service/product different from reality.

## Image audit + target asset inventory

| Section | Target asset(s) | Desired content | Design size |
| --- | --- | --- | --- |
| Header/footer | `assets/hero/whizwheel-official-logo.png` | Exact supplied official horizontal logo | Natural ratio, do not crop |
| Home hero background | `assets/hero/hero-background.webp` | Warm cream coast, subtle teal palms and orange sweep | 1920x1080 artwork |
| Home hero scenic collage | `assets/hero/coastal-collage.webp` | Coastal scenery, stays, boating, diving, culture, no text | Transparent 4:3 |
| Home hero foreground | `assets/hero/blue-scooter.webp` | Scooter cutout isolated on transparency | Transparent 4:5 |
| Home services discovery | `assets/services/{bikes,cabs,homestays,boating,scuba,guide,tours}.svg` | Seven fresh consistent editorial illustrations | 800x500, already committed |
| Bike fleet listings | Real bike images from database, per model | Actual available vehicle, images tied to listing | 1200x900 minimum |
| Cab service | `assets/services/cabs-hero.webp` | Verified local cab/vehicle on coastal route | 1600x900 |
| Homestays | `assets/services/homestays-hero.webp` + gallery | Actual listed cottage/room/property | 1600x900 |
| Boating | `assets/services/boating-hero.webp` | Honnavar Sharavathi river or mangrove boating | 1600x900 |
| Scuba | `assets/services/scuba-hero.webp` | Netrani Island dive experience, appropriately licensed | 1600x900 |
| Guides | `assets/services/guide-hero.webp` | Real guided walking/heritage/nature experience | 1600x900 |
| Tours | `assets/services/tours-hero.webp` | Coastal Karnataka itinerary montage | 1600x900 |
| Branch pages | `assets/branches/honavar.webp`, `murudeshwar.webp` | Actual branch exterior, pickup landmarks, associated local photos | 1600x900 |
| Explore | Per destination galleries | Real locations, accurate alt text | 1200x800 |
| Booking | No decorative photos inside form | Keep booking focused, fast and accessible | N/A |

## Functional UX patterns by service

1. **Bikes:** pickup/return branch, dates, bike category, rate, one-way fee, KYC and checkout. Use actual bike photos.
2. **Cabs:** trip type, route, vehicle, travel datetime, passenger/luggage details, fixed quote vs request state.
3. **Homestays:** stay/gallery, amenities, check-in/out, guests, room count, meals, exact property authenticity.
4. **Boating:** package, date/time slot, adults/children, jetty, weather and safety rules.
5. **Scuba:** dive programme, date, divers, age/medical eligibility, harbour reporting, weather/seasonal rules.
6. **Guides:** trail style, duration, meeting point, language, group size and local guide profile.
7. **Tours:** package comparisons, day-by-day itinerary, stays, transport class, activity inclusions, custom requests.

## Sequence

- Phase A: Shared branding + all-service hero; responsive booking selector; homepage seven-service cards.
- Phase B: Services directory and bike rental catalog/detail/checkout.
- Phase C: Cabs then Homestays.
- Phase D: Boating then Scuba.
- Phase E: Guides then Tours + custom trip builder.
- Phase F: Branches, destinations, FAQs, support/footer, mobile QA and performance.
- Phase G: Connect Laravel in `dev`, validate all workflows, approve for `main`.

## Asset deployment caution
The layered PNG/WebP asset ZIP is available in the current ChatGPT conversation but the binary files are not yet committed to GitHub. Static GitHub Pages references should not be considered visually final until those four files exist at the exact relative paths. Local SVG service illustrations currently ship directly from `ui-preview`.
