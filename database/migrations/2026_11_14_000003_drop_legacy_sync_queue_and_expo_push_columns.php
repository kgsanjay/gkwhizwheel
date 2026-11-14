<?php

declare(strict_types=1);

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
        Schema::dropIfExists('sync_queue');

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'expo_push_token')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('expo_push_token');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'expo_push_token')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('expo_push_token', 255)->nullable();
            });
        }

        if (! Schema::hasTable('sync_queue')) {
            Schema::create('sync_queue', function (Blueprint $table): void {
                $table->id();
                $table->string('device_id', 100);
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action_type', 100);
                $table->json('payload_json');
                $table->string('idempotency_key', 255)->unique();
                $table->string('status', 30)->default('pending');
                $table->timestamp('synced_at')->nullable();
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }
};
