/* ============================================================================
 * COMPOSABLE: useHomeMovies.ts
 * ============================================================================
 *
 * Composable encargado de obtener las películas que se muestran en la
 * pantalla de inicio.
 *
 * Trending, Top Rated y Now Playing son 3 queries independientes (no una
 * sola combinada). Así cada fila de la Home (HomeRow) puede mostrarse apenas
 * su propia data está lista, sin esperar a que las otras dos terminen.
 * Aunque sean 3 useQuery separados, las 3 requests HTTP igual se disparan
 * al mismo tiempo apenas se monta el composable — ninguna espera a que la
 * anterior resuelva.
 * ============================================================================ */

import type { Ref } from "vue";

import { useQuery, keepPreviousData } from "@tanstack/vue-query";

import { getMovieList, getTrendingMovies } from "@/features/movies/services/movies.service";

/**
 * Opciones comunes a las 3 queries de la Home. Se separan acá para no
 * repetirlas 3 veces: mismo tiempo de cache, mismo comportamiento de foco
 * y de placeholder al cambiar de idioma.
 */
const HOME_QUERY_OPTIONS = {
  // Tiempo (ms) que los datos se consideran "fresh" antes de estar "stale".
  staleTime: 1000 * 60 * 5, // 5 min cache
  // No refetchear al volver a la pestaña, para no sobrecargar la API.
  refetchOnWindowFocus: false,
  // Al cambiar de idioma (cambia la queryKey), muestra la data del idioma
  // anterior en vez de vaciar a loading; se reemplaza sola al llegar la nueva.
  placeholderData: keepPreviousData,
} as const;

/**
 * Obtiene las 3 secciones de películas de la Home, cada una como query
 * propia. Cada una expone su .data / .isLoading por separado.
 */
export function useHomeMovies(language: Ref<string>) {

  const trending = useQuery({
    queryKey: ["home-movies", "trending", language],
    queryFn: async () => (await getTrendingMovies(1, language.value)).results,
    ...HOME_QUERY_OPTIONS,
  });

  const topRated = useQuery({
    queryKey: ["home-movies", "top_rated", language],
    queryFn: async () => (await getMovieList("top_rated", 1, language.value)).results,
    ...HOME_QUERY_OPTIONS,
  });

  const nowPlaying = useQuery({
    queryKey: ["home-movies", "now_playing", language],
    queryFn: async () => (await getMovieList("now_playing", 1, language.value)).results,
    ...HOME_QUERY_OPTIONS,
  });

  return { trending, topRated, nowPlaying };
}