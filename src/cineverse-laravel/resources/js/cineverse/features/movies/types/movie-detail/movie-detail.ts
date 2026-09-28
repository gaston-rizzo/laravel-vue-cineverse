/* ============================================================================
 * INTERFACE: movie-detail.ts
 * ============================================================================
 *
 * Representa el detalle completo de una película según el endpoint
 * /movie/{id} de TMDB.
 *
 * Extiende la interface base "Movie", agregando información adicional
 * que solo está disponible en la vista de detalle.
 *
 * Incluye datos como:
 * - duración
 * - géneros completos
 * - estado de producción
 * - información financiera
 *
 * Esta interface se utiliza en:
 * - useMovieDetail (composable principal)
 * - MovieDetailView.vue
 * - componentes de detalle (hero, metadata, etc.)
 * ============================================================================ */

import type { Movie } from "../movie";

export interface MovieDetail extends Movie {
  /* Duración en minutos */
  runtime: number;
  /* Géneros completos (no solo IDs) */
  genres: {
    id: number;
    name: string;
  }[];  
  /* Frase corta promocional de la película. */
  tagline: string;
  /* Estado: Released, Post Production, etc */
  status: string;
  /* Idioma original */
  original_language: string;
  /* Presupuesto */
  budget: number;
  /* Recaudación */
  revenue: number;
}