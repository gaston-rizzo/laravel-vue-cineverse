<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        if (Schema::hasColumn('users', 'is_verified') && Schema::hasColumn('users', 'email_verified_at')) {
            DB::table('users')
                ->where('is_verified', true)
                ->whereNull('email_verified_at')
                ->update(['email_verified_at' => DB::raw('COALESCE(created_at, NOW())')]);
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'updated_at')) {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            }
        });

        DB::statement('ALTER TABLE users MODIFY password VARCHAR(255) NOT NULL');

        $legacyColumns = array_values(array_filter([
            Schema::hasColumn('users', 'password_hash') ? 'password_hash' : null,
            Schema::hasColumn('users', 'is_verified') ? 'is_verified' : null,
            Schema::hasColumn('users', 'verification_token') ? 'verification_token' : null,
            Schema::hasColumn('users', 'verification_expires_at') ? 'verification_expires_at' : null,
            Schema::hasColumn('users', 'password_reset_token') ? 'password_reset_token' : null,
            Schema::hasColumn('users', 'password_reset_expires_at') ? 'password_reset_expires_at' : null,
        ]));

        if ($legacyColumns !== []) {
            Schema::table('users', function (Blueprint $table) use ($legacyColumns) {
                $table->dropColumn($legacyColumns);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'password_hash')) {
                $table->string('password_hash')->nullable()->after('password');
            }

            if (! Schema::hasColumn('users', 'is_verified')) {
                $table->boolean('is_verified')->default(false)->after('created_at');
            }

            if (! Schema::hasColumn('users', 'verification_token')) {
                $table->string('verification_token')->nullable()->after('is_verified');
            }

            if (! Schema::hasColumn('users', 'verification_expires_at')) {
                $table->timestamp('verification_expires_at')->nullable()->after('verification_token');
            }

            if (! Schema::hasColumn('users', 'password_reset_token')) {
                $table->string('password_reset_token')->nullable()->after('verification_expires_at');
            }

            if (! Schema::hasColumn('users', 'password_reset_expires_at')) {
                $table->timestamp('password_reset_expires_at')->nullable()->after('password_reset_token');
            }
        });

        DB::table('users')
            ->whereNull('password_hash')
            ->update(['password_hash' => DB::raw('password')]);
    }
};
