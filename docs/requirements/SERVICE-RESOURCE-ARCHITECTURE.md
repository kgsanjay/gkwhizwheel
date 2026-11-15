# Issue #42 — Service resource inventory and availability architecture

This is the **multi-tenant branch-scoped resource and inventory architecture** for GK WhizWheel's multi-vertical services engine (Two-Wheelers, Cabs & Taxi, Boating, Netrani Scuba, Homestays, Tour Guides, and Custom Packages). All service verticals operate with strict physical branch isolation and role-gated staff scoping.

## Entities and cardinality

```mermaid
erDiagram
  STORES ||--o{ SERVICE_ITEMS : branch_scope
  STORES ||--o{ SERVICE_BOOKINGS : branch_scope
  USERS ||--o{ SERVICE_USER : permissions
  SERVICES ||--o{ SERVICE_USER : vertical_scope
  SERVICE_ITEMS ||--o{ SERVICE_RESOURCES : defines
  STORES ||--o{ SERVICE_RESOURCES : operates
  SERVICE_RESOURCES ||--o{ SERVICE_RESOURCE_ALLOCATIONS : reserved
  SERVICE_BOOKINGS ||--o{ SERVICE_RESOURCE_ALLOCATIONS : consumes
```

### Multi-Tenant Store Scoping (`store_id`)
As formalized in migration `2026_11_07_000001_add_store_ownership_to_service_items_and_bookings.php`, `ServiceItem` and `ServiceBooking` are strictly scoped to physical operational store branches via the `store_id` foreign key. There are no global or single-tenant service resources:
- Every `ServiceItem` belongs to a physical operational hub (`stores.id`).
- Every `ServiceBooking` is tied to a specific branch (`store_id`), ensuring local hub revenue segregation, localized inventory control, and branch-level scheduling.
- Search queries, availability lookups, and administrative consoles filter strictly by store context.

### Staff Vertical Permissions (`service_user`)
Staff access and administrative capabilities for managing specific verticals are gated by the `service_user` pivot table (`user_id`, `service_type` / `service_id`):
- Hub managers and ground staff are only granted permissions for the vertical sectors they are assigned to (e.g., a boat jetty coordinator has `boating` permissions, while scuba instructors have `scuba` permissions).
- Ground check-in, passenger manifest viewing, and status transitions enforce both store branch assignment (`staff_store`) and vertical permission gating (`service_user`).

The `service_resources` catalog stores **real, individually managed resource IDs**, type, branch, operating state, and verified integer capacity. `service_resource_allocations` stores dated, per-booking allocations with quantities and temporary holds. Foreign keys protect historical references.

## Resource types and next-service ownership

| Type | Service | Inventory and scheduling required in its service epic |
|---|---|---|
| `cab_vehicle` | Taxi | Vehicle license, class, trip assignments, driving time buffers |
| `cab_driver` | Taxi | Verified driver, shifts, time overlap and location |
| `boat` | Boating | Vessel, captain, shared seat vs private full-vessel charter |
| `scuba_slot` | Scuba | Session, boat, instructor, participant eligibility and equipment |
| `stay_room` | Homestay | Actual room unit and room-night check-in/out buffer |
| `tour_guide` | Guides | Individual verified guide, language and working calendar |
| `tour_departure` | Tours | Departure, seat limit, supplier dependencies and itinerary |

The above are **type-discriminated physical/resource records**, not separate disconnected systems. Each service epic implements its type-specific detail tables/constraints and admin CRUD. Type strings are validated by their application-level service modules before any admin publish or customer exposure.

## Core invariants

1. Only operator-approved `status=available` resources can be allocated. An initial resource is draft.
2. **Strict Multi-Tenant Branch Scoping:** Every resource, service item, and booking must belong to the exact same physical store hub (`store_id`). Services are never treated as un-scoped or global resources.
3. **Staff Vertical Authorization:** Staff permissions to view, book, or process check-in for a service vertical are gated by the `service_user` pivot table. Access without the matching vertical assignment is rejected with HTTP 403.
4. All writers use `ServiceResourceAllocator::allocate`, which locks the **resource row** in a DB transaction before summing overlapping allocations. The lock must be honored by every writer.
5. Half-open intervals `[start,end)` permit same-time end/start handoffs (subject to buffer rules in each service module). Holds expire automatically for capacity calculation; `confirmed` allocations continue to reserve units.
6. Capacity is **numeric, explicit and verified**. Never convert "10 Persons" or a blank field to an imaginary default for newly managed resources.
7. A retry with same resource, booking, interval, quantity and status returns existing allocation. A changed retry fails. Unique keys prevent two copies for same booking/resource.
8. `service_enquiries` are not bookings and do not allocate inventory or accept payments. Existing two-wheeler inventory uses separate `Bike`/`BikeModel` models.
9. Customer payment is prohibited until availability and server-derived pricing are both approved. Allocation alone does not imply a paid/confirmed booking.

## Remaining explicit work

- Implement cab classes/driver/vehicle data, boat departures, dive eligibility and instructors, property/room-night calendars, guide shifts, tour itinerary departure and shared cross-service supplier allocations in the relevant open issues.
- Add admin permissions and role-scoped CRUD for these resources before making them publishable.
- Implement atomic booking creation + allocation + server quote, appropriate resource conflict recovery and release/modify flows. Future migration must avoid double counting existing `ServiceBooking` capacity.
- Add production-database integration/concurrency tests (two separate connections/transactions), because the initial tests cover deterministic capacity boundaries, not a real parallel server race.
- Staging backup, migration `2026_11_07_000011`, manual seed of verified sample resources on staging only, test concurrency/branch restrictions, sign-off. No production deploy without approval.

## Rollout and rollback

1. Back up staging and verify `main` SHA.
2. `php83 artisan migrate:status`, then `php83 artisan migrate --force`.
3. Check `service_resources` and `service_resource_allocations` exist and initially contain zero rows. Existing service and bike booking totals must remain unchanged.
4. Do not manually fill resources with fake inventory. The first genuine resources will be created when service-specific admin CRUD is approved.
5. Rollback only with a verified backup and after confirming there are no genuine allocations (FK constraints intentionally restrict destructive removal).

The full implementation remains tracked by epic #27 and service epics #29–#34; **Issue #42 stays open until staging and broader capacity/authorization acceptance is recorded**.
