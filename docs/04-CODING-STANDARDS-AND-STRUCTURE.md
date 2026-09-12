# Coding Standards & Project Structure

Purpose: when generating code across many sessions (vibe coding), consistency matters more than any single "best" choice. This doc pins down the conventions so every file looks like it was written by the same person.

---

## 1. PHP / Laravel Standards

- **Follow PSR-12** for all PHP code (spacing, brace placement, naming).
- **Strict types:** every PHP file starts with `declare(strict_types=1);`
- **Type-hint everything:** method parameters, return types, property types — no untyped `$var` where avoidable.
- **Naming:**
  - Classes: `PascalCase` (e.g., `BookingService`, `PricingCalculator`)
  - Methods/variables: `camelCase`
  - Database tables: `snake_case`, plural (e.g., `bike_documents`)
  - Database columns: `snake_case`
  - Routes: `kebab-case` (e.g., `/admin/pricing-rules`)
- **Fat models are avoided.** Business logic (pricing, availability checks, refund calculation) lives in **Service classes** (`app/Services/`), not in controllers or models. Controllers stay thin: validate → call service → return response.
- **Form Requests** for all validation (`app/Http/Requests/`) — never inline `$request->validate()` in controllers for anything beyond trivial cases.
- **API Resources** (`app/Http/Resources/`) for every JSON response shape — never `return $model` directly from a controller, so the API contract in `03-API-SPECIFICATION.md` stays enforced in code, not just in docs.
- **Enums:** use native PHP 8.1+ enums for fixed value sets (booking status, payment method, document type) instead of magic strings scattered across the codebase.
- **No raw SQL** unless there's a specific, documented performance reason — use Eloquent/Query Builder.

## 2. Folder Structure (Laravel app/ directory)

```
app/
├── Console/Commands/          # scheduled jobs (release expired holds, expiry alerts)
├── Enums/                     # BookingStatus, PaymentMethod, DocumentType, etc.
├── Http/
│   ├── Controllers/
│   │   ├── Api/V1/
│   │   │   ├── Public/        # bikes, price-quote, availability
│   │   │   ├── Customer/      # bookings, cancel, extend, documents
│   │   │   ├── Staff/         # walk-in flow, handover, return, sync
│   │   │   └── Admin/         # inventory, pricing, stores, reports
│   ├── Requests/               # one per endpoint needing validation
│   ├── Resources/              # one per response shape
│   └── Middleware/
├── Models/
├── Services/
│   ├── PricingService.php      # single source of truth for price calculation
│   ├── AvailabilityService.php # concurrency-safe booking-hold logic
│   ├── BookingService.php      # state machine transitions
│   ├── RefundService.php
│   ├── NotificationService.php # dispatches email + WhatsApp, logs to notification_logs
│   └── SyncService.php         # processes offline app sync queue
├── Policies/                    # one per model needing authorization rules
├── Notifications/                # Laravel notification classes (email + WhatsApp channel)
└── Jobs/                         # if using queued jobs for anything (sync driver on shared hosting = runs inline, but keep the class structure for future VPS upgrade)
```

## 3. Frontend (Website) Standards

- **Material UI (MUI) components only** — don't mix in other component libraries; keep the design system consistent.
- **Component structure:** feature-based folders, not type-based — e.g., `features/booking/`, `features/bikes/`, not `components/` + `containers/` split.
- **State management:** React Query (TanStack Query) for server state (bikes, bookings, pricing) — don't hand-roll fetch + useState + useEffect for data that comes from the API. Use plain React state/Context only for local UI state.
- **API calls:** centralized in a single `api/` client module using Axios with an interceptor for the auth token — never call `fetch` ad hoc from inside components.
- **Forms:** React Hook Form + a schema validator (Zod or Yup) matching the backend Form Request rules — keep validation messages consistent between frontend and backend.

## 4. Mobile App (Store Manager App) Standards

- **Framework:** React Native (recommended over Flutter only because it shares patterns/libraries with the MUI website team — pick Flutter instead if your dev team is more comfortable there; either is fine technically).
- **Local state for offline queue:** use a local SQLite store (e.g., WatermelonDB or plain `react-native-sqlite-storage`) to hold pending actions until synced — don't rely on in-memory state, since the app can be killed by the OS.
- **API layer:** shares the same `Idempotency-Key` generation logic as described in the API spec — generate a UUID client-side at the moment an action is taken (not at sync time), so retries are safe.
- **Distribution:** Android-only APK builds (see main requirements doc Section 7) — set up a simple internal build script (`eas build` if using Expo, or Gradle directly) that outputs a signed APK to a known path for manual upload to your server.

## 5. Git Workflow

- **Branching:** `main` (production) ← `develop` (staging) ← `feature/*` branches
- **Commit messages:** Conventional Commits format — `feat:`, `fix:`, `refactor:`, `chore:`, `docs:` prefixes (helps track what an AI coding session actually changed, across many small commits)
- **One feature branch per doc-defined feature area** where practical (e.g., `feature/pricing-engine`, `feature/staff-app-handover-flow`) — keeps AI-generated changesets reviewable in isolation rather than one giant branch.
- **Never commit `.env`** — commit `.env.example` only (see `05-ENVIRONMENT-SETUP.md`).

## 6. Testing Expectations

- **PHP:** Pest (preferred, cleaner syntax) or PHPUnit — Feature tests for every API endpoint (happy path + at least one failure case), Unit tests for `PricingService` and `AvailabilityService` specifically since they're the highest-risk logic (money and double-booking).
- **Minimum bar before considering a feature "done":** the availability engine must have a test that simulates two simultaneous booking attempts for the same bike/dates and asserts only one succeeds.
- **Frontend:** not mandatory to reach high coverage for a v1 internal tool, but the booking price-preview calculation (if duplicated on the frontend for instant UI feedback) must have at least a snapshot/unit test to ensure it never silently drifts from the backend's `PricingService` output.

## 7. Code Review Checklist (even if it's just you + an AI tool reviewing itself)

Before merging any feature:
- [ ] Does this match the field names/types in `02-DATABASE-SCHEMA.md` exactly?
- [ ] Does this match the endpoint/response shape in `03-API-SPECIFICATION.md` exactly?
- [ ] Is business logic in a Service class, not the controller?
- [ ] Is every user input validated via a Form Request?
- [ ] Does any money/availability-affecting endpoint use a DB transaction with locking?
- [ ] Is there an `Idempotency-Key` check on any booking-creation endpoint?
- [ ] Are bike documents/KYC documents served via signed temporary URLs, not public paths?

---

## 8. Authorization House Standard

Authorization is consolidated onto two distinct layers to prevent silent bypasses and repetitive boilerplate:

1. **Route-Level Role Boundaries (`role:...` Middleware)**:
   - All role-based access gates are declared directly in route definitions (`routes/web.php` and `routes/api.php`) using the `role:...` middleware alias (`App\Http\Middleware\EnsureRole`).
   - Admin routes: `Route::middleware(['auth:sanctum', 'role:super_admin'])->prefix('admin')`
   - Staff routes: `Route::middleware(['auth:sanctum', 'role:staff,store_manager,super_admin'])->prefix('staff')`
   - Controllers **must not** implement hand-rolled `authorizeAdmin()` or `authorizeStaff()` helpers.

2. **Resource-Level & Domain Scoping (Policies & Store Scoping)**:
   - For entity-specific rules (e.g. can user cancel booking #123), use Laravel Model Policies via `Gate::authorize()` or controller `$this->authorize('action', $model)`.
   - For store isolation, staff endpoints use `$user->getAuthorizedStoreIds()` or `authorizeStoreAccess()` to enforce store assignment and audit cross-store administrative actions.

