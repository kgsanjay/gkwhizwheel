# GK WhizWheel — Production Security & Deployment Readiness Audit

Audit baseline: `main` commit `4eda4a56daa02c27e1ff66cd1711184c227a0729` (2026-11-03).

**Scope:** Static review of Laravel configuration, public routes, authentication/CSRF, payment gateway defaults, exception logging, CORS, background jobs, backup configuration, and GitHub CI. This is **not** a live infrastructure penetration test. No hosting credentials, actual production database, DNS/SSL configuration, merchant accounts, or live app installation were available to inspect.

## Findings fixed in this PR

| Risk | Severity | Finding | Remediation |
| --- | --- | --- | --- |
| Default merchant/webhook credentials | High | `config/services.php` fell back to published testing values for Razorpay, PhonePe, and WhatsApp. Deployments with missing environment variables could use predictable webhook secrets. | Remove embedded credential defaults; unauthenticated webhook signatures fail closed. |
| Cross-site logout | Medium | `/logout` and `/admin/logout` accepted GET as well as POST, and both POST routes were exempted from CSRF checks. | Use POST-only routes with the standard Laravel CSRF middleware. Existing React layouts already use POST. |
| Credentialed CORS overbroad | Medium | Local HTTP origins and arbitrary `*.whizwheels.in` origins were accepted in production. | Limit production defaults to specific origins; keep local development origins only in local/testing; disable wildcard origin regex patterns. |
| Sensitive exception logs | High | API error handler logged raw SQL bindings, full URLs, and stack traces regardless of environment. These may contain tokens, user-submitted values, or personal data. | Log sanitized classification/path/status in production. Keep detailed diagnostics only for local debug mode. |
| Missing deploy-time guardrails | Medium | CI checked source and built assets but did not check deployed `APP_KEY`, HTTPS URL, secure cookies, writable paths, or presence of Vite manifest. | Add `php artisan app:production-check` read-only preflight command. |

## Production deployment runbook (ServerByt / PHP 8.3+)

1. **Back up before touching production.** Export the current database, `storage/app/private`, `storage/app/public`, and encrypted application configuration into independently secured storage. Test a restore. Do **not** commit backups or `.env`.
2. **Document root:** The HTTP document root must be the Laravel `public/` directory, **not** the repository/project root. The project directory, `.env`, `vendor/`, `storage/`, and `bootstrap/` must remain outside the public web root. Confirm `/.env`, `/composer.json`, and `/storage/logs/laravel.log` cannot be downloaded. Do not copy sensitive directories into `public/`.
3. **PHP / dependencies:** Confirm the web PHP version **and CLI PHP version** satisfy the Composer requirement (`^8.3`), along with required PDO, OpenSSL, mbstring, fileinfo, XML, curl, zip, and GD/extensions required by deployed features. Install locked PHP dependencies using `composer install --no-dev --optimize-autoloader --no-interaction`. Do not run `composer update` during a release.
4. **Environment:** Supply a unique `APP_KEY` and strong database credentials, `APP_ENV=production`, `APP_DEBUG=false`, an actual HTTPS `APP_URL`, `SESSION_SECURE_COOKIE=true`, and a validated `MAIL_FROM_ADDRESS`. **Never regenerate an existing APP_KEY** without an explicit encryption/session rotation plan. Restrict CORS_ALLOWED_ORIGINS to controlled HTTPS web origins; do not add wildcard or local HTTP origins. If moving from previous config, explicitly verify stale `config:cache` values are cleared.
5. **Gateways:** Configure your own Razorpay and/or PhonePe keys, webhook secret/salt, exact callback URLs, correct live/sandbox environment, and merchant dashboard webhooks. Never use sample credentials or check secrets into code. Do a real **sandbox** checkout/failed checkout/duplicate callback/partial refund cycle before live transactions. Rotate webhook secrets if sample values were ever deployed.
6. **Deploy sequence:** Put the app in maintenance mode after backup, update the code to a pinned commit, install dependencies, build frontend assets (`npm ci && npm run build`) and verify `public/build/manifest.json`, run `php artisan migrate --force` once after checking the migration plan, create/check `storage:link` for public assets, then run `php artisan optimize`. Keep storage/framework, storage/logs and bootstrap/cache writable by the app user. Run `php artisan app:production-check` and resolve **FAIL** conditions before `php artisan up`. Verify `/up`, login, KYC, booking, and a **sandbox** checkout end to end.
7. **Cron and queues:** Configure scheduler at least once a minute using the correct PHP CLI executable and absolute path: `* * * * * /path/to/php83 /path/to/project/artisan schedule:run >> /dev/null 2>&1`. Current schedule releases expired holds every minute, sends reminders hourly, and checks bike documents/backup daily. If hosting cannot run every-minute cron, hold expiry/recovery may lag; do not silently assume it runs. `QUEUE_CONNECTION=sync` is supported on shared hosting but may delay HTTP requests: consider a supervised database queue worker where available.
8. **Backups:** The current Spatie backup schedule creates **database-only** backups, on **local** storage. This does *not* cover user-uploaded private KYC documents and may fail during a server-wide incident. Arrange encrypted off-site backups for uploads and DB, configure a real backup notification destination, and test recovery from a different host. Set `BACKUP_ARCHIVE_PASSWORD` appropriately if using encrypted archives; protect access to backups and encryption keys separately.
9. **Observability:** Check sanitized Laravel logs, storage capacity, mail delivery, queue failures, scheduled job output, HTTP 429 rates, payment exceptions, and webhook delivery/retry status. Set alerting for payment mismatch, failed refunds, backup failures, and expiring SSL.
10. **Rollback:** Preserve the preceding release and verified backups. Rolling back application code alone may **not** reverse database migrations safely. Use forward-compatible migrations or a tested migration rollback procedure with restore point.

## Automated verification

GitHub Actions runs Laravel's SQLite-backed test suite and two mobile TypeScript checks; these are **not** substitutes for testing MySQL locking, payment-provider integration, real Android/iOS devices, PHP/FPM/Apache behavior, queue scheduling, or production secrets. The added preflight command reads **configured settings only**, avoids printing any secret values, and returns a failing exit code when mandatory checks fail.

## Outstanding items requiring the actual ServerByt account

- Verify correct DNS, TLS certificate, public document root, file permissions, PHP-FPM vs CLI version, `mod_rewrite`, deployed `.env`, and authoritative reverse-proxy configuration.
- Validate MySQL/MariaDB migration and transaction behavior, transactional email sender, scheduler frequency and backup restore.
- Validate live gateway accounts/webhooks, mobile networking and offline-sync compatibility, and end-to-end booking/refund flow.
- Investigate code paths beyond this configuration-focused review with targeted DAST/SAST, dependency audits (`composer audit`, `npm audit`), and authenticated authorization penetration tests before declaring production-ready.

**Release gate:** Merge after CI/review, but **do not deploy or enable live payments solely because the code checks pass**.
