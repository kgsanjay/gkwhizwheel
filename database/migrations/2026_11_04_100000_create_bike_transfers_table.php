<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bike_transfers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('bike_id')->constrained('bikes')->restrictOnDelete();
            $table->foreignId('from_store_id')->constrained('stores')->restrictOnDelete();
            $table->foreignId('to_store_id')->constrained('stores')->restrictOnDelete();
            $table->string('status', 24)->default('requested')->index();
            $table->text('reason');
            $table->text('notes')->nullable();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('dispatched_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->index(['bike_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bike_transfers');
    }
};
