# AGENTS.md — GK WhizWheel Agent Architecture & Engineering Guide

This document defines the permanent project architecture, codebase understanding protocols, and engineering standards for GK WhizWheel. All AI agents and developers working on this repository must adhere strictly to these rules.

---

## 1. Primary Codebase Understanding System: Graphify

This repository uses **Graphify** (`graphify-out/`) as its persistent knowledge graph and architectural ground truth.

### Knowledge Graph Architecture
- **Graph State:** `graphify-out/graph.json` (4,900+ nodes, 11,600+ edges, 280+ communities).
- **Interactive Visualizer:** `graphify-out/graph.html`.
- **System Report:** `graphify-out/GRAPH_REPORT.md` (god nodes, community hubs, and surprising connections).
- **Architecture Wiki:** `graphify-out/wiki/index.md` (modular community articles).

### Protocol for Answering Codebase Questions & Pre-Implementation
1. **Query the Graph First:**
   - For architecture, relationship, or feature questions, query the graph before raw grep or mass file reads:
     ```bash
     graphify query "<question>"             # BFS context traversal
     graphify path "<Source>" "<Target>"     # Trace shortest path between modules/concepts
     graphify explain "<SymbolOrClass>"      # Inspect callers, dependencies, and degree
     ```
2. **Navigate the Architecture Wiki:**
   - For high-level domain understanding, consult `graphify-out/wiki/index.md` and read the relevant community article rather than reading dozens of individual files.
3. **Pre-Implementation Impact Analysis:**
   - **Before implementing any feature or refactoring code**, query the graph to identify:
     - Affected models, controllers, and services.
     - Database foreign keys and Eloquent relationships.
     - Downstream callers and API endpoints that may be broken by changes.
4. **Source Verification Gate:**
   - **Never assume the graph is up to date.** Always verify the actual source files and database schemas before writing code.
5. **Scoped Analysis (Lazy Senior Dev):**
   - Never unnecessarily re-analyse unrelated parts of the application. Keep search and query context bounded.
6. **Incremental Graph Maintenance:**
   - After completing significant code changes, run the incremental update:
     ```bash
     graphify update .
     ```
   - This re-extracts code AST deterministically in seconds with **zero LLM/API cost**.
   - If architectural changes warrant updating the wiki, run:
     ```bash
     graphify export wiki
     ```

---

## 2. Core Architecture & Key Abstractions (God Nodes)

GK WhizWheel is a multi-vertical coastal mobility & experiential travel operations platform built on:
- **Backend:** Laravel 11 / PHP 8.3 / MySQL / Sanctum / Inertia.js
- **Frontend:** React 18 / Material UI (MUI v6/v7) / Vite / Recharts
- **Deployment:** Nginx / PHP-FPM / Vite production assets

### Primary Abstractions (Identified by Graphify Degree Centrality)
1. **`User` & `UserRole` (`app/Models/User.php`, `app/Enums/UserRole.php`):**
   - Roles: `super_admin`, `admin`, `manager`, `staff` (ground staff), `customer`.
   - Branch Access: Multi-branch store assignment via `staff_store` pivot table. Super admin has global scope; managers/staff are scoped to assigned branches.
2. **`Store` (`app/Models/Store.php`):**
   - Physical operational hubs (e.g. Honnavar Hub, Murudeshwar, Gokarna).
   - Enforces inventory segregation, staff assignment, and local branch pricing.
3. **`Booking` (`app/Models/Booking.php`, `app/Enums/BookingStatus.php`):**
   - Two-wheeler rental lifecycle: `pending` → `confirmed` → `handed_over` → `returned` (or `cancelled` / `refunded`).
   - Tracks pickup/return store hubs, landmark pickup points, customer KYC, deposits, and add-ons.
4. **`ServiceBooking` & `ServiceItem` (`app/Models/ServiceBooking.php`, `app/Models/ServiceItem.php`):**
   - Multi-vertical service engine powering 7 operational sectors:
     - `two_wheelers` (Bikes & Scooters)
     - `cabs` (Outstation & Local Taxi Fleets)
     - `boating` (Backwater Cruises & Speedboats)
     - `scuba` (Netrani Island Diving & Snorkeling)
     - `homestays` (Coastal Villas & Resorts)
     - `tour_guides` (Local Certified Guides)
     - `packages` (Custom Multi-Day Itineraries)
   - Staff permissions are scoped per vertical via the `service_user` pivot table.
5. **`CabDispatch` (`app/Models/CabDispatch.php`):**
   - Taxi dispatch state machine: driver assignment, meter readings, GPS, and dispatch events.
6. **`PricingRule` & `BranchBikeModelPrice`:**
   - Dynamic rate engine supporting weekday/weekend rates, seasonal multipliers, duration discounts, and branch-specific price overrides.
7. **`PickupPoint` (`app/Models/PickupPoint.php`):**
   - Landmark-based delivery / return points attached to physical branches with directional relocation fee calculations.

---

## 3. Engineering Rules & Best Practices

### Ponytail Lazy Senior Developer Standard
- **The best code is the code never written:** Stop at the first rung that holds (YAGNI → reuse existing codebase pattern → stdlib → existing dependency → minimum working diff).
- **Root cause over symptom:** Fix the shared service/function once rather than patching individual callers.
- **Boring over clever:** No unsolicited abstractions or speculative design patterns.

### Frontend & MUI v6/v7 Standards
- **Grid v2 Prop Rule:**
  - Strictly use `<Grid size={{ xs: 12, sm: 6 }}>` and `<Grid size={{ xs: 12 }}>`.
  - **Never use deprecated `<Grid item xs={...}>`**; MUI v6+ ignores `item` and `xs`, causing layout scrambling.
- **Dialog & Modal Viewport Integrity:**
  - Prevent horizontal scrollbars: Always set `overflowX: 'hidden'` on `Dialog`'s `PaperProps` and `DialogContent`.
  - Use `disableEqualOverflow` on the root `<Grid container spacing={2}>` inside modals.
  - Multi-item badges/chips must use `<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>`. **Never use `<Stack direction="row" flexWrap="wrap">`** (MUI Stack ignores `flexWrap` and causes horizontal blowout).
- **Browser Credential Autofill Defense:**
  - In staff provisioning and sensitive admin forms, inject hidden decoy credentials inputs (`tabIndex={-1}`, `display: none`) and set `autoComplete="new-password"` / `autoComplete="off"` to prevent browser password managers from auto-filling Super Admin credentials into new accounts.

### Security, Multi-Tenant Scoping & Data Integrity
- **Branch Scoping:** Every hub staff request must be verified against their authorized stores in `staff_store`. Super Admin can switch branch context via header switcher (`all` or specific store ID).
- **Service Scoping:** Staff member actions on bookings must be gated by `service_user` permissions.
- **Audit Logging:** Financial operations, bike status toggles, refunds, and credential changes must emit `ActivityLog` entries.

### Verification Gate (Mandatory)
Before closing any task or committing:
1. **Backend Tests:** Run the targeted PHPUnit suite:
   ```bash
   php artisan test --filter=RelevantFeatureTest
   ```
2. **Frontend Compilation:** Verify clean Vite bundle compilation:
   ```bash
   npm run build
   ```
3. **Graph Sync:** If files were created or structural relationships changed:
   ```bash
   graphify update .
   ```
