# Booking

> God node · 186 connections · `app/Models/Booking.php`

**Community:** [Community 38](Community_38.md)

## Connections by Relation

### contains
- Booking.php `EXTRACTED`

### imports
- RefundServiceTest.php `EXTRACTED`
- AdminBookingWebController.php `EXTRACTED`
- CustomerAccountWebTest.php `EXTRACTED`
- BikeModelBookingAllocationTest.php `EXTRACTED`
- ModelsAndRelationshipsTest.php `EXTRACTED`
- NotificationsAndLogsTest.php `EXTRACTED`
- IdorTest.php `EXTRACTED`
- AdminAuthAndPanelTest.php `EXTRACTED`
- BranchManagerOperationalTest.php `EXTRACTED`
- FullUserJourneysTest.php `EXTRACTED`
- WhatsAppNotificationAndWebhookTest.php `EXTRACTED`
- AdminReportWebController.php `EXTRACTED`
- FutureBranchLocationTest.php `EXTRACTED`
- AdminBookingHandoverReturnWebTest.php `EXTRACTED`
- BikeDirectionalPickupReturnFeeTest.php `EXTRACTED`
- PhonePeWebhookController.php `EXTRACTED`
- AdminDashboardController.php `EXTRACTED`
- CustomerAccountWebController.php `EXTRACTED`
- AvailabilityService.php `EXTRACTED`
- BookingFlowWebTest.php `EXTRACTED`
- *…and 70 more `imports` connection(s) not listed (lowest-degree first to go)*

### inherits
- Illuminate\Database\Eloquent\Model `EXTRACTED`

### method
- .payments() `EXTRACTED`
- .refunds() `EXTRACTED`
- .user() `EXTRACTED`
- .pickupPoint() `EXTRACTED`
- .returnPoint() `EXTRACTED`
- .creator() `EXTRACTED`
- .completer() `EXTRACTED`
- .pickupStore() `EXTRACTED`
- .returnStore() `EXTRACTED`
- .addons() `EXTRACTED`
- .review() `EXTRACTED`
- .conditionLogs() `EXTRACTED`
- .couponUsages() `EXTRACTED`
- .notificationLogs() `EXTRACTED`
- .bike() `EXTRACTED`
- .casts() `EXTRACTED`

### mixes_in
- Illuminate\Database\Eloquent\Factories\HasFactory `EXTRACTED`

### references
- BookingConfirmationNotification `EXTRACTED`
- AdminGroundCheckInTest `EXTRACTED`
- PickupReminderNotification `EXTRACTED`
- PaymentReceiptNotification `EXTRACTED`
- ReturnReminderNotification `EXTRACTED`
- .ensureCurrentStatus() `EXTRACTED`
- scheduleReservation() `EXTRACTED`
- BikeManagerBookingAlertNotification `EXTRACTED`
- RefundStatusNotification `EXTRACTED`
- Relationship Summary (for ORM setup) `INFERRED`
- LateFeeAlertNotification `EXTRACTED`
- modelBooking() `EXTRACTED`
- createTestBooking() `EXTRACTED`
- .assertPaymentRefundCapacity() `EXTRACTED`
- .dispatchGatewayRefund() `EXTRACTED`
- .processCancellationRefund() `EXTRACTED`
- .resolveTargetPayment() `EXTRACTED`
- {closure#8}() `EXTRACTED`
- .extend() `EXTRACTED`
- .handover() `EXTRACTED`
- *…and 43 more `references` connection(s) not listed (lowest-degree first to go)*

### references_constant
- .returnBike() `EXTRACTED`
- .store() `EXTRACTED`
- .handover() `EXTRACTED`
- .processReturn() `EXTRACTED`
- .executeCheckInAction() `EXTRACTED`
- .collectPayment() `EXTRACTED`
- .processRefund() `EXTRACTED`
- .authorizeStoreAccess() `EXTRACTED`
- .handover() `EXTRACTED`
- {closure#3}() `EXTRACTED`
- .index() `EXTRACTED`
- {closure#21}() `EXTRACTED`

### uses_config
- .calculateRefundAmount() `EXTRACTED`
- .amountFor() `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*