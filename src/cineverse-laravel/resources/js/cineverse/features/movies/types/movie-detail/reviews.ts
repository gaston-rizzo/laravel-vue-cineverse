/* ============================================================================
 * INTERFACES: review.ts
 * ============================================================================
 *
 * Representa las reviews que los usuarios dejan sobre una película,
 * junto con las estadísticas, paginación y payloads necesarios para
 * crear/actualizar una review.
 *
 * Estas interfaces se utilizan para:
 * - Mostrar la review propia del usuario y las de la comunidad
 * - Mostrar estadísticas generales (promedio, total)
 * - Paginar el listado de reviews de la comunidad
 * - Enviar los datos al crear o actualizar una review
 * ============================================================================ */

/* ============================================================================
 * INTERFACE: Review
 * ----------------------------------------------------------------------------
 * Representa una review individual dejada por un usuario sobre una película.
 *
 * Responsabilidades:
 * - Identificar la review, el usuario y la película relacionada
 * - Contener el puntaje y el comentario del usuario
 * - Registrar fechas de creación y edición
/* ============================================================================ */

export interface Review {
  // ID único de la review en la base de datos
  id: number;
  // ID del usuario que escribió la review
  user_id: number;
  // ID de la película (TMDB) sobre la que se hizo la review
  movie_id: number;
  // Título de la película al momento de la review.
  // Solo viene poblado en el listado de "mis reviews" (GET /reviews);
  // en las reviews de una película puntual no hace falta (ya se conoce por movieId).
  movie_title?: string;
  // Puntaje asignado por el usuario
  // Ej: escala 1 a 10
  rating: number;
  // Texto del comentario dejado por el usuario
  comment: string;
  // Fecha de creación de la review en formato ISO
  // Ej: "2024-03-10T12:00:00.000Z"
  created_at: string;
  // Fecha de última edición de la review en formato ISO
  updated_at: string;
  // Nombre del usuario que hizo la review
  // Solo viene en las reviews de la comunidad, no en user_review
  username?: string;
}

/* ============================================================================
 * INTERFACE: ReviewsStats
 * ----------------------------------------------------------------------------
 * Representa las estadísticas generales de las reviews de una película.
 *
 * Responsabilidades:
 * - Exponer el promedio de puntajes
 * - Exponer la cantidad total de reviews
/* ============================================================================ */

export interface ReviewsStats {
  // Promedio de todos los ratings de la película
  // Ej: 7.8
  average_rating: number;
  // Cantidad total de reviews recibidas
  total_reviews: number;
}

/* ============================================================================
 * INTERFACE: ReviewsPagination
 * ----------------------------------------------------------------------------
 * Representa la información de paginación del listado de reviews.
 *
 * Responsabilidades:
 * - Indicar la página actual
 * - Indicar si hay más páginas disponibles
/* ============================================================================ */

export interface ReviewsPagination {
  // Número de página actual
  page: number;
  // Indica si existe una página siguiente para pedir más reviews
  has_next: boolean;
}

/* ============================================================================
 * INTERFACE: ReviewsResponse
 * ----------------------------------------------------------------------------
 * Representa la respuesta completa del endpoint de reviews de una película.
 *
 * Responsabilidades:
 * - Indicar el resultado de la request (success, code)
 * - Agrupar estadísticas, paginación, review propia y reviews de la comunidad
/* ============================================================================ */

export interface ReviewsResponse {
  // Indica si la request se resolvió correctamente
  success: boolean;
  // Código interno de la respuesta (útil para manejo de errores)
  code: string;
  data: {
    // Estadísticas generales (promedio, total)
    stats: ReviewsStats;
    // Info de paginación de la lista de reviews
    pagination: ReviewsPagination;
    // Review propia del usuario logueado, si existe
    // null si el usuario todavía no dejó una review
    user_review: Review | null;
    // Lista de reviews de la comunidad (sin contar la propia)
    reviews: Review[];
  };
}

/* ============================================================================
 * INTERFACE: CreateReviewPayload
 * ----------------------------------------------------------------------------
 * Representa los datos enviados al backend para crear una nueva review.
 *
 * Responsabilidades:
 * - Identificar la película sobre la que se crea la review
 * - Enviar el puntaje y comentario del usuario
/* ============================================================================ */

export interface CreateReviewPayload {
  // ID de la película sobre la que se crea la review
  movie_id: number;
  // Título de la película en el momento de crear la review
  // (se persiste tal cual en el backend, sin depender de TMDB en lecturas futuras)
  movie_title: string;
  // Puntaje asignado por el usuario
  rating: number;
  // Comentario del usuario
  comment: string;
}

/* ============================================================================
 * INTERFACE: UpdateReviewPayload
 * ----------------------------------------------------------------------------
 * Representa los datos enviados al backend para actualizar una review
 * existente.
 *
 * Responsabilidades:
 * - Enviar el nuevo puntaje y comentario del usuario
/* ============================================================================ */

export interface UpdateReviewPayload {
  // Nuevo puntaje asignado por el usuario
  rating: number;
  // Nuevo comentario del usuario
  comment: string;
}

/* ============================================================================
 * INTERFACE: UserReviewsResponse
 * ----------------------------------------------------------------------------
 * Representa la respuesta del endpoint que devuelve las reviews del usuario
 * autenticado, paginadas (GET /reviews?page=N).
 *
 * Responsabilidades:
 * - Indicar el resultado de la request (success, code)
 * - Exponer el listado de reviews de la página solicitada
 * - Exponer la información de paginación
/* ============================================================================ */

export interface UserReviewsResponse {
  // Indica si la request se resolvió correctamente
  success: boolean;
  // Código interno de la respuesta (útil para manejo de errores)
  code: string;
  data: {
    // Listado de reviews del usuario correspondiente a la página solicitada
    reviews: Review[];
    // Info de paginación del listado
    pagination: ReviewsPagination;
  };
}