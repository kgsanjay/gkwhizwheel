# New ChatGPT-generated service photos — Installation

## Design preview
The GitHub Pages homepage now points to these seven optimized WebP photos:
- `assets/services/bikes-card.webp`
- `assets/services/cabs-card.webp`
- `assets/services/homestays-card.webp`
- `assets/services/boating-card.webp`
- `assets/services/scuba-card.webp`
- `assets/services/guide-card.webp`
- `assets/services/tours-card.webp`

The original SVG illustrations remain fallback assets while WebP uploads are pending.

## Upload (required)
Obtain the ChatGPT-generated `gkwhizwheel-service-photos.zip` supplied with this conversation. Extract the `assets/services/` folder and commit all 14 optimized WebP files to the **ui-preview branch only**. Do not upload only the ZIP.

The 7 `*-card.webp` files are optimized for 800×500 service cards. The 7 `*-desktop.webp` files are 1586×992, suitable as service-page visual hero concepts.

## QA
On GitHub Pages, inspect all seven cards at desktop and mobile breakpoints. Confirm images return HTTP 200 and are not falling back to the SVG assets. Check 800×500 aspect ratio, text clipping, image loading and card height. The page is a static design preview without active bookings. Production and Laravel `dev` stay untouched.

## Authenticity
These AI-created images depict **conceptual** coast, scooters, taxis, accommodations, guides, boating, diving and tour scenes. They do not document a specific vehicle, property, location or operator. Keep actual listings and product details tied to verified uploaded real-world photos rather than implying that the synthetic images represent the exact bookable item.
