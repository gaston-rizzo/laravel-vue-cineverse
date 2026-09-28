<?php

/* ============================================================================
 * CONTROLLER: AuthenticatedSessionController.php
 * ============================================================================
 *
 * Controlador Breeze para sesiones autenticadas.
 *
 * Atiende login y logout reales de Laravel. Cuando el request viene desde Vue,
 * responde JSON; cuando viene de una navegación web normal, devuelve redirects
 * HTTP clásicos como los que usa Breeze por defecto.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * Redirige a la pantalla Vue/Inertia de login.
     */
    public function create(): RedirectResponse
    {
        return redirect('/es/login');
    }

    /**
     * Procesa el login y crea la sesión autenticada.
     */
    public function store(LoginRequest $request): RedirectResponse|JsonResponse
    {
        // LoginRequest se encarga de validar credenciales, aplicar rate limit
        // y autenticar al usuario con el sistema Auth de Laravel.
        $request->authenticate();

        // Laravel rota el id de sesión luego de autenticar.
        $request->session()->regenerate();

        // El frontend Vue espera una respuesta vacia cuando el login fue OK.
        if ($request->expectsJson()) {
            return response()->json(null, 204);
        }

        // Fallback web tradicional de Breeze.
        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Cierra la sesión autenticada actual.
     */
    public function destroy(Request $request): RedirectResponse|JsonResponse
    {
        // Cierra la sesión del guard web.
        Auth::guard('web')->logout();

        // Inválida la sesión previa para evitar reutilización.
        $request->session()->invalidate();

        // Regenera el token CSRF para invalidar el token asociado a la sesión
        // cerrada y evitar que pueda reutilizarse en requests posteriores.
        $request->session()->regenerateToken();

        // Vue/Inertia solo necesita saber que el logout termino bien.
        if ($request->expectsJson()) {
            return response()->json(null, 204);
        }

        // Fallback web tradicional.
        return redirect('/');
    }
}
