<?php

/* ============================================================================
 * SUPPORT: CineVerseLog.php
 * ============================================================================
 *
 * Helper central para escribir errores personalizados de CineVerse.
 *
 * Mantiene el log personalizado con un formato corto y legible, separado del
 * laravel.log normal.
 *
 * Ejemplo del formato final en el archivo:
 *
 * [2026-07-24 18:49:02] ERROR: SMTP Error: Could not authenticate.
 * {
 *     "controller": "RegisteredUserController",
 *     "method": "store",
 *     "username": "vero",
 *     "email": "ggr104@gmail.com"
 * }
 *
 * La fecha, la hora y el nivel ERROR los agrega el formatter del canal.
 * Esta clase agrega el mensaje principal y, si existe, el bloque JSON de contexto.
 * ============================================================================
 */

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Throwable;

final class CineVerseLog
{
    /**
     * Registra un error en el log personalizado de CineVerse.
     *
     * El mensaje queda en la primera linea.
     * El contexto opcional queda abajo como JSON, para que sea facil de leer.
     */
    public static function error(string $message, array $context = []): void
    {
        // Usa solamente el canal propio de CineVerse; no escribe este formato en laravel.log.
        Log::channel('cineverse_unexpected')->error(
            // Une el mensaje con el JSON ya formateado.
            // Si no hay contexto, formatContext() devuelve texto vacio.
            $message.self::formatContext($context)
        );
    }

    /**
     * Convierte errores tecnicos del mailer en mensajes cortos para el log.
     *
     * Evita guardar el texto enorme de Symfony/Laravel con todos los intentos SMTP.
     * Asi el log conserva el mismo estilo compacto que el backend viejo.
     */
    public static function mailFailureMessage(Throwable $exception): string
    {
        // Se pasa a minusculas para detectar el tipo de fallo sin depender del casing.
        $message = strtolower($exception->getMessage());

        // Fallo tipico cuando el usuario o password SMTP son incorrectos.
        if (str_contains($message, 'authenticat')) {
            return 'SMTP Error: Could not authenticate.';
        }

        // Fallo tipico cuando no se puede llegar al servidor SMTP.
        if (str_contains($message, 'connect')) {
            return 'SMTP Error: Could not connect to SMTP host.';
        }

        // Mensaje generico si el error no encaja en los casos anteriores.
        return 'Email delivery failed.';
    }

    /**
     * Prepara el bloque JSON que acompaña al mensaje principal del error.
     *
     * Recibe datos como controller, method, username, email, status o movie_id.
     * Devuelve una linea nueva + JSON bonito, o texto vacio si no hay datos utiles.
     */
    private static function formatContext(array $context): string
    {
        // Elimina claves con valor null para que el log no se llene de campos vacios.
        $context = array_filter(
            $context,
            static fn (mixed $value): bool => $value !== null
        );

        // Si no quedo ningun dato util, el log queda solamente con el mensaje.
        if ($context === []) {
            return '';
        }

        // JSON_PRETTY_PRINT deja cada dato en su propia linea.
        // JSON_UNESCAPED_UNICODE mantiene acentos y eñes legibles.
        // JSON_UNESCAPED_SLASHES evita barras escapadas innecesarias en URLs o rutas.
        return "\n".json_encode(
            $context,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        );
    }
}
