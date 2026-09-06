# GK WhizWheel — Environment Variables Reference

This document catalogs every environment variable used in GK WhizWheel across `config/*.php` and application services. It details requirements, defaults, and cross-checks against the baseline `.env.example` defined in [`docs/05-ENVIRONMENT-SETUP.md`](05-ENVIRONMENT-SETUP.md).

---

## 1. Classification Overview

Variables are classified into three levels:
1. **Required:** The application or subsystem cannot run safely or process transactions without an explicit value.
2. **Safe Default:** The application operates out-of-the-box using built-in defaults if omitted; only override when customizing.
3. **Optional:** Secondary feature or driver-specific variable (e.g., third-party transports or logging services).

---

## 2. Core Application & Server

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `APP_NAME` | Safe Default | `"Bike Rental Platform"` | Brand name shown in customer notifications and emails. |
| `APP_ENV` | Required | `production` | Runtime environment (`production`, `local`, `testing`). |
| `APP_KEY` | Required | *None* | 32-character base64 encryption key (generated via `php artisan key:generate`). |
| `APP_DEBUG` | Safe Default | `false` | Enables detailed stack traces. Must be `false` in production. |
| `APP_URL` | Required | `https://yourdomain.com` | Base URL used for generating signed document links, email links, and callbacks. |
| `APP_TIMEZONE` | Safe Default | `UTC` | Application timezone (e.g., `Asia/Kolkata`). |

---

## 3. Database (MySQL / MariaDB)

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `DB_CONNECTION` | Safe Default | `mysql` | Database driver (`mysql` / `sqlite` / `pgsql`). |
| `DB_HOST` | Required | `127.0.0.1` | Database server host. |
| `DB_PORT` | Safe Default | `3306` | MySQL port. |
| `DB_DATABASE` | Required | *None* | Production or local database name. |
| `DB_USERNAME` | Required | *None* | Database user username. |
| `DB_PASSWORD` | Required | *None* | Database user password. |

---

## 4. Shared-Hosting Drivers (Cache, Session, Queue, Filesystem)

Configured specifically to operate reliably within shared cPanel constraints without requiring Redis or background worker daemons.

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `CACHE_DRIVER` / `CACHE_STORE` | Safe Default | `file` | Cache driver (`file` stores serialized cache files on disk). |
| `SESSION_DRIVER` | Safe Default | `database` | Stores HTTP sessions in the `sessions` database table. |
| `SESSION_LIFETIME` | Safe Default | `120` | Session expiration in minutes. |
| `SESSION_DOMAIN` | Optional | *None* | Cookie domain (e.g. `.yourdomain.com` for cross-subdomain authentication). |
| `SANCTUM_STATEFUL_DOMAINS` | Optional | *None* | Comma-separated list of domains eligible for stateful cookie auth. |
| `QUEUE_CONNECTION` | Safe Default | `sync` | Runs jobs synchronously inline during HTTP request on shared hosting. |
| `FILESYSTEM_DISK` | Safe Default | `local` | Storage driver (`local` stores uploads in `storage/app/private` & `storage/app/public`). |

---

## 5. Logging

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `LOG_CHANNEL` | Safe Default | `stack` | Active logging channel (`stack`, `single`, `daily`). |
| `LOG_LEVEL` | Safe Default | `error` (prod) / `debug` | Minimum log severity threshold. |
| `LOG_DAILY_DAYS` | Safe Default | `14` | Retention period in days if using `daily` log channel. |

---

## 6. Email & SMTP

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `MAIL_MAILER` | Safe Default | `smtp` | Mail driver (`smtp`, `log`, `sendmail`). |
| `MAIL_HOST` | Required in prod | *None* | SMTP server host (e.g., `smtp.mailgun.org` or cPanel SMTP host). |
| `MAIL_PORT` | Safe Default | `587` | SMTP port (`587` for TLS, `465` for SSL). |
| `MAIL_USERNAME` | Required in prod | *None* | SMTP account username. |
| `MAIL_PASSWORD` | Required in prod | *None* | SMTP account password. |
| `MAIL_ENCRYPTION` | Safe Default | `tls` | SMTP encryption protocol (`tls` or `ssl`). |
| `MAIL_FROM_ADDRESS` | Required in prod | *None* | Default sender email address for customer receipts and alerts. |
| `MAIL_FROM_NAME` | Safe Default | `${APP_NAME}` | Sender display name. |

---

## 7. Payment Gateways

### Razorpay
| Variable | Requirement | Default | Description |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | Required for online | *None* | Public Razorpay API Key ID (`rzp_live_...` or `rzp_test_...`). |
| `RAZORPAY_KEY_SECRET` | Required for online | *None* | Secret key for Razorpay API calls. |
| `RAZORPAY_WEBHOOK_SECRET` | Required for online | *None* | Secret key configured in Razorpay dashboard to verify webhook signatures. |

### PhonePe
| Variable | Requirement | Default | Description |
|---|---|---|---|
| `PHONEPE_MERCHANT_ID` | Required for PhonePe | *None* | Merchant identifier assigned by PhonePe. |
| `PHONEPE_SALT_KEY` | Required for PhonePe | *None* | Secret salt key used to calculate X-VERIFY SHA256 checksums. |
| `PHONEPE_SALT_INDEX` | Safe Default | `1` | Key index appended to checksum header (`###<index>`). |
| `PHONEPE_ENV` | Safe Default | `sandbox` | Environment (`sandbox` or `production`). |
| `PHONEPE_BASE_URL` | Safe Default | `https://api-preprod.phonepe.com/apis/pg-sandbox` | Custom endpoint override if required by gateway. |
| `PHONEPE_CALLBACK_URL` | Safe Default | `${APP_URL}/webhooks/phonepe` | Server-to-server webhook callback URL. |
| `PHONEPE_REDIRECT_URL` | Safe Default | `${APP_URL}/payment/phonepe/callback` | Browser redirect URL following checkout. |

---

## 8. WhatsApp Cloud API (Meta)

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `WHATSAPP_CLOUD_API_TOKEN` | Required for WhatsApp | *None* | Permanent System User Access Token from Meta Business Manager. |
| `WHATSAPP_PHONE_NUMBER_ID` | Required for WhatsApp | *None* | Meta Phone Number ID associated with official WhatsApp Business sender. |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Required for WhatsApp | *None* | WhatsApp Business Account ID (WABA). |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Required for WhatsApp | *None* | Random verification string configured in Meta Webhooks dashboard. |
| `WHATSAPP_API_VERSION` | Safe Default | `v19.0` | Meta Graph API version. |

---

## 9. Business Logic & Compliance Rules

These control financial calculations, cancellations, and compliance alert thresholds in `config/booking.php` and `config/compliance.php`.

| Variable | Requirement | Default | Description |
|---|---|---|---|
| `CANCELLATION_FULL_REFUND_HOURS` | Safe Default | `24` | Hours prior to pickup eligible for 100% advance refund. |
| `CANCELLATION_PARTIAL_REFUND_PERCENTAGE` | Safe Default | `50` | Percentage of advance refund if cancelled inside the cutoff window. |
| `BIKE_DOC_EXPIRY_ALERT_DAYS` | Safe Default | `30` | Advance notice in days before alerting admin of expiring RC/Insurance/PUC. |
| `BIKE_DOC_EXPIRY_GRACE_DAYS` | Safe Default | `0` | Grace period days permitted past document expiration. |
| `BIKE_DOC_EXPIRY_HARD_BLOCK` | Safe Default | `true` | Prevents bikes with expired compliance documents from being rented out. |
| `ADMIN_ALERT_EMAIL` | Safe Default | `config('mail.from.address')` | Email recipient for compliance alerts and automated notices. |
| `ADMIN_ALERT_PHONE` | Optional | `null` | Phone number for administrative SMS or WhatsApp notifications. |
| `BACKUP_ARCHIVE_PASSWORD` | Optional | `null` | Password to encrypt spatie/laravel-backup zip archives. |

---

## 10. Cross-Check Against `05-ENVIRONMENT-SETUP.md` (.env.example)

### Summary of Comparison
* **Variables present in `05-ENVIRONMENT-SETUP.md` (.env.example):** 36 variables.
* **Missing from `.env.example` that exist in code:** 0 required variables.
* All required variables for database, shared-hosting drivers, mail, Razorpay, PhonePe, and WhatsApp Cloud API are present in `.env.example`.

### Fine-Tuning Variables in Code Omitted from `.env.example` by Design
The following variables exist in `config/` but were intentionally excluded from the minimal production template because they have **safe, battle-tested defaults**:

1. **`PHONEPE_ENV`** (defaults to `'sandbox'`): Set to `'production'` when flipping to live credentials.
2. **`PHONEPE_SALT_INDEX`** (defaults to `'1'`): Provided in `.env.example` as standard.
3. **`WHATSAPP_API_VERSION`** (defaults to `'v19.0'`): Managed by Meta API lifespan.
4. **`CANCELLATION_FULL_REFUND_HOURS` & `CANCELLATION_PARTIAL_REFUND_PERCENTAGE`**: Standard 24-hour / 50% business defaults.
5. **`BIKE_DOC_EXPIRY_ALERT_DAYS` & `BIKE_DOC_EXPIRY_HARD_BLOCK`**: Compliance policies default to 30 days notice with hard booking block.
6. **`ADMIN_ALERT_EMAIL`**: Automatically defaults to `MAIL_FROM_ADDRESS` if not explicitly specified.
7. **`BACKUP_ARCHIVE_PASSWORD`**: Optional archive encryption password.

### Recommended Production Additions to `.env.example`
To give operations teams full visibility over live gateway switching, the following optional entries may be added to `.env.example`:
```env
# Optional Gateway & Compliance Overrides
PHONEPE_ENV=production
ADMIN_ALERT_EMAIL=admin@yourdomain.com
```
