<?php

/* ============================================================================
 * CONFIG: session.php
 * ============================================================================
 *
 * Configuración de sesiones de Laravel.
 *
 * Controla dónde se guardan las sesiones, duración, cookie, seguridad HTTPS,
 * SameSite y opciones necesarias para la autenticación web de CineVerse.
 * ============================================================================ */

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Driver de sesión por defecto
    |--------------------------------------------------------------------------
    |
    | Esta opción define dónde guarda Laravel los datos de sesión de los
    | requests entrantes.
    |
    | Soportados: "file", "cookie", "database", "memcached",
    |            "redis", "dynamodb", "array"
    |
    */

    // Driver principal donde Laravel persiste los datos de sesión.
    'driver' => env('SESSION_DRIVER', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Duración de sesión
    |--------------------------------------------------------------------------
    |
    | Acá se define cuántos minutos puede quedar inactiva una sesión antes de
    | expirar. También se puede hacer que expire al cerrar el navegador.
    |
    */

    // Minutos de inactividad antes de expirar la sesión.
    'lifetime' => (int) env('SESSION_LIFETIME', 120),

    // Si está activo, la sesión expira al cerrar el navegador.
    'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', false),

    /*
    |--------------------------------------------------------------------------
    | Cifrado de sesión
    |--------------------------------------------------------------------------
    |
    | Esta opción indica si Laravel cifra los datos de sesión antes de guardarlos.
    | El uso de sesión no cambia para el resto de la aplicación.
    |
    */

    // Indica si Laravel cifra todos los datos de sesión almacenados.
    'encrypt' => env('SESSION_ENCRYPT', false),

    /*
    |--------------------------------------------------------------------------
    | Ubicación de archivos de sesión
    |--------------------------------------------------------------------------
    |
    | Cuando se usa el driver file, las sesiones se guardan en disco. Esta ruta
    | indica dónde se almacenan.
    |
    */

    // Ruta usada cuando el driver de sesión es file.
    'files' => storage_path('framework/sessions'),

    /*
    |--------------------------------------------------------------------------
    | Conexión de base para sesiones
    |--------------------------------------------------------------------------
    |
    | Cuando se usa database o redis, esta opción indica qué conexión administra
    | los datos de sesión.
    |
    */

    // Conexión usada por drivers database o redis.
    'connection' => env('SESSION_CONNECTION'),

    /*
    |--------------------------------------------------------------------------
    | Tabla de sesiones
    |--------------------------------------------------------------------------
    |
    | Cuando se usa el driver database, esta tabla guarda las sesiones.
    |
    */

    // Tabla usada cuando las sesiones se guardan en base de datos.
    'table' => env('SESSION_TABLE', 'sessions'),

    /*
    |--------------------------------------------------------------------------
    | Store de caché para sesiones
    |--------------------------------------------------------------------------
    |
    | Cuando un backend de sesión usa caché, esta opción define qué store guarda
    | los datos entre requests.
    |
    | Afecta a: "dynamodb", "memcached", "redis"
    |
    */

    // Store de caché usado por drivers de sesión basados en caché.
    'store' => env('SESSION_STORE'),

    /*
    |--------------------------------------------------------------------------
    | Limpieza aleatoria de sesiones
    |--------------------------------------------------------------------------
    |
    | Algunos drivers deben limpiar sesiones viejas manualmente. Esta probabilidad
    | define cuándo se ejecuta esa limpieza durante un request.
    |
    */

    // Probabilidad de limpiar sesiones vencidas en cada request.
    'lottery' => [2, 100],

    /*
    |--------------------------------------------------------------------------
    | Nombre de la cookie de sesión
    |--------------------------------------------------------------------------
    |
    | Acá se puede cambiar el nombre de la cookie de sesión. Normalmente no hace
    | falta cambiarlo.
    |
    */

    // Nombre de la cookie de sesión enviada al navegador.
    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug((string) env('APP_NAME', 'laravel')).'-session'
    ),

    /*
    |--------------------------------------------------------------------------
    | Path de la cookie de sesión
    |--------------------------------------------------------------------------
    |
    | El path define para qué rutas del sitio está disponible la cookie.
    |
    */

    // Path donde la cookie de sesión es válida.
    'path' => env('SESSION_PATH', '/'),

    /*
    |--------------------------------------------------------------------------
    | Dominio de la cookie de sesión
    |--------------------------------------------------------------------------
    |
    | Este valor define en qué dominio y subdominios está disponible la cookie.
    |
    */

    // Dominio donde la cookie de sesión es válida.
    'domain' => env('SESSION_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Cookies solo por HTTPS
    |--------------------------------------------------------------------------
    |
    | Si está activo, la cookie de sesión solo se envía por conexiones HTTPS.
    |
    */

    // Si está activo, la cookie solo viaja por HTTPS.
    'secure' => env('SESSION_SECURE_COOKIE'),

    /*
    |--------------------------------------------------------------------------
    | Acceso solo por HTTP
    |--------------------------------------------------------------------------
    |
    | Si está activo, JavaScript no puede leer la cookie. Esto ayuda a proteger
    | la sesión ante ataques XSS.
    |
    */

    // Evita que JavaScript pueda leer la cookie de sesión.
    'http_only' => env('SESSION_HTTP_ONLY', true),

    /*
    |--------------------------------------------------------------------------
    | Cookies SameSite
    |--------------------------------------------------------------------------
    |
    | Esta opción define cómo se comportan las cookies en requests cross-site y
    | ayuda a mitigar ataques CSRF.
    |
    | See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesite-value
    |
    | Soportados: "lax", "strict", "none", null
    |
    */

    // Controla comportamiento cross-site de cookies para mitigar CSRF.
    'same_site' => env('SESSION_SAME_SITE', 'lax'),

    /*
    |--------------------------------------------------------------------------
    | Cookies particionadas
    |--------------------------------------------------------------------------
    |
    | Si está activo, la cookie queda ligada al sitio principal en contextos
    | cross-site. Requiere secure y SameSite en none.
    |
    */

    // Soporte opcional para cookies particionadas en contextos cross-site.
    'partitioned' => env('SESSION_PARTITIONED_COOKIE', false),

];
