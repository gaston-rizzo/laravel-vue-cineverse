<script setup lang="ts">

/* ============================================================================
 * VIEW: MovieDetailView.vue
 * ============================================================================
 *
 * Vista del detalle de una película. Obtiene el id desde la ruta, llama al
 * composable useMovieDetail para traer los datos desde TMDB, maneja los
 * estados de carga y error, renderiza MovieHero y MovieTabs, y controla
 * el modal del tráiler (incluyendo cierre con Escape y bloqueo de scroll).
 * ============================================================================ */

import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import { useHeaderCollapsed } from "@/layouts/composables/useHeaderCollapsed";
import { useMovieDetail } from "../composables/movie-detail/useMovieDetail";

import MovieHero from "../components/movie-detail/MovieHero.vue";
import MovieTabs from "../components/movie-detail/MovieTabs.vue";

// Acceso a los parámetros de la ruta actual (ej: /movie/:id)
const route = useRoute();

// Extrae el id de la película desde la URL; fallback a 0 si falla la conversión
const id = Number(route.params.id) || 0;

// t() para textos traducidos; locale se usa como dependencia reactiva de TMDB
const { t, locale } = useI18n();

// Composable que trae el detalle de la película desde TMDB (data, loading, error)
const { data, isLoading, isError } = useMovieDetail(id, locale);

// Alias de isError, usado para mostrar la pantalla de error (ej: 404)
const error = isError;

// Indica si MovieHero terminó de renderizar; oculta el loader cuando es true
const heroReady = ref(false);

// Controla si el modal del tráiler está abierto
const isTrailerOpen = ref(false);

// Estado global del header (plegado/expandido), usado para ajustar alturas del layout
const { isHeaderCollapsed } = useHeaderCollapsed();

// Película extraída de data; undefined mientras no haya cargado
const movie = computed(() => data.value?.movie);

// Cast del elenco; [] por defecto para evitar errores de undefined en el template
const cast = computed(() => data.value?.cast ?? []);

// Id del tráiler; null si la película no tiene uno disponible
const trailer = computed(() => data.value?.trailer ?? null);

// Director de la película; null si no viene en la respuesta
const director = computed(() => data.value?.director ?? null);

// Películas similares; [] por defecto para evitar v-if undefined
const similar = computed(() => data.value?.similar ?? []);

// Fuerza a remontar el hero cuando cambia el idioma sin remontar toda la vista.
const detailRenderKey = computed(() => `${id}-${locale.value}`);

/**
 * Se ejecuta cuando MovieHero emite "ready" (imágenes cargadas, layout
 * estable). Marca heroReady para ocultar el loader en el momento justo
 * y evitar mostrar contenido incompleto al usuario.
 */
function onHeroReady() {
  heroReady.value = true;
}

// Al cambiar idioma o iniciar una recarga, se vuelve a coordinar la entrada
// para que hero y pestaÃ±as aparezcan juntos cuando los datos estÃ©n listos.
watch(
  () => locale.value,
  () => {
    heroReady.value = false;
  }
);

watch(isLoading, (loading) => {
  if (loading) {
    heroReady.value = false;
  }
});

/**
 * Abre el modal del tráiler. Verifica antes que exista un tráiler
 * disponible para evitar mostrar un modal vacío.
 */
function openTrailer() {
  if (!trailer.value) return;
  isTrailerOpen.value = true;
}

/**
 * Cierra el modal del tráiler. Al desmontarse el iframe, la reproducción
 * se detiene automáticamente.
 */
function closeTrailer() {
  isTrailerOpen.value = false;
}

/**
 * Cierra el modal del tráiler al presionar Escape, mejorando la
 * accesibilidad sin depender del mouse.
 */
function handleKey(e: KeyboardEvent) {
  if (e.key === "Escape" && isTrailerOpen.value) {
    closeTrailer();
  }
}

/**
 * Sincroniza el scroll del body con el estado del modal del tráiler:
 * lo bloquea al abrir y lo restaura al cerrar, manteniendo el control
 * en un solo lugar reactivo.
 */
watch(isTrailerOpen, (val) => {
  document.body.style.overflow = val ? "hidden" : "";
});

// Registra el listener global de teclado para poder cerrar el tráiler con Escape
onMounted(() => {
  window.addEventListener("keydown", handleKey);
});

// Limpia el listener y restaura el scroll por seguridad al desmontar el componente
onUnmounted(() => {
  window.removeEventListener("keydown", handleKey);
  document.body.style.overflow = "";
});

</script>

<template>

  <div 
    class="detail-wrapper"
    :class="{ 'is-error': error,
              'is-header-collapsed': isHeaderCollapsed
     }"
  >

    <!-- ERROR -->
    <div v-if="error" class="error-hero">

      <div class="error-content">

        <h1 class="error-title">
          <span class="error-icon">🎬</span>
          <span class="error-text">
            {{ t('movieDetail.notFoundTitle') }}
          </span>
        </h1>

        <p class="error-sub">
          {{ t('movieDetail.notFoundMessage') }}
        </p>

        <RouterLink class="btn-error" :to="`/${locale}/movies`">

          <svg
            class="icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          
          {{ t('movieDetail.backToMovies') }}

        </RouterLink>

      </div>

    </div>

    <div v-else>

      <MovieHero
        v-if="movie"
        :key="`hero-${detailRenderKey}`"
        :movie="movie"
        :cast="cast"
        :director="director"
        :hasTrailer="!!trailer"
        @openTrailer="openTrailer"
        @ready="onHeroReady"
      />

      <MovieTabs
        v-if="heroReady && movie"
        :key="`tabs-${detailRenderKey}`"
        :cast="cast"
        :similar="similar"
        :movieId="id"
        :movieTitle="movie.title"
      />

      <!-- LOADER COMO OVERLAY -->
      <div v-if="isLoading || !heroReady" class="loading-overlay">

        <div class="loading-content">

          <div class="spinner"></div>
          <h1 class="loading-title">
            {{ t('movieDetail.loadingTitle') }}
          </h1>
          <p class="loading-sub">
            {{ t('movieDetail.loadingSubtitle') }}
          </p>

        </div>

      </div>

    </div>

    <Transition name="trailer">

      <!-- TRAILER MODAL -->
      <div
        v-if="isTrailerOpen && trailer"
        class="trailer-modal"
      >

        <div class="trailer-window">

          <!-- HEADER / BARRA -->
          <div class="trailer-header">

            <span class="trailer-title">
              {{ t('movieDetail.playTrailer') }}
            </span>

            <button class="btn-close" @click="closeTrailer">
              ✕
            </button>                        

          </div>

          <!-- VIDEO -->
          <div class="trailer-content" @click.stop>
            <iframe
              :src="`https://www.youtube.com/embed/${trailer}?autoplay=1`"
              title="Trailer"
              frameborder="0"
              allow="autoplay; encrypted-media"
              allowfullscreen
            ></iframe>
          </div>

        </div>

      </div>

    </Transition>

  </div>

</template>

<style scoped>

/* ============================================================================
 * DETAIL WRAPPER
 * Contenedor principal de la vista de detalle.
 *
 * Responsabilidades:
 * - Fondo oscuro, ocupa toda la pantalla, layout en columna
 * - Base para loader, error y contenido
 * ============================================================================ */

.detail-wrapper {
  position: relative;
  background: #0b0f19;
  color: #e5e7eb;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  isolation: isolate;
}

/* fondo animado con gradientes radiales, blur y movimiento sutil (detrás del contenido). */
.detail-wrapper::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.15), transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(124, 58, 237, 0.18), transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(30, 64, 175, 0.18), transparent 50%),
    linear-gradient(180deg, #0b0f19 0%, #0f172a 40%, #0b0f19 100%);
  filter: blur(90px);
  animation: cinematicBg 45s ease-in-out infinite alternate;
}

.detail-wrapper::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background-image: url("@/assets/noise.svg");
  opacity: 0.06;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* desplazamiento suave y cambio de opacidad del fondo animado. */
@keyframes cinematicBg {
  0% { transform: translate3d(-4%, -2%, 0) scale(1); }
  50% { transform: translate3d(3%, 2%, 0) scale(1.1); }
  100% { transform: translate3d(-2%, 4%, 0) scale(1.05); }
}

/* eleva el contenido por encima del fondo animado (::before). */
.error-content,
.loading-content,
.trailer-modal,
.detail-content {
  position: relative;
  z-index: 1;
}

/* altura mínima para que el footer no quede flotando cuando hay poco contenido (error). */
.detail-wrapper.is-error {
  min-height: calc(100vh - 133px); /* header normal */
}

.detail-wrapper.is-header-collapsed {
  min-height: calc(100vh - 63px); /* header colapsado */
}

/* ============================================================================
 * LOADING OVERLAY
 * Capa que cubre la vista mientras cargan los datos.
 *
 * Responsabilidades:
 * - Bloquear interacción y centrar el loader
 * - Overlay translúcido + blur, sin reemplazar el fondo global
 * ============================================================================ */

.loading-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #0b0f19;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
  z-index: 10;
}

.loading-overlay::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.15), transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(124, 58, 237, 0.18), transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(30, 64, 175, 0.18), transparent 50%),
    linear-gradient(180deg, #0b0f19 0%, #0f172a 40%, #0b0f19 100%);
  filter: blur(90px);
  animation: cinematicBg 45s ease-in-out infinite alternate;
  pointer-events: none;
  z-index: 0;
}

.loading-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/noise.svg");
  opacity: 0.06;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 0;
}

/* ============================================================================
 * DETAIL CONTENT
 * Contenedor central del contenido.
 *
 * Responsabilidades:
 * - Limitar y centrar el ancho del contenido
 * - Mantener consistencia con MoviesView
 * ============================================================================ */

.detail-content {
  max-width: 1400px;
  margin: auto;
  padding: 40px 30px;
  position: relative;
}

/* ============================================================================
 * LOADING CONTENT
 * Contenido visible del loader (spinner + textos).
 *
 * Responsabilidades:
 * - Centrar texto y spinner, subir ligeramente el bloque
 * ============================================================================ */

.loading-content {
  transform: translateY(-10vh);
  text-align: center;
  z-index: 2;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #ff0055;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

/* rotación continua del spinner del estado de carga. */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-title {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #fff, #ff0055, #fff);
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}

.loading-sub {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-top: 10px;
}

/* brillo desplazándose sobre los textos con gradiente (loading-title, error-title, error-text). */
@keyframes shimmer {
  0% { background-position: 200%; }
  100% { background-position: -200%; }
}

/* ============================================================================
 * ERROR HERO
 * Pantalla mostrada cuando la película no es encontrada.
 *
 * Responsabilidades:
 * - Centrar el mensaje de error en la pantalla
 * - Ocupar el espacio disponible del layout
 * ============================================================================ */

.error-hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: transparent;
}

.error-content {
  position: relative;
  text-align: center;
  z-index: 2;
  max-width: 900px;
}

/* nota: el gradiente propio no se ve, el título solo agrupa a .error-icon + .error-text */
.error-title {
  font-size: clamp(38px, 4vw, 48px);
  white-space: nowrap;
  font-weight: 800;
  margin-bottom: 20px;
  text-wrap: balance;
}

.error-icon {
  margin-right: 16px;
}

.error-text {
  background: linear-gradient(90deg, #fff, #ff0055, #fff);
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}

.error-sub {
  color: #f1f5f9; /* blanco suave, no puro */
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 30px;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

/* ============================================================================
 * BOTÓN ERROR
 * Botón de acción para volver al catálogo desde la pantalla de error.
 *
 * Responsabilidades:
 * - Permitir navegación de regreso a /movies
 * - Aplicar efecto hover (escala + glow)
 * ============================================================================ */

.btn-error {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  padding: 12px 24px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff0055, #ff3366);
  color: white;
  text-decoration: none;
  font-weight: 600;
  transition: 0.3s;
}

.btn-error:hover {
  transform: scale(1.005);
  box-shadow: 0 0 20px rgba(255, 0, 100, 0.5);
}

.icon {
  width: 18px;
  height: 18px;
}

/* ============================================================================
 * TRAILER MODAL
 * Modal fullscreen con el reproductor del tráiler.
 *
 * Responsabilidades:
 * - Cubrir toda la pantalla, oscurecer y desenfocar el fondo
 * - Centrar la ventana del reproductor
 * ============================================================================ */

.trailer-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: trailerFade 0.25s ease;
}

/* aparición progresiva del overlay del tráiler con desenfoque. */
@keyframes trailerFade {
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(12px); }
}

/* ============================================================================
 * TRAILER HEADER
 * Barra superior del modal: título + botón cerrar.
 *
 * Responsabilidades:
 * - Línea separadora inferior con gradiente/glow (::after)
 * ============================================================================ */

.trailer-header {
  width: 90%;
  max-width: 1000px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.95),
    rgba(0, 0, 0, 0.75)
  );
  backdrop-filter: blur(10px);
  position: relative;
}

/* línea decorativa inferior con gradiente que separa visualmente el header del modal. */
.trailer-header::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.15),
    rgba(255, 0, 85, 0.35),
    rgba(255, 255, 255, 0.15),
    transparent
  );
}

.trailer-title {
  font-size: 14px;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 600;
  background: linear-gradient(90deg, #fff, #ff0055);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  opacity: 0.9;
}

/* ============================================================================
 * BOTÓN CERRAR (TRAILER)
 * Botón circular para cerrar el modal del tráiler.
 *
 * Responsabilidades:
 * - Cerrar el modal al hacer click
 * - Aplicar hover con glow acorde al color principal de la app
 * ============================================================================ */

.btn-close {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 0, 85, 0.15);
  border-color: rgba(255, 0, 85, 0.5);
  box-shadow: 0 0 12px rgba(255, 0, 85, 0.4);
}

/* ============================================================================
 * TRAILER CONTENT
 * Wrapper del iframe del tráiler.
 *
 * Responsabilidades:
 * - Mantener aspect ratio 16:9
 * - Ocultar cualquier desborde del video
 * ============================================================================ */

.trailer-content {
  position: relative;
  width: 90%;
  max-width: 1000px;
  aspect-ratio: 16 / 9;
  background: black;
  overflow: hidden;
}

.trailer-content iframe {
  width: 100%;
  height: 100%;
  border: none;
}

/* ============================================================================
 * TRANSICIÓN MODAL TRAILER
 * Animación sincronizada del overlay + ventana al abrir/cerrar.
 *
 * Responsabilidades:
 * - Animar el fade del overlay y el blur progresivo
 * - Animar escala y desplazamiento de la ventana del modal
 * ============================================================================ */

.trailer-window {
  width: 90%;
  max-width: 1000px;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.trailer-enter-active,
.trailer-leave-active {
  transition: opacity 0.35s ease, backdrop-filter 0.35s ease;
}

.trailer-enter-from,
.trailer-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.trailer-enter-from .trailer-window,
.trailer-leave-to .trailer-window {
  transform: scale(0.94) translateY(10px);
  opacity: 0;
}

.trailer-enter-to .trailer-window,
.trailer-leave-from .trailer-window {
  transform: scale(1) translateY(0);
  opacity: 1;
}

</style>
