/* ============================================================================
 * INTERFACE: base-filters.ts
 * ============================================================================
 * 
 * Representa el conjunto base de filtros que se pueden aplicar
 * al buscar películas desde el frontend.
 *
 * Esta interface agrupa todos los filtros comunes:
 *  - géneros
 *  - rango de años
 *  - rango de calificación (rating)
 *  - ordenamiento
 *
 * Se utiliza como base para otras interfaces más específicas
 * como "DiscoverFilters" y "SearchWithFilters".
 * ============================================================================ */

export interface BaseFilters {
  /* Array de IDs de géneros para filtrar. Ej: [28, 12] para Acción y Aventura */
  genres?: number[];
  /* Año mínimo de estreno (desde). Filtra películas estrenadas a partir de este año */
  yearFrom?: number;
  /* Año máximo de estreno (hasta). Filtra películas estrenadas hasta este año */
  yearTo?: number;
  /* Calificación mínima (vote_average) para filtrar */
  minRating?: number;
  /* Calificación máxima (vote_average) para filtrar */
  maxRating?: number;
  /* Ordenamiento de los resultados. Ej: 'popularity.desc', 'release_date.asc' */
  sortBy?: string;
}
