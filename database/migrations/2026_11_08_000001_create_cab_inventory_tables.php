<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_vehicles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('service_item_id')->constrained('service_items')->restrictOnDelete();
            $table->foreignId('service_resource_id')->nullable()->unique()->constrained('service_resources')->restrictOnDelete();
            $table->string('registration_number', 32)->unique();
            $table->string('vehicle_class', 32);
            $table->string('make', 80);
            $table->string('model_name', 100);
            $table->string('ownership_type', 16); // owned | partner
            $table->unsignedTinyInteger('seats');
            $table->unsignedTinyInteger('luggage_capacity')->default(0);
            $table->boolean('is_ac')->default(false);
            $table->boolean('is_accessible')->default(false);
            $table->date('insurance_expires_on')->nullable();
            $table->date('permit_expires_on')->nullable();
            $table->date('fitness_expires_on')->nullable();
            $table->date('last_inspected_on')->nullable();
            $table->boolean('documents_verified')->default(false);
            $table->string('status', 24)->default('draft'); // draft | maintenance | available | inactive
            $table->timestamps();
            $table->index(['store_id', 'status', 'vehicle_class']);
            $table->index(['service_item_id', 'status']);
        });

        Schema::create('cab_drivers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('service_item_id')->constrained('service_items')->restrictOnDelete();
            $table->foreignId('service_resource_id')->nullable()->unique()->constrained('service_resources')->restrictOnDelete();
            $table->string('name', 120);
            $table->string('license_fingerprint', 64)->unique();
            $table->string('license_last_four', 4);
            $table->date('license_expires_on')->nullable();
            $table->date('last_verified_on')->nullable();
            $table->boolean('documents_verified')->default(false);
            $table->string('status', 24)->default('draft');
            $table->timestamps();
            $table->index(['store_id', 'status']);
            $table->index(['service_item_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_drivers');
        Schema::dropIfExists('cab_vehicles');
    }
};
