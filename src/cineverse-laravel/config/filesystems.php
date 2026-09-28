<?php

/* ============================================================================
 * CONFIG: filesystems.php
 * ============================================================================
 *
 * Configuración de almacenamiento de archivos.
 *
 * Define discos locales, públicos y S3 para que Laravel pueda leer, escribir y
 * exponer archivos desde una API común.
 * ============================================================================ */

return [

    /*
    |--------------------------------------------------------------------------
    | Disco de archivos por defecto
    |--------------------------------------------------------------------------
    |
    | Acá se define el disco que Laravel usa por defecto para leer y escribir
    | archivos. Puede ser local, público o remoto.
    |
    */

    // Disco usado por defecto cuando no se especifica otro.
    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Discos de archivos
    |--------------------------------------------------------------------------
    |
    | Debajo se configuran los discos disponibles. Cada disco define dónde se
    | guardan archivos y qué driver usa Laravel para accederlos.
    |
    | Drivers soportados: "local", "ftp", "sftp", "s3"
    |
    */

    // Discos disponibles para storage local, público o cloud.
    'disks' => [

        // Disco privado dentro de storage/app/private.
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        // Disco público que puede exponerse con php artisan storage:link.
        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        // Disco S3 opcional para archivos en cloud.
        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Enlaces simbólicos
    |--------------------------------------------------------------------------
    |
    | Acá se configuran los enlaces simbólicos creados por storage:link. La
    | clave es la ruta pública y el valor es la carpeta real en storage.
    |
    */

    // Symlinks creados por el comando storage:link.
    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
