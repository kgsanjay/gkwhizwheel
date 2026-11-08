<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cab_dispatch_events', function (Blueprint $table): void {
            // Historical events remain intact; reasons were not previously collected.
            $table->text('reason')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('cab_dispatch_events', function (Blueprint $table): void {
            $table->dropColumn('reason');
        });
    }
};
