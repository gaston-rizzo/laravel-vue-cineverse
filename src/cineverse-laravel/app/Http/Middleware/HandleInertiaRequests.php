<?php

/* ============================================================================
 * MIDDLEWARE: HandleInertiaRequests.php
 * ============================================================================
 *
 * Middleware principal de Inertia.
 *
 * Define la vista raíz de la SPA y comparte props globales entre Laravel y Vue,
 * incluyendo el usuario autenticado.
 * ============================================================================ */

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * Vista Blade raíz que carga la aplicación Inertia.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Devuelve la versión actual de assets para Inertia.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Comparte props globales disponibles en todas las páginas Vue.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
        ];
    }
}
