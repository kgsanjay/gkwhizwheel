<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Logging\MaskSensitiveDataProcessor;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Monolog\Level;
use Monolog\LogRecord;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->user = User::create([
        'name' => 'Security Auditor',
        'email' => 'auditor@gkwhizwheel.com',
        'phone' => '9876543210',
        'password' => bcrypt('Password123!'),
        'role' => UserRole::SUPER_ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
});

test('ActivityLog automatically redacts raw passwords, CVVs, credit cards, and full KYC document content', function (): void {
    $rawBase64Kyc = 'data:image/jpeg;base64,' . base64_encode(str_repeat('A', 500));

    $log = ActivityLog::create([
        'user_id' => $this->user->id,
        'action' => 'user_profile_updated',
        'subject_type' => User::class,
        'subject_id' => $this->user->id,
        'old_values' => [
            'password' => 'OldPlainPassword123!',
            'card_number' => '4111-2222-3333-4444',
            'cvv' => '123',
            'document_content' => $rawBase64Kyc,
            'role' => 'customer',
        ],
        'new_values' => [
            'password' => 'NewPlainPassword456!',
            'password_confirmation' => 'NewPlainPassword456!',
            'credit_card' => '5500 0000 0000 9876',
            'cvc' => '999',
            'raw_document' => str_repeat('B', 400),
            'reference_id' => 'DOC-REF-1001',
            'role' => 'staff',
        ],
    ]);

    $savedLog = ActivityLog::findOrFail($log->id);

    // Assert sensitive fields are redacted or masked in old_values
    expect($savedLog->old_values['password'])->toBe('[REDACTED]')
        ->and($savedLog->old_values['cvv'])->toBe('[REDACTED]')
        ->and($savedLog->old_values['card_number'])->toBe('[REDACTED]')
        ->and($savedLog->old_values['document_content'])->toBe('[REDACTED]')
        ->and($savedLog->old_values['role'])->toBe('customer');

    // Assert sensitive fields are redacted or masked in new_values
    expect($savedLog->new_values['password'])->toBe('[REDACTED]')
        ->and($savedLog->new_values['password_confirmation'])->toBe('[REDACTED]')
        ->and($savedLog->new_values['credit_card'])->toBe('[REDACTED]')
        ->and($savedLog->new_values['cvc'])->toBe('[REDACTED]')
        ->and($savedLog->new_values['raw_document'])->toBe('[REDACTED]')
        ->and($savedLog->new_values['reference_id'])->toBe('DOC-REF-1001')
        ->and($savedLog->new_values['role'])->toBe('staff');
});

test('MaskSensitiveDataProcessor masks embedded credit cards and redacts sensitive keys in context', function (): void {
    $processor = new MaskSensitiveDataProcessor();

    $record = new LogRecord(
        datetime: new \DateTimeImmutable(),
        channel: 'testing',
        level: Level::Info,
        message: 'Payment attempt failed for card 4111 2222 3333 4444 with cvv=789 and password=SuperSecret!',
        context: [
            'password' => 'RawSecret123',
            'card_number' => '4111222233334444',
            'cvv' => '456',
            'nested' => [
                'user_secret' => 'NestedSecretKey',
                'description' => 'Charged card 5500-0000-0000-1234 successfully',
                'kyc_doc' => 'data:application/pdf;base64,' . base64_encode('PDF content'),
            ],
            'safe_identifier' => 'PAY-REF-9988',
        ]
    );

    $processed = $processor($record);

    // Message assertions
    expect($processed->message)->not->toContain('4111 2222 3333 4444')
        ->and($processed->message)->toContain('************4444')
        ->and($processed->message)->toContain('cvv=***')
        ->and($processed->message)->toContain('password=[REDACTED]');

    // Context assertions
    expect($processed->context['password'])->toBe('[REDACTED]')
        ->and($processed->context['card_number'])->toBe('[REDACTED]')
        ->and($processed->context['cvv'])->toBe('[REDACTED]')
        ->and($processed->context['nested']['user_secret'])->toBe('[REDACTED]')
        ->and($processed->context['nested']['description'])->toContain('************1234')
        ->and($processed->context['nested']['kyc_doc'])->toBe('[BINARY/BASE64 DOCUMENT REDACTED]')
        ->and($processed->context['safe_identifier'])->toBe('PAY-REF-9988');
});

test('standard application logging channels include MaskSensitiveDataProcessor', function (): void {
    $config = config('logging.channels');

    expect($config['single']['processors'])->toContain(MaskSensitiveDataProcessor::class)
        ->and($config['daily']['processors'])->toContain(MaskSensitiveDataProcessor::class)
        ->and($config['stderr']['processors'])->toContain(MaskSensitiveDataProcessor::class);
});
