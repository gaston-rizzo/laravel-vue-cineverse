/* ============================================================================
 * COMPOSABLE: useMovieDetail.ts
 * ============================================================================
 *
 * Obtiene el detalle completo de una película usando Vue Query, combinando
 * varias llamadas a la API en una sola consulta lista para la UI:
 * detalle principal, créditos (cast + director), videos y similares.
 * ============================================================================ */

import type { Ref } from "vue";

import { useQuery } from "@tanstack/vue-query";

import {
  getMovieDetail,
  getMovieCredits,
  getMovieVideos,
  getSimilarMovies
} from "../../services/movies.service";

import type { Movie } from "../../types/movie";
import type { MovieDetail } from "../../types/movie-detail/movie-detail";
import type { CastMember } from "../../types/movie-detail/cast";

// Data ya procesada y lista para la UI
type MovieDetailResult = {
  movie: MovieDetail;
  cast: CastMember[];
  director: { name: string } | null;
  trailer: string | null;
  similar: Movie[];
};

export function useMovieDetail(id: number, language: Ref<string>) {
  return useQuery<MovieDetailResult>({
    // Si cambia id o language, se ejecuta de nuevo con cache separado
    queryKey: ["movie-detail", id, language],

    // Solo ejecuta si el id es válido (evita requests con NaN/undefined)
    enabled: Number.isFinite(id) && id > 0,

    // Sin reintentos: un "not found" es un error lógico, no transitorio.
    // Reintentar no cambiaría el resultado y solo generaría requests de más.
    retry: false,

    // No refetchea al volver a la pestaña
    refetchOnWindowFocus: false,

    queryFn: async () => {

      const movieData = await getMovieDetail(id, language.value);

      // Corta el flujo y dispara error en la query si no existe
      if (!movieData) {
        throw new Error("Movie not found");
      }

      // Requests en paralelo para optimizar tiempo
      const [creditsData, videosData, similarData] =
        await Promise.all([
          getMovieCredits(id, language.value),
          getMovieVideos(id, language.value),
          getSimilarMovies(id, 1),
        ]);

      // Trailer oficial de YouTube
      const trailerData = videosData.results.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      );

      trailer: videosData.results[0]?.key ?? null

      // Director dentro del crew
      const director = creditsData.crew.find(
        (p) => p.job === "Director"
      );

      return {
        movie: movieData,
        cast: creditsData.cast.slice(0, 10), // limita a 10 actores
        director: director ? { name: director.name } : null,
        trailer: trailerData ? trailerData.key : null,
        similar: similarData.results,
      };
    },
  });
}