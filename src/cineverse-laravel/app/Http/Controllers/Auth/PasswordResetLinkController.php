<?php

/* ============================================================================
 * CONTROLLER: PasswordResetLinkController.php
 * ============================================================================
 *
 * Controlador Breeze para solicitar restablecimiento de password.
 *
 * Valida el email y delega en el password broker de Laravel el envio del enlace
 * usando la notificacion personalizada de CineVerse.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\CineVerseLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

class PasswordResetLinkController extends Controller
{
    /**
     * Redirige a la pantalla Vue/Inertia de recuperacion de password.
     */
    public function create(): RedirectResponse
    {
        return redirect('/es/forgot-password');
    }

    /**
     * Procesa la solicitud de envio del enlace de reset.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        // Se normalizan los campos libres antes de pasar por validacion.
        $request->merge([
            'email' => is_string($request->input('email')) ? trim($request->input('email')) : $request->input('email'),
            'language' => is_string($request->input('language')) ? trim($request->input('language')) : $request->input('language'),
        ]);

        // Laravel valida formato y longitud maxima del email.
        $request->validate([
            'email' => 'required|email|max:80',
        ]);

        // Laravel envia el link mediante el password broker configurado.
        try {
            $status = Password::sendResetLink(
                $request->only('email')
            );
        } catch (Throwable $exception) {
            CineVerseLog::error(CineVerseLog::mailFailureMessage($exception), [
                'controller' => 'PasswordResetLinkController',
                'method' => 'store',
                'email' => $request->input('email'),
            ]);

            throw ValidationException::withMessages([
                'email' => __('auth.email_delivery_failed'),
            ]);
        }

        // El frontend Vue espera 204 cuando la solicitud JSON fue aceptada.
        if ($request->expectsJson() && $status == Password::RESET_LINK_SENT) {
            return response()->json(null, 204);
        }

        // Flujo web tradicional de Breeze: vuelve con mensaje de estado.
        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        // Si el broker no pudo enviar el mail, se devuelve error de validacion.
        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
