/* ============================================================================
 * INTERFACE: videos-response.ts
 * ============================================================================
 * 
 * Representa la respuesta del endpoint:
 * /movie/{movie_id}/videos de TMDB.
 *
 * Contiene todos los videos asociados a una película,
 * como trailers, teasers, clips y contenido promocional.
 *
 * Responsabilidades:
 * - Identificar la película (id)
 * - Agrupar la lista de videos disponibles
 *
 * Nota:
 * - El array `results` puede venir vacío si no hay videos disponibles.
 * - Se recomienda filtrar los resultados para obtener:
 *    - site === "YouTube"
 *    - type === "Trailer"
 *    - official === true
 * ============================================================================ */

import type { Video } from "./video";

export interface MovieVideosResponse {
  // ID de la película en TMDB
  // Este ID corresponde al movieId usado en el endpoint
  id: number;
  // Lista de videos asociados a la película
  // Incluye trailers, teasers, clips, etc.
  results: Video[];
}