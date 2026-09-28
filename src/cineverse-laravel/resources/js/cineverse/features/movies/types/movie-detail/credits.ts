/* ============================================================================
 * INTERFACES: credits.ts
 * ============================================================================
 *
 * Representa la estructura de créditos de una película según la respuesta
 * del endpoint /movie/{id}/credits de TMDB.
 *
 * Incluye tanto:
 * - Reparto (cast): actores que aparecen en pantalla
 * - Equipo técnico (crew): personas detrás de cámara
 *
 * Estas interfaces se utilizan para:
 * - Renderizar la sección de cast (actores)
 * - Obtener información clave del crew (director, guionista, etc.)
 * - Normalizar la respuesta de la API hacia el frontend
 * ============================================================================ */

import type { CastMember } from "./cast";

/* ============================================================================
 * INTERFACE: MovieCredits
 * ----------------------------------------------------------------------------
 * Contenedor principal de créditos de una película.
 *
 * Responsabilidades:
 * - Identificar la película (id)
 * - Agrupar reparto y equipo técnico
/* ============================================================================ */

export interface MovieCredits {
  // ID único de la película en TMDB
  id: number;
  // Lista de actores que participan en la película
  // Cada elemento contiene información como nombre, personaje, imagen, etc.
  cast: CastMember[];
  // Lista del equipo técnico (personas detrás de cámara)
  // Incluye director, guionistas, productores, etc.
  crew: CrewMember[];
}

/* ============================================================================
 * INTERFACE: CrewMember
 * ----------------------------------------------------------------------------
 * Representa un miembro del equipo técnico de la película.
 *
 * Incluye roles como:
 * - Director
 * - Guionista
 * - Productor
 * - Fotografía, edición, etc.
 *
 * Responsabilidades:
 * - Identificar a la persona
 * - Indicar su rol específico (job)
 * - Agrupar por departamento
/* ============================================================================ */

export interface CrewMember {
  // ID único de la persona en TMDB
  id: number;
  // Nombre completo del miembro del equipo
  name: string;
  // Rol específico dentro de la producción
  // Ejemplos: "Director", "Writer", "Producer"
  job: string;
  // Departamento al que pertenece dentro del equipo técnico
  // Ejemplos: "Directing", "Writing", "Production"
  department: string;
}