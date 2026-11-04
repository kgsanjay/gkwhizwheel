# G.K. WhizWheel — Official Logo & UI Brand System

## Source of truth
The owner-provided horizontal logo (scooter / palm illustration plus “G.K. WhizWheel” lettering) is the official brand mark. Preserve its exact artwork and proportions; do not regenerate or typeset a replacement.

**Required asset:** `public/images/whizwheel-official-logo.png` (original 400 × 137 PNG; supplied separately as an upload). The shared header, mobile menu and footer reference this path, falling back to `/images/logo.png` while the official asset is not present.

**Asset setup in Antigravity:** Copy the supplied original PNG to that exact path; verify the browser returns HTTP 200 for `/images/whizwheel-official-logo.png`. Commit the image binary on the design branch before merging. The source logo has a white background, so keep the logo itself on a clean white surface.

## Colors (sampled from the user-provided logo)
- Deep ocean teal: `#0A404C` — main branded text / dark sections
- Sea glass teal: `#399394` — secondary highlights / links
- Golden amber: `#F5C360` — highlights and subtle accents
- Sunset orange: `#EB7E2B` — prominent action accents sparingly
- Warm white: `#FAF8F1` — page canvas
- White: `#FFFFFF` — cards and header
- Ink: `#172326` — readable text

## Visual direction
Calm, authentic travel + mobility brand; editorial scale, professional photography, clean booking forms, restrained radii, meaningful whitespace, strong hierarchy, excellent mobile support. Avoid neon gradients, oversized badges, floating glows, multiple conflicting accents, fictional ratings and decorative animations.

## Pages, in order
1. Global header/navigation/footer and logo
2. Homepage hero and pickup/return booking search
3. Branch discovery (Honnavar and Murudeshwar)
4. Inventory/bike cards and details
5. Checkout/booking steps and transparent one-way pricing
6. Account and customer support
7. Admin: table density, dashboards, form consistency

## Deployment boundaries
Design changes must be deployed to `staging.whizwheels.in` only after ensuring staging does not share application files or databases with `whizwheels.in`. Do not deploy this work directly to production.
