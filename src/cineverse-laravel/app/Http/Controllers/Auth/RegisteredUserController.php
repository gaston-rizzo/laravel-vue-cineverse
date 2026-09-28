<?php

/* ============================================================================
 * CONTROLLER: RegisteredUserController.php
 * ============================================================================
 *
 * Controlador Breeze para registro de usuarios.
 *
 * Valida username, email y password con reglas Laravel, crea el usuario
 * estandar y dispara el flujo de verificacion de email.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\CineVerseLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Throwable;

class RegisteredUserController extends Controller
{
    /**
     * Redirige a la pantalla Vue/Inertia de registro.
     */
    public function create(): RedirectResponse
    {
        return redirect('/es/register');
    }

    /**
     * Procesa el registro de un nuevo usuario.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        // Se normalizan campos antes de validar unicidad y formato.
        $request->merge([
            'username' => $this->trimString($request->input('username')),
            'email' => $this->trimString($request->input('email')),
            'language' => $this->trimString($request->input('language')),
        ]);

        // Reglas reales de Laravel/Breeze adaptadas a CineVerse.
        $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:20', 'regex:/^[A-Za-z0-9_]+$/', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:80', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Se crea el usuario con columnas estandar de Laravel.
        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Envia el correo de verificacion directamente desde el modelo.
        // Asi cualquier fallo SMTP queda dentro de este try/catch y se registra.
        try {
            $user->sendEmailVerificationNotification();
        } catch (Throwable $exception) {
            CineVerseLog::error(CineVerseLog::mailFailureMessage($exception), [
                'controller' => 'RegisteredUserController',
                'method' => 'store',
                'username' => $user->username,
                'email' => $user->email,
            ]);

            $user->delete();

            throw ValidationException::withMessages([
                'email' => __('auth.email_delivery_failed'),
            ]);
        }

        // Vue/Inertia recibe 204 para mostrar la pantalla "revisa tu correo".
        if ($request->expectsJson()) {
            return response()->json(null, 204);
        }

        // Fallback web tradicional.
        return redirect('/es/verify-email');
    }

    /**
     * Normaliza valores string recibidos por el formulario.
     */
    private function trimString(mixed $value): mixed
    {
        return is_string($value) ? trim($value) : $value;
    }
}
