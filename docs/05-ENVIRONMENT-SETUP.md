# Environment Setup & Deployment (Serverbyt Shared Hosting)

## 1. Local Development Environment
- PHP 8.3, Composer 2.x
- Node.js 20 LTS + npm/pnpm (for MUI website build + asset compilation)
- MySQL 8 (or MariaDB 10.6+, whichever your shared hosting actually runs — confirm with Serverbyt's control panel before deciding which one to develop against locally, since subtle SQL differences exist)
- Laravel Herd, Valet, or plain `php artisan serve` — any local setup works, this isn't hosting-constrained

## 2. .env.example Template

```env
APP_NAME="Bike Rental Platform"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://yourdomain.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

# Shared hosting: no Redis available — use database/file drivers
CACHE_DRIVER=file
SESSION_DRIVER=database
QUEUE_CONNECTION=sync

MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="${APP_NAME}"

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

PHONEPE_MERCHANT_ID=
PHONEPE_SALT_KEY=
PHONEPE_SALT_INDEX=

WHATSAPP_CLOUD_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

SANCTUM_STATEFUL_DOMAINS=yourdomain.com
SESSION_DOMAIN=.yourdomain.com

FILESYSTEM_DISK=local
```

**Why these driver choices:** as covered earlier, shared hosting can't run Redis or persistent queue workers. `CACHE_DRIVER=file` and `SESSION_DRIVER=database` work fine on shared hosting with no extra setup. `QUEUE_CONNECTION=sync` means jobs (like sending a notification) run immediately inline rather than being queued — this is fine at small-to-medium traffic; if it ever becomes a bottleneck, that's the trigger to consider the optional VPS upgrade path mentioned in the main requirements doc — not something to solve prematurely.

## 3. Deployment Steps (Serverbyt Shared Hosting via cPanel)

1. **Domain/subdomain setup:** point your domain (or an `app.` subdomain) to a folder outside `public_html` if your hosting allows it, with `public_html` (or the domain's document root) pointing specifically to Laravel's `public/` folder — this keeps `.env`, `app/`, `vendor/` outside the web-servable root. If Serverbyt's structure doesn't allow repointing the document root, a common fallback is deploying the whole app inside a subfolder and using an `.htaccess` redirect/symlink trick — check what Serverbyt's control panel supports before finalizing folder layout.
2. **Upload code** via Git (if Serverbyt supports SSH + git pull) or via cPanel File Manager/FTP as a fallback.
3. **Composer install:** if SSH access is available, run `composer install --no-dev --optimize-autoloader` on the server. If SSH isn't available on your plan, run it locally and upload the `vendor/` folder (bulkier, but works on any shared host).
4. **Set `.env`** with production values via cPanel File Manager (never upload your local `.env`, only `.env.example`, and fill in production secrets directly on the server).
5. **Run migrations:** `php artisan migrate --force` via SSH, or via a one-time web route/artisan-runner script if SSH isn't available (remove/protect that route immediately after use).
6. **Storage symlink:** `php artisan storage:link` so uploaded bike images/documents are web-accessible through the intended signed-URL mechanism.
7. **Set up cron:** in cPanel's Cron Jobs section, add:
   ```
   * * * * * php /home/yourusername/path-to-app/artisan schedule:run >> /dev/null 2>&1
   ```
   This single cron entry drives everything: releasing expired `held` bookings, sending scheduled reminder notifications, checking document expiry alerts — all defined as scheduled tasks inside Laravel's `app/Console/Kernel.php`, not as separate cron entries.
8. **SSL:** enable AutoSSL/Let's Encrypt via cPanel (usually one click) — confirm `APP_URL` uses `https://`.
9. **File permissions:** `storage/` and `bootstrap/cache/` need to be writable by the web server user (typically `755` or as your host's PHP execution user requires — check Serverbyt's specific docs, this varies slightly by host).

## 4. Backup Strategy (No Extra Cost)
- **Database:** a scheduled Laravel command (`php artisan backup:run` using `spatie/laravel-backup`, a free package) triggered by the same cron, dumping the DB and emailing it to yourself or storing it in a `backups/` folder outside the public root — rotate to keep the last 7–14 daily backups to avoid filling your storage quota.
- **Code:** your Git repository itself is your code backup — always push before/after any deployment.

## 5. Mobile App Distribution (Android APK)
- Host the compiled APK file in a non-public or rate-limited folder on the same shared hosting (e.g., `yourdomain.com/downloads/store-app-latest.apk`), since your plan includes unlimited storage.
- Build an `/api/v1/staff/app-version` endpoint returning the latest version number + download URL, so the app's in-app update check (Section 7 of the main requirements doc) has something to poll.
