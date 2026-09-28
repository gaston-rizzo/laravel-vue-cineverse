<script setup lang="ts">

/* ============================================================================
 * VIEW: MoviesView.vue
 * ============================================================================
 *
 * Página contenedora que combina el panel de filtros (MovieFilters) y la
 * grilla de resultados (MovieResults). Gestiona los filtros mediante el
 * composable useMoviesFilters, ejecuta la query paginada de películas con
 * useMoviesQuery, y sincroniza el idioma de la API con el idioma actual
 * de la app. Expone un resetSignal para que MovieResults reinicie la
 * grilla por completo cuando los filtros cambian.
 * ============================================================================ */

import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useMoviesFilters } from "@/features/movies/composables/useMoviesFilters";
import { useMoviesQuery } from "@/features/movies/composables/useMoviesQuery";

import MovieFilters from "../components/MovieFilters.vue";
import MovieResults from "../components/MovieResults.vue";

// Composable que gestiona el estado de los filtros (género, año, calificación,
// búsqueda por texto, etc.) y expone un queryKey para detectar cuándo cambian
const filters = useMoviesFilters();

// Idioma actual de la app, usado para pedirle a la API los resultados
// en el idioma correcto
const { locale } = useI18n();
const apiLanguage = locale;

// useMoviesQuery recibe los filtros y el idioma, y devuelve los resultados
// paginados junto con el estado de la query (loading, error, paginación)
const {
  data,
  isLoading,
  isFetching,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useMoviesQuery(filters, apiLanguage);

// Señal que le indica a MovieResults que debe reiniciar la grilla por
// completo (limpiar películas, resetear flags de scroll, volver al top).
// Es un número y no un booleano porque el watcher de MovieResults necesita
// detectar cada cambio de valor: con un booleano, resets consecutivos
// podrían no dispararse si el usuario cambia filtros rápido
const resetSignal = ref(0);

/**
 * Reacciona a cualquier cambio en los filtros (filters.queryKey): saca el
 * foco del input o combo activo, ya que sin el blur() a veces el input
 * queda activo y el scroll infinito puede comportarse raro; y aumenta
 * resetSignal para que MovieResults reinicie su estado.
 */
watch(
  () => filters.queryKey.value,
  () => {
    (document.activeElement as HTMLElement)?.blur();
    resetSignal.value++;
  }
);

</script>

<template>
  
  <div class="page-wrapper">
    <div class="movies-layout">
      
      <aside class="filters-panel">
        <MovieFilters :movieFilters="filters" />
      </aside>

      <main class="movies-content">

        <MovieResults
          :data="data"
          :isLoading="isLoading"
          :isFetching="isFetching"
          :error="error"
          :hasNextPage="hasNextPage"
          :isFetchingNextPage="isFetchingNextPage"
          :resetSignal="resetSignal"
          @load-more="fetchNextPage"
        />

      </main>
    </div>
  </div>
</template>

<style scoped>

/* ============================================================================
 * PAGE WRAPPER
 * Contenedor principal de la página de películas.
 *
 * Responsabilidades:
 * - Define color de fondo y color de texto
 * - Maneja padding superior e inferior
 * - overflow visible para dropdowns/filtros activos
 * - isolation: isolate para mantener pseudo-elementos separados
 * ============================================================================ */

.page-wrapper {
  position: relative; /* necesario para posicionar ::before y ::after */
  overflow: visible;
  color: #e5e7eb;
  padding-top: 20px;
  padding-bottom: 40px;
  background: #0b0f19;
  isolation: isolate;
}

/* fondo animado con luces radiales, blur y movimiento continuo. */
.page-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;

  background:
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.15), transparent 40%),
    radial-gradient(
      circle at 80% 30%,
      rgba(124, 58, 237, 0.18),
      transparent 45%
    ),
    radial-gradient(
      circle at 50% 80%,
      rgba(30, 64, 175, 0.18),
      transparent 50%
    ),
    linear-gradient(180deg, #0b0f19 0%, #0f172a 40%, #0b0f19 100%);

  filter: blur(90px);

  animation: backgroundDrift 45s ease-in-out infinite alternate;
}

/* alterna suavemente posición y escala del fondo animado. */
@keyframes backgroundDrift {
  0% {
    transform: translate3d(-4%, -2%, 0) scale(1);
  }

  50% {
    transform: translate3d(3%, 2%, 0) scale(1.1);
  }

  100% {
    transform: translate3d(-2%, 4%, 0) scale(1.05);
  }
}

/* capa de ruido/textura sutil, sin interferir con interacciones. */
.page-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/noise.svg");
  opacity: 0.06;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* ============================================================================
 * MOVIES LAYOUT
 * Contenedor de sidebar y grilla de películas.
 *
 * Responsabilidades:
 * - Distribuye el sidebar y contenido principal en columnas
 * - Define gap entre columnas
 * - Centra la grilla horizontalmente
 * ============================================================================ */

.movies-layout {
  display: grid;
  /* primera columna (280px): sidebar con filtros */
  /* segunda columna (1fr): contenido principal donde aparecen las películas */
  grid-template-columns: 280px 1fr;
  gap: 32px;
  /* como .movies-layout tiene margin: auto y max-width: 1400px, toda la grilla queda centrada en la página */
  max-width: 1400px; /* ancho máximo de la grilla */
  margin: auto;      /* centra la grilla horizontalmente */
  padding: 30px;
  padding-bottom: 20px;
  position: relative;
  z-index: 1;
}

/* ============================================================================
 * FILTERS PANEL
 * Sidebar con filtros de películas.
 *
 * Responsabilidades:
 * - Mantener posición sticky al hacer scroll
 * - Ajustar altura automáticamente
 * - Alinear al inicio de la grilla
 * ============================================================================ */

.filters-panel {
  position: sticky;
  top: 110px;
  height: fit-content;
  align-self: start;
}

/* ============================================================================
 * MOVIES CONTENT
 * Contenedor principal de la grilla de películas.
 *
 * Responsabilidades:
 * - Organiza películas en columna
 * - Define separación vertical entre items
 * - Mantiene isolation para pseudo-elementos internos
 * ============================================================================ */

.movies-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  isolation: isolate;
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
  .movies-layout {
    grid-template-columns: 1fr;
    padding: 20px;
    gap: 24px;
  }

  .filters-panel {
    position: relative;
    top: auto;
  }
}

@media (max-width: 768px) {
  .movies-layout {
    padding: 16px;
    gap: 20px;
  }

  .page-wrapper {
    padding-top: 10px;
  }
}

@media (max-width: 480px) {
  .movies-layout {
    padding: 12px;
    gap: 16px;
  }
}

</style>