# Issue #54 — Cab customer trip request and verified checkout readiness

## Implemented foundation

- Responsive cab-request modal replaces the former hardcoded vehicle/pricing checkout form. Captures one-way, round-trip, local or airport trip; optional published cab item and preferred vehicle class; origin/destination, scheduled pickup/return, passengers and bags, train/flight number, up to six stops and special requests.
- Uses **the actual published cab service item list** when one is selected. The optional vehicle class is a preference only, not a guarantee of dispatch. If no published item is available, a customer may still make a general cab enquiry for staff review.
- Explicit consent acknowledges no confirmed reservation, verified fare, driver, payment or cancellation/refund entitlement exists yet.
- Separate authenticated POST `/services/cabs/enquire` writes an existing `service_enquiries` row and a new `cab_enquiry_details` record in a single transaction. New records are `requested` and `awaiting_verification`. Customer-supplied prices, booking/payment statuses, and assignments are ignored.
- Item and active-branch relationship are checked on the server. Cross-branch items, inactive items, inactive branches, invalid passenger or bag counts, invalid date/time and excessive stops are rejected.
- Outdated local sample cab price calculations and unsupported structured-data priced offers are removed from the cab landing page; remaining business operations need content/SEO editorial verification.
- **No booking, inventory allocation, payment, or actual driver assignment takes place**. This is the safe part of customer checkout, not an end-to-end accepted payable cab checkout.

## Remaining required work before closing #54

1. Create a customer-owned, expiry-bound cab quote request with **verified** distance, time, route and rate snapshots from Issue #53. Do not trust browser kilometre/time estimates for payable charges.
2. Approve rates in the verified Admin workflow with reviewer identity and audit history; the fare rules currently begin as inactive drafts.
3. Atomically allocate an eligible verified driver **and** vehicle from Issue #52; enforce same branch, route, simultaneous bookings, passenger and luggage capacity with cancellation/expiry release and real DB concurrency tests.
4. Build the verified quote acceptance and checkout page with explicit refund/cancellation terms and no automatic dispatch claims. Process sandbox payments only after allocation and signed quote validation.
5. Staff review UI for customer cab requests and their structured detail, no PII leakage to cross-branch users, and mobile-web accessibility review.
6. Verify all remaining marketing and SEO claims for fleet, hours, pickup rates, route distances and cancellation with actual business evidence; remove unsupported guarantees.
7. ServerByt staging: backup & test restore, migrate after review, confirm real cab branches, test guest redirect, customer enquiry, validation, staff review, responsive UI, security boundaries, screenshot and owner sign-off.
8. Leave Issue #54 **OPEN** until these acceptance criteria pass. Do not mark the customer checkout complete merely because the enquiry form works.

No deployment or DB writes were performed against ServerByt.
