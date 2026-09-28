<?php

/* ============================================================================
 * CONTROLLER: VerifyEmailController.php
 * ============================================================================
 *
 * Controlador Breeze para confirmar emails verificados.
 *
 * Recibe el enlace firmado de Laravel, marca el email como verificado y devuelve
 * al usuario a la pantalla Vue/Inertia de verificacion.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    /**
     * Marca como verificado el email indicado por el link firmado.
     */
    public function __invoke(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        abort_unless(hash_equals($hash, sha1($user->getEmailForVerification())), 403);

        // Si ya estaba verificado, solo se devuelve al frontend.
        if ($user->hasVerifiedEmail()) {
            return redirect($this->verifiedRedirectUrl($request));
        }

        // Laravel marca el email y dispara el evento estandar Verified.
        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        // El usuario vuelve a la pantalla Vue con flag de exito.
        return redirect($this->verifiedRedirectUrl($request));
    }

    /**
     * Construye la URL final luego de verificar el email.
     */
    private function verifiedRedirectUrl(Request $request): string
    {
        // El link firmado puede traer lang para regresar al idioma correcto.
        $locale = $request->query('lang', app()->getLocale());

        // Se limita a los idiomas soportados por la SPA.
        $locale = in_array($locale, ['en', 'es'], true) ? $locale : 'en';

        return url("/{$locale}/verify-email?verified=1");
    }
}
