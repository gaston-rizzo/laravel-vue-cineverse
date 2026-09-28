<?php

/* ============================================================================
 * ROUTES: auth.php
 * ============================================================================
 *
 * Rutas de autenticación Breeze/Laravel.
 *
 * Mantiene login, registro, verificación de email, recuperación de contraseña,
 * cambio de contraseña y logout reales de Laravel, usados por la SPA Vue.
 * ============================================================================ */

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

// Rutas disponibles solo para visitantes no autenticados.
Route::middleware('guest')->group(function () {
    // Pantalla y acción de registro.
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    // Pantalla y acción de login.
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    // Solicitud de enlace para restablecer contraseña.
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    // Pantalla y acción final de cambio de contraseña.
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

// Rutas que requieren una sesión autenticada.
// Link firmado recibido por email: verifica la cuenta sin iniciar sesion.
Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::middleware('auth')->group(function () {
    // Endpoint ligero usado por Vue para reconstruir sesión y CSRF.
    Route::get('user', function () {
        $user = request()->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
            'csrf_token' => csrf_token(),
        ]);
    });

    // Pantalla puente de verificación de email.
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    // Link firmado que marca el email como verificado.
    // Reenvío del email de verificación.
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Confirmación de contraseña para acciones sensibles.
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    // Cambio de contraseña del usuario autenticado.
    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    // Cierre de sesión Laravel.
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
