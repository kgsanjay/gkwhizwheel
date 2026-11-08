<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_enquiry_details', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_enquiry_id')->unique()->constrained('service_enquiries')->restrictOnDelete();
            $table->foreignId('service_item_id')->nullable()->constrained('service_items')->restrictOnDelete();
            $table->foreignId('store_id')->nullable()->constrained('stores')->restrictOnDelete();
            $table->string('trip_type', 20);
            $table->string('vehicle_class', 32)->nullable();
            $table->unsignedTinyInteger('passengers');
            $table->unsignedTinyInteger('bags')->default(0);
            $table->string('travel_reference', 40)->nullable();
            $table->text('stops_json')->nullable();
            $table->text('special_requests')->nullable();
            $table->string('fare_state', 32)->default('awaiting_verification');
            $table->boolean('terms_acknowledged')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_enquiry_details');
    }
};
