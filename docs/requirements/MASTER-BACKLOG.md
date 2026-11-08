# G.K. WhizWheel — 7-Service Requirements and Delivery Backlog

**Canonical master issue:** [#39](https://github.com/kgsanjay/gkwhizwheel/issues/39). **Every atomic requirement is a separate GitHub issue.**

**Scope:** Laravel + React/Inertia WEB ONLY; seven services (bike, cab, boating, scuba, homestay, guide, tours); Honnavar and Murudeshwar operational branches; no mobile app.

Current release-tree and acceptance reconciliation: [release baseline](RELEASE-BASELINE-20261108.md). Historical issue closure or preview success is not full acceptance.

## Status convention (must follow)

- **Open, no PR:** Not started or pending validation of pre-existing code.
- **Open, PR linked:** In progress or pending code/test/review.
- **Open, PR merged:** Code exists but NOT done until staging/admin/staff/customer acceptance and data checks pass.
- **Closed (completed):** All issue acceptance checkboxes satisfied, evidence posted, approved reviewer/owner sign-off.
- **Closed (not planned or duplicate):** Not completion; add reason and canonical link.
- **Do not assume the checkboxes in this file auto-update.** GitHub issue states + issue acceptance checkboxes are authoritative.

## Definition of DONE for *every* individual task

1. Scope and dependencies clear; no unapproved operational facts/rates.
2. Implementation on feature branch, one reviewed PR with linked `Closes #ISSUE` only after acceptance strategy is clear.
3. Database safety plan: dry-run, verified staging backup, rollback and preservation of historical records where relevant.
4. Automated unit/feature/API/authorization/concurrency tests, green project CI, no other service regression.
5. Browser acceptance: customer desktop + mobile; Super Admin + authorized branch staff where relevant.
6. No unverified commitments, invented prices, certificates, dates, capacities or availability.
7. Attach test/log summary and screenshots (no private docs/secrets) to issue; record exact staging commit.
8. Reviewer/owner confirms acceptance, then close the issue. Update parent epic and #39 progress.

## Sequential work order

Follow in displayed order **subject to dependencies**. Within an epic, close one open issue before starting the next unless blocked. Resolve urgent P0 regressions before other work.

### Phase 0 — blocking architecture and integrity

1. [ ] [#40 — Fix six non-bike booking modal/server ID mismatch](https://github.com/kgsanjay/gkwhizwheel/issues/40)
2. [ ] [#41 — Lifecycle: enquiries/holds/quotes vs actual confirmations](https://github.com/kgsanjay/gkwhizwheel/issues/41)
3. [ ] [#42 — Resource-specific inventory architecture](https://github.com/kgsanjay/gkwhizwheel/issues/42)
4. [ ] [#43 — Authoritative pricing and quote snapshots](https://github.com/kgsanjay/gkwhizwheel/issues/43)
5. [ ] [#44 — Existing DB/migration safety audit](https://github.com/kgsanjay/gkwhizwheel/issues/44)
6. [ ] [#50 — Customer status honesty across all seven services](https://github.com/kgsanjay/gkwhizwheel/issues/50)
7. [ ] [#51 — Prevent payment against unverified booking/quote](https://github.com/kgsanjay/gkwhizwheel/issues/51)
8. [ ] [#87 — Branch isolation, contact and legacy-store reconciliation](https://github.com/kgsanjay/gkwhizwheel/issues/87)

### Phase 1 — physical bike inventory, checkout, and handover

1. [ ] [#45 — Honnavar 10-RC inventory reconciliation](https://github.com/kgsanjay/gkwhizwheel/issues/45)
2. [ ] [#46 — Murudeshwar ten-bike verification](https://github.com/kgsanjay/gkwhizwheel/issues/46)
3. [ ] [#47 — Branch points, directional charges and cross-branch returns](https://github.com/kgsanjay/gkwhizwheel/issues/47)
4. [ ] [#48 — Private bike compliance and handover workflows](https://github.com/kgsanjay/gkwhizwheel/issues/48)
5. [ ] [#49 — Bike end-to-end QA/payments](https://github.com/kgsanjay/gkwhizwheel/issues/49)

### Phase 2 — cab services

1. [ ] [#52 — Cab vehicle and operator master](https://github.com/kgsanjay/gkwhizwheel/issues/52)
2. [ ] [#53 — Cab route/fare quote engine](https://github.com/kgsanjay/gkwhizwheel/issues/53)
3. [ ] [#54 — Cab customer search and checkout](https://github.com/kgsanjay/gkwhizwheel/issues/54)
4. [ ] [#55 — Driver dispatch and trip conflict prevention](https://github.com/kgsanjay/gkwhizwheel/issues/55)
5. [ ] [#56 — Cab refunds and final QA](https://github.com/kgsanjay/gkwhizwheel/issues/56)

### Phase 3 — boating

1. [ ] [#57 — Boat/operator/boarding location master](https://github.com/kgsanjay/gkwhizwheel/issues/57)
2. [ ] [#58 — Shared-seat vs charter slots](https://github.com/kgsanjay/gkwhizwheel/issues/58)
3. [ ] [#59 — Boating prices/customer booking](https://github.com/kgsanjay/gkwhizwheel/issues/59)
4. [ ] [#60 — Captain/safety/weather response](https://github.com/kgsanjay/gkwhizwheel/issues/60)
5. [ ] [#61 — Boat payment/voucher tests](https://github.com/kgsanjay/gkwhizwheel/issues/61)

### Phase 4 — scuba diving

1. [ ] [#62 — Verified scuba operators and experiences](https://github.com/kgsanjay/gkwhizwheel/issues/62)
2. [ ] [#63 — Scuba participants and eligibility](https://github.com/kgsanjay/gkwhizwheel/issues/63)
3. [ ] [#64 — Dive slots and resources](https://github.com/kgsanjay/gkwhizwheel/issues/64)
4. [ ] [#65 — Scuba customer quote/checkout](https://github.com/kgsanjay/gkwhizwheel/issues/65)
5. [ ] [#66 — Scuba cancellation/operator QA](https://github.com/kgsanjay/gkwhizwheel/issues/66)

### Phase 5 — homestays

1. [ ] [#67 — Property/host/room inventory](https://github.com/kgsanjay/gkwhizwheel/issues/67)
2. [ ] [#68 — Room-night calendar and buffers](https://github.com/kgsanjay/gkwhizwheel/issues/68)
3. [ ] [#69 — Stay rates, meals and taxes](https://github.com/kgsanjay/gkwhizwheel/issues/69)
4. [ ] [#70 — Stay search/customer booking](https://github.com/kgsanjay/gkwhizwheel/issues/70)
5. [ ] [#71 — Host dashboard/turnover QA](https://github.com/kgsanjay/gkwhizwheel/issues/71)

### Phase 6 — guides

1. [ ] [#72 — Verified guide profiles](https://github.com/kgsanjay/gkwhizwheel/issues/72)
2. [ ] [#73 — Guide calendar and scheduling](https://github.com/kgsanjay/gkwhizwheel/issues/73)
3. [ ] [#74 — Guide package/quote/booking](https://github.com/kgsanjay/gkwhizwheel/issues/74)
4. [ ] [#75 — Guide dispatch/settlement](https://github.com/kgsanjay/gkwhizwheel/issues/75)
5. [ ] [#76 — Guide end-to-end acceptance](https://github.com/kgsanjay/gkwhizwheel/issues/76)

### Phase 7 — tour packages

1. [ ] [#77 — Tour packages/day-wise itinerary](https://github.com/kgsanjay/gkwhizwheel/issues/77)
2. [ ] [#78 — Tour departure seats/resources](https://github.com/kgsanjay/gkwhizwheel/issues/78)
3. [ ] [#79 — Custom trip quotation approval](https://github.com/kgsanjay/gkwhizwheel/issues/79)
4. [ ] [#80 — Tours payments/vouchers](https://github.com/kgsanjay/gkwhizwheel/issues/80)
5. [ ] [#81 — Tour operations/acceptance](https://github.com/kgsanjay/gkwhizwheel/issues/81)

### Phase 8 — customer website and account

1. [ ] [#82 — Multi-service homepage/navigation](https://github.com/kgsanjay/gkwhizwheel/issues/82)
2. [ ] [#83 — Unified customer booking account](https://github.com/kgsanjay/gkwhizwheel/issues/83)
3. [ ] [#84 — Accurate service detail pages/media](https://github.com/kgsanjay/gkwhizwheel/issues/84)
4. [ ] [#85 — Responsive accessibility/validation](https://github.com/kgsanjay/gkwhizwheel/issues/85)
5. [ ] [#86 — Customer notification/support lifecycle](https://github.com/kgsanjay/gkwhizwheel/issues/86)

### Phase 9 — admin and branch staff

1. [ ] [#88 — Super Admin seven-service work queues](https://github.com/kgsanjay/gkwhizwheel/issues/88)
2. [ ] [#89 — Staff assignment and authorization](https://github.com/kgsanjay/gkwhizwheel/issues/89)
3. [ ] [#90 — Operational analytics/reports](https://github.com/kgsanjay/gkwhizwheel/issues/90)
4. [ ] [#91 — Safe imports, documents and backups](https://github.com/kgsanjay/gkwhizwheel/issues/91)

### Phase 10 — finance, WhatsApp, privacy and reporting

1. [ ] [#102 — Per-service rate cards and fee configuration](https://github.com/kgsanjay/gkwhizwheel/issues/102)
2. [ ] [#103 — Gateway, advance, refunds and reconciliation](https://github.com/kgsanjay/gkwhizwheel/issues/103)
3. [ ] [#104 — Official WhatsApp, branch phones and Maps](https://github.com/kgsanjay/gkwhizwheel/issues/104)
4. [ ] [#105 — KYC/RC/privacy and RBAC](https://github.com/kgsanjay/gkwhizwheel/issues/105)
5. [ ] [#106 — Financial ledger and event audit](https://github.com/kgsanjay/gkwhizwheel/issues/106)

### Phase 11 — SEO, content, media and staging release

1. [ ] [#107 — Public copy/hardcoded claim audit](https://github.com/kgsanjay/gkwhizwheel/issues/107)
2. [ ] [#108 — Branch/destination SEO structure](https://github.com/kgsanjay/gkwhizwheel/issues/108)
3. [ ] [#109 — Approved real photos and media](https://github.com/kgsanjay/gkwhizwheel/issues/109)
4. [ ] [#110 — Sitemaps/structured data/indexing](https://github.com/kgsanjay/gkwhizwheel/issues/110)
5. [ ] [#111 — Final staging release acceptance](https://github.com/kgsanjay/gkwhizwheel/issues/111)

## Seven service acceptance checklist (release gate)

| Service | Public experience | Live/approved data | Pricing & availability | Staff fulfillment | Payment & refund | Test acceptance |
|---|---|---|---|---|---|---|
| Bike rentals | Pending review | Pending review | Pending review | Pending review | Pending review | Pending review |
| Cab services | Pending review | Pending review | Pending review | Pending review | Pending review | Pending review |
| Boating | Pending review | Pending review | Pending review | Pending review | Pending review | Pending review |
| Scuba | Pending review | Pending review | Pending review | Pending review | Pending review | Pending review |
| Homestays | Pending review | Pending review | Pending review | Pending review | Pending review | Pending review |
| Tourist guides | Pending review | Pending review | Pending review | Pending review | Pending review | Pending review |
| Tour packages | Pending review | Pending review | Pending review | Pending review | Pending review | Pending review |

## Confirmed context and outstanding business decisions

- Honnavar uploaded RCs: 5 Honda Dio DLX, 3 Honda Activa STD, 2 Suzuki Access 125. Clarify RC model `Activa STD` vs existing catalog `Activa 6G` before editing live records.
- Murudeshwar agreed mapping: 4 Honda Activa, 4 Suzuki Access 125, 2 Yamaha Fascino 125. Staff must verify RCs and actual ready-to-rent status.
- Two operational branches, independent editable phone/Maps; WhatsApp enquiries all target official +91 86609 89586.
- Confirmed customer pickup locations: Honnavar Railway Station / KSRTC / hotel-custom; Murudeshwar KSRTC / railway / temple / hotel-custom.
- Each point may have a distinct pickup fee AND return fee. Fees UNKNOWN until individually entered; never assume ₹0 or charge an unquoted amount.
- Bike customers may pay ₹100 advance or full amount; new online bike bookings do not require a ₹500 security deposit.
- Six other services currently have frontend/backend booking contract mismatch around missing `service_item_id`; fix before operational claims.
- Keep approved multi-service homepage intact. Real prices, partners, slot capacity, room nights, permits and offers are not verified by design placeholders.

## How to work on the next task

1. Read master issue #39, this file, and the lowest-numbered unblocked P0 task.
2. In task issue, comment `IN PROGRESS` with dependencies, file inventory, intended fix and tests.
3. Implement/test via dedicated branch and PR; do not merge failing CI.
4. For migrations/data changes, stop before staging write if backup, permissions or preflight fail.
5. Post test evidence and deployed staging SHA; satisfy all checkboxes and request sign-off.
6. Close canonical GitHub issue only when verified; continue to next open task.

**Privacy:** RC PDFs, banking documents, chassis/engine numbers, personal identifiers, private partner documents, and sensitive customer information must never be committed to this repo or published on the customer site.