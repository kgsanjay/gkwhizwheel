# Community 38

> 38 nodes

## Key Concepts

- **Booking** (186 connections) — `app/Models/Booking.php`
- **BookingService** (33 connections) — `app/Services/BookingService.php`
- **BookingResource** (28 connections) — `app/Http/Resources/BookingResource.php`
- **.ensureCurrentStatus()** (15 connections) — `app/Services/BookingService.php`
- **BookingService.php** (15 connections) — `app/Services/BookingService.php`
- **.returnBike()** (11 connections) — `app/Http/Controllers/Api/V1/Staff/BookingController.php`
- **.store()** (10 connections) — `app/Http/Controllers/Api/V1/Staff/BookingController.php`
- **.extend()** (9 connections) — `app/Http/Controllers/Api/V1/Customer/BookingController.php`
- **.handover()** (9 connections) — `app/Http/Controllers/Api/V1/Staff/BookingController.php`
- **BookingController** (8 connections) — `app/Http/Controllers/Api/V1/Staff/BookingController.php`
- **ExtendBookingRequest** (8 connections) — `app/Http/Requests/Customer/ExtendBookingRequest.php`
- **.collectPayment()** (7 connections) — `app/Http/Controllers/Api/V1/Staff/BookingController.php`
- **.extendBooking()** (7 connections) — `app/Http/Controllers/Web/CustomerAccountWebController.php`
- **.extend()** (7 connections) — `app/Services/BookingService.php`
- **.authorizeStoreAccess()** (6 connections) — `app/Http/Controllers/Api/V1/Staff/BookingController.php`
- **.handover()** (6 connections) — `app/Http/Controllers/Web/Admin/AdminBookingWebController.php`
- **.confirmPayment()** (6 connections) — `app/Services/BookingService.php`
- **.markHandedOver()** (6 connections) — `app/Services/BookingService.php`
- **.markReturned()** (6 connections) — `app/Services/BookingService.php`
- **.make()** (5 connections) — `app/Exceptions/InvalidBookingTransitionException.php`
- **.remainder()** (5 connections) — `app/Services/BikeBookingPayments.php`
- **.cancel()** (5 connections) — `app/Services/BookingService.php`
- **.markPendingPayment()** (5 connections) — `app/Services/BookingService.php`
- **{closure#3}()** (5 connections) — `app/Services/BookingService.php`
- **{closure#5}()** (5 connections) — `app/Services/BookingService.php`
- *... and 13 more nodes in this community*

## Relationships

- [Community 20](Community_20.md) (25 shared connections)
- [Community 48](Community_48.md) (18 shared connections)
- [Community 6](Community_6.md) (18 shared connections)
- [Community 32](Community_32.md) (18 shared connections)
- [Community 0](Community_0.md) (17 shared connections)
- [Community 12](Community_12.md) (12 shared connections)
- [Community 4](Community_4.md) (12 shared connections)
- [Community 51](Community_51.md) (11 shared connections)
- [Community 68](Community_68.md) (8 shared connections)
- [Community 19](Community_19.md) (8 shared connections)
- [Community 18](Community_18.md) (8 shared connections)
- [Community 26](Community_26.md) (8 shared connections)

## Source Files

- `app/Exceptions/InvalidBookingTransitionException.php`
- `app/Http/Controllers/Api/V1/Customer/BookingController.php`
- `app/Http/Controllers/Api/V1/Staff/BookingController.php`
- `app/Http/Controllers/Web/Admin/AdminBookingWebController.php`
- `app/Http/Controllers/Web/CustomerAccountWebController.php`
- `app/Http/Requests/Customer/ExtendBookingRequest.php`
- `app/Http/Resources/BookingResource.php`
- `app/Models/Booking.php`
- `app/Services/BikeBookingPayments.php`
- `app/Services/BookingService.php`
- `tests/Feature/PublicBikeApiDrivenPagesTest.php`

## Audit Trail

- EXTRACTED: 337 (95%)
- INFERRED: 18 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*