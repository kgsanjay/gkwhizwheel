# G.K. WhizWheel — Layered 2027 Hero Preview

The responsive multi-service hero is implemented in `ui-preview/index.html` and references four **real** artwork files that are distributed separately as `whizwheel-hero-assets.zip` in the conversation.

Copy these exact files to the `ui-preview` branch (relative to repository root):

- `assets/hero/hero-background.webp`
- `assets/hero/coastal-collage.webp`
- `assets/hero/blue-scooter.webp`
- `assets/hero/whizwheel-official-logo.png`

Do not upload the ZIP alone; extract the four files at the paths above.

The preview intentionally has fallback images if the exact art has not been installed. Those fallbacks **are not** the approved final hero.

Local preview: open `hero-preview.html` from the asset package after extraction. It uses these layers directly.

**Technical:** The hero is a static HTML/CSS/JS design demonstration for GitHub Pages only. Live service availability, branch rentals, pricing, dates, payment, and booking workflows remain in the Laravel app. Do not migrate this static demo directly to production. For the final Laravel version, place images in `public/images/hero` and implement responsive React/MUI components and service-specific booking routes. Do not advertise unsupported review counts or invented service availability.

Mobile: Collage and scooter stack below copy; service selection becomes a horizontal scroller, with location/date form fields stacked on narrow screens.
