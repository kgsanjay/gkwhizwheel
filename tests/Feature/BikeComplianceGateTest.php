<?php

declare(strict_types=1);

use App\Enums\BikeDocumentType;
use App\Enums\BikeStatus;
use App\Enums\FuelType;
use App\Enums\StoreStatus;
use App\Enums\Transmission;
use App\Models\Bike;
use App\Models\BikeCategory;
use App\Models\BikeDocument;
use App\Models\Store;
use App\Services\BikeComplianceGate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $store = Store::create([
        'name' => 'Honnavar', 'address_line' => 'Main Road',
        'city' => 'Honnavar', 'state' => 'Karnataka', 'pincode' => '581334',
        'latitude' => 14.28, 'longitude' => 74.45,
        'status' => StoreStatus::ACTIVE,
    ]);
    $category = BikeCategory::create([
        'name' => 'Scooters', 'base_daily_rate' => 500,
        'default_deposit_amount' => 0,
    ]);
    $this->bike = Bike::create([
        'category_id' => $category->id,
        'home_store_id' => $store->id, 'current_store_id' => $store->id,
        'brand' => 'Honda', 'model_name' => 'Activa',
        'registration_number' => 'KA47A4848',
        'fuel_type' => FuelType::PETROL,
        'transmission' => Transmission::AUTOMATIC,
        'status' => BikeStatus::AVAILABLE,
    ]);
});

function complianceDoc(Bike $bike, BikeDocumentType $type, bool $verified = true, ?string $expires = null): BikeDocument
{
    return BikeDocument::create([
        'bike_id' => $bike->id,
        'document_type' => $type,
        'file_path' => 'private/compliance/test-'.$type->value.'.pdf',
        'issue_date' => now()->subMonth()->toDateString(),
        'expiry_date' => $expires,
        'verified' => $verified,
    ]);
}

function complianceReady(Bike $bike): void
{
    complianceDoc($bike, BikeDocumentType::RC);
    complianceDoc($bike, BikeDocumentType::INSURANCE, true, now()->addMonths(8)->toDateString());
    complianceDoc($bike, BikeDocumentType::EMISSION_CERTIFICATE, true, now()->addMonths(3)->toDateString());
}

test('missing and unverified compliance prevents physical handover', function (): void {
    $gate = app(BikeComplianceGate::class);
    expect(count($gate->problems($this->bike)))->toBe(3);
    expect(fn () => $gate->assertReadyForHandover($this->bike))->toThrow(ValidationException::class);

    complianceDoc($this->bike, BikeDocumentType::RC, false);
    complianceDoc($this->bike, BikeDocumentType::INSURANCE, true, now()->addMonths(2)->toDateString());
    complianceDoc($this->bike, BikeDocumentType::EMISSION_CERTIFICATE, true, now()->addMonths(2)->toDateString());
    expect(count($gate->problems($this->bike)))->toBe(1);
});

test('verified current RC insurance and PUC permit handover when bike is available', function (): void {
    complianceReady($this->bike);
    $gate = app(BikeComplianceGate::class);
    expect($gate->problems($this->bike))->toBe([]);
    $gate->assertReadyForHandover($this->bike);
});

test('expired or unknown-dated PUC and insurance are not silently accepted', function (): void {
    complianceDoc($this->bike, BikeDocumentType::RC);
    complianceDoc($this->bike, BikeDocumentType::INSURANCE, true, null);
    complianceDoc($this->bike, BikeDocumentType::EMISSION_CERTIFICATE, true, now()->subDay()->toDateString());
    $gate = app(BikeComplianceGate::class);
    expect(count($gate->problems($this->bike)))->toBe(2);
    expect(fn () => $gate->assertReadyForHandover($this->bike))->toThrow(ValidationException::class);
});

test('overdue maintenance and unavailable status each stop handover', function (): void {
    complianceReady($this->bike);
    $this->bike->update(['next_service_due_date' => now()->subDay()]);
    expect(app(BikeComplianceGate::class)->problems($this->bike))->toContain('Overdue vehicle maintenance');
    $this->bike->update(['next_service_due_date' => null, 'status' => BikeStatus::MAINTENANCE]);
    expect(fn () => app(BikeComplianceGate::class)->assertReadyForHandover($this->bike))
        ->toThrow(ValidationException::class);
});

test('compliance audit reports unsafe available bike but does not edit it or expose document paths', function (): void {
    $before = $this->bike->getRawOriginal();
    $this->artisan('fleet:audit-compliance', ['--strict' => true])->assertFailed();
    $this->artisan('fleet:audit-compliance')->assertSuccessful();
    expect($this->bike->fresh()->getRawOriginal())->toBe($before)
        ->and($this->bike->fresh()->status)->toBe(BikeStatus::AVAILABLE);
    complianceReady($this->bike);
    $this->artisan('fleet:audit-compliance', ['--strict' => true])->assertSuccessful();
});
