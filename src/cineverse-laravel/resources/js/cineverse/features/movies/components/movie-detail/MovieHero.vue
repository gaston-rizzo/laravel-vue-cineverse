<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieHero.vue
 * ============================================================================
 *
 * Hero principal del detalle de película: poster, título, metadata (año,
 * duración, director), score animado, botón de trailer y de favorito.
 * Espera a que el poster cargue antes de mostrar el contenido y disparar
 * las animaciones de entrada, y emite "ready" cuando todo está listo.
 * ============================================================================ */

import { ref, onMounted, watch } from "vue";

import { useFavoritesStore } from "@/features/movies/stores/useMoviesFavoritesStore";

import MovieSynopsis from "./MovieSynopsis.vue";

import noImagePoster from "@/assets/no-image-poster.jpg";

import type { MovieDetail } from "../../types/movie-detail/movie-detail";
import type { CastMember } from "../../types/movie-detail/cast";

// Props:
// - movie: datos completos de la película
// - cast: lista de actores
// - director: info básica del director (puede ser null)
// - hasTrailer: indica si hay trailer disponible
const props = defineProps<{
  movie: MovieDetail;
  cast: CastMember[];
  director: { name: string } | null;
  hasTrailer: boolean;
}>();

// Eventos hacia el padre:
// - openTrailer: solicita abrir el modal/reproductor del trailer
// - ready: el hero terminó de cargar y animar
const emit = defineEmits(["openTrailer", "ready"]);

// Indica si el hero ya puede mostrarse (imágenes cargadas + delay de entrada)
const isReady = ref(false);

// Estado de carga del poster (el backdrop se eliminó por estética, ver checkReady)
const posterLoaded = ref(false);

// Activa las animaciones de entrada (fade, slide) una vez que isReady es true
const intro = ref(false);

// Base URL de imágenes de TMDB
const imageBase = "https://image.tmdb.org/t/p/original";

// Score final a mostrar (0–100)
const score = Math.round(props.movie.vote_average * 10);

// Duración total de la animación del score, en ms
const duration = 1200;

// Valor de score interpolado que se va mostrando en la UI
const animatedScore = ref(0);

// Indica si la animación del score sigue corriendo
const isAnimating = ref(false);

// Color dinámico del score (rojo → verde, o violeta si es muy alto)
const currentColor = ref("#22c55e");

// Se activa cuando termina la animación del score (habilita UI dependiente)
const trailerReady = ref(false);

// Escala del latido del corazón, sincronizada con el score
const heartScale = ref(1);

// Velocidad del latido del corazón, sincronizada con el score
const heartSpeed = ref(0.6);

// Store global de favoritos (Pinia)
const favorites = useFavoritesStore();

/** Marca el poster como cargado y dispara el chequeo de "listo para mostrar". */
function onPosterLoad() {
  posterLoaded.value = true;
  checkReady();
}

/**
 * Verifica si el hero ya puede mostrarse (poster cargado) y, si es así,
 * habilita el contenido y las animaciones de entrada tras un pequeño delay,
 * y notifica al padre con el evento "ready".
 *
 * Nota: originalmente también esperaba al backdrop, pero se eliminó porque
 * estéticamente no quedaba bien con varias películas.
 */
function checkReady() {
  if (posterLoaded.value) {
    setTimeout(() => {
      isReady.value = true;
      intro.value = true;
      emit("ready");
    }, 150);
  }
}

/**
 * Calcula un color según el score: violeta fijo para scores altos (>85),
 * o un gradiente HSL de rojo a verde para el resto.
 * @param score - Puntaje de 0 a 100
 */
function getColor(score: number) {
  if (score > 85) return "#7c3aed";
  const hue = (score / 100) * 120;
  return `hsl(${hue}, 80%, 50%)`;
}

/**
 * Ajusta la escala y velocidad del latido del corazón en función del score:
 * a mayor score, late más grande y más rápido.
 * @param score - Puntaje actual (0 a 100)
 */
function updateHeartByScore(score: number) {
  heartScale.value = 1 + (score / 100) * 0.4; // 1 → 1.4
  heartSpeed.value = 0.8 - (score / 100) * 0.4; // 0.8s → 0.4s
}

/**
 * Agrega o quita la película actual de favoritos según su estado.
 * Se ejecuta al hacer click en el botón de favorito.
 */
function onFavoriteClick() {
  if (favorites.isFavorite(props.movie.id)) {
    favorites.removeFavorite(props.movie.id);
  } else {
    favorites.addFavorite(props.movie);
  }
}

/**
 * Al cambiar de película, resetea el estado de carga del poster (si no
 * tiene imagen, se considera "cargado" para no bloquear la UI) y vuelve
 * a chequear si el hero puede mostrarse.
 */
watch(
  () => props.movie,
  (movie) => {
    posterLoaded.value = !movie.poster_path;
    checkReady();
  },
  { immediate: true }
);

/**
 * Anima el score desde 0 hasta su valor final con requestAnimationFrame,
 * actualizando en cada frame el color dinámico y el latido del corazón.
 * Al terminar, deja el latido en su estado final y habilita el trailer.
 */
onMounted(() => {
  const start = performance.now();

  const animate = (time: number) => {
    const progress = Math.min((time - start) / duration, 1);

    animatedScore.value = Math.floor(progress * score);
    currentColor.value = getColor(animatedScore.value);
    updateHeartByScore(animatedScore.value);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      heartSpeed.value = 1.2;
      heartScale.value = 1.1;

      setTimeout(() => {
        isAnimating.value = false;
        trailerReady.value = true;
      }, 400);
    }
  };

  isAnimating.value = true;
  requestAnimationFrame(animate);
});

</script>

<template>

    <section 
    class="movie-hero" 
    :class="{ 
      beating: isAnimating,
      ready: isReady
    }"
  >

  <!-- BACKDROP -->
  <!-- <div class="hero-backdrop">
    <img
      v-if="movie.backdrop_path"
      class="hero-backdrop-img"
      :src="imageBase + movie.backdrop_path"
      @load="onBackdropLoad"
    />
  </div> -->

  <!-- OVERLAY -->
  <!-- <div class="hero-overlay" /> -->

  <!-- <div class="hero-color-layer"
       :class="{ fadeOut: trailerReady }"
       :style="{
        '--accent': currentColor
       }" ></div> -->

  <!-- CONTENIDO -->
  <div class="hero-container" :class="{ visible: isReady }">

    <div class="hero-grid">

      <!-- POSTER -->
      <div class="hero-poster" :class="{ intro: intro }">
        <img 
          :src="movie.poster_path ? 
                  imageBase + movie.poster_path :
                  noImagePoster"
          @load="onPosterLoad"
        />
      </div>

      <!-- INFO -->
      <div class="hero-info" :class="{ intro: intro }">

        <div class="hero-header">

          <div class="hero-header-left">

            <h1 class="hero-title">
              {{ movie.title }}
            </h1>

            <div class="hero-stats">

              <span class="meta-chip">
                📅 {{ movie.release_date?.slice(0, 4) }}
              </span>

              <span class="meta-chip">
                ⏱ {{ Math.floor(movie.runtime / 60) }}h {{ movie.runtime % 60 }}m
              </span>

              <span v-if="director">
                🎬 Dirigida por {{ director.name }}
              </span>

            </div> <!-- hero-stats -->                   

          </div> <!-- hero-header-left -->

          <div class="rating-circle"
                :style="{
                '--glow-color': currentColor,
                '--glow-scale': heartScale }"
                :class="{ beating: isAnimating }"
          >

            <!-- SVG -->
            <svg viewBox="0 0 36 36">
              <path class="bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />

              <path
                class="progress"
                :stroke="currentColor"
                :stroke-dasharray="animatedScore + ', 100'"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />

            </svg>

            <span class="rating-text">
              {{ animatedScore }}%
            </span>

            <div class="particles">
              <span v-for="i in 6" :key="i"></span>
            </div>

          </div> <!-- rating-circle -->

          <div class="hero-actions">

            <button 
              v-if="hasTrailer"
              class="btn-trailer-circle"
              @click="$emit('openTrailer')"
            >
              <span class="btn-inner">
              <span class="play-icon">▶</span>
              </span>
            </button>

          </div> <!-- hero-actions -->

          <button 
            class="btn-favorite"
            :class="{ 
            beating: isAnimating,
            active: favorites.isFavorite(movie.id)  
            }"
              :style="{
                '--heart-scale': heartScale,
                '--heart-speed': heartSpeed + 's'
              }"
                @click="onFavoriteClick"
          >
            <span class="heart">
              {{ favorites.isFavorite(movie.id) ? '❤️' : '🤍' }}
            </span>
          </button>

        </div> <!-- hero-header -->

        <p class="hero-tagline" v-if="movie.tagline">
          {{ movie.tagline }}
        </p>

        <MovieSynopsis :overview="movie.overview" />

      </div> <!-- hero-info -->

    </div> <!-- hero-grid -->

  </div> <!-- hero-container -->

</section>

</template>

<style scoped>

/* ============================================================================
 * MOVIE HERO
 * Contenedor raíz del hero de película.
 *
 * Responsabilidades:
 * - Estructurar el layout general
 * - Reflejar el estado "beating" (mientras se anima el score) con un
 *   leve realce de saturación/brillo global
 * ============================================================================ */

.movie-hero {
  opacity: 1;
  position: relative;
  display: flex;
  align-items: flex-start;
  transition: filter 0.6s ease;
}

.movie-hero.beating {
  filter: saturate(1.2) brightness(1.05);
}

/* ============================================================================
 * HERO CONTAINER
 * Wrapper del contenido visible del hero.
 *
 * Responsabilidades:
 * - Limitar y centrar el ancho
 * - Ocultar y bloquear interacción hasta que el poster termine de cargar
 *   (ver isReady / .visible)
 * ============================================================================ */

.hero-container {
  opacity: 0;
  pointer-events: none;
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 30px;
}

.hero-container.visible {
  opacity: 1;
  pointer-events: auto;
}

/* ============================================================================
 * HERO GRID
 * Layout de 2 columnas: poster fijo + info flexible.
 *
 * Responsabilidades:
 * - Separar poster e info en columnas (ancho fijo + flexible)
 * - Mantener el gap y la alineación entre ambas
 * ============================================================================ */

.hero-grid {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 40px;
  align-items: stretch;
}

/* ============================================================================
 * HERO POSTER
 * Imagen del poster dentro de la columna fija del grid.
 *
 * Responsabilidades:
 * - Ocupar el ancho de su columna
 * - Aplicar sombra para despegarla del fondo
 * ============================================================================ */

.hero-poster img {
  width: 100%;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.9),
    0 0 30px rgba(229, 9, 20, 0.25);
}

/* ============================================================================
 * HERO INFO (GLASS PANEL)
 * Panel con título, meta, score y acciones.
 *
 * Responsabilidades:
 * - Fondo glass (blur + transparencia) para separarse del fondo
 * - Contener el header (título/stats, rating, acciones, favorito) y la
 *   sinopsis
 * ============================================================================ */

.hero-info {
  background:
    radial-gradient(circle at 88% 20%, rgba(229, 9, 65, 0.12), transparent 45%),
    radial-gradient(circle at 8% 8%, rgba(124, 58, 237, 0.16), transparent 42%),
    linear-gradient(135deg, rgba(35, 24, 70, 0.72), rgba(9, 11, 27, 0.88) 48%, rgba(48, 5, 32, 0.58));
  padding: 20px;
  border-radius: 16px;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: none;
  filter: none;
}

.hero-title {
  font-size: 3.5rem;
  line-height: 1.1;
  font-weight: 500;
  margin-bottom: 10px;
}

.hero-tagline {
  font-style: italic;
  color: #ccc;
  margin-bottom: 20px;
}

.hero-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-header-left {
  flex: 1;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 15px;
}

.meta-chip {
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  backdrop-filter: blur(6px);
}

.hero-actions {
  display: flex;
  gap: 12px;
}

/* ============================================================================
 * RATING CIRCLE
 * Anillo de progreso con el score animado (0-100).
 *
 * Responsabilidades:
 * - Dibujar el fondo y el progreso del anillo (SVG stroke-dasharray)
 * - Glow dinámico (::after) que pulsa mientras el score se anima
 * - Partículas decorativas alrededor del anillo
 * ============================================================================ */

.rating-circle {
  position: relative;
  width: 70px;
  height: 70px;
  margin-right: 30px;
  z-index: 1;
}

.rating-circle svg {
  transform: rotate(-90deg);
}

.rating-circle .bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 3;
}

.rating-circle .progress {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  transition:
    stroke-dasharray 0.3s ease,
    stroke 0.3s ease;
}

/* Glow difuso detrás del anillo, sincronizado con el color del score */
.rating-circle::after {
  content: "";
  position: absolute;
  inset: -10px;
  border-radius: 50%;

  background: radial-gradient(circle, var(--glow-color) 0%, transparent 70%);

  opacity: 0.25;
  filter: blur(12px);
  transform: scale(1);
  transition: all 0.3s ease;
}

/* pulso del glow sincronizado con el latido del corazón favorito. */
.rating-circle.beating::after {
  animation: glowPulse var(--heart-speed) ease-in-out infinite;
}

/* Pulso del glow sincronizado con el latido del corazón favorito */
@keyframes glowPulse {
  0% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(calc(1 + (var(--glow-scale) - 1) * 0.6)); opacity: 0.45; }
  100% { transform: scale(1); opacity: 0.2; }
}

.rating-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* ============================================================================
 * PARTÍCULAS
 * Puntos decorativos alrededor del rating circle, cada uno con su propia
 * trayectoria y timing (float1..float6).
 * ============================================================================ */

.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particles span {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--glow-color);
  opacity: 0;
  filter: blur(2px);
}

/* Posición inicial y animación asignada a cada partícula individual */
.particles span:nth-child(1) { left: 50%; top: 50%; animation: float1 2.5s infinite; }
.particles span:nth-child(2) { left: 40%; top: 60%; animation: float2 3s infinite; }
.particles span:nth-child(3) { left: 60%; top: 55%; animation: float3 2.8s infinite; }
.particles span:nth-child(4) { left: 55%; top: 40%; animation: float4 3.2s infinite; }
.particles span:nth-child(5) { left: 45%; top: 45%; animation: float5 2.6s infinite; }
.particles span:nth-child(6) { left: 50%; top: 65%; animation: float6 3.1s infinite; }

/* Trayectoria y desvanecimiento de cada partícula alrededor del anillo */
@keyframes float1 { 0% { transform: translate(0,0) scale(1); opacity: 0.4; } 100% { transform: translate(-20px,-40px) scale(0.3); opacity: 0; } }
@keyframes float2 { 0% { transform: translate(0,0) scale(1); opacity: 0.3; } 100% { transform: translate(25px,-35px) scale(0.2); opacity: 0; } }
@keyframes float3 { 0% { transform: translate(0,0); opacity: 0.35; } 100% { transform: translate(-15px,-30px); opacity: 0; } }
@keyframes float4 { 0% { transform: translate(0,0); opacity: 0.25; } 100% { transform: translate(20px,-25px); opacity: 0; } }
@keyframes float5 { 0% { transform: translate(0,0); opacity: 0.3; } 100% { transform: translate(-10px,-20px); opacity: 0; } }
@keyframes float6 { 0% { transform: translate(0,0); opacity: 0.2; } 100% { transform: translate(10px,-30px); opacity: 0; } }

/* ============================================================================
 * BOTÓN FAVORITO
 * Corazón que marca/desmarca la película como favorita.
 *
 * Responsabilidades:
 * - Latir en hover, y sincronizado con el score mientras éste se anima
 * - Mostrar un corazón roto (💔) en hover cuando ya es favorito
 * ============================================================================ */

.btn-favorite {
  width: 70px;
  height: 70px;
  border-radius: 50px;
  margin-right: 50px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s ease;
  overflow: hidden;
}

.btn-favorite:hover {
  transform: scale(1.03);
  animation: heartBeatHover 1.1s ease-in-out infinite;
}

/* Pequeño latido al pasar el mouse por el botón de favorito */
@keyframes heartBeatHover {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* late en sync con el score mientras éste se anima. */
.btn-favorite.beating {
  animation: heartBeatSync var(--heart-speed) ease-in-out infinite;
}

/* Late en sync con el score mientras éste se anima */
@keyframes heartBeatSync {
  0%   { transform: scale(1); }
  25%  { transform: scale(var(--heart-scale)); }
  50%  { transform: scale(1); }
  75%  { transform: scale(calc(var(--heart-scale) * 0.9)); }
  100% { transform: scale(1); }
}

/* Muestra un corazón roto al pasar el mouse si ya es favorito */
.btn-favorite.active:hover::after {
  content: "💔";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
}

/* ============================================================================
 * BOTÓN TRAILER
 * CTA principal del hero (círculo con ícono de play).
 *
 * Responsabilidades:
 * - Animar su entrada con un efecto tipo "impacto cinemático"
 * - Reaccionar a hover con escala + rotación del ícono interno
 * ============================================================================ */

.btn-trailer-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: white;
  opacity: 0;
  transform: translateY(40px) rotate(-120deg) scale(0.6);
  filter: blur(6px);
  animation: trailerCinematicIntro 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transition:
    transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease;
}

/* entra con overshoot de rotación/escala y se asienta. */
@keyframes trailerCinematicIntro {
  0% { opacity: 0; transform: translateY(40px) rotate(-120deg) scale(0.6); filter: blur(6px); }
  50% { opacity: 1; transform: translateY(-8px) rotate(20deg) scale(1.15); filter: blur(0); }
  75% { transform: translateY(2px) rotate(-6deg) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); filter: blur(0); }
}

.btn-trailer-circle:hover {
  transform: translateY(0) rotate(0deg) scale(1.06) !important;
}

/* evita el borde de foco al cerrar el modal del trailer con ESC */
.btn-trailer-circle:focus,
.btn-trailer-circle:active {
  outline: none;
}

.btn-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: transform 0.25s ease;
}

.btn-trailer-circle:hover .btn-inner {
  transform: scale(1.08) rotate(8deg);
}

.play-icon {
  display: inline-block;
  transform: scale(0.6) rotate(-40deg);
  opacity: 0;
  animation: iconSnap 0.4s ease-out 0.3s forwards;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* El ícono de play aparece con un pequeño rebote */
@keyframes iconSnap {
  to { transform: scale(1) rotate(0deg); opacity: 1; }
}

.btn-trailer-circle:hover .play-icon {
  transform: rotate(15deg) scale(1.2);
}

.btn-trailer-circle,
.btn-favorite {
  cursor: pointer;
}

/* ============================================================================
 * ANIMACIÓN DE ENTRADA (POSTER + INFO)
 * Stagger de aparición con rebote una vez que isReady/intro se activan.
 * ============================================================================ */

.hero-poster,
.hero-info {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}

.hero-poster.intro,
.hero-info.intro {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.hero-poster.intro {
  animation: heroEnter 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.hero-info.intro {
  animation: heroEnter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: 0.08s;
}

/* entra desde abajo con rebote de dos pasos antes de asentarse. */
@keyframes heroEnter {
  0% { transform: translateY(50px) scale(0.95); opacity: 0; }
  40% { transform: translateY(-6px) scale(1.04); opacity: 1; }
  65% { transform: translateY(3px) scale(0.995); }
  85% { transform: translateY(-1px) scale(1.01); }
  100% { transform: translateY(0) scale(1); }
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .hero-container {
    padding: 20px 16px;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .hero-poster {
    width: 180px;
    margin: 0 auto;
  }

  .hero-title {
    font-size: 1.8rem;
    line-height: 1.2;
  }

  .hero-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .hero-stats {
    flex-wrap: wrap;
    gap: 8px;
  }

  .hero-info {
    padding: 16px;
  }

  .rating-circle {
    width: 56px;
    height: 56px;
    margin-right: 0;
  }

  .btn-favorite {
    width: 56px;
    height: 56px;
    font-size: 1.3rem;
    margin-right: 0;
  }

  .btn-trailer-circle {
    width: 56px;
    height: 56px;
  }

  .hero-actions {
    width: 100%;
  }

  .hero-tagline {
    font-size: 0.9rem;
  }
}

</style>
