<?php

/* ============================================================================
 * CONFIG: logging.php
 * ============================================================================
 *
 * Define los logs de CineVerse.
 *
 * El log personalizado guarda errores 500, base de datos caida y fallos de
 * correo con formato corto.
 *
 * La carpeta se configura con CINEVERSE_LOG_PATH.
 * ============================================================================ */

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Handler\SyslogUdpHandler;
use Monolog\Processor\PsrLogMessageProcessor;

// Carpeta donde se guardara el log personalizado de CineVerse.
// Se configura desde .env con CINEVERSE_LOG_PATH.
$cineverseLogPath = env('CINEVERSE_LOG_PATH');

if (is_string($cineverseLogPath) && $cineverseLogPath !== '') {
    // Permite dos formas:
    // - Ruta absoluta: C:/logs/cineverse o /var/log/cineverse.
    // - Ruta relativa: storage/logs, tomando como base la raiz del proyecto.
    $isAbsoluteCineVerseLogPath = preg_match('/^(?:[A-Za-z]:[\\\\\/]|[\\\\\/])/', $cineverseLogPath) === 1;
    $cineverseLogPath = $isAbsoluteCineVerseLogPath ? $cineverseLogPath : base_path($cineverseLogPath);
} else {
    // Si no se define CINEVERSE_LOG_PATH, se usa la carpeta default de Laravel.
    $cineverseLogPath = storage_path('logs');
}

// Nombre base del archivo. Como el canal usa driver daily, Laravel lo guarda
// finalmente como cineverse-backend-YYYY-MM-DD.log.
$cineverseLogPath = rtrim($cineverseLogPath, "\\/").DIRECTORY_SEPARATOR.'cineverse-backend.log';

return [

    /*
    |--------------------------------------------------------------------------
    | Canal de logs por defecto
    |--------------------------------------------------------------------------
    |
    | Esta opción define el canal usado por defecto para escribir logs. Debe
    | coincidir con uno de los canales configurados debajo.
    |
    */

    // Canal usado por defecto cuando la aplicación escribe registros.
    'default' => env('LOG_CHANNEL', 'stack'),

    /*
    |--------------------------------------------------------------------------
    | Canal de logs para deprecaciones
    |--------------------------------------------------------------------------
    |
    | Esta opción define dónde registrar advertencias por funciones o librerías
    | deprecadas, útil para preparar actualizaciones futuras.
    |
    */

    // Canal dedicado a avisos de deprecaciones de PHP o dependencias.
    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace' => env('LOG_DEPRECATIONS_TRACE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Canales de logs
    |--------------------------------------------------------------------------
    |
    | Acá se configuran los canales de logs de la aplicación. Laravel usa
    | Monolog para escribir en archivos, servicios externos o salida estándar.
    |
    | Drivers disponibles: "single", "daily", "slack", "syslog",
    |                    "errorlog", "monolog", "custom", "stack"
    |
    */

    // Canales disponibles para escribir registros en archivos, servicios o salida estándar.
    'channels' => [

        // Stack permite combinar varios canales en una sola salida lógica.
        'stack' => [
            'driver' => 'stack',
            'channels' => explode(',', (string) env('LOG_STACK', 'single')),
            'ignore_exceptions' => false,
        ],

        // Archivo único de registro, útil para desarrollo local.
        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        // Registros rotados por día para evitar archivos demasiado grandes.
        'daily' => [
            'driver' => 'daily',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
            'days' => env('LOG_DAILY_DAYS', 14),
            'replace_placeholders' => true,
        ],

        // Canal propio de CineVerse para errores inesperados:
        // 500 = error interno del servidor por una excepcion no controlada.
        // 503 = servicio no disponible; aca se usa cuando la base de datos esta caida.
        // 422 = error controlado de formulario; aca se registra si falla el envio de mail.
        'cineverse_unexpected' => [
            // daily crea un archivo por dia. Laravel agrega la fecha al nombre:
            // cineverse-backend.log -> cineverse-backend-YYYY-MM-DD.log.
            'driver' => 'daily',

            // Archivo base del log. La carpeta viene de CINEVERSE_LOG_PATH.
            'path' => $cineverseLogPath,

            // Solo se escriben errores. Info/debug/warning no entran en este log.
            'level' => 'error',

            // Conserva hasta 30 archivos diarios y elimina los mas antiguos.
            'days' => 30,

            // Aplica el formato corto propio de CineVerse:
            // [fecha] ERROR: mensaje + JSON legible, sin stacktrace gigante.
            'tap' => [App\Logging\CineVerseLogFormatter::class],

            // Permite que Monolog reemplace placeholders en mensajes/contexto.
            'replace_placeholders' => true,
        ],

        'slack' => [
            'driver' => 'slack',
            'url' => env('LOG_SLACK_WEBHOOK_URL'),
            'username' => env('LOG_SLACK_USERNAME', env('APP_NAME', 'Laravel')),
            'emoji' => env('LOG_SLACK_EMOJI', ':boom:'),
            'level' => env('LOG_LEVEL', 'critical'),
            'replace_placeholders' => true,
        ],

        'papertrail' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => env('LOG_PAPERTRAIL_HANDLER', SyslogUdpHandler::class),
            'handler_with' => [
                'host' => env('PAPERTRAIL_URL'),
                'port' => env('PAPERTRAIL_PORT'),
                'connectionString' => 'tls://'.env('PAPERTRAIL_URL').':'.env('PAPERTRAIL_PORT'),
            ],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'stderr' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => StreamHandler::class,
            'handler_with' => [
                'stream' => 'php://stderr',
            ],
            'formatter' => env('LOG_STDERR_FORMATTER'),
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'syslog' => [
            'driver' => 'syslog',
            'level' => env('LOG_LEVEL', 'debug'),
            'facility' => env('LOG_SYSLOG_FACILITY', LOG_USER),
            'replace_placeholders' => true,
        ],

        'errorlog' => [
            'driver' => 'errorlog',
            'level' => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        'null' => [
            'driver' => 'monolog',
            'handler' => NullHandler::class,
        ],

        'emergency' => [
            'path' => storage_path('logs/laravel.log'),
        ],

    ],

];
