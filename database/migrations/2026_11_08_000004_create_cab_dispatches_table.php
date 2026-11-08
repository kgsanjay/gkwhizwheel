<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_dispatches', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_booking_id')->unique()->constrained('service_bookings')->restrictOnDelete();
            $table->foreignId('cab_vehicle_id')->constrained('cab_vehicles')->restrictOnDelete();
            $table->foreignId('cab_driver_id')->constrained('cab_drivers')->restrictOnDelete();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('assigned_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->dateTime('trip_started_at')->nullable();
            $table->dateTime('trip_completed_at')->nullable();
            $table->unsignedInteger('start_odometer')->nullable();
            $table->unsignedInteger('end_odometer')->nullable();
            $table->text('operations_notes')->nullable();
            $table->string('status', 24)->default('assigned');
            $table->timestamps();
            $table->index(['store_id', 'status', 'starts_at']);
            $table->index(['cab_vehicle_id', 'starts_at', 'ends_at']);
            $table->index(['cab_driver_id', 'starts_at', 'ends_at']);
        });
        Schema::create('cab_dispatch_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('cab_dispatch_id')->constrained('cab_dispatches')->restrictOnDelete();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->string('from_status', 24)->nullable();
            $table->string('to_status', 24);
            $table->dateTime('occurred_at');
            $table->timestamps();
            $table->index(['cab_dispatch_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_dispatch_events');
        Schema::dropIfExists('cab_dispatches');
    }
};
