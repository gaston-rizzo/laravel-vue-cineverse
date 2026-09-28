<?php

/* ============================================================================
 * CONFIG: queue.php
 * ============================================================================
 *
 * Configuración de colas de Laravel.
 *
 * Define la conexión principal, backends disponibles, lotes de jobs y registro
 * de trabajos fallidos.
 * ============================================================================ */

return [

    /*
    |--------------------------------------------------------------------------
    | Conexión de cola por defecto
    |--------------------------------------------------------------------------
    |
    | Las colas de Laravel soportan varios backends con una API común. Debajo
    | se define qué conexión se usa por defecto.
    |
    */

    // Conexión usada por defecto para despachar jobs.
    'default' => env('QUEUE_CONNECTION', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Conexiones de cola
    |--------------------------------------------------------------------------
    |
    | Acá se configuran los backends de cola disponibles. Cada uno puede usarse
    | para procesar jobs de forma inmediata, en base de datos o servicios externos.
    |
    | Drivers: "sync", "database", "beanstalkd", "sqs", "redis",
    |          "deferred", "background", "failover", "null"
    |
    */

    // Backends disponibles para ejecutar trabajos en cola.
    'connections' => [

        // Ejecuta jobs inmediatamente en el mismo request.
        'sync' => [
            'driver' => 'sync',
        ],

        // Guarda jobs en base de datos para procesarlos con workers.
        'database' => [
            'driver' => 'database',
            'connection' => env('DB_QUEUE_CONNECTION'),
            'table' => env('DB_QUEUE_TABLE', 'jobs'),
            'queue' => env('DB_QUEUE', 'default'),
            'retry_after' => (int) env('DB_QUEUE_RETRY_AFTER', 90),
            'after_commit' => false,
        ],

        'beanstalkd' => [
            'driver' => 'beanstalkd',
            'host' => env('BEANSTALKD_QUEUE_HOST', 'localhost'),
            'queue' => env('BEANSTALKD_QUEUE', 'default'),
            'retry_after' => (int) env('BEANSTALKD_QUEUE_RETRY_AFTER', 90),
            'block_for' => 0,
            'after_commit' => false,
        ],

        'sqs' => [
            'driver' => 'sqs',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'prefix' => env('SQS_PREFIX', 'https://sqs.us-east-1.amazonaws.com/your-account-id'),
            'queue' => env('SQS_QUEUE', 'default'),
            'suffix' => env('SQS_SUFFIX'),
            'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
            'after_commit' => false,
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => env('REDIS_QUEUE_CONNECTION', 'default'),
            'queue' => env('REDIS_QUEUE', 'default'),
            'retry_after' => (int) env('REDIS_QUEUE_RETRY_AFTER', 90),
            'block_for' => null,
            'after_commit' => false,
        ],

        'deferred' => [
            'driver' => 'deferred',
        ],

        'background' => [
            'driver' => 'background',
        ],

        'failover' => [
            'driver' => 'failover',
            'connections' => [
                'database',
                'deferred',
            ],
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Lotes de jobs
    |--------------------------------------------------------------------------
    |
    | Estas opciones definen la base y tabla donde Laravel guarda información
    | de batches de jobs.
    |
    */

    // Tablas usadas cuando Laravel agrupa jobs en batches.
    'batching' => [
        'database' => env('DB_CONNECTION', 'sqlite'),
        'table' => 'job_batches',
    ],

    /*
    |--------------------------------------------------------------------------
    | Jobs fallidos
    |--------------------------------------------------------------------------
    |
    | Estas opciones definen cómo y dónde se registran los jobs que fallan.
    | Laravel puede guardarlos en archivo, base de datos u otros drivers.
    |
    | Drivers soportados: "database-uuids", "dynamodb", "file", "null"
    |
    */

    // Configuración del registro de jobs fallidos.
    'failed' => [
        'driver' => env('QUEUE_FAILED_DRIVER', 'database-uuids'),
        'database' => env('DB_CONNECTION', 'sqlite'),
        'table' => 'failed_jobs',
    ],

];
