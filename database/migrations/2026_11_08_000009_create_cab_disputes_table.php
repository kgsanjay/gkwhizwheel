<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_disputes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_booking_id')->constrained('service_bookings')->restrictOnDelete();
            $table->foreignId('store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('category', 40);
            $table->string('status', 24)->default('open');
            $table->text('description');
            $table->timestamps();
            $table->index(['store_id', 'status', 'created_at']);
            $table->index(['service_booking_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_disputes');
    }
};
