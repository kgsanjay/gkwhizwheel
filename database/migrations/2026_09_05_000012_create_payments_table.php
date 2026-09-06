<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->enum('type', ['advance', 'deposit', 'late_fee', 'damage_fee', 'refund']);
            $table->decimal('amount', 10, 2);
            $table->enum('method', ['razorpay', 'phonepe', 'cash', 'card_pos']);
            $table->string('gateway_reference', 150)->nullable();
            $table->enum('status', ['pending', 'success', 'failed', 'refunded'])->default('pending');
            $table->foreignId('collected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
