/* ============================================================================
 * SERVICE: person.service.ts
 * ============================================================================
 *
 * Servicio para obtener información de personas (actores, directores, etc.)
 * desde la API de TMDB, incluyendo su filmografía (movie credits).
 * ============================================================================ */

import api from "@/core/api/tmdbApi";

import type { PersonDetail } from "../types/person-detail";

/**
 * Obtiene el detalle completo de una persona desde TMDB.
 *
 * Usa append_to_response=movie_credits para traer la filmografía en la
 * misma request, evitando llamadas adicionales. Pensada para usarse con
 * Vue Query a través del composable usePersonDetail.
 */
export const getFullPersonDetail = async (
  personId: number,
  language: string
): Promise<PersonDetail> => {
  const { data } = await api.get<PersonDetail>(`/person/${personId}`, {
    params: {
      language,
      append_to_response: "movie_credits",
    },
  });

  return data;
};