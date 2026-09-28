/* ============================================================================
 * COMPOSABLE: useMoviesGenresQuery.ts
 * ============================================================================
 *
 * Obtiene la lista de géneros de películas desde TMDB usando Vue Query.
 *
 * Nota: se cachea agresivamente porque los géneros casi nunca cambian,
 * evitando requests innecesarios. El idioma forma parte del queryKey
 * para que cada idioma tenga su propio cache.
 * ============================================================================ */

import type { Ref } from "vue";

import { useQuery } from "@tanstack/vue-query";

import { getMovieGenres } from "@/features/movies/services/movies.service";

import type { Genre } from "@/features/movies/types/genre";

/**
 * Clave base de Vue Query para la consulta de géneros de películas.
 *
 * Se usa como parte del queryKey para que Vue Query:
 * - Identifique esta consulta en el cache
 * - Reutilice datos cacheados entre componentes
 * - Permite marcar la consulta como desactualizada y volver a obtener sus datos
 *
 * El idioma se agrega dinámicamente al queryKey para que
 * cada idioma tenga su propio cache de géneros.
 */
const MOVIE_GENRES_QUERY_KEY = "movieGenres";

export function useMovieGenresQuery(language: Ref<string>) {  
  return useQuery<Genre[]>({
    // Clave de cache de la query.
    // Si el idioma cambia se vuelven a obtener los generos
    queryKey: [MOVIE_GENRES_QUERY_KEY, language],
    // Mantener cache mucho tiempo
    gcTime: 1000 * 60 * 60 * 24,
    // Función que realiza la llamada HTTP real.
    queryFn: () => getMovieGenres(language.value),
  });
}