<?php

/* ============================================================================
 * REQUEST: LoginRequest.php
 * ============================================================================
 *
 * Request de autenticación usado por Breeze/Laravel.
 *
 * Valida credenciales, aplica rate limiting y ejecuta el login real contra el
 * modelo User estándar de Laravel.
 * ============================================================================ */

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class LoginRequest extends FormRequest
{
    /**
     * Permite ejecutar el request de login.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normaliza el email antes de validar credenciales.
     */
    protected function prepareForValidation(): void
    {
        if (is_string($this->email)) {
            $this->merge([
                'email' => trim($this->email),
            ]);
        }
    }

    /**
     * Devuelve las reglas de validacion del formulario de login.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:80'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Intenta autenticar las credenciales recibidas.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        // Antes de consultar las credenciales, se bloquea el acceso si se supera
        // la cantidad de intentos permitidos.
        // El rate limiting limita la cantidad de intentos de inicio de sesión 
        // permitidos durante un período para evitar ataques de fuerza bruta.
        $this->ensureIsNotRateLimited();

        // Se busca por email normalizado para usar el modelo User real.
        $user = User::query()
            ->where('email', $this->string('email')->toString())
            ->first();

        // Usuario inexistente o password invalido comparten el mismo mensaje.
        if (! $user || ! Hash::check($this->string('password')->toString(), $user->password)) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        // CineVerse exige email verificado antes de permitir el login.
        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => trans('auth.email_not_verified'),
            ])->status(403);
        }

        // Login final usando el guard web de Laravel.
        Auth::login($user, $this->boolean('remember'));

        // Al autenticar correctamente, se limpian los intentos fallidos.
        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Verifica que el login no haya excedido el limite de intentos.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        // Si todavia quedan intentos disponibles, el login puede continuar.
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 3)) {
            return;
        }

        // Laravel emite el evento estandar de bloqueo.
        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        // Se devuelve ValidationException con status 429 para el frontend.
        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ])->status(429);
    }

    /**
     * Devuelve la clave usada por el rate limiter del login.
     */
    public function throttleKey(): string
    {
        // Combina email e IP para limitar intentos por usuario/origen.
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
