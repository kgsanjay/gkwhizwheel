<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_resources', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_item_id')->constrained('service_items')->restrictOnDelete();
            $table->foreignId('store_id')->nullable()->constrained('stores')->restrictOnDelete();
            $table->string('resource_type', 32);
            $table->string('code', 80);
            $table->string('name', 160);
            $table->unsignedSmallInteger('capacity_units')->default(1);
            $table->string('status', 24)->default('draft');
            $table->timestamps();
            $table->unique(['service_item_id', 'code']);
            $table->index(['service_item_id', 'status']);
            $table->index(['store_id', 'resource_type', 'status']);
        });

        Schema::create('service_resource_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_resource_id')->constrained('service_resources')->restrictOnDelete();
            $table->foreignId('service_booking_id')->constrained('service_bookings')->restrictOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->unsignedSmallInteger('quantity');
            $table->string('status', 24)->default('held');
            $table->dateTime('held_until')->nullable();
            $table->timestamps();
            $table->unique(['service_resource_id', 'service_booking_id']);
            $table->index(['service_resource_id', 'starts_at', 'ends_at', 'status'], 'resource_allocation_window_idx');
            $table->index(['service_booking_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_resource_allocations');
        Schema::dropIfExists('service_resources');
    }
};
