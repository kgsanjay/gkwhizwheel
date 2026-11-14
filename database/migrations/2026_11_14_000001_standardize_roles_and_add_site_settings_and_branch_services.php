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
        // 1. Create site_settings table for dynamic zero-hardcoding platform configuration
        if (! Schema::hasTable('site_settings')) {
            Schema::create('site_settings', function (Blueprint $table): void {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->string('group')->default('general');
                $table->string('description')->nullable();
                $table->timestamps();
            });
        }

        // 2. Add email, whatsapp, operating_hours_label, and services to stores table
        Schema::table('stores', function (Blueprint $table): void {
            if (! Schema::hasColumn('stores', 'email')) {
                $table->string('email', 150)->nullable()->after('phone');
            }
            if (! Schema::hasColumn('stores', 'whatsapp')) {
                $table->string('whatsapp', 30)->nullable()->after('email');
            }
            if (! Schema::hasColumn('stores', 'operating_hours_label')) {
                $table->string('operating_hours_label', 100)->nullable()->default('Open 24/7')->after('operating_hours');
            }
            if (! Schema::hasColumn('stores', 'services')) {
                $table->json('services')->nullable()->after('status');
            }
        });

        // 3. Relax role column on users table to varchar(50) to support standardized roles (superadmin, admin, manager, customer)
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT "customer"');
        }

        // 4. Seed initial site_settings
        $defaultSettings = [
            'primary_phone' => '+918660989586',
            'whatsapp_number' => '918660989586',
            'support_email' => 'contact@whizwheels.in',
            'operating_hours_label' => 'Open 24/7',
            'tagline' => 'Coastal Travel Hub • Rides, Stays & Experiences',
            'explore_label' => 'Explore',
            'locations_summary' => 'Honnavar & Murudeshwar',
            'google_rating_label' => '5.0 Google Rated (324+)',
            'google_rating_value' => '5.0',
            'google_reviews_count' => '324+',
            'google_maps_reviews_url' => 'https://maps.app.goo.gl/y94Ap38BbZGWGSDdA',
        ];

        foreach ($defaultSettings as $key => $val) {
            DB::table('site_settings')->updateOrInsert(
                ['key' => $key],
                [
                    'value' => $val,
                    'group' => 'general',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        // 5. Update existing stores with contact info & active service matrices
        // Honnavar: Bike Rental, Cab, Homestay, Backwater Boating, Guide
        DB::table('stores')
            ->where('city', 'like', '%Honnavar%')
            ->orWhere('id', 1)
            ->update([
                'phone' => '+918660989586',
                'whatsapp' => '918660989586',
                'email' => 'contact@whizwheels.in',
                'operating_hours_label' => 'Open 24/7',
                'services' => json_encode(['two_wheelers', 'taxi', 'homestay', 'boating', 'guide']),
            ]);

        // Murudeshwar: Bike Rental, Cab, Rooms, Scuba Diving, Guide
        DB::table('stores')
            ->where('city', 'like', '%Murudeshwar%')
            ->orWhere('id', 52)
            ->update([
                'phone' => '+917892094155',
                'whatsapp' => '917892094155',
                'email' => 'murudeshwar@whizwheels.in',
                'operating_hours_label' => 'Open 24/7',
                'services' => json_encode(['two_wheelers', 'taxi', 'rooms', 'scuba', 'guide']),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_settings');

        Schema::table('stores', function (Blueprint $table): void {
            if (Schema::hasColumn('stores', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('stores', 'whatsapp')) {
                $table->dropColumn('whatsapp');
            }
            if (Schema::hasColumn('stores', 'operating_hours_label')) {
                $table->dropColumn('operating_hours_label');
            }
            if (Schema::hasColumn('stores', 'services')) {
                $table->dropColumn('services');
            }
        });
    }
};
