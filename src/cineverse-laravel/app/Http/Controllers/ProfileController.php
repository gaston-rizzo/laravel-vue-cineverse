<?php

/* ============================================================================
 * CONTROLLER: ProfileController.php
 * ============================================================================
 *
 * Controller Breeze para acciones web del perfil.
 *
 * Mantiene compatibilidad con rutas tradicionales de Laravel mientras el perfil
 * principal se renderiza desde la experiencia Vue/Inertia de CineVerse.
 * ============================================================================ */

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;

class ProfileController extends Controller
{
    /**
     * Redirige al perfil Vue/Inertia de CineVerse.
     */
    public function edit(Request $request): RedirectResponse
    {
        return redirect('/es/profile');
    }

    /**
     * Actualiza los datos del perfil del usuario autenticado.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        // Solo se cargan campos validados por ProfileUpdateRequest.
        $request->user()->fill($request->validated());

        // Si cambia el email, Laravel requiere verificarlo otra vez.
        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        // Persistencia final del usuario autenticado.
        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Elimina la cuenta del usuario autenticado.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Laravel confirma la password actual antes de borrar la cuenta.
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        // Se conserva la referencia antes de cerrar sesión.
        $user = $request->user();

        // Primero se cierra la sesión activa.
        Auth::logout();

        // Luego se elimina definitivamente el usuario.
        $user->delete();

        // Se inválida la sesión y se rota el CSRF token.
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
