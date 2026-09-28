/* ============================================================================
 * INTERFACE: discover-filters.ts
 * ============================================================================
 * 
 * Representa los filtros que se pueden aplicar al buscar películas
 * usando el endpoint /discover/movie (sin texto) o similares.
 *
 * Permite filtrar por géneros, rango de años, ordenamiento y opcionalmente por texto.
 * Esta interface se usa en la función "searchByFilters".
 * ============================================================================ */

import type { BaseFilters } from "./base-filters";

export interface DiscoverFilters extends BaseFilters {}