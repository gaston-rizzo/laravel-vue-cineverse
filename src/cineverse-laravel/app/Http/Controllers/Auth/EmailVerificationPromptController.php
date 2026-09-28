<?php

/* ============================================================================
 * CONTROLLER: EmailVerificationPromptController
 * ============================================================================
 *
 * Resuelve a qué pantalla debe ir un usuario autenticado cuando Laravel le
 * exige verificar su email.
 *
 * En lugar de mostrar una vista Blade de Breeze, redirige al flujo Vue/Inertia
 * de CineVerse respetando la pantalla de verificación del frontend.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationPromptController extends Controller
{
    /**
     * Si el email ya está verificado, envía al inicio de la app.
     * Si todavía falta verificarlo, envía a la pantalla Vue de verificación.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended('/es')
                    : redirect('/es/verify-email');
    }
}
