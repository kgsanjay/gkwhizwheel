<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_refund_reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_booking_id')->unique()->constrained('service_bookings')->restrictOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->unsignedBigInteger('verified_receipts_paise');
            $table->unsignedBigInteger('recorded_advance_paise');
            $table->string('status', 30)->default('requires_policy_review');
            $table->text('reason');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_refund_reviews');
    }
};
