/* ============================================================================
 * SERVICE: movies.service.ts
 * ============================================================================
 *
 * Servicio para obtener películas desde la API de TMDB: búsqueda por texto,
 * búsqueda por filtros (discover), búsqueda combinada de texto + filtros,
 * listas predefinidas (populares, en cartelera, etc.), géneros y el detalle
 * completo de una película (detalle, créditos, videos, similares).
 * ============================================================================ */

import api from "../../../core/api/tmdbApi";

import type { Movie } from "@/features/movies/types/movie";
import type { PaginatedResponse } from "@/shared/types/paginated-response";
import type { DiscoverFilters } from "@/features/movies/types/discover-filters";
import type { SearchWithTextAndFilters } from "@/features/movies/types/search-with-text-filters";
import type { Genre } from "@/features/movies/types/genre";
import type { MovieListType } from "@/features/movies/types/movie-list-type";
import type { MovieDetail } from "../types/movie-detail/movie-detail";
import type { MovieCredits } from "../types/movie-detail/credits";
import type { MovieVideosResponse } from "../types/movie-detail/videos-response";

/**
 * Obtiene las películas en tendencia del día (trending).
 *
 * Pensada para Home, donde se busca mostrar contenido con impacto inmediato.
 */
export const getTrendingMovies = async (
  page: number,
  language: string
): Promise<PaginatedResponse<Movie>> => {
  const { data } = await api.get<PaginatedResponse<Movie>>("/trending/movie/day", {
    params: { page, language },
  });

  return data;
};

/**
 * Obtiene una lista predefinida de películas (popular, now_playing, upcoming
 * o top_rated), ya ordenada por TMDB. No admite filtros avanzados.
 *
 * Para "upcoming", TMDB a veces incluye películas ya estrenadas, por eso se
 * filtran manualmente dejando solo las que estrenan hoy o después.
 */
export const getMovieList = async (
  listType: MovieListType,
  page: number,
  language: string
): Promise<PaginatedResponse<Movie>> => {
  const { data } = await api.get<PaginatedResponse<Movie>>(`/movie/${listType}`, {
    params: {
      page,
      language,
      // region: "US", // deshabilitado: limita los resultados
      // a EE.UU. y oculta estrenos de otras regiones
    },
  });

  if (listType === "upcoming") {
    const today = new Date().toISOString().split("T")[0]!;

    data.results = data.results.filter((movie) => movie.release_date >= today);
  }

  return data;
};

/**
 * Busca películas por texto (título) usando /search/movie.
 *
 * No permite combinar filtros avanzados; si se necesitan, se aplican
 * después sobre estos resultados (ver searchByTextAndFilters).
 */
export const searchByText = async (
  query: string,
  page: number,
  language: string
): Promise<PaginatedResponse<Movie>> => {
  const { data } = await api.get<PaginatedResponse<Movie>>("/search/movie", {
    params: { query, page, language },
  });

  return data;
};

/**
 * Busca películas aplicando filtros directamente en la API (/discover/movie):
 * géneros, rango de fechas, rating y ordenamiento. Se usa solo cuando NO hay
 * texto de búsqueda.
 */
export const searchByFilters = async (
  page: number,
  language: string,
  filters: DiscoverFilters = {}
): Promise<PaginatedResponse<Movie>> => {
  const params: Record<string, any> = { page, language };

  // TMDB espera los géneros como string separado por coma: "28,12,16"
  if (filters.genres?.length) {
    params.with_genres = filters.genres.join(",");
  }

  if (filters.yearFrom) {
    params["primary_release_date.gte"] = `${filters.yearFrom}-01-01`;
  }

  if (filters.yearTo) {
    params["primary_release_date.lte"] = `${filters.yearTo}-12-31`;
  }

  if (filters.minRating !== undefined) {
    params["vote_average.gte"] = filters.minRating;
  }

  if (filters.maxRating !== undefined) {
    params["vote_average.lte"] = filters.maxRating;
  }

  // Ej: popularity.desc, vote_average.desc, release_date.asc, etc.
  if (filters.sortBy) {
    params.sort_by = filters.sortBy;
  }

  const { data } = await api.get<PaginatedResponse<Movie>>("/discover/movie", {
    params,
  });

  return data;
};

/**
 * Busca películas por texto y aplica filtros adicionales de forma manual.
 *
 * /search/movie no permite combinar texto con géneros, rating o rango de
 * fechas, así que primero se busca por texto y después se filtra y ordena
 * en el frontend.
 */
export const searchByTextAndFilters = async (
  page: number,
  language: string,
  filters: SearchWithTextAndFilters
): Promise<PaginatedResponse<Movie>> => {
  const data = await searchByText(filters.query, page, language);

  if (data.results.length === 0) {
    return data;
  }

  let results = data.results;

  // Filtro por géneros: se mantiene la película si algún genre_id coincide
  if (filters.genres?.length) {
    results = results.filter((movie) =>
      movie.genre_ids?.some((id) => filters.genres!.includes(id))
    );
  }

  // Filtro por rango de año
  if (filters.yearFrom || filters.yearTo) {
    results = results.filter((movie) => {
      if (!movie.release_date) return false;

      const movieYear = new Date(movie.release_date).getFullYear();

      if (filters.yearFrom && filters.yearTo) {
        return movieYear >= filters.yearFrom && movieYear <= filters.yearTo;
      }
      if (filters.yearFrom) {
        return movieYear >= filters.yearFrom;
      }
      if (filters.yearTo) {
        return movieYear <= filters.yearTo;
      }

      return true;
    });
  }

  if (filters.minRating) {
    results = results.filter((movie) => movie.vote_average >= filters.minRating!);
  }

  if (filters.maxRating) {
    results = results.filter((movie) => movie.vote_average <= filters.maxRating!);
  }

  // Ordenamiento en frontend (TMDB no lo soporta combinado con texto)
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case "popularity.desc":
        results = [...results].sort((a, b) => b.popularity - a.popularity);
        break;
      case "popularity.asc":
        results = [...results].sort((a, b) => a.popularity - b.popularity);
        break;
      case "vote_average.desc":
        results = [...results].sort((a, b) => b.vote_average - a.vote_average);
        break;
      case "vote_average.asc":
        results = [...results].sort((a, b) => a.vote_average - b.vote_average);
        break;
      case "release_date.desc":
        results = [...results].sort(
          (a, b) =>
            new Date(b.release_date ?? 0).getTime() -
            new Date(a.release_date ?? 0).getTime()
        );
        break;
      case "release_date.asc":
        results = [...results].sort(
          (a, b) =>
            new Date(a.release_date ?? 0).getTime() -
            new Date(b.release_date ?? 0).getTime()
        );
        break;
    }
  }

  return {
    ...data,
    results,
    total_results: results.length,
  };
};

/**
 * Obtiene la lista de géneros de películas (/genre/movie/list).
 *
 * Devuelve solo el array de géneros, sin el resto de la metadata de TMDB.
 */
export const getMovieGenres = async (language: string): Promise<Genre[]> => {
  const { data } = await api.get("/genre/movie/list", {
    params: { language },
  });

  return data.genres;
};

/**
 * Obtiene el detalle completo de una película.
 *
 * Si poster y backdrop vienen vacíos en el idioma solicitado, hace fallback
 * al otro idioma (en/es) para no dejar la UI sin imágenes.
 */
export const getMovieDetail = async (
  movieId: number,
  language: string
): Promise<MovieDetail> => {
  if (!movieId) {
    throw new Error("movieId is required");
  }

  const { data } = await api.get<MovieDetail>(`/movie/${movieId}`, {
    params: { language },
  });

  if (!data.backdrop_path && !data.poster_path) {
    const fallbackLang = language === "en" ? "es" : "en";

    const { data: fallbackData } = await api.get<MovieDetail>(`/movie/${movieId}`, {
      params: { language: fallbackLang },
    });

    data.backdrop_path = fallbackData.backdrop_path || data.backdrop_path;
    data.poster_path = fallbackData.poster_path || data.poster_path;
  }

  return data;
};

/**
 * Obtiene los créditos (cast y crew) de una película.
 *
 * Si vienen vacíos en el idioma solicitado, hace fallback al otro idioma
 * (en/es).
 */
export const getMovieCredits = async (
  movieId: number,
  language: string
): Promise<MovieCredits> => {
  if (!movieId) {
    throw new Error("movieId is required");
  }

  const { data } = await api.get<MovieCredits>(`/movie/${movieId}/credits`, {
    params: { language },
  });

  if ((!data.cast || data.cast.length === 0) && (!data.crew || data.crew.length === 0)) {
    const fallbackLang = language === "en" ? "es" : "en";

    const { data: fallbackData } = await api.get<MovieCredits>(
      `/movie/${movieId}/credits`,
      { params: { language: fallbackLang } }
    );

    data.cast = fallbackData.cast.length ? fallbackData.cast : data.cast;
    data.crew = fallbackData.crew.length ? fallbackData.crew : data.crew;
  }

  return data;
};

/**
 * Obtiene los videos (trailers, teasers, clips) de una película.
 *
 * Si no hay videos en el idioma solicitado, hace fallback a la request
 * sin idioma especificado.
 */
export const getMovieVideos = async (
  movieId: number,
  language: string
): Promise<MovieVideosResponse> => {
  const { data } = await api.get(`/movie/${movieId}/videos`, {
    params: { language },
  });

  if (data.results && data.results.length > 0) {
    return data;
  }

  const { data: fallback } = await api.get(`/movie/${movieId}/videos`);

  return fallback;
};

/**
 * Obtiene películas similares a una película específica.
 *
 * Siempre pide los resultados en inglés para mantener consistencia entre
 * títulos, sin importar el idioma activo de la app.
 */
export const getSimilarMovies = async (
  movieId: number,
  page: number
): Promise<PaginatedResponse<Movie>> => {
  const { data } = await api.get<PaginatedResponse<Movie>>(`/movie/${movieId}/similar`, {
    params: {
      page,
      language: "en-US",
    },
  });

  return data;
};