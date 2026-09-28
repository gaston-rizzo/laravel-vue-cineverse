<?php

/* ============================================================================
 * CONFIG: mail.php
 * ============================================================================
 *
 * Configuración de correo de Laravel.
 *
 * Define el servicio de correo principal, transportes disponibles y remitente global usado por
 * emails de verificación y restablecimiento de contraseña de CineVerse.
 * ============================================================================ */

return [

    /*
    |--------------------------------------------------------------------------
    | Servicio de correo por defecto
    |--------------------------------------------------------------------------
    |
    | Esta opción define el mailer usado por defecto para enviar correos, salvo
    | que el código indique otro mailer específico.
    |
    */

    // Servicio de correo usado por defecto para todos los correos.
    'default' => env('MAIL_MAILER', 'log'),

    /*
    |--------------------------------------------------------------------------
    | Configuración de mailers
    |--------------------------------------------------------------------------
    |
    | Acá se configuran los mailers disponibles y sus opciones. Se pueden sumar
    | otros según lo necesite la aplicación.
    |
    | Laravel soporta varios transportes para enviar emails. El transporte real
    | se elige desde MAIL_MAILER o desde el código.
    |
    | Soportados: "smtp", "sendmail", "mailgun", "ses", "ses-v2",
    |            "postmark", "resend", "log", "array",
    |            "failover", "roundrobin"
    |
    */

    // Transportes disponibles para enviar o simular emails.
    'mailers' => [

        // SMTP: usado para Gmail u otros servidores configurados en .env.
        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME'),
            'url' => env('MAIL_URL'),
            'host' => env('MAIL_HOST', '127.0.0.1'),
            'port' => env('MAIL_PORT', 2525),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'encryption' => env('MAIL_ENCRYPTION'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN', parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)),
        ],

        'ses' => [
            'transport' => 'ses',
        ],

        'postmark' => [
            'transport' => 'postmark',
            // 'message_stream_id' => env('POSTMARK_MESSAGE_STREAM_ID'),
            // 'client' => [
            //     'timeout' => 5,
            // ],
        ],

        'resend' => [
            'transport' => 'resend',
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => env('MAIL_SENDMAIL_PATH', '/usr/sbin/sendmail -bs -i'),
        ],

        // Registro: guarda emails en archivos de log, útil para desarrollo sin enviar correo real.
        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'smtp',
                'log',
            ],
            'retry_after' => 60,
        ],

        'roundrobin' => [
            'transport' => 'roundrobin',
            'mailers' => [
                'ses',
                'postmark',
            ],
            'retry_after' => 60,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Remitente global
    |--------------------------------------------------------------------------
    |
    | Acá se define el nombre y correo remitente usado globalmente por los
    | emails enviados desde la aplicación.
    |
    */

    // Remitente global visible en los correos enviados por CineVerse.
    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', env('APP_NAME', 'Laravel')),
    ],

];
