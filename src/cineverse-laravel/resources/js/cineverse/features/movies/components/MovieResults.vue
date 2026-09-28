<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieResults.vue
 * ============================================================================
 *
 * Grilla de resultados de películas usada dentro de MoviesView.vue.
 * Filtra películas sin poster, implementa scroll infinito con
 * IntersectionObserver, permite resetear la grilla (resetSignal),
 * y aplica efectos visuales de hover/tilt 3D sobre las cards.
 * ============================================================================ */

import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";

import { useI18n } from "vue-i18n";

import MovieCard from "./MovieCard.vue";

import type { PaginatedResponse } from "@/shared/types/paginated-response";
import type { Movie } from "@/features/movies/types/movie";

/**
 * Props recibidas desde el padre (resultado de useInfiniteQuery + estado).
 *
 * resetSignal es un número (no un booleano) porque el watcher necesita
 * detectar cada cambio de valor (0 → 1 → 2 → 3): con un booleano, resets
 * consecutivos podrían no dispararse si el usuario cambia filtros rápido.
 */
const props = defineProps<{
  data: { pages: PaginatedResponse<Movie>[] } | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  isFetchingNextPage: boolean | undefined;
  resetSignal: number;
  hasNextPage: boolean | undefined;
}>();

const { t } = useI18n();

// Lista final de películas (sin poster inválido) que renderiza el template
const validMovies = ref<Movie[]>([]);

// Elemento sentinel al final de la grilla, observado por el IntersectionObserver
const loadMoreTrigger = ref<HTMLElement | null>(null);

// Evita que el observer dispare múltiples requests simultáneas
const loadingMore = ref(false);

// Evita mostrar el empty state antes de que termine el primer procesamiento de datos
const hasProcessedData = ref(false);

// Emitido para que el padre cargue la siguiente página (ej: fetchNextPage de TanStack Query)
const emit = defineEmits(["load-more"]);

// Bloquea temporalmente el auto-load mientras se resetea la grilla (ver watch de resetSignal)
let ignoreLoads = false;

// Instancia del IntersectionObserver que implementa el infinite scroll (ver onMounted)
let observer: IntersectionObserver;

// El infinite scroll no arranca solo: el usuario debe presionar "Mostrar más" primero
const autoScrollEnabled = ref(false);

// Cantidad mínima de películas a mostrar; si hay menos (por el filtrado post-paginación
// de TMDB), se siguen pidiendo páginas extra. No garantiza llenar la grilla si se acaban
// los resultados (hasNextPage = false) o si muchas películas quedan filtradas.
const MIN_MOVIES = 20;

/**
 * Activa el infinite scroll manualmente (botón "Mostrar más")
 * y dispara la primera carga de la siguiente página.
 */
function enableScroll() {
  autoScrollEnabled.value = true;
  emit("load-more");
}

// Id del frame actual, para no ejecutar el tilt más de una vez por frame
let frame: number | null = null;

// Última card con el efecto de tilt aplicado, para poder resetearla
let lastTilted: HTMLElement | null = null;

/**
 * Aplica un efecto de hover magnético / tilt 3D a la card bajo el cursor,
 * simulando que la tarjeta "sigue" al mouse. Usa requestAnimationFrame
 * como throttle para no recalcular más de una vez por frame (~60fps).
 */
function handleGridMouseMove(e: MouseEvent) {
  // Si ya hay un frame pendiente, no programamos otro
  if (frame !== null) return;

  frame = requestAnimationFrame(() => {    
    frame = null;

    // Buscamos la card bajo el cursor
    // e.target es el elemento exacto bajo el cursor en este frame (puede
    // ser el poster, el título, cualquier hijo interno de la card), así
    // que usamos closest() para subir en el DOM hasta encontrar la card
    // completa a la que pertenece
    const target = (e.target as HTMLElement).closest(".movie-card");

    if (!target) return;

    // El tilt (la inclinación 3D que sigue al cursor, rotateX/rotateY
    // más abajo) se aplica sobre .tilt-layer, una capa interna, no
    // directo sobre .movie-card. Así, la card exterior puede seguir
    // usando su propio "transform" (por ejemplo, para la animación de
    // entrada o el hover) sin que el tilt lo pise: cada capa maneja
    // su transformación por separado, sin pisarse entre sí
    const tiltLayer = target.querySelector(".tilt-layer") as HTMLElement;

    if (!tiltLayer) return;

    // Cuando el mouse pasa directo de una card a otra, el navegador no
    // dispara un mouseleave sobre la card anterior (el evento que
    // escuchamos es mousemove sobre toda la grilla, no por card), así
    // que esa card anterior se quedaría con el tilt trabado si no la
    // reseteamos a mano acá antes de aplicarle el efecto a la nueva.
    if (lastTilted && lastTilted !== tiltLayer) {
      lastTilted.style.transform = `
        perspective(900px)
        rotateX(0deg)
        rotateY(0deg)
        scale(1)
      `;
      // Vuelve el glare al centro de la card (50%/50%) en vez de dejarlo
      // clavado en la última posición donde estaba el cursor
      lastTilted.style.setProperty("--glare-x", "50%");
      lastTilted.style.setProperty("--glare-y", "50%");
    }

    // Actualiza la referencia a la card que tiene el efecto de
    // inclinación 3D (tilt) aplicado en este momento, para que el
    // próximo movimiento del mouse (aunque sea sobre otra card) sepa
    // cuál resetear si corresponde (ver el bloque de arriba)
    lastTilted = tiltLayer;

    // getBoundingClientRect() devuelve el rectángulo que ocupa la card
    // en la pantalla (posición y tamaño), medido desde la esquina
    // superior izquierda del viewport. Lo necesitamos porque
    // e.clientX/e.clientY (más abajo) también vienen medidos desde el
    // viewport, no desde la card: sin rect.left/rect.top no podríamos
    // saber en qué punto de la card está el mouse, solo en qué punto
    // de la pantalla está.
    const rect = tiltLayer.getBoundingClientRect();

    // Convierte la posición del mouse de "coordenadas de pantalla"
    // (e.clientX/clientY) a "coordenadas dentro de la card": al restar
    // rect.left/rect.top, el punto (0,0) pasa a ser la esquina superior
    // izquierda de la card en vez de la esquina superior izquierda del
    // viewport
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Punto central de la card (mitad del ancho, mitad del alto). Sirve
    // como referencia para saber si el mouse está a la izquierda/derecha
    // o arriba/abajo del centro, y calcular así cuánto inclinar la card
    // (rotateX/rotateY) y hacia qué lado
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Inclinación en base a la distancia al centro.
    // Con rotateX positivo, el borde superior de la card se aleja del
    // usuario (se ve más chico/hundido); con rotateX negativo, se acerca
    // (se ve más grande/levantado).
    // El multiplicador es -9 (no +9) porque cuando el mouse está arriba
    // del centro (y < centerY), la diferencia (y - centerY) ya es
    // negativa, y multiplicarla por -9 la vuelve positiva: así rotateX
    // da positivo y el borde superior se aleja, que es el efecto buscado
    // (la card se hunde del lado donde está el cursor).
    const rotateX = ((y - centerY) / centerY) * -9;
    // rotateY sigue la misma lógica que rotateX (mismo efecto: el borde
    // del lado donde está el mouse se aleja/hunde), pero acá no hace
    // falta invertir el signo. Mouse a la derecha del centro (x > centerX,
    // diferencia positiva) ya corresponde directamente a un rotateY
    // positivo que aleja el borde derecho — el multiplicador +9 alcanza
    // sin necesidad del -9 que sí requirió rotateX.
    const rotateY = ((x - centerX) / centerX) * 9;

    // Aplica la rotación 3D calculada (rotateX/rotateY) más un leve
    // scale(1.02) para reforzar la sensación de que la card "se levanta"
    // hacia el cursor. perspective(900px) define qué tan pronunciado se
    // ve el efecto 3D: un valor más chico exagera la perspectiva (más
    // "dramático"), uno más grande la aplana (más sutil).
    tiltLayer.style.transform = `
      perspective(900px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.02)
    `;

    // Mueve el glare (brillo que sigue al cursor, ver comentario en el
    // bloque de reset más arriba) a la posición actual del mouse.
    // Estas variables las consume un gradiente en .tilt-layer, definido
    // en MovieCard.vue
    tiltLayer.style.setProperty("--glare-x", `${x}px`);
    tiltLayer.style.setProperty("--glare-y", `${y}px`);
  });
}

/**
 * Restablece el tilt (la inclinación 3D que sigue al cursor, ver
 * handleGridMouseMove) de la card actualmente tilteada, cuando el
 * cursor sale de la grilla entera.
 *
 * Complementa el reset "card por card" que hace handleGridMouseMove al
 * pasar de una card a otra (ver el bloque de arriba en esa función):
 * este reset cubre el caso en que el mouse abandona la grilla por
 * completo, donde no hay una "próxima card" que dispare ese reset.
 */
function resetTiltedCard() {
  // En cualquier momento hay a lo sumo una card con tilt aplicado
  // (handleGridMouseMove resetea la anterior antes de tiltear la
  // siguiente), así que alcanza con volver esa a su estado plano
  if (!lastTilted) return;

  // Vuelve la card a su estado plano: sin inclinación (rotateX/rotateY
  // en 0) y sin el leve levantamiento (scale de vuelta a 1)
  lastTilted.style.transform = `
    perspective(900px)
    rotateX(0deg)
    rotateY(0deg)
    scale(1)
  `;

  // Devuelve el glare al centro de la card
  lastTilted.style.setProperty("--glare-x", "50%");
  lastTilted.style.setProperty("--glare-y", "50%");

  lastTilted = null;
}

/**
 * Reinicia la grilla y el estado de scroll cuando cambia "resetSignal"
 * (ej: al cambiar filtros o iniciar una nueva búsqueda).
 */
watch(() => props.resetSignal, async () => {

  // Bloquea cargas automáticas mientras se resetea todo
  ignoreLoads = true;

  autoScrollEnabled.value = false;
  loadingMore.value = false;
  validMovies.value = [];

  // Vuelve al inicio de la página sin animación
  window.scrollTo({
    top: 0,
    behavior: "auto"
  });

  // Espera a que Vue actualice el DOM antes de liberar el bloqueo
  await nextTick();

  ignoreLoads = false;
});

/**
 * Procesa los datos de la query infinita cada vez que cambian: unifica todas
 * las páginas en una sola lista y filtra las películas sin poster_path
 * válido. Como TMDB pagina antes de filtrar, si tras el filtro quedan pocas
 * películas pide páginas extra automáticamente hasta llegar a MIN_MOVIES.
 * Al final espera el render (nextTick) y re-sincroniza el IntersectionObserver,
 * ya que el sentinel se mueve de posición al agregar películas.
 */
watch(
  () => props.data,
  async (data) => {

    // Evita mostrar el empty state mientras se recalcula la lista
    hasProcessedData.value = false;

    const pages = data?.pages;
    if (!pages || pages.length === 0) return;

    // Unifica los resultados de todas las páginas
    const allMovies = pages.flatMap(p => p.results);

    validMovies.value = allMovies.filter(
      movie => movie.poster_path && !movie.poster_path.includes("null")
    );

    hasProcessedData.value = true;

    // hasNextPage evita pedir páginas inexistentes;
    // isFetchingNextPage evita múltiples requests simultáneos
    if (
      validMovies.value.length < MIN_MOVIES &&
      props.hasNextPage &&
      !props.isFetchingNextPage
    ) {
      emit("load-more");
    }

    await nextTick();

    // Re-registra el observer ya que el DOM cambió de tamaño
    if (autoScrollEnabled.value && loadMoreTrigger.value) {
      observer.unobserve(loadMoreTrigger.value);
      observer.observe(loadMoreTrigger.value);
    }
  }
  // { immediate: true }
);

/**
 * Libera el bloqueo de "loadingMore" cuando termina de cargar la página,
 * permitiendo que el observer dispare una nueva carga al seguir scrolleando.
 */
watch(() => props.isFetchingNextPage, (v) => {
  if (!v) loadingMore.value = false;
});

/**
 * Inicializa el infinite scroll: crea el IntersectionObserver que vigila
 * el sentinel al final de la grilla y dispara "load-more" cuando el usuario
 * se acerca al final (rootMargin adelanta la carga 2500px antes).
 * También hace un prefetch de una página extra si el scroll es muy rápido.
 */
onMounted(async () => {

  // Espera a que el sentinel exista en el DOM antes de observarlo
  await nextTick();

  observer = new IntersectionObserver(entries => {

    const entry = entries[0];

    // Si se está reseteando la grilla, ignoramos cualquier trigger
    if (ignoreLoads) return;

    // Solo activo si el usuario habilitó el auto-scroll
    if (!autoScrollEnabled.value) return;

    if (!entry) return;

    // Condiciones para cargar más: sentinel visible, auto-scroll activo,
    // no hay otra carga en curso, y todavía quedan páginas
    if (
      entry.isIntersecting &&
      autoScrollEnabled.value &&
      !props.isFetchingNextPage &&
      !loadingMore.value &&
      props.hasNextPage
    ) {

      loadingMore.value = true;

      emit("load-more");

      // Prefetch de una página extra: si el usuario scrollea muy rápido,
      // puede llegar al final antes de que termine de cargar la página actual
      setTimeout(() => {
        if (props.hasNextPage) {
          emit("load-more");
        }
      }, 200);

    }

  }, {
    // Adelanta la detección 2500px antes de que el sentinel sea visible,
    // para empezar a cargar la siguiente página sin dejar huecos
    rootMargin: "2500px",
    // Alcanza con que el sentinel toque el área observada
    threshold: 0
  });

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

// Desconecta el observer para evitar fugas de memoria
onUnmounted(() => {
  observer?.disconnect();
});

</script>

<template>

  <div v-if="isLoading" class="cinema-loading">

    <div class="scan-line"></div>

    <div class="loading-title">
      {{ t('common.searchingMovies') }}
    </div>

    <div class="loading-bar">
      <div class="loading-progress"></div>
    </div>

  </div>

  <div v-else-if="error" class="empty-state">

    <div class="empty-visual">

      <div class="halo"></div>

      <!-- icono -->
      <svg class="film-icon" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2"/>
        <line x1="20" y1="20" x2="44" y2="44" stroke="currentColor" stroke-width="2"/>
        <line x1="44" y1="20" x2="20" y2="44" stroke="currentColor" stroke-width="2"/>
      </svg>

    </div>

    <h2 class="empty-title">
      {{ t("common.errorTitle") }}
    </h2>

    <p class="empty-description">
      {{ t("common.errorMessage") }}
    </p>

  </div>

  <div name="movie">
    
    <div v-if="validMovies.length">

        <div name="movie" class="movies-grid"
             @mousemove="handleGridMouseMove"
             @mouseleave="resetTiltedCard">
        
          <MovieCard
            v-for="(movie, index) in validMovies"
            :key="movie.id"
            :movie="movie"
            :delay="index * 30"                                   
          />

        </div>

      <div ref="loadMoreTrigger" class="scroll-sentinel"></div>

      <button 
        v-if="!autoScrollEnabled && hasNextPage && !isFetchingNextPage"
             @click="enableScroll"
             class="load-more-btn"
        >
        <span class="load-more-glow"></span>
        <span class="load-more-label">
          {{ t("common.showMore") }}
        </span>
      </button>

    </div>

    <div v-else-if="hasProcessedData && validMovies.length === 0" class="empty-state">

      <div class="projector-flash"></div>

      <div class="empty-visual">

        <!-- projector rays -->
        <div class="projector-rays"></div>

        <!-- halo -->
        <div class="halo"></div>
        
        <!-- icono de proyector de cine -->
        <svg class="film-icon" viewBox="0 0 64 64" fill="none">

          <!-- reels -->
          <circle cx="18" cy="18" r="8" stroke="currentColor" stroke-width="2"/>
          <circle cx="18" cy="18" r="2" fill="currentColor"/>

          <circle cx="38" cy="14" r="6" stroke="currentColor" stroke-width="2"/>
          <circle cx="38" cy="14" r="1.6" fill="currentColor"/>

          <!-- projector body -->
          <rect x="10" y="24" width="30" height="16" rx="3"
                stroke="currentColor" stroke-width="2"/>

          <!-- lens -->
          <rect x="40" y="28" width="8" height="8" rx="2"
                stroke="currentColor" stroke-width="2"/>

          <!-- tripod -->
          <line x1="20" y1="40" x2="14" y2="50"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>

          <line x1="30" y1="40" x2="36" y2="50"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>

          <!-- light beam -->
          <path
            d="M48 30 L60 26 L60 38 Z"
            fill="currentColor"
            opacity="0.35"
          />

        </svg>

        <!-- particles -->
        <div class="particles">
          <span v-for="n in 14" :key="n"></span>
        </div>

      </div>

      <h2 class="empty-title">
        {{ t("common.emptyResultsTitle") }}
      </h2>

      <p class="empty-description">
        {{ t("common.emptyResultsLine1") }} <br>
        {{ t("common.emptyResultsLine2")  }}
      </p>

    </div>

  </div>
</template>

<style scoped>

/* ============================================================================
 * MOVIES GRID
 * Grid principal donde se renderizan las tarjetas de películas.
 *
 * Responsabilidades:
 * - Distribuir las cards en columnas fijas
 * - perspective: habilita animaciones 3D (tilt) en las cards
 * ============================================================================ */

.movies-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  perspective: 1000px;
  position: relative;
}

/* ============================================================================
 * EMPTY STATE
 * Contenedor que reemplaza la grilla cuando no hay resultados o hay error.
 * Sin estética de "card": todo flota sobre el fondo global de la app.
 *
 * Responsabilidades:
 * - Centrar el mensaje vertical y horizontalmente
 * - Ocultar overlays internos que sobresalen (rayos, partículas)
 * ============================================================================ */

.empty-state {
  position: relative;
  width: 100%;
  min-height: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 18px;
  overflow: hidden;
  isolation: isolate;

  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;

  animation: cinematicReveal 0.9s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* aparición del estado vacío: sube y escala levemente desde abajo. */
@keyframes cinematicReveal {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ============================================================================
 * EMPTY VISUAL
 * Área central que agrupa icono, halo y rayos del estado vacío.
 *
 * Responsabilidades:
 * - Definir el tamaño del área visual y centrar su contenido
 * ============================================================================ */

.empty-visual {
  position: relative;
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============================================================================
 * PROJECTOR RAYS
 * Rayos rotatorios que simulan luz proyectada alrededor del icono.
 *
 * Responsabilidades:
 * - Aplicar un gradiente cónico con blur, en rotación continua
 * ============================================================================ */

.projector-rays {
  position: absolute;
  width: 300px;
  height: 300px;

  background: conic-gradient(
    from 180deg,
    rgba(124, 58, 237, 0.35),
    transparent 20%,
    rgba(229, 9, 20, 0.25),
    transparent 45%,
    rgba(124, 58, 237, 0.35),
    transparent 70%
  );

  filter: blur(35px);
  animation: raysRotate 20s linear infinite;
}

/* rotación continua de los rayos. */
@keyframes raysRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ============================================================================
 * HALO
 * Glow radial detrás del icono, para reforzar el foco visual.
 *
 * Responsabilidades:
 * - Aplicar un resplandor difuso con animación de "respiración"
 * ============================================================================ */

.halo {
  position: absolute;
  width: 160px;
  height: 160px;
  border-radius: 50%;

  background: radial-gradient(
    circle,
    rgba(124, 58, 237, 0.45),
    rgba(124, 58, 237, 0.15),
    transparent 70%
  );

  filter: blur(30px);
  animation: haloPulse 6s ease-in-out infinite;
}

/* respiración luminosa del halo (escala + opacidad). */
@keyframes haloPulse {
  0%, 100% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.25); opacity: 0.35; }
}

/* ============================================================================
 * FILM ICON
 * Icono SVG central del estado vacío (cinta o proyector).
 *
 * Responsabilidades:
 * - Aplicar glow neon y una animación de flote continuo
 * ============================================================================ */

.film-icon {
  width: 70px;
  height: 70px;
  color: #c084fc;
  filter:
    drop-shadow(0 0 10px rgba(124, 58, 237, 0.7))
    drop-shadow(0 0 35px rgba(229, 9, 20, 0.3));
  animation: iconFloat 4s ease-in-out infinite;
}

/* flote vertical continuo del icono. */
@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* ============================================================================
 * EMPTY TITLE / DESCRIPTION
 * Título y texto descriptivo del estado vacío.
 *
 * Responsabilidades:
 * - Título con gradiente de texto y glow
 * - Descripción legible, de menor jerarquía
 * ============================================================================ */

.empty-title {
  font-family: "Orbitron", sans-serif;
  font-size: 31px;
  font-weight: 700;

  background: linear-gradient(90deg, #ffffff, #c084fc);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;

  letter-spacing: 0.3px;

  text-shadow:
    0 0 10px rgba(124, 58, 237, 0.35),
    0 0 30px rgba(124, 58, 237, 0.15);
}

.empty-description {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8ff; /* un poco más claro */
  max-width: 420px;
  line-height: 1.7;
  opacity: 0.95;
}

/* ============================================================================
 * PARTICLES
 * Partículas flotantes que refuerzan el ambiente espacial del estado vacío.
 *
 * Responsabilidades:
 * - Animar cada partícula con flote vertical y fade in/out
 * - Posicionar manualmente cada una dentro del área visual
 * ============================================================================ */

.particles span {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  opacity: 0.8;
  animation: particleFloat 7s linear infinite;
}

.particles span:nth-child(odd) {
  background: #c084fc;
}

.particles span:nth-child(even) {
  background: #ef4444;
}

/* posiciones manuales de las partículas */
.particles span:nth-child(1) { top: 10%; left: 10%; }
.particles span:nth-child(2) { top: 20%; left: 80%; }
.particles span:nth-child(3) { top: 60%; left: 15%; }
.particles span:nth-child(4) { top: 70%; left: 75%; }
.particles span:nth-child(5) { top: 40%; left: 90%; }
.particles span:nth-child(6) { top: 80%; left: 50%; }
.particles span:nth-child(7) { top: 30%; left: 5%; }
.particles span:nth-child(8) { top: 15%; left: 65%; }
.particles span:nth-child(9) { top: 85%; left: 30%; }
.particles span:nth-child(10) { top: 50%; left: 70%; }
.particles span:nth-child(11) { top: 75%; left: 40%; }
.particles span:nth-child(12) { top: 35%; left: 25%; }
.particles span:nth-child(13) { top: 55%; left: 85%; }
.particles span:nth-child(14) { top: 5%; left: 50%; }

/* nace invisible, hace fade-in, flota, y hace fade-out subiendo. */
@keyframes particleFloat {
  0% { transform: translateY(10px) scale(0.8); opacity: 0; }
  15% { opacity: 0.9; }
  70% { opacity: 0.9; }
  100% { transform: translateY(-80px) scale(1); opacity: 0; }
}

/* ============================================================================
 * CINEMA LOADING
 * Contenedor principal del estado de carga.
 *
 * Responsabilidades:
 * - Centrar spinner/texto y dar espacio para la scan-line
 * ============================================================================ */

.cinema-loading {
  min-height: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  position: relative;
}

/* ============================================================================
 * LOADING TITLE
 * Texto tipo HUD/sci-fi del estado de carga.
 *
 * Responsabilidades:
 * - Tipografía técnica en mayúsculas con glow violeta
 * ============================================================================ */

.loading-title {
  font-family: "Orbitron", sans-serif;
  font-size: 20px;
  color: #c084fc;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-shadow:
    0 0 12px rgba(124, 58, 237, 0.6),
    0 0 35px rgba(124, 58, 237, 0.3);
}

/* ============================================================================
 * LOADING BAR / PROGRESS
 * Barra de progreso animada del loader.
 *
 * Responsabilidades:
 * - Contenedor con glow; relleno con gradiente en movimiento
 * - Simular avance de carga con ancho variable
 * ============================================================================ */

.loading-bar {
  width: 360px;
  height: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  box-shadow: 0 0 15px rgba(124, 58, 237, 0.4);
}

.loading-progress {
  height: 100%;
  width: 40%; /* valor inicial */
  background: linear-gradient(90deg, #7c3aed, #ef4444, #7c3aed);
  background-size: 200% 100%;
  animation:
    progressMove 2.4s linear infinite,     /* movimiento del gradiente */
    progressWidth 3s ease-in-out infinite; /* expansión falsa de carga */
}

/* desplaza el gradiente horizontalmente. */
@keyframes progressMove {
  to { background-position: -200% 0; }
}

/* expande y contrae el ancho, simulando avance mientras espera la API. */
@keyframes progressWidth {
  0% { width: 15%; }
  50% { width: 85%; }
  100% { width: 15%; }
}

/* ============================================================================
 * SCAN LINE
 * Línea que simula un escáner tipo radar/interface holográfica.
 *
 * Responsabilidades:
 * - Recorrer verticalmente el loader con fade en los extremos
 * ============================================================================ */

.scan-line {
  position: absolute;
  width: 500px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 58, 237, 0.9),
    transparent
  );
  animation: scanMove 3s linear infinite;
}

/* recorrido vertical de la línea de escaneo, con fade en los extremos. */
@keyframes scanMove {
  0% { transform: translateY(-120px); opacity: 0.2; }
  50% { opacity: 1; }
  100% { transform: translateY(120px); opacity: 0.2; }
}

/* ============================================================================
 * LOAD MORE BUTTON
 * Botón "Mostrar más" para activar el infinite scroll.
 *
 * Responsabilidades:
 * - Estilo glass con glow interno animado (::before vía .load-more-glow)
 * - Hover con más glow; active con leve compresión
 * ============================================================================ */

.load-more-btn {
  position: relative;
  margin: 60px auto 20px;
  padding: 14px 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Orbitron", sans-serif;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #e9d5ff;

  background: rgba(124, 58, 237, 0.08);
  border: 1px solid rgba(124, 58, 237, 0.4);

  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  transition: all 0.35s ease;

  box-shadow:
    0 0 10px rgba(124, 58, 237, 0.3),
    inset 0 0 12px rgba(124, 58, 237, 0.15);
}

.load-more-btn:hover {
  /* transform: scale(1.01); */
  border-color: #c084fc;
  box-shadow:
    0 0 18px rgba(124, 58, 237, 0.6),
    0 0 40px rgba(239, 68, 68, 0.25),
    inset 0 0 16px rgba(124, 58, 237, 0.25);
}

.load-more-btn:active {
  transform: scale(0.97);
}

/* capa de brillo animada dentro del botón. */
.load-more-glow {
  position: absolute;
  inset: 0;

  background: linear-gradient(
    120deg,
    transparent,
    rgba(124, 58, 237, 0.6),
    rgba(239, 68, 68, 0.5),
    transparent
  );

  opacity: 0.25;
  filter: blur(20px);
  animation: LoadMoveGlow 6s linear infinite;
}

/* recorrido horizontal del brillo interno del botón. */
@keyframes LoadMoveGlow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Mantiene el texto por encima de la capa de brillo animada del botón. */
.load-more-label {
  position: relative;
  z-index: 2;
}

/* ============================================================================
 * SCROLL SENTINEL
 * Elemento invisible observado por el IntersectionObserver para detectar
 * cuándo el usuario llegó al final de la grilla y disparar más carga.
 *
 * Responsabilidades:
 * - Ofrecer un área mínima detectable (sin contenido visual)
 * ============================================================================ */

.scroll-sentinel {
  height: 40px;
  width: 100%;
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
  .movies-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 26px;
  }
}

@media (max-width: 768px) {
  .movies-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .empty-state {
    min-height: 420px;
    gap: 14px;
  }

  .empty-visual {
    width: 140px;
    height: 140px;
  }

  .projector-rays {
    width: 220px;
    height: 220px;
  }

  .halo {
    width: 120px;
    height: 120px;
  }

  .film-icon {
    width: 56px;
    height: 56px;
  }

  .empty-title {
    font-size: 24px;
  }

  .empty-description {
    font-size: 14px;
    max-width: 320px;
  }

  .cinema-loading {
    min-height: 420px;
    gap: 20px;
  }

  .loading-title {
    font-size: 16px;
  }

  .loading-bar {
    width: 260px;
  }

  .scan-line {
    width: 320px;
  }

  .load-more-btn {
    margin: 40px auto 16px;
    padding: 12px 28px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .movies-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .empty-state {
    min-height: 340px;
  }

  .empty-visual {
    width: 110px;
    height: 110px;
  }

  .projector-rays {
    width: 160px;
    height: 160px;
    filter: blur(24px);
  }

  .halo {
    width: 90px;
    height: 90px;
    filter: blur(20px);
  }

  .film-icon {
    width: 44px;
    height: 44px;
  }

  .empty-title {
    font-size: 20px;
  }

  .empty-description {
    font-size: 13px;
    max-width: 260px;
    line-height: 1.5;
  }

  .cinema-loading {
    min-height: 340px;
    gap: 16px;
  }

  .loading-title {
    font-size: 14px;
    letter-spacing: 0.08em;
  }

  .loading-bar {
    width: 200px;
    height: 6px;
  }

  .scan-line {
    width: 220px;
  }

  .load-more-btn {
    width: 100%;
    margin: 30px auto 14px;
    padding: 12px 20px;
  }
}

</style>