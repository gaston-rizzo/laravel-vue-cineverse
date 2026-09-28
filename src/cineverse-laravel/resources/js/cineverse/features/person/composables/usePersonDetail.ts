/* ============================================================================
 * COMPOSABLE: usePersonDetail.ts
 * ============================================================================
 *
 * Composable que obtiene el detalle completo de una persona usando Vue Query,
 * dejando la data lista para la UI (PersonDetail).
 *
 * Uso:
 * const { data, isLoading, isError } = usePersonDetail(id, language)
 * ============================================================================ */

import type { Ref } from "vue";

import { useQuery } from "@tanstack/vue-query";

import { getFullPersonDetail } from "../services/person.service";

import type { PersonDetail } from "../types/person-detail";

export function usePersonDetail(id: number, language: Ref<string>) {

  return useQuery<PersonDetail>({

    // Clave única de la query, incluye id e idioma para invalidar cache al cambiar cualquiera
    queryKey: ["person-detail", id, language],

    // Solo ejecuta la query si el id es un número válido
    enabled: Number.isFinite(id) && id > 0,

    // No reintenta automáticamente si falla (ej: 404)
    retry: false,

    // Evita refetch al volver a enfocar la pestaña
    refetchOnWindowFocus: false,

    // Trae el detalle completo de la persona desde TMDB
    queryFn: async () => {
      return await getFullPersonDetail(id, language.value)
    },
  })
}