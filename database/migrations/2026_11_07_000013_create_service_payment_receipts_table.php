<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_payment_receipts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_booking_id')->constrained('service_bookings')->restrictOnDelete();
            $table->string('provider', 24)->default('razorpay');
            $table->string('payment_id', 128);
            $table->string('order_id', 128)->nullable();
            $table->unsignedBigInteger('amount_paise');
            $table->timestamps();
            // Enforce provider-wide (not merely per-booking) replay protection.
            $table->unique(['provider', 'payment_id'], 'service_payment_provider_ref_unique');
            $table->index('service_booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_payment_receipts');
    }
};
