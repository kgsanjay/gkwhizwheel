<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_reschedule_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('cab_dispatch_id')->constrained('cab_dispatches')->restrictOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->dateTime('original_starts_at');
            $table->dateTime('original_ends_at');
            $table->dateTime('proposed_starts_at');
            $table->dateTime('proposed_ends_at');
            $table->string('status', 24)->default('pending');
            $table->text('reason');
            $table->timestamps();
            $table->index(['cab_dispatch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_reschedule_requests');
    }
};
