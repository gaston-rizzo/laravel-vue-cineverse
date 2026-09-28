/* ============================================================================
 * INTERFACE: movie.ts
 * ============================================================================
 * 
 * Representa una película tal como la devuelve TMDB.
 *
 * Contiene la información principal que usamos en la aplicación:
 * - Identificador único
 * - Título y fecha de estreno
 * - Imágenes (poster y backdrop)
 * - Rating promedio
 * - Géneros asociados (opcional, útil para filtros)
 * ============================================================================ */

export interface Movie {
  /* Identificador único de la película en TMDB */
  id: number;
  /* Título de la película */
  title: string;
  /* Fecha de estreno en formato "YYYY-MM-DD" */
  release_date: string;
  /* Ruta relativa del poster de la película. Puede ser null si no hay imagen */
  poster_path: string | null;
  /* Ruta relativa del backdrop (imagen de fondo). Puede ser null si no hay imagen */
  backdrop_path: string | null;
  /* Promedio de votos de los usuarios (rating) */
  vote_average: number;
  /* Popularidad calculada por TMDB (usada para ordenar) */
  popularity: number;
  /* Array de IDs de géneros asociados a la película. Opcional, útil para filtros */
  genre_ids?: number[];
  /* Descripción/sinopsis de la película */
  overview: string;
}