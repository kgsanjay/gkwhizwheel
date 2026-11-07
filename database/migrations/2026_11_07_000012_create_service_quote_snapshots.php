<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_quote_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('service_item_id')->constrained('service_items')->restrictOnDelete();
            $table->string('service_type', 32);
            $table->dateTime('start_datetime');
            $table->unsignedSmallInteger('quantity');
            $table->decimal('base_amount', 12, 2);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2);
            $table->json('breakdown_json');
            $table->dateTime('expires_at');
            $table->foreignId('service_booking_id')->nullable()->unique()->constrained('service_bookings')->restrictOnDelete();
            $table->timestamps();
            $table->index(['user_id', 'expires_at']);
            $table->index(['service_item_id', 'start_datetime']);
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('service_quote_snapshots');
    }
};
