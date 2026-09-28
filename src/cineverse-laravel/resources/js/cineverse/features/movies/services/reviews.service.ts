/* ============================================================================
 * SERVICE: reviews.service.ts
 * ============================================================================
 *
 * Servicio para gestionar las reviews que los usuarios dejan sobre una
 * película, consumiendo la API propia del backend: listado paginado,
 * creación, actualización y eliminación.
 * ============================================================================ */

import webApi from "@/core/api/webApi";

import type {
  ReviewsResponse,
  CreateReviewPayload,
  UpdateReviewPayload,
  UserReviewsResponse
} from "@/features/movies/types/movie-detail/reviews";


/**
 * Crea una nueva review para una película.
 *
 * Requiere el token CSRF de la sesión para validar la request en el backend.
 */
export const createReview = async (payload: CreateReviewPayload, csrfToken: string) => {
  const { data } = await webApi.post("/api/reviews", payload, {
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });

  return data;
};

/**
 * Actualiza una review existente del usuario autenticado.
 *
 * Requiere el token CSRF de la sesión para validar la request en el backend.
 */
export const updateReview = async (
  reviewId: number,
  payload: UpdateReviewPayload,
  csrfToken: string
) => {
  const { data } = await webApi.put(`/api/reviews/${reviewId}`, payload, {
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });

  return data;
};

/**
 * Elimina una review existente del usuario autenticado.
 *
 * Requiere el token CSRF de la sesión para validar la request en el backend.
 */
export const deleteReview = async (reviewId: number, csrfToken: string) => {
  const { data } = await webApi.delete(`/api/reviews/${reviewId}`, {
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });

  return data;
};

/**
 * Obtiene las reviews del usuario autenticado, paginadas ordenadas
 * de la más reciente a la más antigua.
 */
export const getUserReviews = async (
  page: number = 1
): Promise<UserReviewsResponse> => {
  const { data } = await webApi.get<UserReviewsResponse>("/api/reviews", {
    params: { page },
  });
  return data;
};

/**
 * Obtiene las reviews de una película, junto con estadísticas, paginación
 * y la review propia del usuario autenticado (si existe).
 */
export const getMovieReviews = async (
  movieId: number,
  page: number = 1
): Promise<ReviewsResponse> => {
  const { data } = await webApi.get<ReviewsResponse>(`/api/movies/${movieId}/reviews`, {
    params: { page },
  });

  return data;
};
