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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_reference', 20)->unique();
            $table->foreignId('bike_id')->constrained('bikes');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('pickup_store_id')->constrained('stores');
            $table->foreignId('return_store_id')->constrained('stores');
            $table->enum('channel', ['online', 'offline']);
            $table->enum('status', [
                'held',
                'pending_payment',
                'confirmed',
                'handed_over',
                'returned',
                'completed',
                'cancelled',
                'expired',
                'no_show',
            ])->default('held');
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('base_amount', 10, 2);
            $table->decimal('pricing_adjustments_amount', 10, 2)->default(0);
            $table->decimal('one_way_fee_amount', 10, 2)->default(0);
            $table->decimal('addon_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('deposit_amount', 10, 2);
            $table->decimal('late_fee_amount', 10, 2)->default(0);
            $table->decimal('damage_fee_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->json('price_breakdown_json');
            $table->timestamp('held_until')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('agreement_signed_at')->nullable();
            $table->string('agreement_signature_path', 255)->nullable();
            $table->string('idempotency_key', 100)->unique();
            $table->timestamps();

            $table->index(['bike_id', 'start_date', 'end_date', 'status'], 'bookings_availability_idx');
            $table->index('user_id');
            $table->index('pickup_store_id');
            $table->index('return_store_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
