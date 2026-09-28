<script setup lang="ts">

/* ============================================================================
 * COMPONENT: HomeRow.vue
 * ============================================================================
 *
 * Contenedor que envuelve un carrusel de películas (HomeCarousel), con título/
 * subtítulo superpuestos y un overlay tipo skeleton mientras carga.
 *
 * Usa sessionStorage para no repetir el loader en navegaciones posteriores
 * dentro de la misma sesión, y espera el evento "ready" del carrusel (Swiper +
 * primera imagen cargada) antes de mostrar el contenido real.
 * ============================================================================ */

import { ref } from "vue";

import HomeCarousel from "./HomeCarousel.vue";

import type { Movie } from "@/features/movies/types/movie";

defineProps<{
  title: string
  subtitle: string
  movies: Movie[]
  loading?: boolean
}>()

// Si la home ya se mostró antes en esta sesión, no repetimos el loader
const alreadyLoaded = sessionStorage.getItem("home-loaded") === "true"

// Visibilidad del skeleton inicial: arranca oculto si ya se cargó antes
const showOverlay = ref(!alreadyLoaded)

// True cuando Swiper terminó de inicializar y la primera imagen ya cargó
const isReady = ref(false)

/**
 * Se ejecuta cuando el carrusel emite "ready". Marca el contenido como
 * listo, persiste el flag en sessionStorage, y oculta el overlay con un
 * pequeño delay.
 *
 * El delay es necesario porque "imagen cargada" (onload) no garantiza que
 * el navegador ya la haya pintado en pantalla: sin este margen se puede
 * ver un flash blanco o un frame vacío antes de que aparezca el contenido.
 */
function handleReady() {
  isReady.value = true

  if (!alreadyLoaded) {
    sessionStorage.setItem("home-loaded", "true")
  }

  setTimeout(() => {
    showOverlay.value = false
  }, 50)
}

</script>

<template>

  <div class="carousel-wrapper">

    <!-- TEXTO SUPERPUESTO -->
    <div class="floating-header">

      <h2 class="row-title">
        {{ title }}
      </h2>

      <p class="row-subtitle">
        {{ subtitle }}
      </p>

    </div>

    <div class="carousel-container">

      <div 
        v-if="showOverlay"
        class="skeleton-overlay"
        :class="{ hide: isReady }"
        >
          <div class="skeleton-hero" />
      </div>
        
      <!-- CONTENIDO REAL -->        
      <div :class="['carousel-content', { visible: isReady || alreadyLoaded }]">
        <HomeCarousel 
          :movies="movies"
          @ready="handleReady"
        />
      </div>

    </div>

  </div>

</template>

<style scoped>

/* ============================================================================
 * CAROUSEL WRAPPER
 * Contenedor principal del carrusel.
 *
 * Responsabilidades:
 * - Actuar como contexto de posicionamiento (position: relative)
 * - Permitir ubicar elementos superpuestos (header, overlay)
 * - Encapsular el carrusel y sus capas visuales
 * ============================================================================ */

.carousel-wrapper {
  position: relative;
}

/* ============================================================================
 * FLOATING HEADER
 * Header superpuesto (título/subtítulo) sobre el carrusel.
 *
 * Responsabilidades:
 * - Mostrar título y subtítulo de la sección
 * - Posicionarse encima del contenido sin afectar el layout
 * - Mantener jerarquía visual sobre el carrusel (z-index)
 * ============================================================================ */

.floating-header {
  position: absolute;
  top: 18px;
  left: 24px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-title {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.3px;
  color: #fff;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.9);
}

.row-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
}

/* ============================================================================
 * CAROUSEL CONTAINER
 * Área visible del carrusel.
 *
 * Responsabilidades:
 * - Actuar como referencia para el overlay de carga (position: relative)
 * - Mantener una altura fija para evitar saltos de layout durante la carga
 * ============================================================================ */

.carousel-container {
  position: relative;
  height: 345px;
}

/* ============================================================================
 * SKELETON OVERLAY
 * Capa de carga superpuesta sobre el carrusel, con fondo animado
 * y efecto shimmer durante la carga.
 *
 * Responsabilidades:
 * - Cubrir el área del carrusel y bloquear interacción mientras carga
 * - Desvanecerse suavemente (fade-out) cuando el contenido está listo
 * ============================================================================ */

.skeleton-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 18px;
  z-index: 3;

  background:
    radial-gradient(circle at 15% 25%, rgba(255, 40, 180, 0.10), transparent 35%),
    radial-gradient(circle at 85% 70%, rgba(130, 60, 255, 0.10), transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(0, 220, 255, 0.04), transparent 45%),
    linear-gradient(
      135deg,
      #0b0f19 0%,
      #101728 35%,
      #15132a 60%,
      #0b0f19 100%
    );

  border: 1px solid rgba(255, 255, 255, 0.03);

  box-shadow:
    inset 0 0 40px rgba(255, 40, 170, 0.04),
    inset 0 0 70px rgba(120, 0, 255, 0.04);

  transition: opacity 0.35s ease;
}

/* haz de luz que recorre el overlay, efecto shimmer. */
.skeleton-overlay::before {
  content: "";
  position: absolute;
  inset: -20%;

  background: linear-gradient(
    110deg,
    transparent 35%,
    rgba(255, 255, 255, 0.04) 46%,
    rgba(255, 90, 200, 0.10) 50%,
    rgba(120, 220, 255, 0.08) 54%,
    transparent 65%
  );

  animation: shimmer 2.8s linear infinite;
}

/* desplaza el gradiente de izquierda a derecha. */
@keyframes shimmer {
  from { transform: translateX(-70%); }
  to { transform: translateX(70%); }
}

/* fade-out del overlay una vez que el contenido está listo. */
.skeleton-overlay.hide {
  opacity: 0;
  pointer-events: none;
}

/* ============================================================================
 * RESPONSIVE (MOBILE)
 * ============================================================================ */

@media (max-width: 768px) {
  .floating-header {
    top: 12px;
    left: 16px;
    gap: 2px;
  }

  .row-title {
    font-size: 20px;
    letter-spacing: -0.2px;
  }

  .row-subtitle {
    font-size: 12px;
  }

  .carousel-container {
    height: 240px;
  }

  .skeleton-overlay {
    border-radius: 12px;
  }
}

</style>