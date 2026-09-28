<?php

/* ============================================================================
 * CONTROLLER: PasswordController
 * ============================================================================
 *
 * Gestiona el cambio de contraseña de un usuario autenticado.
 *
 * Forma parte del flujo Breeze/Laravel real y usa las reglas globales de
 * contraseña definidas para CineVerse, manteniendo el hash estándar de Laravel.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Valida la contraseña actual, aplica las reglas de nueva contraseña y
     * persiste el nuevo hash en la tabla users.
     */
    public function update(Request $request): RedirectResponse
    {
        // Laravel valida password actual y reglas globales de nueva password.
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        // Se guarda el nuevo hash en la columna password estandar.
        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Breeze vuelve a la pantalla anterior luego de actualizar.
        return back();
    }
}
