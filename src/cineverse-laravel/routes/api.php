<?php

/* ============================================================================
 * ROUTES: api.php
 * ============================================================================
 *
 * Rutas JSON consumidas por el frontend CineVerse.
 *
 * Agrupa endpoints protegidos por sesión Laravel y endpoints públicos que la
 * SPA necesita consultar sin obligar al usuario a iniciar sesión.
 * ============================================================================ */

use App\Http\Controllers\Api\ProfileController as ApiProfileController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

// Endpoints API que requieren usuario autenticado mediante sesión web.
Route::middleware(['web', 'auth'])->group(function () {
    // Resumen del perfil autenticado.
    Route::get('/profile', [ApiProfileController::class, 'show']);

    // CRUD de reseñas propias del usuario autenticado.
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
});

// Reseñas públicas de una película, con datos extra si el usuario está logueado.
Route::middleware('web')->get('/movies/{movieId}/reviews', [ReviewController::class, 'movieReviews']);
