/* ============================================================================
 * INTERFACE: movie-list-type.ts
 * ============================================================================
 * 
 * Tipos de listados de películas disponibles en TMDB.
 *
 * Estos corresponden directamente a los endpoints:
 *
 * /movie/popular
 * /movie/now_playing
 * /movie/upcoming
 * /movie/top_rated
 *
 * Se utilizan para obtener listas predefinidas de películas
 * desde la API de TMDB sin aplicar filtros avanzados.
 * ============================================================================ */

export type MovieListType =
  | "popular"
  | "now_playing"
  | "upcoming"
  | "top_rated"
  | "discover";