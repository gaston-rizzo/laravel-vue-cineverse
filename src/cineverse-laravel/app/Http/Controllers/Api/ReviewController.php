<?php

/* ============================================================================
 * CONTROLLER: ReviewController.php
 * ============================================================================
 *
 * Endpoint API de reseñas de CineVerse. Gestiona el listado de reseñas del
 * usuario, la creación, edición y eliminación de reseñas propias, y el listado
 * público paginado de reseñas por película para la pestaña Reseñas.
 * ============================================================================ */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Lista las reseñas del usuario autenticado para la página de perfil.
     */
    public function index(Request $request): JsonResponse
    {
        // Paginación de "Mis reseñas" dentro del perfil del usuario.
        $page = max(1, (int) $request->query('page', 1));
        $perPage = 12;

        // Query base: solo reseñas propias, ordenadas de más nuevas a más viejas.
        $query = Review::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at');

        // Se cuenta el total para saber si existe una pagina siguiente.
        $totalReviews = (clone $query)->count();

        // Se trae solo la página actual que pide el frontend.
        $reviews = Review::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->forPage($page, $perPage)
            ->get();

        // Respuesta usada por la pantalla de perfil para listar reseñas propias.
        return response()->json([
            'success' => true,
            'code' => 'REVIEWS_FETCHED',
            'data' => [
                'pagination' => [
                    'page' => $page,
                    'has_next' => ($page * $perPage) < $totalReviews,
                ],
                'reviews' => $reviews,
            ],
        ]);
    }

    /**
     * Crea una reseña nueva para el usuario autenticado.
     */
    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'comment' => $this->normalizeReviewComment((string) $request->input('comment', '')),
        ]);

        // Laravel valida campos, tipos y limites antes de crear la reseña.
        $validated = $request->validate([
            'movie_id' => ['required', 'integer', 'min:1'],
            'movie_title' => ['nullable', 'string', 'max:255'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'min:20', 'max:1000'],
        ]);

        // Cada usuario puede tener una sola reseña por película.
        $exists = Review::query()
            ->where('user_id', $request->user()->id)
            ->where('movie_id', $validated['movie_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'code' => 'REVIEW_ALREADY_EXISTS',
            ], 409);
        }

        // Se guarda la reseña asociada al usuario autenticado.
        Review::create([
            'user_id' => $request->user()->id,
            'movie_id' => $validated['movie_id'],
            'movie_title' => $validated['movie_title'] ?? '',
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
        ]);

        // El frontend refresca la pestaña de reseñas al recibir este OK.
        return response()->json([
            'success' => true,
            'code' => 'REVIEW_CREATED',
        ]);
    }

    /**
     * Actualiza una reseña existente si pertenece al usuario autenticado.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->merge([
            'comment' => $this->normalizeReviewComment((string) $request->input('comment', '')),
        ]);

        // Solo se permite editar puntaje y comentario.
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'min:20', 'max:1000'],
        ]);

        // Se busca la reseña por id antes de verificar pertenencia.
        $review = Review::query()->find($id);

        if (! $review) {
            return response()->json([
                'success' => false,
                'code' => 'REVIEW_NOT_FOUND',
            ], 404);
        }

        // Proteccion: un usuario no puede editar reseñas de otro usuario.
        if ((int) $review->user_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'code' => 'NOT_REVIEW_OWNER',
            ], 403);
        }

        // Actualizacion final de los campos permitidos.
        $review->update([
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
        ]);

        // Respuesta simple para que Vue cierre/actualice el formulario.
        return response()->json([
            'success' => true,
            'code' => 'REVIEW_UPDATED',
        ]);
    }

    /**
     * Elimina una reseña existente si pertenece al usuario autenticado.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        // Se busca la reseña antes de intentar eliminarla.
        $review = Review::query()->find($id);

        if (! $review) {
            return response()->json([
                'success' => false,
                'code' => 'REVIEW_NOT_FOUND',
            ], 404);
        }

        // Protección: solo el dueño puede eliminar su propia reseña.
        if ((int) $review->user_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'code' => 'NOT_REVIEW_OWNER',
            ], 403);
        }

        // Eliminacion definitiva de la reseña.
        $review->delete();

        // Respuesta simple para que Vue quite la reseña de la interfaz.
        return response()->json([
            'success' => true,
            'code' => 'REVIEW_DELETED',
        ]);
    }

    /**
     * Devuelve reseñas, estadísticas y reseña propia para una película.
     */
    public function movieReviews(Request $request, int $movieId): JsonResponse
    {
        // Paginación de la pestaña "Reseñas" dentro del detalle de la película.
        $page = max(1, (int) $request->query('page', 1));
        $perPage = 10;
        $userId = $request->user()?->id;

        $userReview = null;

        // En la primera página se devuelve aparte la reseña propia del usuario.
        if ($page === 1 && $userId !== null) {
            $userReview = Review::query()
                ->where('user_id', $userId)
                ->where('movie_id', $movieId)
                ->first();
        }

        // Query de reseñas de la comunidad con username para mostrar autor.
        $communityQuery = Review::query()
            ->select([
                'reviews.id',
                'reviews.user_id',
                'reviews.movie_id',
                'reviews.movie_title',
                'reviews.rating',
                'reviews.comment',
                'reviews.created_at',
                'reviews.updated_at',
                'users.username',
            ])
            ->join('users', 'users.id', '=', 'reviews.user_id')
            ->where('reviews.movie_id', $movieId)
            ->orderByDesc('reviews.created_at');

        // Si el usuario ya tiene reseña, no se duplica dentro del listado comun.
        if ($userId !== null) {
            $communityQuery->where('reviews.user_id', '<>', $userId);
        }

        // Total usado para calcular si hay mas páginas.
        $totalCommunityReviews = (clone $communityQuery)->count();

        // Reseñas visibles en la página actual.
        $reviews = $communityQuery
            ->forPage($page, $perPage)
            ->get();

        // Estadísticas generales de la película: promedio y cantidad total.
        $stats = Review::query()
            ->where('movie_id', $movieId)
            ->selectRaw('COUNT(*) as total_reviews, ROUND(AVG(rating), 1) as average_rating')
            ->first();

        // Respuesta completa para la pestaña "Reseñas" del detalle de una película.
        return response()->json([

            'success' => true,
            'code' => 'REVIEWS_FETCHED',
            'data' => [
                'stats' => [
                    'average_rating' => (float) ($stats->average_rating ?? 0),
                    'total_reviews' => (int) ($stats->total_reviews ?? 0),
                ],
                'pagination' => [
                    'page' => $page,
                    'has_next' => ($page * $perPage) < $totalCommunityReviews,
                ],
                'user_review' => $userReview,
                'reviews' => $reviews,
            ],
            
        ]);
    }

    private function normalizeReviewComment(string $comment): string
    {
        $normalizedComment = str_replace(["\r\n", "\r"], "\n", $comment);

        $normalizedComment = preg_replace(
            "/[ \t]*\n[ \t]*/",
            "\n",
            $normalizedComment
        ) ?? $normalizedComment;

        $normalizedComment = preg_replace(
            "/\n{3,}/",
            "\n\n",
            $normalizedComment
        ) ?? $normalizedComment;

        return trim($normalizedComment);
    }
}
