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

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique()->after('id');
            }

            if (! Schema::hasColumn('users', 'password')) {
                $table->string('password')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'remember_token')) {
                $table->rememberToken();
            }

            if (! Schema::hasColumn('users', 'created_at') && ! Schema::hasColumn('users', 'updated_at')) {
                $table->timestamps();
            }
        });

        if (Schema::hasColumn('users', 'name') && Schema::hasColumn('users', 'username')) {
            DB::table('users')
                ->whereNull('username')
                ->update(['username' => DB::raw('name')]);
        }

        if (Schema::hasColumn('users', 'password_hash') && Schema::hasColumn('users', 'password')) {
            DB::table('users')
                ->whereNull('password')
                ->update(['password' => DB::raw('password_hash')]);
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
        });

        if (Schema::hasColumn('users', 'password_hash') && Schema::hasColumn('users', 'password')) {
            DB::table('users')
                ->whereNull('password_hash')
                ->update(['password_hash' => DB::raw('password')]);
        }
    }
};
