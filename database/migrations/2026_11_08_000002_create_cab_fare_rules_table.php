<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_fare_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('service_item_id')->constrained('service_items')->restrictOnDelete();
            $table->string('trip_type', 24); // one_way | round_trip | local | airport
            $table->string('route_class', 40); // exact admin-approved route/zone
            $table->decimal('fixed_route_amount', 12, 2)->nullable();
            $table->decimal('per_km_amount', 12, 2)->nullable();
            $table->decimal('minimum_amount', 12, 2)->nullable();
            $table->decimal('hourly_amount', 12, 2)->nullable();
            $table->unsignedSmallInteger('minimum_hours')->nullable();
            $table->decimal('daily_minimum_amount', 12, 2)->nullable();
            $table->decimal('driver_allowance_per_day', 12, 2)->nullable();
            $table->decimal('extra_km_amount', 12, 2)->nullable();
            $table->decimal('extra_hour_amount', 12, 2)->nullable();
            $table->decimal('included_km', 9, 2)->nullable();
            $table->decimal('included_hours', 9, 2)->nullable();
            $table->string('toll_policy', 20)->default('excluded'); // included | excluded | exact
            $table->string('parking_policy', 20)->default('excluded');
            $table->decimal('interstate_permit_amount', 12, 2)->nullable();
            $table->boolean('is_approved')->default(false);
            $table->boolean('is_active')->default(false);
            $table->timestamps();
            $table->unique(['service_item_id', 'trip_type', 'route_class'], 'cab_fare_unique_route');
            $table->index(['store_id', 'is_active', 'is_approved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_fare_rules');
    }
};
