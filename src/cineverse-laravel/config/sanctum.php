<?php

/* ============================================================================
 * CONFIG: sanctum.php
 * ============================================================================
 *
 * Configuración de Laravel Sanctum.
 *
 * Permite autenticación SPA con estado mediante cookies de sesión y mantiene soporte
 * para tokens si el proyecto los necesitara más adelante.
 * ============================================================================ */

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;
use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Dominios con estado
    |--------------------------------------------------------------------------
    |
    | Los requests desde estos dominios pueden usar cookies de autenticación
    | stateful. Normalmente incluye localhost y dominios de producción de la SPA.
    |
    */

    // Dominios que pueden usar autenticación con estado mediante cookies.
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        Sanctum::currentApplicationUrlWithPort(),
        // Sanctum::currentRequestHost(),
    ))),

    /*
    |--------------------------------------------------------------------------
    | Guards de Sanctum
    |--------------------------------------------------------------------------
    |
    | Este array indica qué guards revisa Sanctum al autenticar un request. Si
    | ninguno autentica, Sanctum puede intentar usar un bearer token.
    |
    */

    // Sanctum intenta autenticar primero con el guard web de Laravel.
    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Minutos de expiración
    |--------------------------------------------------------------------------
    |
    | Este valor controla cuántos minutos dura válido un token emitido. Las
    | sesiones first-party por cookies no se ven afectadas.
    |
    */

    // El valor null mantiene tokens sin expiración global; las sesiones web no se afectan.
    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Prefijo de token
    |--------------------------------------------------------------------------
    |
    | Sanctum puede agregar un prefijo a tokens nuevos para facilitar detección
    | de secretos filtrados por herramientas de seguridad.
    |
    | See: https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning
    |
    */

    // Prefijo opcional para ayudar a detectar tokens filtrados.
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Middleware de Sanctum
    |--------------------------------------------------------------------------
    |
    | Para autenticar una SPA first-party, Sanctum usa estos middleware para
    | sesión, cookies y protección CSRF.
    |
    */

    // Middleware usados por Sanctum para cookies, sesión y CSRF.
    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => ValidateCsrfToken::class,
    ],

];
