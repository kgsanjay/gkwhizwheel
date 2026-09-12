<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RawSqlInjectionSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Security Auditor',
            'email' => 'auditor@gkwhizwheel.com',
            'phone' => '9876543299',
            'password' => Hash::make('StrongPass123!@#'),
            'role' => UserRole::SUPER_ADMIN,
            'status' => UserStatus::ACTIVE,
        ]);
    }

    /**
     * Audit test: scan all controller and service files for raw SQL methods
     * and verify zero direct variable or request concatenation into raw SQL strings.
     */
    public function test_no_raw_sql_uses_direct_string_concatenation_or_interpolation(): void
    {
        $directories = [
            app_path('Http/Controllers'),
            app_path('Services'),
        ];

        $rawMethods = [
            'DB::raw',
            'DB::select',
            'DB::statement',
            'DB::unprepared',
            'whereRaw',
            'selectRaw',
            'orderByRaw',
            'groupByRaw',
            'havingRaw',
            'joinRaw',
        ];

        $violations = [];

        foreach ($directories as $dir) {
            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));

            foreach ($iterator as $file) {
                if ($file->isFile() && str_ends_with($file->getFilename(), '.php')) {
                    $content = file_get_contents($file->getPathname());
                    $relativePath = str_replace(base_path() . '/', '', $file->getPathname());

                    foreach ($rawMethods as $rawMethod) {
                        if (str_contains($content, $rawMethod)) {
                            // Match the arguments inside this specific raw invocation
                            $pattern = '/' . preg_quote($rawMethod, '/') . '\s*\(([^()]+)\)/';
                            if (preg_match_all($pattern, $content, $matches)) {
                                foreach ($matches[1] as $arguments) {
                                    // Check if arguments contain string concatenation (.) with variables or variable interpolation ($)
                                    $hasConcatenation = preg_match('/\s*\.\s*\$/', $arguments);
                                    $hasVariableInterpolation = preg_match('/"([^"]*)\$([a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*)([^"]*)"/', $arguments);

                                    if ($hasConcatenation || $hasVariableInterpolation) {
                                        $violations[] = [
                                            'file' => $relativePath,
                                            'method' => $rawMethod,
                                            'arguments' => trim($arguments),
                                        ];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        $this->assertEmpty(
            $violations,
            'Detected raw SQL string concatenation/interpolation: ' . json_encode($violations, JSON_PRETTY_PRINT)
        );
    }

    /**
     * Functional test: attempting SQL injection payloads into report grouping & filter params
     * is safely validated and parameterized without syntax errors or leakage.
     */
    public function test_admin_report_endpoint_safely_handles_sql_injection_payloads(): void
    {
        $payloads = [
            "' OR 1=1 --",
            "1; DROP TABLE users; --",
            "' UNION SELECT id, password, email FROM users --",
            "benchmark(5000000,MD5(1))",
        ];

        foreach ($payloads as $sqlPayload) {
            $response = $this->actingAs($this->superAdmin, 'sanctum')->getJson('/api/v1/admin/reports/revenue?' . http_build_query([
                'group_by' => $sqlPayload,
                'start_date' => $sqlPayload,
                'end_date' => $sqlPayload,
            ]));

            // Must either fail validation with 422 or safely default without 500 SQL syntax errors
            $this->assertNotEquals(500, $response->status(), "SQL payload caused 500 error: {$sqlPayload}");
            $this->assertTrue(
                in_array($response->status(), [200, 422], true),
                "Unexpected status code {$response->status()} for payload: {$sqlPayload}"
            );
        }
    }
}
