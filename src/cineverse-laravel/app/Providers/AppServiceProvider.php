<?php

/* ============================================================================
 * PROVIDER: AppServiceProvider.php
 * ============================================================================
 *
 * Registra la configuración global de la aplicación Laravel.
 *
 * Agrupa reglas compartidas, ajustes de arranque y configuración base que
 * debe quedar disponible para todo el backend.
 * ============================================================================ */

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Registra servicios propios de la aplicación.
     */
    public function register(): void
    {
        //
    }

    /**
     * Configura reglas globales de password y precarga de assets Vite.
     */
    public function boot(): void
    {
        Password::defaults(fn () => Password::min(8)
            ->max(32)
            ->mixedCase()
            ->numbers()
            ->symbols());

        Vite::prefetch(concurrency: 3);
    }
}
