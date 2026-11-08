<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cab_dispute_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('cab_dispute_id')->constrained('cab_disputes')->restrictOnDelete();
            $table->foreignId('actor_user_id')->constrained('users')->restrictOnDelete();
            $table->string('from_status', 24);
            $table->string('to_status', 24);
            $table->text('review_notes');
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['cab_dispute_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cab_dispute_events');
    }
};
