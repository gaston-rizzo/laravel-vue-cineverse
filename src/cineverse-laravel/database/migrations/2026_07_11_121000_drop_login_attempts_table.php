<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('login_attempts');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Laravel usa RateLimiter/cache para los intentos de login.
        // No recreamos la tabla legacy del backend PHP.
    }
};
