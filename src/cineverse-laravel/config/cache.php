<?php

/* ============================================================================
 * CONFIG: cache.php
 * ============================================================================
 *
 * Configuración de caché de Laravel.
 *
 * Define el store principal, stores disponibles y prefijo de claves para evitar
 * colisiones con otras aplicaciones.
 * ============================================================================ */

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Store de caché por defecto
    |--------------------------------------------------------------------------
    |
    | Esta opción define el store de caché que usa Laravel cuando el código no
    | especifica uno concreto.
    |
    */

    // Store de caché usado cuando el código no especifica uno concreto.
    'default' => env('CACHE_STORE', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Stores de caché
    |--------------------------------------------------------------------------
    |
    | Acá se definen los stores de caché disponibles y sus drivers. Se pueden
    | crear varios stores para separar distintos tipos de datos.
    |
    | Drivers soportados: "array", "database", "file", "memcached",
    |                    "redis", "dynamodb", "octane",
    |                    "failover", "null"
    |
    */

    // Stores soportados por Laravel para caché y locks.
    'stores' => [

        'array' => [
            'driver' => 'array',
            'serialize' => false,
        ],

        'database' => [
            'driver' => 'database',
            'connection' => env('DB_CACHE_CONNECTION'),
            'table' => env('DB_CACHE_TABLE', 'cache'),
            'lock_connection' => env('DB_CACHE_LOCK_CONNECTION'),
            'lock_table' => env('DB_CACHE_LOCK_TABLE'),
        ],

        'file' => [
            'driver' => 'file',
            'path' => storage_path('framework/cache/data'),
            'lock_path' => storage_path('framework/cache/data'),
        ],

        'memcached' => [
            'driver' => 'memcached',
            'persistent_id' => env('MEMCACHED_PERSISTENT_ID'),
            'sasl' => [
                env('MEMCACHED_USERNAME'),
                env('MEMCACHED_PASSWORD'),
            ],
            'options' => [
                // Memcached::OPT_CONNECT_TIMEOUT => 2000,
            ],
            'servers' => [
                [
                    'host' => env('MEMCACHED_HOST', '127.0.0.1'),
                    'port' => env('MEMCACHED_PORT', 11211),
                    'weight' => 100,
                ],
            ],
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => env('REDIS_CACHE_CONNECTION', 'cache'),
            'lock_connection' => env('REDIS_CACHE_LOCK_CONNECTION', 'default'),
        ],

        'dynamodb' => [
            'driver' => 'dynamodb',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            'table' => env('DYNAMODB_CACHE_TABLE', 'cache'),
            'endpoint' => env('DYNAMODB_ENDPOINT'),
        ],

        'octane' => [
            'driver' => 'octane',
        ],

        'failover' => [
            'driver' => 'failover',
            'stores' => [
                'database',
                'array',
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Prefijo de claves de caché
    |--------------------------------------------------------------------------
    |
    | Cuando varias aplicaciones comparten el mismo sistema de caché, el prefijo
    | evita colisiones entre claves.
    |
    */

    // Prefijo global para separar las claves de CineVerse de otros proyectos.
    'prefix' => env('CACHE_PREFIX', Str::slug((string) env('APP_NAME', 'laravel')).'-cache-'),

];
