<?php

/* ============================================================================
 * ROUTES: web.php
 * ============================================================================
 *
 * Rutas web de Laravel/Inertia.
 *
 * Laravel sirve una página puente llamada CineVerse y Vue Router maneja las
 * vistas internas del frontend: inicio, películas, detalle, perfil y auth.
 * ============================================================================ */

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Entrada raíz: manda al idioma español por defecto.
Route::get('/', function () {
    return redirect('/es');
});

// Dashboard Breeze queda redirigido a la experiencia principal CineVerse.
Route::get('/dashboard', function () {
    return redirect('/es');
})->middleware(['auth', 'verified'])->name('dashboard');

// Rutas web tradicionales de perfil que Breeze espera tener registradas.
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Rutas reales de autenticación Breeze/Laravel.
require __DIR__.'/auth.php';

// Página principal por idioma. Vue Router decide qué vista mostrar dentro.
Route::get('/{locale}', function (string $locale) {
    return Inertia::render('CineVerse', [
        'locale' => $locale,
    ]);
})->whereIn('locale', ['es', 'en']);

// Rutas de auth visibles para invitados. Si ya hay sesión, se vuelve al inicio.
Route::get('/{locale}/{authPage}', function (string $locale) {
    if (Auth::check()) {
        return redirect("/{$locale}");
    }

    return Inertia::render('CineVerse', [
        'locale' => $locale,
    ]);
})->whereIn('locale', ['es', 'en'])->whereIn('authPage', ['login', 'register', 'forgot-password']);

// Catch-all localizado para que Vue Router maneje rutas internas profundas.
Route::get('/{locale}/{any}', function (string $locale) {
    return Inertia::render('CineVerse', [
        'locale' => $locale,
    ]);
})->whereIn('locale', ['es', 'en'])->where('any', '.*');
