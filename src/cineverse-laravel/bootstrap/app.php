<?php

/* ============================================================================
 * BOOTSTRAP: Laravel application
 * ============================================================================
 *
 * Archivo principal de arranque de Laravel.
 *
 * Define las rutas disponibles, registra middleware globales/de grupo y
 * agrupa el manejo de excepciones de la aplicacion.
 * ============================================================================ */

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Support\CineVerseLog;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))

    /* =========================================================================
     * ROUTING
     * -------------------------------------------------------------------------
     *
     * Registra los archivos de rutas usados por la aplicacion:
     * - web.php: rutas Inertia/Vue renderizadas por Laravel
     * - api.php: endpoints JSON consumidos por el frontend
     * - console.php: comandos Artisan propios
     * - /up: endpoint simple de health-check
     * ========================================================================= */
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    /* =========================================================================
     * MIDDLEWARE
     * -------------------------------------------------------------------------
     *
     * Extiende el grupo web con middleware necesarios para Inertia:
     * - HandleInertiaRequests: comparte props globales con Vue
     * - AddLinkHeadersForPreloadedAssets: optimiza precarga de assets Vite
     * ========================================================================= */
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
    })

    /* =========================================================================
     * EXCEPTIONS
     * -------------------------------------------------------------------------
     *
     * Personaliza respuestas de error para casos conocidos de la aplicacion.
     *
     * En desarrollo puede ocurrir que MySQL no este levantado. En vez de mostrar
     * el stack trace técnico de Laravel, se devuelve una respuesta 503 clara:
     * - JSON para requests API
     * - Vista HTML amigable para navegacion web
     * ========================================================================= */
    ->withExceptions(function (Exceptions $exceptions): void {

        // Reporte global de excepciones.
        // Laravel pasa por acá antes de renderizar la respuesta final.
        $exceptions->report(function (Throwable $exception): bool|null {

            // Caso conocido: MySQL no está disponible.
            // Aunque la respuesta al usuario será 503, conviene registrarlo
            // porque suele indicar un problema de entorno o servicio caído.
            $isDatabaseUnavailable = $exception instanceof QueryException
                && str_contains($exception->getMessage(), 'SQLSTATE[HY000] [2002]');

            // Error 500 real o inesperado.
            // Si no es una excepción HTTP conocida, Laravel la trata como error
            // interno. Si sí es HTTP, solo se registra cuando el status es 500.
            $isInternalServerError = (! $exception instanceof HttpExceptionInterface)
                || $exception->getStatusCode() === 500;

            // No se registran validaciones ni errores esperados como 404, 403,
            // 419 o 422. Este canal queda reservado para 500 y base caída.
            if ($exception instanceof ValidationException || (! $isDatabaseUnavailable && ! $isInternalServerError)) {
                return null;
            }

            // Se toma el request actual para sumar contexto útil al log.
            $request = request();
            $route = $request->route();
            $routeAction = optional($route)->getActionName();
            $controller = 'Application';
            $method = 'report';

            // Laravel guarda la acción de la ruta como Controller@method.
            // Se separa para que el log muestre datos parecidos al backend viejo.
            if (is_string($routeAction) && str_contains($routeAction, '@')) {
                [$controller, $method] = explode('@', $routeAction, 2);
                $controller = class_basename($controller);
            } elseif (app()->runningInConsole()) {
                // Errores generados desde Artisan/Tinker no tienen ruta HTTP.
                $controller = 'Console';
                $method = 'artisan';
            } elseif ($route !== null) {
                // Las rutas closure no tienen Controller@method.
                // Se identifica la ruta para que el origen no quede vacio.
                $controller = 'RouteClosure';
                $method = $request->method().' '.$route->uri();
            }

            // Se escribe en el canal propio de CineVerse con el mismo formato
            // compacto que usa el backend PHP viejo.
            CineVerseLog::error($exception->getMessage(), [
                'controller' => $controller,
                'method' => $method,
                'status' => $isDatabaseUnavailable ? 503 : 500,
                'user_id' => optional($request->user())->id,
                'email' => $request->input('email'),
                'username' => $request->input('username'),
                'movie_id' => $request->route('movieId') ?? $request->input('movie_id'),
            ]);

            // false evita que Laravel duplique este reporte en el canal default.
            return false;
        });

        $exceptions->render(function (QueryException $exception, Request $request) {

            /* =================================================================
             * DATABASE UNAVAILABLE
             * -----------------------------------------------------------------
             *
             * SQLSTATE[HY000] [2002] indica que Laravel no pudo conectarse a
             * MySQL. Si el error no corresponde a ese caso, se deja que Laravel
             * continue con su flujo normal de manejo de excepciones.
             * ================================================================= */
            if (! str_contains($exception->getMessage(), 'SQLSTATE[HY000] [2002]')) {
                return null;
            }

            /* =================================================================
             * API RESPONSE
             * -----------------------------------------------------------------
             *
             * Para endpoints JSON se conserva la estructura de respuesta de la API:
             * success/code/message + status HTTP 503.
             * ================================================================= */
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'code' => 'DATABASE_UNAVAILABLE',
                    'message' => 'La base de datos no esta disponible.',
                ], 503);
            }

            /* =================================================================
             * WEB RESPONSE
             * -----------------------------------------------------------------
             *
             * Para navegacion normal se muestra una pantalla simple y amigable
             * en lugar del error tecnico completo.
             * ================================================================= */
            return response()->view('errors.database', [], 503);
        });
    })->create();
