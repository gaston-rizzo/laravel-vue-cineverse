<?php

/* ============================================================================
 * CONFIG: auth.php
 * ============================================================================
 *
 * Configuración de autenticación de Laravel/Breeze.
 *
 * Define guard, proveedor de usuarios, broker de restablecimiento de contraseña
 * y tiempo de confirmación de password para CineVerse.
 * ============================================================================ */

use App\Models\User;

return [

    /*
    |--------------------------------------------------------------------------
    | Valores por defecto de autenticación
    |--------------------------------------------------------------------------
    |
    | Esta opción define el guard de autenticación y el broker de recuperación
    | de contraseña usados por defecto por Laravel.
    |
    */

    // Guard y broker por defecto usados por Breeze.
    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Guards de autenticación
    |--------------------------------------------------------------------------
    |
    | Acá se definen los guards de autenticación disponibles. El guard web usa
    | sesiones y el provider Eloquent de usuarios.
    |
    | Cada guard usa un provider para saber cómo recuperar usuarios desde la
    | base de datos u otro almacenamiento.
    |
    | Soportado: "session"
    |
    */

    // Guard web basado en sesión: el login real usa cookies de Laravel.
    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Providers de usuarios
    |--------------------------------------------------------------------------
    |
    | Los providers definen cómo Laravel obtiene usuarios reales para login,
    | sesiones y recuperación de contraseña.
    |
    | Si existieran varias tablas o modelos de usuario, se podrían definir
    | providers adicionales y asignarlos a guards específicos.
    |
    | Soportados: "database", "eloquent"
    |
    */

    // Proveedor Eloquent que resuelve usuarios desde App\Models\User.
    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => env('AUTH_MODEL', User::class),
        ],

        // 'users' => [
        //     'driver' => 'database',
        //     'table' => 'users',
        // ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Restablecimiento de contraseñas
    |--------------------------------------------------------------------------
    |
    | Estas opciones definen cómo funciona el reset de contraseña de Laravel:
    | tabla de tokens, provider de usuarios y expiración.
    |
    | El tiempo de expiración indica cuántos minutos dura válido cada token.
    | Mantenerlo corto reduce el riesgo de abuso.
    |
    | El throttle define cuántos segundos debe esperar el usuario antes de
    | pedir otro token de recuperación.
    |
    */

    // Broker encargado de tokens y expiración para recuperar contraseña.
    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tiempo de confirmación de contraseña
    |--------------------------------------------------------------------------
    |
    | Define cuántos segundos dura una confirmación de contraseña antes de pedir
    | que el usuario vuelva a ingresar su password.
    |
    */

    // Tiempo de validez de confirmación de password para acciones sensibles.
    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
