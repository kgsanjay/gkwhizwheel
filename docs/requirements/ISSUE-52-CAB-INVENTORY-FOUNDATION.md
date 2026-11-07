# Issue #52 — Cab vehicle and driver inventory (foundation)

## Scope implemented

- Additive `cab_vehicles` and `cab_drivers` tables. Each record belongs to exactly one active branch and one cab/taxi `service_item`; a nullable unique link connects an explicitly approved `service_resource` from Issue #42.
- Vehicles: globally unique normalized registration; vehicle class (hatchback/sedan/SUV/MPV/van/tempo traveller), owned/partner flag, seats, luggage capacity, AC, wheelchair/accessibility flag, insurance/permit/fitness expiry metadata, last inspection, verification and operational status.
- Drivers: deduplicated licence via keyed SHA-256 fingerprint, masked last four, licence expiry, last verification, operational status. No raw licence number in the table or list response. Original documents/driver personal identity still require a separately approved private-document workflow.
- Authenticated admin JSON contracts: `GET/POST /admin/cab-inventory/vehicles` and `GET/POST /admin/cab-inventory/drivers`. Only users granted the taxi service may access; non-HQ staff are scoped to active assigned branches. All newly created records start **draft + documents_verified=false**, regardless of submitted client flags. No batch seeding or synthetic fleet published.
- `CabDispatchEligibility`: a verified, current vehicle and driver each need an active matching branch and cab item, active linked resource of matching type/capacity, current document dates, and a recent inspection/verification. This is a **fail-closed readiness check**, not yet wired into customer checkout.
- Existing `ServiceResourceAllocator` remains independent of legacy checkout: no cab booking is automatically allocated a vehicle/driver yet. Existing six service enquiry-first forms stay unconfirmed and do not charge customers.

## Security and deployment gates

- Do not store RC scans, DL numbers, addresses, contact details or other private docs in public disk/GitHub; determine encrypted private storage, authorized preview, retention, upload audit and access matrix in a separate reviewed step.
- Admin endpoints currently provide the CRUD **create/list foundation**, not a complete operational administration interface. There is no verification/activation UI or status mutation API in this PR. Human review and separate approval are required before turning records into available resources.
- Enforce globally unique plates and licence fingerprints at DB level. Confirm local transport/commercial permit, fitness, driver licence class, background checks and insurance applicability from actual business/transport evidence; no fabricated validity.
- Never auto-upgrade drafts to available via migration or seeder. Confirm every store and service item relationship against the actual ServerByt database.
- Before staging migrations: verified encrypted backup and restore rehearsal; review every pending migration, not just this PR; run `audit:legacy-services --strict` after migration. Compare bike bookings, non-cab service bookings, active branch rows and financial totals before/after. No `migrate:fresh` or `db:seed` without approval.
- Test branch role boundary (Honnavar vs Murudeshwar), duplicate registration variants, unapproved documents, expired permit/insurance/licence, driver unavailability, 2 concurrent allocations and cancellation release on actual supported DB.
- Keep checkout enquiry-only until service-specific approved tariff, vehicle + driver **paired allocation** (locking both resources with cancellation), customer screen/dispatch and sandbox payment are implemented and accepted in the next phase.
- Attach CI, staging SHA, admin screenshot, test record counts (without plates/licences), reviewer and documented verification to GitHub Issue #52. Keep issue OPEN until full criteria are met.

## Future work

1. Admin detail/edit, permissioned verification and private document upload/preview.
2. Vehicle-class rate matrix and explicit approved pricing by branch, capacity, distance, tolls and time.
3. Atomic vehicle+driver pairing and release across branch/dates; real-driver availability, licence class and dispatch timetable.
4. Responsive accessible cab customer selector and confirmed booking integration, with approved server quote and payment.
5. Operational inspection records, partner agreements, cancellation/refund and audit records.

**This PR does not deploy to ServerByt or import any real cabs or drivers.**
