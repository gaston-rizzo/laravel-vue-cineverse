/* ============================================================================
 * INTERFACE: person-movie.ts
 * ============================================================================
 *
 * Representan la filmografía de una persona en TMDB.
 *
 * Estas interfaces extienden de `Movie` y agregan información específica
 * según el tipo de participación:
 *
 * - Cast → actuación (personaje interpretado)
 * - Crew → trabajo técnico (rol dentro de la producción)
 *
 * Se utilizan dentro de:
 * PersonDetail.movie_credits
 * ============================================================================ */

import type { Movie } from "@/features/movies/types/movie";

/* ============================================================================
 * INTERFACE: PersonMovieCast
 * ----------------------------------------------------------------------------
 * Representa una película en la que la persona participó como actor/actriz.
 *
 * Extiende:
 * - Movie → incluye toda la información base de la película
 *
 * Responsabilidades:
 * - Indicar el personaje interpretado
 * - Definir el orden de aparición en el reparto
 * ========================================================================== */

export interface PersonMovieCast extends Movie {

  // Nombre del personaje interpretado en la película
  // Ejemplo: "Bruce Wayne / Batman"
  character: string;

  // Orden de aparición en el reparto (billing order)
  // 0 = protagonista principal
  // números mayores = menor relevancia en el cast
  order: number;
}

/* ============================================================================
 * INTERFACE: PersonMovieCrew
 * ----------------------------------------------------------------------------
 * Representa una película en la que la persona participó como parte del equipo técnico.
 *
 * Extiende:
 * - Movie → incluye toda la información base de la película
 *
 * Responsabilidades:
 * - Indicar el rol específico dentro de la producción
 * - Clasificar el área de trabajo (departamento)
 * ========================================================================== */

export interface PersonMovieCrew extends Movie {

  // Rol específico dentro de la producción
  // Ejemplos: "Director", "Writer", "Producer"
  job: string;

  // Departamento al que pertenece dentro del equipo técnico
  // Ejemplos: "Directing", "Writing", "Production"
  department: string;
}