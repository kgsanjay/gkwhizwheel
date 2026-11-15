# User

> God node · 261 connections · `app/Models/User.php`

**Community:** [Community 63](Community_63.md)

## Connections by Relation

### calls
- .checkAndHandleExpiry() `EXTRACTED`
- .test_two_factor_columns_cannot_be_mass_assigned_on_user() `EXTRACTED`
- {closure#1}() `EXTRACTED`

### contains
- User.php `EXTRACTED`

### imports
- CabDispatchFlowTest.php `EXTRACTED`
- RefundServiceTest.php `EXTRACTED`
- ServiceBookingApprovalTest.php `EXTRACTED`
- CustomerAccountWebTest.php `EXTRACTED`
- BikeModelBookingAllocationTest.php `EXTRACTED`
- ModelsAndRelationshipsTest.php `EXTRACTED`
- AdminBikesWebTest.php `EXTRACTED`
- NotificationsAndLogsTest.php `EXTRACTED`
- IdorTest.php `EXTRACTED`
- AdminAuthAndPanelTest.php `EXTRACTED`
- BranchManagerOperationalTest.php `EXTRACTED`
- FullUserJourneysTest.php `EXTRACTED`
- WhatsAppNotificationAndWebhookTest.php `EXTRACTED`
- FutureBranchLocationTest.php `EXTRACTED`
- AdminBookingHandoverReturnWebTest.php `EXTRACTED`
- CustomerAdminStaffRouteAccessDenialTest.php `EXTRACTED`
- CheckBikeDocumentExpiryCommandTest.php `EXTRACTED`
- PhonePeWebhookController.php `EXTRACTED`
- BookingFlowWebTest.php `EXTRACTED`
- CustomerOperationalTest.php `EXTRACTED`
- *…and 125 more `imports` connection(s) not listed (lowest-degree first to go)*

### inherits
- Illuminate\Foundation\Auth\User `EXTRACTED`

### method
- .isSuperAdmin() `EXTRACTED`
- .isAdmin() `EXTRACTED`
- .accessibleStoreIds() `EXTRACTED`
- .stores() `EXTRACTED`
- .isStaffOrAdmin() `EXTRACTED`
- .isManager() `EXTRACTED`
- .canManageService() `EXTRACTED`
- .getAuthorizedStoreIds() `EXTRACTED`
- .assignedServicesList() `EXTRACTED`
- .tokenAbilities() `EXTRACTED`
- .canAccessAllStores() `EXTRACTED`
- .requiresTwoFactor() `EXTRACTED`
- .kycDocuments() `EXTRACTED`
- .verifiedKycDocuments() `EXTRACTED`
- .uploadedBikeDocuments() `EXTRACTED`
- .couponUsages() `EXTRACTED`
- .collectedPayments() `EXTRACTED`
- .processedRefunds() `EXTRACTED`
- .reviews() `EXTRACTED`
- .bikeConditionLogs() `EXTRACTED`
- *…and 10 more `method` connection(s) not listed (lowest-degree first to go)*

### mixes_in
- Illuminate\Database\Eloquent\Factories\HasFactory `EXTRACTED`
- Illuminate\Database\Eloquent\SoftDeletes `EXTRACTED`
- Laravel\Sanctum\HasApiTokens `EXTRACTED`
- Spatie\Permission\Traits\HasRoles `EXTRACTED`
- Illuminate\Notifications\Notifiable `EXTRACTED`

### references
- AdminGroundCheckInTest `EXTRACTED`
- BranchAdminOperationalTest `EXTRACTED`
- CustomerOperationalTest `EXTRACTED`
- MassAssignmentProtectionTest `EXTRACTED`
- scheduleReservation() `EXTRACTED`
- .makeEnquiry() `EXTRACTED`
- SecurityAuditComplianceTest `EXTRACTED`
- SuperAdminOperationalPerfectionTest `EXTRACTED`
- Relationship Summary (for ORM setup) `INFERRED`
- FullUserJourneysTest `EXTRACTED`
- FileUploadSecurityTest `EXTRACTED`
- AdminDispatchWebTest `EXTRACTED`
- .authorizeBookingAccess() `EXTRACTED`
- .executeCheckInAction() `EXTRACTED`
- .authorize() `EXTRACTED`
- .issueToken() `EXTRACTED`
- .update() `EXTRACTED`
- .event() `EXTRACTED`
- .authorize() `EXTRACTED`
- .loadUserStores() `EXTRACTED`
- *…and 56 more `references` connection(s) not listed (lowest-degree first to go)*

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*