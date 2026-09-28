/* ============================================================================
 * INTERFACE: PaginatedResponse<T>
 * ============================================================================
 *
 * Estructura estándar de respuesta paginada utilizada por TMDB.
 *
 * Representa cualquier endpoint que devuelva listas con paginación
 * (ej: /search/movie, /discover/movie, /movie/popular, etc.).
 * 
 *  Se usa cuando una consulta devuelve listas de resultados divididas en páginas
 * (por ejemplo: películas, búsquedas o descubrimientos).
 *
 * Uso:
 * - Permite tipar respuestas genéricas reutilizables en toda la app
 * - Se combina con tipos concretos (Movie, Person, etc.)
 *
 * Campos:
 * - page → página actual de resultados
 * - results → lista de elementos del tipo T
 * - total_pages → total de páginas disponibles
 * - total_results → total global de resultados
 *
 * Nota:
 * - Es una interface genérica para evitar duplicación de tipos
 *   en diferentes servicios de la API
 * ============================================================================ */ 

 export interface PaginatedResponse<T> {
  /* Página actual de los resultados */
  page: number;
  /* Lista de resultados de tipo genérico T (por ejemplo Movie) */
  results: T[];
  /* Total de páginas disponibles según la consulta */
  total_pages: number;
  /* Total de resultados disponibles según la consulta */
  total_results: number;
}