<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ProductionReadinessCheck extends Command
{
    protected $signature = 'app:production-check';

    protected $description = 'Check deploy-time Laravel security configuration without printing secrets.';

    public function handle(): int
    {
        $failed = 0;
        $warnings = 0;
        $production = app()->isProduction();

        $this->info('GK WhizWheel production readiness (configuration checks only)');

        $check = function (bool $ok, string $label) use (&$failed): void {
            if ($ok) {
                $this->line('PASS  '.$label);

                return;
            }

            $failed++;
            $this->error('FAIL  '.$label);
        };

        $warn = function (bool $risk, string $label) use (&$warnings): void {
            if ($risk) {
                $warnings++;
                $this->warn('WARN  '.$label);
            }
        };

        $url = (string) config('app.url');
        $key = (string) config('app.key');
        $keyBytes = Str::startsWith($key, 'base64:') ? base64_decode(substr($key, 7), true) : $key;

        $check($production, 'APP_ENV=production');
        $check(config('app.debug') === false, 'APP_DEBUG=false');
        $check(is_string($keyBytes) && strlen($keyBytes) === 32, 'APP_KEY is a valid 32-byte encryption key');
        $check(Str::startsWith($url, 'https://') && ! str_contains($url, 'yourdomain.com'), 'APP_URL is a real HTTPS origin');
        $check((bool) config('session.secure'), 'Secure session cookies enabled');
        $check((bool) config('session.http_only'), 'HttpOnly session cookies enabled');
        $check(in_array(config('session.same_site'), ['lax', 'strict'], true), 'SameSite cookie restriction set');

        $origins = config('cors.allowed_origins', []);
        $patterns = config('cors.allowed_origins_patterns', []);
        $check(! in_array('*', $origins, true) && $patterns === [], 'Credentialed CORS has no wildcard origins or patterns');
        $check(count(array_filter($origins, static fn ($origin) => str_starts_with($origin, 'http://'))) === 0, 'No insecure HTTP CORS origins');

        $check(is_file(public_path('build/manifest.json')), 'Vite production manifest exists');
        $check(is_writable(storage_path('framework')) && is_writable(storage_path('logs')), 'Laravel framework and log storage is writable');
        $check(is_writable(base_path('bootstrap/cache')), 'Bootstrap cache directory is writable');
        $check(filter_var(config('mail.from.address'), FILTER_VALIDATE_EMAIL) !== false, 'MAIL_FROM_ADDRESS configured');

        $warn(config('queue.default') === 'sync', 'Synchronous queue: email and other work will delay HTTP responses');
        $warn(config('cache.default') === 'array', 'Array cache is not shared between requests; throttling may be ineffective');
        $warn(empty(config('backup.backup.password')), 'Backup encryption password not configured');
        $warn(config('backup.backup.destination.disks') === ['local'], 'Backups stored only on local disk; configure an independent off-site copy');

        foreach ([
            'phonepe' => ['merchant_id', 'salt_key'],
        ] as $gateway => $required) {
            $values = array_map(static fn (string $name): string => (string) config("services.{$gateway}.{$name}"), $required);
            $missing = count(array_filter($values, static fn (string $value): bool => trim($value) === '')) > 0;
            $warn($missing, strtoupper($gateway).' missing credentials; its payment integration must remain disabled');
        }

        $this->newLine();
        $this->line("Summary: {$failed} failure(s), {$warnings} warning(s).");
        $this->line('Not checked: actual DB connectivity, real gateway callbacks, scheduler/cron, SSL certificate, or backup restore.');

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
