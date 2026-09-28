/* ============================================================================
 * INTERFACE: search-with-text-filters.ts
 * ============================================================================
 * 
 * Representa los filtros que se pueden aplicar al buscar películas combinando
 * texto + filtros adicionales en frontend.
 *
 * Esta interface se usa en la función "searchByTextAndFilters".
 * ============================================================================ */

import type { BaseFilters } from "./base-filters";

export interface SearchWithTextAndFilters extends BaseFilters {
  /** Texto que ingresa el usuario para buscar películas (obligatorio) */
  query: string;
}