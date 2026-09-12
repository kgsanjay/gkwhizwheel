<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Normalize empty strings to null so they do not collide under the unique constraint
        DB::table('payments')
            ->where('gateway_reference', '')
            ->update(['gateway_reference' => null]);

        // 2. Safely clean up any existing duplicate non-null gateway_reference rows if present
        $duplicates = DB::table('payments')
            ->select('gateway_reference', DB::raw('MIN(id) as keep_id'), DB::raw('COUNT(*) as count'))
            ->whereNotNull('gateway_reference')
            ->groupBy('gateway_reference')
            ->having('count', '>', 1)
            ->get();

        foreach ($duplicates as $dup) {
            DB::table('payments')
                ->where('gateway_reference', $dup->gateway_reference)
                ->where('id', '!=', $dup->keep_id)
                ->delete();
        }

        // 3. Add unique index on payments.gateway_reference
        Schema::table('payments', function (Blueprint $table) {
            $table->unique('gateway_reference', 'payments_gateway_reference_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique('payments_gateway_reference_unique');
        });
    }
};
