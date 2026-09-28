<?php

/* ============================================================================
 * CONTROLLER: EmailVerificationNotificationController
 * ============================================================================
 *
 * Reenvía el correo de verificación de cuenta para usuarios autenticados.
 *
 * Mantiene el comportamiento Breeze/Laravel, pero responde correctamente tanto
 * al flujo web tradicional como al frontend Vue que consume respuestas JSON.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\CineVerseLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Si el usuario ya verificó su email, finaliza sin reenviar nada.
     * Si todavía no lo verificó, dispara la notificación configurada en el
     * modelo User y devuelve una respuesta compatible con web/API.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        // Si ya esta verificado, no se vuelve a enviar el mail.
        if ($request->user()->hasVerifiedEmail()) {
            // Vue/Inertia espera una respuesta vacia para cerrar el flujo.
            if ($request->expectsJson()) {
                return response()->json(null, 204);
            }

            // Fallback web tradicional de Breeze.
            return redirect()->intended(route('dashboard', absolute: false));
        }

        // El modelo User decide que notificacion personalizada se envia.
        try {
            $request->user()->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            CineVerseLog::error(CineVerseLog::mailFailureMessage($exception), [
                'controller' => 'EmailVerificationNotificationController',
                'method' => 'store',
                'user_id' => $request->user()->id,
                'username' => $request->user()->username,
                'email' => $request->user()->email,
            ]);

            throw ValidationException::withMessages([
                'email' => __('auth.email_delivery_failed'),
            ]);
        }

        // Respuesta JSON para el frontend Vue.
        if ($request->expectsJson()) {
            return response()->json(null, 204);
        }

        // Fallback web tradicional con status de Breeze.
        return back()->with('status', 'verification-link-sent');
    }
}
