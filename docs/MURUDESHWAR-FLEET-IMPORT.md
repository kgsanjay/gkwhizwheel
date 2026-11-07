# Murudeshwar fleet intake — 7 November 2026

These ten staff-supplied registration/model mappings are prepared for the active Murudeshwar branch. They are **not** inserted on deploy; only the explicit artisan import command applies them.

| Model | Registrations | Units |
|---|---|---:|
| Honda Activa 6G | KA47A8988, KA47A8989, KA47A9092, KA47A9053 | 4 |
| Yamaha Fascino 125 | KA47A8991, KA47A8999 | 2 |
| Suzuki Access 125 | KA47A9088, KA47A9089, KA47A9090, KA47A9091 | 4 |

**Verification status:** Activa/Fascino interpretation came from staff wording; four Suzuki Access identifications were based on photos. Check registration certificates before enabling booking. No fabricated RC, insurance, PUC details, mileage, or branch tariff are inserted.

## Staging release

1. Back up database. Pull updated `main` when the PR is merged and run `php83 artisan migrate --force` if pending.
2. Find the **exact active Murudeshwar store ID** in the existing admin branch list or DB. Do not guess the ID.
3. Preview: `php83 artisan bikes:import-murudeshwar --store=YOUR_MURUDESHWAR_STORE_ID`.
4. Confirm each registration/model and review conflicting pre-existing records. Import refuses wrong-branch or wrong-model collisions.
5. Apply: `php83 artisan bikes:import-murudeshwar --store=YOUR_MURUDESHWAR_STORE_ID --apply`.
6. Verify each vehicle's registration certificate, insurance, condition and availability in admin. **New records start in maintenance**, so they are not bookable until staff explicitly approves them.
7. Configure branch-specific model tariffs in Admin → Bike Model Catalog as needed. The importer preserves existing branch price settings and original bike rates (Activa ₹400/₹500, Fascino ₹450/₹500, Access ₹450/₹500).
8. Confirm date-based stock and quotes from Murudeshwar customer pages. No production deployment until staging acceptance.

This is intentionally not added to `BikeSeeder`; its existing destructive test-data behavior is unsafe for real registrations. The importer is idempotent and dry-run-first.
