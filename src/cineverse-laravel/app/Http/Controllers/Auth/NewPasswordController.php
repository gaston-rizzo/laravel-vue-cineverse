<?php

/* ============================================================================
 * CONTROLLER: NewPasswordController.php
 * ============================================================================
 *
 * Controlador Breeze para confirmar un nuevo password.
 *
 * Valida token, email y password, y delega en el password broker de Laravel la
 * actualizacion segura de credenciales.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class NewPasswordController extends Controller
{
    /**
     * Redirige a la pantalla Vue/Inertia de cambio de password.
     */
    public function create(Request $request): RedirectResponse
    {
        // Conserva token y email al pasar desde la ruta Breeze al frontend Vue.
        return redirect('/es/reset-password?'.http_build_query([
            'token' => $request->route('token'),
            'email' => $request->email,
        ]));
    }

    /**
     * Procesa el cambio de password usando el token de reset.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        // Se limpian email y token para evitar espacios accidentales del link.
        $request->merge([
            'email' => is_string($request->input('email')) ? trim($request->input('email')) : $request->input('email'),
            'token' => is_string($request->input('token')) ? trim($request->input('token')) : $request->input('token'),
        ]);

        // Breeze valida token, email y las reglas globales de password.
        $request->validate([
            'token' => 'required',
            'email' => 'required|email|max:80',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Laravel valida el token y actualiza el hash del usuario real.
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                // Se guarda el nuevo hash y se rota remember_token por seguridad.
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Laravel emite el evento estandar de password reseteado.
                event(new PasswordReset($user));
            }
        );

        // Se responde segun el tipo de request usado por Vue/Inertia o web.
        if ($request->expectsJson() && $status == Password::PASSWORD_RESET) {
            return response()->json(null, 204);
        }

        if ($status == Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
