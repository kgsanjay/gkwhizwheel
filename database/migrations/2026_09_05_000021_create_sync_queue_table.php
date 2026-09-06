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
        Schema::create('sync_queue', function (Blueprint $table) {
            $table->id();
            $table->string('device_id', 150);
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('action_type', 100);
            $table->json('payload_json');
            $table->string('idempotency_key', 100)->unique();
            $table->enum('status', ['pending', 'synced', 'failed'])->default('pending');
            $table->timestamp('synced_at')->nullable();
            $table->timestamp('created_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_queue');
    }
};
