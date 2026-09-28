/* ============================================================================
 * COMPOSABLE: useMoviesQuery.ts
 * ============================================================================
 *
 * Composable que gestiona la búsqueda de películas usando Vue Query
 * con paginación infinita. Recibe los filtros activos y el idioma,
 * y devuelve el estado de Vue Query (data, isLoading, error, etc.)
 * ============================================================================ */

import { computed } from "vue";
import type { Ref } from "vue";

import { useInfiniteQuery } from "@tanstack/vue-query";

import {
  getMovieList,
  searchByFilters,
  searchByTextAndFilters,
} from "@/features/movies/services/movies.service";

import { useMoviesFilters } from "./useMoviesFilters";

import type { PaginatedResponse } from "@/shared/types/paginated-response";
import type { Movie } from "@/features/movies/types/movie";
import type { MovieListType } from "@/features/movies/types/movie-list-type";

export type MovieFilters = ReturnType<typeof useMoviesFilters>;

export function useMoviesQuery(filters: MovieFilters, language: Ref<string>) {
  return useInfiniteQuery<PaginatedResponse<Movie>>({
    /**
     * Identidad de la query. Si cualquiera de estos valores cambia,
     * Vue Query vuelve a ejecutarla automáticamente.
     */
    queryKey: computed(() => [
      // Query base generada por el composable de filtros
      ...filters.queryKey.value,
      // El idioma forma parte de la key porque la API devuelve
      // resultados distintos según el language
      language.value,
    ]),

    // Página inicial al cargar la query
    initialPageParam: 1,

    // Con 0, los datos se consideran inmediatamente "stale"
    // y Vue Query puede refetchear según enabled/refetchOnMount
    staleTime: 0,

    // Con 0, la caché se limpia apenas la query se desconecta
    gcTime: 0,

    // Refetchea siempre al montar el componente (resultados dinámicos)
    refetchOnMount: true,

    // No refetchea al volver a la pestaña, para no sobrecargar la API
    refetchOnWindowFocus: false,

    /**
     * Controla cuándo puede ejecutarse la query: cuando hay una lista
     * distinta de "discover", texto de búsqueda, o filtros activos.     
     */
    enabled: computed(
      () =>
        // filters.listType.value !== "discover" ||
        // filters.hasText.value ||
        // filters.hasFilters.value ||
        // filters.listType.value === "discover",
        filters.listType.value !== "discover" ||
        filters.debouncedQuery.value.length >= 3 ||
        filters.hasFilters.value ||
        true // discover siempre hace fetch, con o sin filtros activos (usa el sort por defecto)

    ),

    /**
     * Ejecuta la llamada a la API según el caso activo.
     * Siempre devuelve Promise<PaginatedResponse<Movie>>.
     */
    queryFn: ({ pageParam = 1 }) => {

      const page = pageParam as number;

      // Normaliza las opciones de filtros para no repetir
      // el mismo objeto en múltiples llamadas
      const filterOptions = {
        genres: filters.selectedGenres.value,
        // Si no existe valor se envía undefined
        // para que la API ignore el filtro
        yearFrom: filters.yearFrom.value ?? undefined,
        yearTo: filters.yearTo.value ?? undefined,
        minRating: filters.minRating.value,
        maxRating: filters.maxRating.value,
        // Mismo default que resetAdvancedFilters() en MovieFilters.vue:
        // "vote_average.desc" (Mejor rating) es el orden que se aplica
        // cuando el usuario no eligió ninguno explícitamente.
        sortBy: filters.sortBy.value ?? "vote_average.desc",
      };

      // Caso 1: hay texto de búsqueda. Siempre usa searchByTextAndFilters,
      // porque /search/movie no soporta ordenar y el sort se aplica en el
      // frontend. filterOptions.sortBy ya trae el fallback "vote_average.desc"
      // cuando el usuario no eligió ninguno.
      // Ej: search="batman" → busca "batman" y ordena por rating
      if (filters.debouncedQuery.value) {
        return searchByTextAndFilters(page, language.value, {
          query: filters.debouncedQuery.value,
          ...filterOptions,
        });
      }

      // Caso 2: listados predefinidos
      // Ej: listType="top_rated" → trae el listado fijo de TMDB de mejor valoradas
      if (filters.listType.value !== "discover") {
        return getMovieList(
          filters.listType.value as MovieListType,
          page,
          language.value,
        );
      }

      // Caso 3: solo filtros
      // Ej: genres=[28], yearFrom=2000 → discover con género Acción desde el año 2000
      return searchByFilters(page, language.value, filterOptions);
    },

    /**
     * Determina qué página traer a continuación.
     * @returns la página siguiente, o undefined si ya es la última
     */
    getNextPageParam: (lastPage) => {

      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }

      return undefined;
    },
  });
}