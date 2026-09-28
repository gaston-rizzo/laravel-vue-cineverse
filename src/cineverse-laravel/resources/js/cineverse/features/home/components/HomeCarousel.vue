<script setup lang="ts">

/* ============================================================================
 * COMPONENT: HomeCarousel.vue
 * ============================================================================
 *
 * Carrusel principal de la Home (Swiper), con efecto fade y autoplay.
 *
 * Puntos no evidentes de la implementación:
 * - Con effect="fade", swiper.isBeginning / isEnd no son confiables (Swiper
 *   los calcula pensando en scroll real, que acá no existe), así que los
 *   extremos se calculan a mano comparando activeIndex.
 * - "ready" se emite recién cuando Swiper terminó de inicializar Y la
 *   primera imagen visible ya cargó (ver checkReady).
 * ============================================================================ */

import { ref } from "vue";

import { Swiper, SwiperSlide } from "swiper/vue";
import { Navigation, Autoplay, EffectFade } from "swiper/modules";

import MovieCardCarousel from "./MovieCardCarousel.vue";

import type { Movie } from "@/features/movies/types/movie";

import "swiper/css";
import "swiper/css/navigation";

const props = defineProps<{
  movies: Movie[]
}>()

// Emitido cuando Swiper + la primera imagen visible ya están listos (ver checkReady)
const emit = defineEmits(["ready"])

const swiperReady = ref(false)
const firstImageLoaded = ref(false)

// Instancia de Swiper, guardada en onSwiper para controlar next/prev desde código
const swiperRef = ref()

// Extremos del carrusel, recalculados a mano por el problema de effect="fade" (ver arriba)
const isBeginning = ref(true)
const isEnd = ref(false)

/**
 * Se ejecuta cuando la primera imagen visible termina de cargar.
 *
 * El doble requestAnimationFrame es intencional: el 1er frame deja que el
 * navegador recalcule el layout tras cargar la imagen, y el 2do espera a
 * que se pinte de verdad en pantalla. Sin esto se puede emitir "ready"
 * antes de que la imagen sea visualmente visible, causando un flash.
 */
function onImageLoaded() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      firstImageLoaded.value = true
      checkReady()
    })
  })
}

// Emite "ready" solo cuando Swiper y la primera imagen están ambos listos
function checkReady() {
  if (swiperReady.value && firstImageLoaded.value) {
    emit("ready")
  }
}

/**
 * Hook @swiper: guarda la instancia y fija el estado inicial de navegación.
 *
 * swiper.isBeginning/isEnd no son fiables acá (ver nota del componente),
 * por eso isBeginning/isEnd se calculan con activeIndex en su lugar.
 */
function onSwiper(swiper: any) {
  swiperRef.value = swiper
  swiperReady.value = true
  checkReady()

  isBeginning.value = swiper.activeIndex === 0
  isEnd.value = swiper.activeIndex === props.movies.length - 1

  // Bloquea el drag manual en los extremos
  swiper.allowSlidePrev = !swiper.isBeginning
  swiper.allowSlideNext = !swiper.isEnd
}

function next() {
  swiperRef.value?.slideNext()
}

function prev() {
  swiperRef.value?.slidePrev()
}

/**
 * Recalcula extremos y bloqueo de drag en cada cambio de slide.
 * Misma lógica de activeIndex que onSwiper (ver nota del componente).
 */
function onSlideChange(swiper: any) {
  isBeginning.value = swiper.activeIndex === 0
  isEnd.value = swiper.activeIndex === props.movies.length - 1

  swiper.allowSlidePrev = !swiper.isBeginning
  swiper.allowSlideNext = !swiper.isEnd
}

</script>

<template>

  <div class="home-carousel">

    <Swiper
      :modules="[Navigation, Autoplay, EffectFade]"
      effect="fade"
      :fade-effect="{ crossFade: true }"
      :speed="1800"
      :slides-per-view="1"
      :navigation="false"
      :autoplay="{
        delay: 3500,
        disableOnInteraction: false
      }"
      @swiper="onSwiper"
      @slideChange="onSlideChange"
    >

      <SwiperSlide
        v-for="(movie, i) in movies"
        :key="movie.id"
      >
        <!-- Solo la primera slide (la visible) controla el ready -->
        <MovieCardCarousel 
          :movie="movie"
          :priority="i === 0"
          @loaded="i === 0 && onImageLoaded()"
        />
      </SwiperSlide>

      <div class="nav prev" 
        @click="prev"
        :class="{ disabled: isBeginning }"
      >
        <svg viewBox="0 0 24 24">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </div>

      <div class="nav next" 
           @click="next"
           :class="{ disabled: isEnd }"
      >
        <svg viewBox="0 0 24 24">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>

    </Swiper>

  </div>

</template>

<style scoped>

/* ============================================================================
 * HOME CAROUSEL
 * Contenedor principal del carrusel.
 *
 * Responsabilidades:
 * - Actuar como contexto de posicionamiento (position: relative)
 * - Contener elementos superpuestos (flechas de navegación)
 * - Limitar el contenido visible (overflow: hidden)
 * ============================================================================ */

.home-carousel {
  position: relative;
  overflow: hidden;
  width: 100%;
}

/* ============================================================================
 * SWIPER NAVIGATION (BOTONES NATIVOS)
 * Ajustes sobre los botones default de Swiper.
 *
 * Nota: se usa :deep() porque Swiper genera su propio DOM interno, fuera
 * del scope de <style scoped>.
 *
 * Responsabilidades:
 * - Eliminar estilos por defecto (background, bordes, sombras) y ocultarlos
 * - Resaltar y escalar levemente en hover
 * - Posicionar prev/next a los costados
 * ============================================================================ */

:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  width: auto;
  height: auto;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  color: rgba(255, 255, 255, 0.6);
  opacity: 0;
}

:deep(.swiper-button-next:hover),
:deep(.swiper-button-prev:hover) {
  color: rgba(255, 255, 255, 0.95);
  transform: scale(1.15);
}

:deep(.swiper-button-prev) {
  left: 14px;
}

:deep(.swiper-button-next) {
  right: 14px;
}

/* ============================================================================
 * SWIPER LAYOUT
 * Estilos base del contenedor, wrapper y slides de Swiper.
 *
 * Responsabilidades:
 * - Asegurar que Swiper y sus slides ocupen todo el ancho disponible
 * - Mantener box-sizing consistente (padding/border incluidos en el tamaño)
 * - Evitar que las slides se reduzcan de tamaño (flex-shrink: 0)
 * ============================================================================ */

:deep(.swiper) {
  width: 100%;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

:deep(.swiper-wrapper) {
  width: 100%;
  align-items: center;
}

:deep(.swiper-slide) {
  width: 100% !important;
  flex-shrink: 0;
}

:deep(.swiper),
:deep(.swiper-wrapper),
:deep(.swiper-slide) {
  box-sizing: border-box;
}

/* ============================================================================
 * TRANSICIÓN Y VISIBILIDAD DE SLIDES (EFFECT="FADE")
 *
 * Por qué: en el primer render Swiper puede mostrar varias slides a la vez
 * (especialmente con contenido cacheado), generando superposición y flicker.
 * Se ocultan todas por defecto y solo la activa queda visible.
 *
 * Responsabilidades:
 * - Suavizar el cambio entre slides con opacity (!important pisa la
 *   transición interna de Swiper)
 * - Mostrar solo la slide activa, habilitando interacción únicamente en ella
 * ============================================================================ */

:deep(.swiper-slide) {
  opacity: 0;
  transition: opacity 1.6s ease !important;
}

:deep(.swiper-slide-active) {
  opacity: 1;
  pointer-events: auto;
  z-index: 2;
}

/* ============================================================================
 * NAV BUTTONS (FLECHAS PROPIAS)
 * Botones de navegación custom (izquierda/derecha) sobre el carrusel.
 *
 * Responsabilidades:
 * - Posicionarse centrados verticalmente a los costados
 * - Permanecer ocultos hasta hover sobre el carrusel
 * - Reflejar estado deshabilitado en los extremos (ver isBeginning/isEnd)
 * ============================================================================ */

.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.25s ease;
  z-index: 30;
}

.nav.prev {
  left: 16px;
}

.nav.next {
  right: 16px;
}

.nav svg {
  width: 42px;
  height: 42px;
  stroke: rgba(255, 255, 255, 0.38);
  stroke-width: 1.8;
  fill: none;
  transition: all 0.25s ease;
}

.nav:hover svg {
  stroke: #fff;
  transform: scale(1.15);
}

.nav.disabled {
  opacity: 0 !important;
  pointer-events: none;
}

.home-carousel:hover .nav {
  opacity: 1;
}

/* ============================================================================
 * RESPONSIVE 
 * ============================================================================ */

@media (max-width: 1024px) {
  .nav {
    width: 40px;
    height: 40px;
  }

  .nav svg {
    width: 32px;
    height: 32px;
  }

  .nav.prev {
    left: 10px;
  }

  .nav.next {
    right: 10px;
  }
}

@media (max-width: 640px) {
  /* ocultamos navegación (mejor UX táctil) */
  .nav {
    display: none;
  }

  :deep(.swiper-slide) {
    transition: opacity 0.8s ease !important;
  }

  /* evita hover fantasma en mobile */
  .home-carousel:hover .nav {
    opacity: 0;
  }
}

@media (max-width: 400px) {
  :deep(.swiper-slide) {
    transition: opacity 0.6s ease !important;
  }
}

</style>