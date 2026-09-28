<?php

/* ============================================================================
 * CONFIG: app.php
 * ============================================================================
 *
 * Configuración principal de la aplicación Laravel.
 *
 * Define nombre, entorno, URL, idioma, zona horaria, clave de cifrado y modo
 * mantenimiento usados por todo CineVerse.
 * ============================================================================ */

return [

    /*
    |--------------------------------------------------------------------------
    | Nombre de la aplicación
    |--------------------------------------------------------------------------
    |
    | Este valor es el nombre de la aplicación. Laravel lo usa cuando necesita
    | mostrar el nombre del proyecto en notificaciones, mensajes o elementos
    | de interfaz generados por el framework.
    |
    */

    // Nombre visible de la aplicación en notificaciones y mensajes del sistema.
    'name' => env('APP_NAME', 'Laravel'),

    /*
    |--------------------------------------------------------------------------
    | Entorno de la aplicación
    |--------------------------------------------------------------------------
    |
    | Este valor indica en qué entorno corre la aplicación. Sirve para separar
    | configuraciones de local, testing o producción. Se define desde .env.
    |
    */

    // Entorno actual: local, production, testing, etc.
    'env' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Modo debug de la aplicación
    |--------------------------------------------------------------------------
    |
    | Cuando debug está activo, Laravel muestra errores detallados con stack
    | trace. En producción debe estar desactivado para no exponer información
    | interna.
    |
    */

    // En local muestra errores detallados; en producción debe estar apagado.
    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | URL de la aplicación
    |--------------------------------------------------------------------------
    |
    | Esta URL se usa para generar enlaces absolutos desde consola, jobs o
    | comandos Artisan. Debe apuntar a la raíz pública de la aplicación.
    |
    */

    // URL base usada por Artisan y por generación de enlaces absolutos.
    'url' => env('APP_URL', 'http://localhost'),

    /*
    |--------------------------------------------------------------------------
    | Zona horaria de la aplicación
    |--------------------------------------------------------------------------
    |
    | Define la zona horaria base que usan Laravel y PHP para fechas y horas.
    | UTC es el valor estándar recomendado para la mayoría de los sistemas.
    |
    */

    // Zona horaria base usada por PHP/Laravel para fechas.
    'timezone' => 'America/Argentina/Buenos_Aires',

    /*
    |--------------------------------------------------------------------------
    | Configuración de idioma de la aplicación
    |--------------------------------------------------------------------------
    |
    | El locale define el idioma por defecto que usan las traducciones de
    | Laravel. Debe coincidir con los idiomas disponibles en la carpeta lang.
    |
    */

    // Idioma principal usado por traducciones Laravel.
    'locale' => env('APP_LOCALE', 'en'),

    // Idioma de respaldo cuando no existe una traducción específica.
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    // Idioma usado por Faker en factories y datos de prueba.
    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
    |--------------------------------------------------------------------------
    | Clave de cifrado
    |--------------------------------------------------------------------------
    |
    | Esta clave la usan los servicios de cifrado de Laravel. Debe ser aleatoria
    | y estar configurada antes de desplegar la aplicación.
    |
    */

    // Algoritmo usado por el servicio de cifrado de Laravel.
    'cipher' => 'AES-256-CBC',

    // Clave de cifrado principal; debe venir desde .env.
    'key' => env('APP_KEY'),

    // Permite rotar claves manteniendo compatibilidad con datos cifrados previos.
    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Driver de modo mantenimiento
    |--------------------------------------------------------------------------
    |
    | Estas opciones definen cómo Laravel guarda el estado de modo mantenimiento.
    | El driver cache permite coordinarlo entre varios servidores.
    |
    | Drivers soportados: "file", "cache"
    |
    */

    // Configuración del modo mantenimiento de Laravel.
    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

];
