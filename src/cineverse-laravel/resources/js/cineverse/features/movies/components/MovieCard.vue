<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieCard.vue
 * ============================================================================
 *
 * Tarjeta interactiva de una película dentro de la grilla. Muestra el poster
 * con carga progresiva (skeleton), aplica efectos de tilt 3D, glare y overlay
 * con info adicional (título, año, sinopsis) y acciones (ver detalle, favorito).
 * ============================================================================ */

import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import { useFavoritesStore } from "@/features/movies/stores/useMoviesFavoritesStore";

import type { Movie } from "@/features/movies/types/movie";

// Props recibidas del componente padre:
// - movie: datos de la película
// - delay: delay de animación de entrada (ms), para escalonar la grilla
defineProps<{
  movie: Movie;
  delay: number;
}>();

// Hook de i18n para traducir textos
const { t } = useI18n();

// Evita que el poster se vea vacío mientras la imagen carga.
// Empieza en false y se activa con el evento "load" de la <img>.
const imageLoaded = ref(false);

// Navegación y lectura de params de la ruta actual (para preservar el idioma)
const router = useRouter();
const route = useRoute();

// Store de favoritos (agregar / quitar / consultar estado)
const favorites = useFavoritesStore();

// Muestra el tooltip de "límite alcanzado" cuando addFavorite falla por MAX_FAVORITES
const showLimitTooltip = ref(false);

// Timeout activo para ocultar el tooltip, evita que se pisen si el usuario clickea rápido
let limitTooltipTimeout: ReturnType<typeof setTimeout> | null = null;

/** Marca el poster como cargado, ocultando el skeleton. */
function onPosterLoad() {
  imageLoaded.value = true;
}

/**
 * Navega al detalle de la película, preservando el idioma actual.
 * @param id - Id de la película
 */
function goToMovie(id: number) {
  router.push({
    name: "MovieDetail",
    params: {
      lang: route.params.lang,
      id,
    },
  });
}

/**
 * Agrega o quita la película de favoritos según su estado actual.
 * @param movie - Película a alternar
 */
function onFavoriteClick(movie: Movie) {

  if (favorites.isFavorite(movie.id)) {
    favorites.removeFavorite(movie.id);
    return;
  }

  const added = favorites.addFavorite(movie);

  if (added) return;

  // No se pudo agregar por límite: muestra el tooltip un par de segundos
  showLimitTooltip.value = true;

  if (limitTooltipTimeout) {
    clearTimeout(limitTooltipTimeout);
  }
    
  limitTooltipTimeout = setTimeout(() => {
    showLimitTooltip.value = false;
  }, 1500);
}

</script>

<template>

  <div
    class="movie-card"
    :style="{ animationDelay: delay + 'ms' }"
    @click="goToMovie(movie.id)"
  >

    <div
      class="tilt-layer"
      ref="cardRef"
    >
      <div class="poster-wrapper">
        <div class="glare"></div>

        <div v-if="!imageLoaded" class="poster-skeleton"></div>

        <img
          :src="`https://image.tmdb.org/t/p/w500${movie.poster_path}`"
          :alt="movie.title"
          class="poster"
          :class="{ loaded: imageLoaded }"
          loading="lazy"
          @load="onPosterLoad"
        />

        <button
          class="btn-favorite"
          :class="{ active: favorites.isFavorite(movie.id) }"
          @click.stop="onFavoriteClick(movie)"
        >
          {{ favorites.isFavorite(movie.id) ? "❤️" : "♥" }}
        </button>

        <Transition name="tooltip-fade">
          <span v-if="showLimitTooltip" class="favorite-limit-tooltip">
            {{ t("movies.favoriteLimitReached") }}
          </span>
        </Transition>

        <!-- BARRA INFERIOR PERMANENTE -->
        <div class="title-bar">

          <div class="title-row">
            <span class="rating-badge">
              ⭐ {{ movie.vote_average?.toFixed(1) }}
            </span>

            <h3 class="movie-title">
              {{ movie.title }}
            </h3>
          </div>

        </div>

        <!-- OVERLAY HOVER -->
        <div class="poster-overlay">

          <div class="overlay-content">

            <h3 class="overlay-title">
              {{ movie.title }}
            </h3>

            <p class="year">
              {{ movie.release_date?.slice(0, 4) }}
            </p>

            <p class="overview">
              {{ movie.overview || t("movies.noDescription") }}
            </p>

            <button class="details-btn">
              {{ t("movies.viewDetails") }}
            </button>

          </div>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>

/* ============================================================================
 * MOVIE CARD
 * Contenedor principal de la tarjeta dentro de la grilla.
 *
 * Responsabilidades:
 * - Habilitar el contexto 3D para el tilt (preserve-3d)
 * - Animar la entrada de la card (fade + slide + scale)
 * - Elevarse levemente en hover
 * ============================================================================ */

.movie-card {
  cursor: pointer;
  transition:
    transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1),
    filter 0.3s ease;
  transform-style: preserve-3d;
  will-change: transform;

  /* estado inicial antes de la animación de entrada */
  opacity: 0;
  transform: translateY(30px) scale(0.96);
  animation: cardEnter 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

/* fade-in + slide-up + scale al aparecer en pantalla. */
@keyframes cardEnter {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.movie-card:hover {
  transform: translateY(-4px);
}

/* ============================================================================
 * POSTER WRAPPER
 * Contenedor del poster: borde con gradiente y glow general de la card.
 *
 * Responsabilidades:
 * - Recortar el poster con border-radius
 * - Pintar el borde con gradiente vía doble background (padding-box +
 *   border-box), sin pseudo-elementos extra
 * - Disparar el brillo diagonal (::after) en hover
 * ============================================================================ */

.poster-wrapper {
  position: relative;
  aspect-ratio: 2/3;
  border-radius: 14px;
  overflow: hidden;
  isolation: isolate;
  border: 2px solid transparent;
  transform: translateZ(0);
  backface-visibility: hidden;

  background:
    linear-gradient(#000, #000) padding-box,
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.6),
      rgba(255, 0, 60, 0.7),
      rgba(255, 140, 0, 0.6),
      rgba(255, 230, 0, 0.5),
      rgba(255, 0, 60, 0.7),
      rgba(120, 0, 255, 0.6),
      rgba(255, 255, 255, 0.6)
    ) border-box;

  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.95),
    0 0 25px rgba(255, 0, 60, 0.4);
}

/* franja de luz diagonal que barre el poster en hover. */
.poster-wrapper::after {
  content: "";
  position: absolute;
  inset: -40%;

  background: linear-gradient(
    110deg,
    transparent 40%,
    rgba(255, 255, 255, 0.35) 50%,
    transparent 60%
  );

  transform: translateX(-120%) rotate(12deg);
  opacity: 0;
  /* transition corta de opacity para que no quede pegado en dos cards a la vez */
  transition:
    transform 1.6s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.12s ease;
  pointer-events: none;
}

/* Al pasar el mouse, la franja de luz termina de cruzar el poster y se hace visible */
.movie-card:hover .poster-wrapper::after {
  opacity: 1;
  transform: translateX(120%) rotate(12deg);
}

/* ============================================================================
 * POSTER + SKELETON
 * Imagen principal de la card y su placeholder mientras carga.
 *
 * Responsabilidades:
 * - Poster: cubrir el contenedor manteniendo proporción, fade-in al cargar
 * - Skeleton: shimmer animado que ocupa el lugar del poster hasta que
 *   la imagen real termina de cargar
 * ============================================================================ */

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}

.poster.loaded {
  opacity: 1;
}

.movie-card:hover .poster {
  transform: scale(1.015);
  /* oscurece y desenfoca el poster para destacar el overlay */
  filter: brightness(0.75) blur(2px);
  z-index: 1;
}

.poster-skeleton {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: linear-gradient(110deg, #1a102c 25%, #5b1d55 37%, #1a102c 63%);
  background-size: 200% 100%;
  animation: skeleton 1.6s linear infinite;
}

/* desplaza el gradiente para simular el brillo en movimiento. */
@keyframes skeleton {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

/* ============================================================================
 * TITLE BAR
 * Barra inferior siempre visible con el rating y el título.
 *
 * Responsabilidades:
 * - Fondo glass sobre el poster
 * - Layout horizontal: badge de rating + título clamped a 2 líneas
 * ============================================================================ */

.title-bar {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  padding: 8px 10px;
  background: rgba(20, 20, 25, 0.55);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  color: #111;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 8px;
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.45),
    0 0 10px rgba(250, 204, 21, 0.25);
  white-space: nowrap;
}

.movie-title {
  font-size: 14px;
  font-weight: 600;
  color: #f9fafb;
  line-height: 1.3;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
}

/* ============================================================================
 * HOVER OVERLAY
 * Capa con título, año, sinopsis y botón de detalle sobre el poster.
 *
 * Responsabilidades:
 * - Overlay: fade in/out sobre gradiente oscuro (sin escala ni desplazamiento,
 *   para evitar artefactos al salir del hover)
 * - Overlay content: fade + slide-up, un paso detrás del overlay
 * ============================================================================ */

.poster-overlay {
  position: absolute;
  inset: 0;

  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.96) 10%,
    rgba(0, 0, 0, 0.85) 45%,
    rgba(0, 0, 0, 0.65) 70%,
    rgba(0, 0, 0, 0.35) 100%
  );

  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  opacity: 0;
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
    filter 0.35s ease;
  z-index: 3;
}

.movie-card:hover .poster-overlay {
  opacity: 1;
  filter: blur(0);
}

.overlay-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 6px;
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

.movie-card:hover .overlay-content {
  opacity: 1;
  transform: translateY(0);
}

.overlay-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.year {
  font-size: 12px;
  color: #9ca3af;
}

.overview {
  font-size: 13px;
  color: #e5e7eb;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 9;
  -webkit-line-clamp: 9;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============================================================================
 * TILT 3D + GLARE
 * Capa que recibe la transformación 3D desde JS (handleGridMouseMove) y
 * el reflejo de luz que sigue al cursor.
 *
 * Responsabilidades:
 * - Tilt layer: separado de .movie-card para no interferir con cardEnter
 * - Glare: radial-gradient centrado en --glare-x/--glare-y, actualizadas
 *   desde JS en cada mousemove
 * ============================================================================ */

.tilt-layer {
  transition: transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
  transform-style: preserve-3d;
  will-change: transform;
  --glare-x: 50%;
  --glare-y: 50%;
}

.glare {
  z-index: 2;
  position: absolute;
  inset: 0;
  pointer-events: none;

  background: radial-gradient(
    circle at var(--glare-x) var(--glare-y),
    rgba(255, 255, 255, 0.35),
    rgba(255, 255, 255, 0.15) 18%,
    transparent 40%
  );

  mix-blend-mode: normal;
  opacity: 0;
  transition: opacity 0.25s ease;

  /* fix Firefox: fuerza su propio layer de composición */
  transform: translateZ(0);
  will-change: transform;
  isolation: isolate;
}

.movie-card:hover .glare {
  opacity: 1;
}

/* ============================================================================
 * DETAILS BUTTON
 * Botón principal de acción ("ver detalles").
 *
 * Responsabilidades:
 * - Entrar con rebote (btnBounce) cuando aparece el overlay
 * - Mostrar brillo deslizante (::after) en hover
 * ============================================================================ */

.details-btn {
  position: relative;
  margin-top: 10px;
  background: #e50914;
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0;
  transform: translateY(8px);
  transition:
    transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 0.25s ease,
    background 0.2s ease,
    opacity 0.25s ease;
}

.movie-card:hover .details-btn {
  opacity: 1;
  animation: btnBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* entra desde abajo con un rebote de dos pasos antes de asentarse. */
@keyframes btnBounce {
  0% { transform: translateY(12px) scale(0.95); opacity: 0; }
  40% { transform: translateY(-4px) scale(1.05); opacity: 1; }
  65% { transform: translateY(2px) scale(0.99); }
  85% { transform: translateY(-1px) scale(1.01); }
  100% { transform: translateY(0) scale(1); }
}

.details-btn:hover {
  background: #ff1e2d;
  box-shadow:
    0 8px 22px rgba(229, 9, 20, 0.45),
    0 0 14px rgba(229, 9, 20, 0.35);
}

/* brillo que atraviesa el botón en hover (mismo truco que el poster). */
.details-btn::after {
  content: "";
  position: absolute;
  inset: 0;

  background: linear-gradient(
    110deg,
    transparent 30%,
    rgba(255, 255, 255, 0.45) 50%,
    transparent 70%
  );

  transform: translateX(-140%);
  transition: transform 0.6s ease;
}

/* Al pasar el mouse, el brillo termina de cruzar el botón */
.details-btn:hover::after {
  transform: translateX(140%);
}

/* ============================================================================
 * FAVORITE BUTTON
 * Botón circular (♥ / ❤️) en la esquina superior del poster.
 *
 * Responsabilidades:
 * - Reflejar el estado de favorito y dar feedback rápido al click/hover
 * - Mostrar un corazón roto (💔) al pasar el mouse sobre un favorito activo,
 *   como indicador de la acción de "quitar"
 * ============================================================================ */

.btn-favorite {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(20, 20, 25, 0.45);
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  z-index: 4;

  /* oculto por defecto (corazón blanco, sin hover) */
  opacity: 0;
  pointer-events: none;
}

/* corazón blanco: aparece solo con hover en la card */
.movie-card:hover .btn-favorite {
  opacity: 1;
  pointer-events: auto;
}

.btn-favorite:hover {
  background: #ff2a5a;
  animation: heartbeat 0.7s infinite;
}

/* corazón rojo: siempre visible, con o sin hover */
.btn-favorite.active {
  font-size: 14px;
  background: rgba(20, 20, 25, 0.45);
  border-color: rgba(255, 255, 255, 0.35);
    opacity: 1;
  pointer-events: auto;
}

.btn-favorite.active:hover {
  animation: none;
  transform: scale(1.1);
}

/* corazón roto centrado (bug fix: faltaba display:flex). */
.btn-favorite.active:hover::after {
  content: "💔";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* pulso de "latido": agranda, vuelve, pulso secundario más chico. */
@keyframes heartbeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.25); }
  40% { transform: scale(1); }
  60% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

/* ============================================================================
 * FAVORITE LIMIT TOOLTIP
 * Aviso flotante que aparece un par de segundos cuando el usuario intenta
 * agregar un favorito habiendo llegado a MAX_FAVORITES (ver useMoviesFavoritesStore).
 *
 * Responsabilidades:
 * - Posicionarse pegado al botón de favorito, sin desplazar el layout
 * - Animar entrada y salida vía <Transition name="tooltip-fade"> (ver template)
 * ============================================================================ */

.favorite-limit-tooltip {
  position: absolute;
  top: 48px;
  right: 10px;
  z-index: 5;

  max-width: 160px;
  padding: 6px 10px;
  border-radius: 8px;

  background: rgba(20, 20, 25, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f5f5f5;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;

  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;

  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

/* estado inicial de entrada y estado final de salida */
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.95);
}

/* durante la transición de salida, Vue mantiene el elemento en el DOM
   con position:absolute activo, así que no rompe el layout mientras se va */
.tooltip-fade-leave-active {
  position: absolute;
}

/* ============================================================================
 * RESPONSIVE
 * Ajustes para mobile y pantallas chicas.
 *
 * Responsabilidades:
 * - Desactivar efectos que dependen de hover/mouse (lift, glare, brillo, tilt)
 * - Dejar el overlay y sus acciones siempre visibles
 * - Reducir tamaños de fuente y paddings en breakpoints chicos
 * ============================================================================ */

@media (max-width: 768px) {
  .movie-card:hover {
    transform: none;
  }

  .poster-overlay {
    opacity: 1;
    transform: none;
    filter: none;
  }

  .overlay-content {
    opacity: 1;
    transform: none;
  }

  .details-btn {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .glare {
    display: none;
  }

  .poster-wrapper::after {
    display: none;
  }
}

@media (max-width: 480px) {
  .overview {
    line-clamp: 4;
    -webkit-line-clamp: 4;
    font-size: 12px;
  }

  .overlay-title {
    font-size: 14px;
  }

  .movie-title {
    font-size: 12px;
  }

  .rating-badge {
    font-size: 10px;
    padding: 3px 6px;
  }

  .btn-favorite {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .details-btn {
    font-size: 12px;
    padding: 6px 10px;
  }

  .title-bar {
    padding: 6px 8px;
  }

  .poster-overlay {
    padding: 12px;
  }
}

</style>