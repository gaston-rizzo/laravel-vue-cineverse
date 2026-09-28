/* ============================================================================
 * INTERFACE: person-detail.ts
 * ============================================================================
 * 
 * Representa el detalle completo de una persona (actor, director, etc.)
 * según la respuesta del endpoint /person/{id} de TMDB.
 *
 * Incluye:
 * - Información básica (nombre, biografía, imagen)
 * - Datos personales (fecha de nacimiento, lugar, alias, género)
 * - Filmografía completa (cast y crew) mediante append_to_response
 *
 * Responsabilidades:
 * - Normalizar la información de una persona para el frontend
 * - Proveer datos para vistas de detalle y filmografía
 * ============================================================================ */

import type { PersonMovieCast } from "./person-movie";
import type { PersonMovieCrew } from "./person-movie";

export interface PersonDetail {

  // ID único de la persona en TMDB
  id: number;
  // Nombre completo de la persona
  name: string;
  // Biografía completa (puede venir vacía)
  biography: string;
  // Ruta de la imagen de perfil (puede ser null si no hay foto)
  profile_path: string | null;

  /* ==========================================================================
   * Información personal
   * ========================================================================== */

  // Fecha de nacimiento en formato YYYY-MM-DD (puede ser null)
  birthday: string | null;
  // Lugar de nacimiento (ciudad, país) o null si no está disponible
  place_of_birth: string | null;
  // Género de la persona según TMDB
  // Valores comunes:
  // 0 = Not set / unknown
  // 1 = Female
  // 2 = Male
  // 3 = Non-binary
  gender: number;
  // Lista de nombres alternativos (alias, nombres artísticos, etc.)
  also_known_as: string[];

  /* ==========================================================================
   * Filmografía (incluida mediante append_to_response)
   * ========================================================================== */

  // Créditos de películas donde participó la persona
  movie_credits: {
    // Películas donde aparece como actor/actriz
    // Incluye personaje interpretado y datos de la película
    cast: PersonMovieCast[];
    // Películas donde trabajó como parte del equipo técnico
    // Incluye rol (director, writer, producer, etc.)
    crew: PersonMovieCrew[];
  };
}