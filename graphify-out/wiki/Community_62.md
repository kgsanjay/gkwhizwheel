# Community 62

> 25 nodes

## Key Concepts

- **TwoFactorService** (16 connections) — `app/Services/TwoFactorService.php`
- **AdminTwoFactorAuthTest** (16 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.generateSecretKey()** (10 connections) — `app/Services/TwoFactorService.php`
- **.twoFactorAuthenticate()** (6 connections) — `app/Http/Controllers/Web/Admin/AdminAuthController.php`
- **.twoFactorConfirm()** (6 connections) — `app/Http/Controllers/Web/Admin/AdminAuthController.php`
- **TwoFactorService.php** (5 connections) — `app/Services/TwoFactorService.php`
- **PragmaRX\Google2FA\Google2FA** (5 connections)
- **.getQrCodeDataUri()** (3 connections) — `app/Services/TwoFactorService.php`
- **.verify()** (3 connections) — `app/Services/TwoFactorService.php`
- **.verifyAndConsumeRecoveryCode()** (3 connections) — `app/Services/TwoFactorService.php`
- **.__construct()** (2 connections) — `app/Services/TwoFactorService.php`
- **.generateRecoveryCodes()** (2 connections) — `app/Services/TwoFactorService.php`
- **.getQrCodeUrl()** (2 connections) — `app/Services/TwoFactorService.php`
- **.setUp()** (2 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_staff_login_is_direct_when_2fa_not_configured_and_can_disable_when_enabled()** (2 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_super_admin_and_store_manager_cannot_disable_2fa()** (2 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_super_admin_can_authenticate_with_recovery_code_and_code_is_consumed()** (2 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_super_admin_can_authenticate_with_valid_totp_code()** (2 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_super_admin_receives_error_with_invalid_totp_code()** (2 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_super_admin_with_2fa_confirmed_redirects_to_challenge()** (2 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **chillerlan\QRCode\QRCode** (2 connections)
- **.test_customer_login_is_never_redirected_to_2fa()** (1 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_store_manager_login_without_2fa_redirects_to_mandatory_setup()** (1 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_super_admin_login_without_2fa_redirects_to_mandatory_setup()** (1 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`
- **.test_user_can_confirm_2fa_setup_and_receive_recovery_codes()** (1 connections) — `tests/Feature/AdminTwoFactorAuthTest.php`

## Relationships

- [Community 10](Community_10.md) (8 shared connections)
- [Community 1](Community_1.md) (5 shared connections)
- [Community 16](Community_16.md) (2 shared connections)
- [Community 63](Community_63.md) (2 shared connections)
- [Community 14](Community_14.md) (1 shared connections)
- [Community 58](Community_58.md) (1 shared connections)

## Source Files

- `app/Http/Controllers/Web/Admin/AdminAuthController.php`
- `app/Services/TwoFactorService.php`
- `tests/Feature/AdminTwoFactorAuthTest.php`

## Audit Trail

- EXTRACTED: 47 (80%)
- INFERRED: 12 (20%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*