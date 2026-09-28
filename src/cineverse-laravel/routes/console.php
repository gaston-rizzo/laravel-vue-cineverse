<?php

/* ============================================================================
 * ROUTES: console.php
 * ============================================================================
 *
 * Comandos Artisan propios del proyecto.
 *
 * Laravel permite registrar comandos simples desde este archivo para tareas de
 * consola. Actualmente se conserva el comando de ejemplo generado por Laravel.
 * ============================================================================ */

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

// Comando de ejemplo de Laravel: php artisan inspire.
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
