<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_enquiries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('reference', 32)->unique();
            $table->string('service_type', 32)->index();
            $table->string('customer_name', 100);
            $table->string('customer_phone', 20);
            $table->string('customer_email', 150)->nullable();
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime')->nullable();
            $table->string('pickup_location', 255);
            $table->string('drop_location', 255)->nullable();
            $table->unsignedSmallInteger('quantity');
            $table->text('customer_notes')->nullable();
            $table->string('status', 24)->default('requested')->index();
            $table->timestamps();
            $table->index(['service_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_enquiries');
    }
};
