<?php

/* ============================================================================
 * CONTROLLER: ConfirmablePasswordController
 * ============================================================================
 *
 * Maneja la confirmación de contraseña de Breeze para acciones sensibles.
 *
 * Aunque CineVerse usa una experiencia Vue/Inertia, se conserva este controller
 * para mantener disponible el flujo estándar de Laravel cuando una ruta protegida
 * requiere confirmar la contraseña del usuario autenticado.
 * ============================================================================ */

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class ConfirmablePasswordController extends Controller
{
    /**
     * CineVerse no usa la vista Blade estándar de Breeze para confirmar
     * contraseña. Por eso redirige al login Vue localizado en español.
     */
    public function show(): RedirectResponse
    {
        return redirect('/es/login');
    }

    /**
     * Valida la contraseña contra el guard web. Un guard en Laravel define
     * cómo se autentica un usuario; el guard "web" usa sesión y cookies,
     * que es el flujo normal de Breeze para usuarios logueados en navegador.
     *
     * Si la contraseña coincide, marca en sesión el timestamp de confirmación
     * usado por Laravel para autorizar acciones sensibles durante una ventana
     * de tiempo.
     */
    public function store(Request $request): RedirectResponse
    {
        // Auth::guard('web') usa el mecanismo de autenticación web de Laravel:
        // sesión, cookies y el provider de usuarios configurado en config/auth.php.
        // validate() comprueba credenciales sin iniciar una nueva sesión.
        if (! Auth::guard('web')->validate([
            'email' => $request->user()->email,
            'password' => $request->password,
        ])) {
            // Si la contraseña no coincide, Laravel devuelve un error de
            // validación asociado al campo password.
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        // Guarda el momento exacto en que la contraseña fue confirmada.
        // Laravel consulta esta marca para permitir temporalmente acciones
        // sensibles sin pedir la contraseña en cada request.
        $request->session()->put('auth.password_confirmed_at', time());

        // Vuelve a la URL que Laravel intentaba proteger, o al dashboard
        // como fallback si no había destino pendiente.
        return redirect()->intended(route('dashboard', absolute: false));
    }
}
