# Community 67

> 23 nodes

## Key Concepts

- **WhatsAppMessage** (25 connections) — `app/Notifications/Messages/WhatsAppMessage.php`
- **.create()** (13 connections) — `app/Notifications/Messages/WhatsAppMessage.php`
- **WhatsAppService** (11 connections) — `app/Services/WhatsAppService.php`
- **.handle()** (6 connections) — `app/Http/Controllers/Api/V1/Webhooks/WhatsAppWebhookController.php`
- **self** (6 connections)
- **.sendMessage()** (5 connections) — `app/Services/WhatsAppService.php`
- **.toWhatsApp()** (4 connections) — `app/Notifications/BookingConfirmationNotification.php`
- **.toWhatsApp()** (3 connections) — `app/Notifications/BikeManagerBookingAlertNotification.php`
- **.toWhatsApp()** (3 connections) — `app/Notifications/PickupReminderNotification.php`
- **.toWhatsApp()** (3 connections) — `app/Notifications/ReturnReminderNotification.php`
- **.toWhatsApp()** (3 connections) — `app/Notifications/ServiceManagerBookingAlertNotification.php`
- **.updateDeliveryStatus()** (3 connections) — `app/Services/WhatsAppService.php`
- **{closure#3}()** (3 connections) — `tests/Feature/WhatsAppNotificationAndWebhookTest.php`
- **.__construct()** (2 connections) — `app/Channels/WhatsAppChannel.php`
- **.bodyText()** (2 connections) — `app/Notifications/Messages/WhatsAppMessage.php`
- **.buttonUrl()** (2 connections) — `app/Notifications/Messages/WhatsAppMessage.php`
- **.documentUrl()** (2 connections) — `app/Notifications/Messages/WhatsAppMessage.php`
- **.parameters()** (2 connections) — `app/Notifications/Messages/WhatsAppMessage.php`
- **.template()** (2 connections) — `app/Notifications/Messages/WhatsAppMessage.php`
- **.normalizePhone()** (2 connections) — `app/Services/WhatsAppService.php`
- **.verifyWebhookSignature()** (2 connections) — `app/Services/WhatsAppService.php`
- **.__construct()** (1 connections) — `app/Notifications/Messages/WhatsAppMessage.php`
- **WhatsAppMessage.php** (1 connections) — `app/Notifications/Messages/WhatsAppMessage.php`

## Relationships

- [Community 6](Community_6.md) (22 shared connections)
- [Community 64](Community_64.md) (3 shared connections)
- [Community 44](Community_44.md) (2 shared connections)
- [Community 20](Community_20.md) (2 shared connections)
- [Community 81](Community_81.md) (2 shared connections)
- [Community 19](Community_19.md) (2 shared connections)
- [Community 16](Community_16.md) (1 shared connections)
- [Community 12](Community_12.md) (1 shared connections)
- [Community 115](Community_115.md) (1 shared connections)

## Source Files

- `app/Channels/WhatsAppChannel.php`
- `app/Http/Controllers/Api/V1/Webhooks/WhatsAppWebhookController.php`
- `app/Notifications/BikeManagerBookingAlertNotification.php`
- `app/Notifications/BookingConfirmationNotification.php`
- `app/Notifications/Messages/WhatsAppMessage.php`
- `app/Notifications/PickupReminderNotification.php`
- `app/Notifications/ReturnReminderNotification.php`
- `app/Notifications/ServiceManagerBookingAlertNotification.php`
- `app/Services/WhatsAppService.php`
- `tests/Feature/WhatsAppNotificationAndWebhookTest.php`

## Audit Trail

- EXTRACTED: 67 (94%)
- INFERRED: 4 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*