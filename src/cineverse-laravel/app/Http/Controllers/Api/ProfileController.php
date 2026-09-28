<?php

/* ============================================================================
 * CONTROLLER: ProfileController.php
 * ============================================================================
 *
 * Endpoint API del perfil de CineVerse. Devuelve un resumen del usuario
 * autenticado para que Vue pueda mostrar cantidad de reseñas y las últimas
 * reseñas sin recargar la página completa.
 * ============================================================================ */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Devuelve el resumen del perfil del usuario autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        // Se toma el usuario desde la sesión autenticada de Laravel.
        $userId = $request->user()->id;

        // Total de reseñas creadas por el usuario para mostrar el resumen.
        $reviewsCount = Review::query()
            ->where('user_id', $userId)
            ->count();

        // Ultimas reseñas del usuario, limitadas para no cargar todo el historial.
        $latestReviews = Review::query()
            ->select([
                'id',
                'movie_id',
                'movie_title',
                'rating',
                'comment',
                'created_at',
            ])
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();

        // Respuesta JSON consumida por la vista de perfil de CineVerse.
        return response()->json([
            'success' => true,
            'code' => 'PROFILE_SUMMARY_FETCHED',
            'data' => [
                'reviews_count' => $reviewsCount,
                'latest_reviews' => $latestReviews,
            ],
        ]);
    }
}
