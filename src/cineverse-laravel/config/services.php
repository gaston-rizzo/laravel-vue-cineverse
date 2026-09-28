<?php

/* ============================================================================
 * CONFIG: services.php
 * ============================================================================
 *
 * Configuración de credenciales para servicios externos.
 *
 * Laravel agrupa acá proveedores de terceros para que servicios de correo,
 * notificaciones y paquetes puedan leer sus claves desde variables de entorno.
 * ============================================================================ */

return [

    /*
    |--------------------------------------------------------------------------
    | Servicios de terceros
    |--------------------------------------------------------------------------
    |
    | Este archivo guarda credenciales de proveedores externos como Postmark,
    | Resend, AWS SES o Slack. Las claves reales deben vivir en .env y Laravel
    | solo las referencia desde acá mediante env().
    |
    */

    // Credenciales para enviar emails mediante Postmark.
    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    // Credenciales para enviar emails mediante Resend.
    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    // Credenciales de AWS SES para envío de emails.
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Configuración opcional para notificaciones por Slack.
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
