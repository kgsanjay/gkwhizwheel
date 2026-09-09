<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_items', function (Blueprint $table) {
            $table->id();
            $table->string('service_type', 50)->index(); // two_wheelers, taxi, boating, scuba, homestay, guide, tours
            $table->string('name');
            $table->string('category', 100)->nullable();
            $table->text('description')->nullable();
            $table->decimal('price_base', 10, 2);
            $table->string('price_unit', 50)->default('per_day'); // per_day, per_km, per_person, per_dive, per_night, per_trip, per_hour
            $table->string('capacity', 50)->nullable();
            $table->string('image_url')->nullable();
            $table->string('badge', 50)->nullable();
            $table->json('features')->nullable();
            $table->string('status', 30)->default('available')->index(); // available, maintenance, booked, inactive
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('service_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_number', 64)->unique();
            $table->string('service_type', 50)->index();
            $table->foreignId('service_item_id')->nullable()->constrained('service_items')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_name');
            $table->string('customer_phone', 30)->index();
            $table->string('customer_email')->nullable();
            $table->string('booking_channel', 30)->default('online'); // online, offline_walkin, offline_phone
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime')->nullable();
            $table->string('pickup_location')->nullable();
            $table->string('drop_location')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('base_amount', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('advance_paid', 10, 2)->default(0);
            $table->decimal('balance_due', 10, 2)->default(0);
            $table->string('payment_status', 30)->default('pending')->index(); // pending, partial, paid, refunded
            $table->string('payment_method', 30)->default('pay_on_arrival'); // cash, upi, card, online, pay_on_arrival
            $table->string('status', 30)->default('confirmed')->index(); // confirmed, in_progress, completed, cancelled
            $table->text('customer_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_bookings');
        Schema::dropIfExists('service_items');
    }
};
