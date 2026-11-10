<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_notification_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_booking_id')->constrained('service_bookings')->restrictOnDelete();
            $table->string('event_key', 160)->unique();
            $table->string('event_type', 48);
            $table->string('status', 30)->default('pending_approval');
            $table->timestamp('recorded_at');
            $table->timestamps();
            $table->index(['service_booking_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_notification_events');
    }
};
