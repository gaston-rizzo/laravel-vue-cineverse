<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieCardCarousel.vue
 * ============================================================================
 *
 * Tarjeta individual del carrusel principal. Muestra el backdrop de la
 * película, info básica superpuesta, y navega al detalle al hacer click.
 * ============================================================================ */

import { useRoute, useRouter } from "vue-router"

import type { Movie } from "@/features/movies/types/movie"

/**
 * Props recibidas desde el padre (carrusel).
 *
 * priority indica si esta card es la primera visible del carrusel: en ese
 * caso la imagen se carga con loading="eager" para evitar el flash inicial
 * en blanco que produce el lazy loading.
 */
defineProps<{
  movie: Movie
  priority?: boolean
}>()

// Notifica al padre cuando la imagen terminó de cargar (ej: para ocultar un skeleton)
const emit = defineEmits(["loaded"])

const router = useRouter()

// Se usa solo para leer el lang actual y mantenerlo al navegar (routing i18n)
const route = useRoute()

/**
 * Navega al detalle de la película, preservando el idioma actual de la ruta.
 * Sin esto, cambiar de página resetearía el lang al default.
 */
function goToMovie(id: number) {
  router.push({
    name: "MovieDetail",
    params: {
      lang: route.params.lang as string,
      id
    }
  })
}

</script>

<template>
  
  <div class="carousel-card" @click="goToMovie(movie.id)">

    <!-- IMAGEN -->
    <img
      :src="`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`"
      :alt="movie.title"
      class="backdrop"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      @load="emit('loaded')"
    />

    <!-- OVERLAY -->
    <div class="overlay">

      <div class="content">

        <h2 class="title">
          {{ movie.title }}
        </h2>

        <div class="rating">
          ⭐ {{ movie.vote_average?.toFixed(1) }}
        </div>

        <div class="meta">
          <span class="chip">{{ movie.release_date?.slice(0,4) }}</span>
          <span class="chip">2h 10m</span> 
        </div>

      </div>

    </div>

  </div>

</template>

<style scoped>

/* ============================================================================
 * CAROUSEL CARD
 * Tarjeta de la película dentro del carrusel.
 *
 * Responsabilidades:
 * - Definir tamaño fijo de cada slide y recortar contenido (overflow)
 * - Permitir interacción (click) para ir al detalle
 * - Elevar sombra y aclarar el backdrop en hover
 * ============================================================================ */

.carousel-card {
  position: relative;
  width: 100%;
  height: 345px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}

.carousel-card:hover {
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9);
}

.carousel-card:hover .backdrop {
  filter: brightness(1.1);
}

/* ============================================================================
 * BACKDROP IMAGE
 * Imagen principal de la película dentro de la tarjeta.
 *
 * Responsabilidades:
 * - Cubrir el contenedor manteniendo proporción sin deformarse
 * - Permitir transición suave de brillo/escala en hover
 * ============================================================================ */

.backdrop {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease, filter 0.4s ease;
}

/* ============================================================================
 * OVERLAY + CONTENT
 * Capa con degradado y contenido textual sobre la imagen.
 *
 * Responsabilidades:
 * - Overlay: degradado inferior para mejorar legibilidad del texto
 * - Content: organizar título, rating y meta en columna
 * ============================================================================ */

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 24px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.65) 0%,
    rgba(0, 0, 0, 0.3) 30%,
    transparent 70%
  );
}

.content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1.4;
  color: white;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
}

.meta {
  display: flex;
  gap: 8px;
}

.chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(6px);
  color: white;
}

/* ============================================================================
 * RATING BADGE
 * Indicador de puntuación de la película.
 *
 * Responsabilidades:
 * - Destacar visualmente el rating dentro de la tarjeta
 * - Mantenerlo siempre visible en la esquina superior
 * - Mejorar contraste con fondo semitransparente y blur
 * ============================================================================ */

.rating {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 700;

  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;

  backdrop-filter: blur(8px);
  border-radius: 999px;
  
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
  .carousel-card {
    height: 300px;
  }

  .title {
    font-size: 28px;
  }

  .rating {
    font-size: 14px;
    padding: 6px 10px;
  }
}

@media (max-width: 640px) {
  .carousel-card {
    height: 240px;
  }

  .overlay {
    padding: 16px;
  }

  .title {
    font-size: 20px;
    line-height: 1.2;
  }

  .content {
    gap: 6px;
  }

  .chip {
    font-size: 10px;
    padding: 3px 8px;
  }

  .rating {
    top: 10px;
    right: 10px;
    font-size: 12px;
    padding: 5px 8px;
  }

  /* elimina hover en mobile */
  .carousel-card:hover .backdrop {
    filter: none;
  }
}

@media (max-width: 400px) {
  .carousel-card {
    height: 200px;
  }

  .title {
    font-size: 16px;
  }

  .rating {
    font-size: 11px;
  }
}

</style>