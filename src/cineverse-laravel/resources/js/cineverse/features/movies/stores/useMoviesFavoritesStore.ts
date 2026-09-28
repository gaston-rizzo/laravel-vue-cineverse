/* ============================================================================
 * STORE: useMoviesFavoritesStore.ts (Pinia Store)
 * ============================================================================
 * 
 * Store que gestiona la lista de películas favoritas del usuario.
 * Las películas que el usuario marca como favoritas se guardan acá y se
 * mantienen incluso al recargar la página gracias a la persistencia.
 * 
 * Reglas de negocio:
 * - No se permiten duplicados
 * - Máximo de 20 favoritos (MAX_FAVORITES)
 * ============================================================================ */

import { ref, computed } from "vue";

import { defineStore } from "pinia";

import type { Movie } from "@/features/movies/types/movie";

// Límite máximo de favoritos permitidos
const MAX_FAVORITES = 20;

export const useFavoritesStore = defineStore(
  "favorites",
  () => {

    // Lista reactiva de películas favoritas
    const favorites = ref<Movie[]>([]);

    /** Cantidad actual de películas en favoritos. */
    const favoritesCount = computed(() =>
      favorites.value.length
    );

    /**
     * Verifica si una película ya está en favoritos por su id.
     * @param id - Id de la película a buscar
     * @returns true si existe en favoritos
     */
    const isFavorite = (id: number) => {
      return favorites.value.some(m => m.id === id);
    };

    /**
     * Agrega una película a favoritos.
     * No hace nada si ya existe o si se alcanzó MAX_FAVORITES.
     * @param movie - Película a agregar
     * @returns true si se agregó, false si ya existía o se llegó al límite
     */
    const addFavorite = (movie: Movie) => {

      const exists = favorites.value.some(m => m.id === movie.id);
      
      if (exists) return false;

      if (favorites.value.length >= MAX_FAVORITES) return false;

      favorites.value.push(movie);
      return true;
    };

    /**
     * Elimina una película de favoritos por su id.
     * @param id - Id de la película a eliminar
     */
    const removeFavorite = (id: number) => {
      favorites.value = favorites.value.filter(m => m.id !== id);
    };

    /**
     * Vacía por completo la lista de favoritos.
     */
    const clearFavorites = () => {
      favorites.value = [];
    };

    // Expone datos y funciones del store
    return {
      favorites,
      isFavorite,
      addFavorite,
      removeFavorite,
      clearFavorites,
      favoritesCount
    };
  },
  {
    // Persiste el estado automáticamente en storage
    persist: true,
  }
);