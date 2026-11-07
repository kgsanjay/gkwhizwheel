<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bike_relocation_tasks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('bike_id')->constrained('bikes')->cascadeOnDelete();
            $table->foreignId('triggering_booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('affected_booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('from_store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('required_store_id')->constrained('stores')->restrictOnDelete();
            $table->string('status', 20)->default('open');
            $table->timestamps();
            $table->unique(['affected_booking_id', 'status'], 'bike_relocation_affected_status_unique');
            $table->index(['required_store_id', 'status'], 'bike_relocation_required_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bike_relocation_tasks');
    }
};
