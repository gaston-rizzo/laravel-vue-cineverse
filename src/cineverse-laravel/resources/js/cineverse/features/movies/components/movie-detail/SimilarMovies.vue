<script setup lang="ts">

/* ============================================================================
 * COMPONENT: SimilarMovies.vue
 * ============================================================================
 *
 * Grilla de películas similares a la película actual. Recibe la lista desde
 * el padre, limita a 6 resultados, y navega al detalle al hacer click,
 * preservando el idioma actual en la ruta.
 * ============================================================================ */

import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { Film } from "lucide-vue-next";

import noImagePoster from "@/assets/no-image-poster.jpg";

import type { Movie } from "../../types/movie";

// Props: lista de películas similares recibida del padre
const props = defineProps<{
  movies: Movie[];
}>();

// Navegación y lectura de params de la ruta actual (para preservar el idioma)
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// Limita la cantidad de películas mostradas a un máximo de 6
const limitedMovies = computed(() => props.movies.slice(0, 6));

// Base URL para las imágenes de posters (TMDB)
const imageBase = "https://image.tmdb.org/t/p/w300";

/**
 * Navega al detalle de la película seleccionada, preservando el idioma
 * actual de la URL. Se ejecuta al hacer click en una tarjeta.
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

</script>

<template>

<section class="similar-wrapper">

  <!-- contenedor centrado solo para cards -->
  <div class="similar-inner">

    <div v-if="limitedMovies.length === 0" class="similar-empty">
      <Film :size="32" />
      <p>{{ t("similar.noMovies") }}</p>
    </div>

    <div v-else class="similar-grid">

      <div 
        v-for="movie in limitedMovies"
        :key="movie.id"
        class="similar-card"
        :style="{ backgroundImage: `url(${noImagePoster})` }"
        @click="goToMovie(movie.id)"
        >
          <img 
            :src="movie.poster_path ? 
                  imageBase + movie.poster_path :
                  noImagePoster"  />
          <div class="overlay">
            <span class="title">{{ movie.title }}</span>
          </div>
        </div>

      </div>

  </div>

</section>

</template>

<style scoped>

/* ============================================================================
 * SIMILAR WRAPPER
 * Contenedor externo de la sección de películas similares.
 *
 * Responsabilidades:
 * - Ocupar todo el ancho disponible
 * - Aplicar el fondo con degradado de la sección
 * ============================================================================ */

.similar-wrapper {
  width: 100%;
  background: transparent;
}

/* ============================================================================
 * INNER CONTAINER
 * Contenedor interno centrado.
 *
 * Responsabilidades:
 * - Limitar el ancho máximo de las cards
 * - Centrar la grilla dentro del wrapper
 * ============================================================================ */

.similar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.similar-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 50px 20px;
  color: rgba(255, 255, 255, .5);
}

.similar-empty svg {
  width: 42px;
  height: 42px;
  color: rgba(255, 255, 255, .28);
  stroke-width: 1.8;
}

.similar-empty p {
  margin: 0;
  font-size: .95rem;
  font-weight: 500;
  letter-spacing: .03em;
  color: rgba(255, 255, 255, .58);
}

/* ============================================================================
 * SIMILAR GRID
 * Grilla de películas similares.
 *
 * Responsabilidades:
 * - Organizar las cards en columnas
 * - Mantener spacing uniforme entre ellas
 * ============================================================================ */

.similar-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 22px;
  justify-content: center;
}

/* ============================================================================
 * SIMILAR CARD
 * Tarjeta individual de película similar.
 *
 * Responsabilidades:
 * - Contener imagen y overlay
 * - Animar su entrada y aplicar efectos de hover
 * ============================================================================ */

.similar-card {
  position: relative;
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s ease;
  background: rgba(255, 255, 255, 0.02);
  background-size: cover;
  background-position: center;
  aspect-ratio: 2 / 3;
  opacity: 0;
  animation: similarCardEnter 0.4s ease forwards;
}

/* entra levemente desde la izquierda (sentido opuesto a MovieCast, para variar). */
@keyframes similarCardEnter {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* borde degradado tipo glass, recortado con mask para no tapar el contenido. */
.similar-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.2px;

  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25),
    rgba(124, 58, 237, 0.7),
    rgba(255, 255, 255, 0.08)
  );

  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;

  pointer-events: none;
}

.similar-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* escala leve + realce de color + glow violeta progresivo. */
.similar-card:hover {
  transform: scale(1.01);
  filter: saturate(1.15) brightness(1.05) contrast(1.05);
  box-shadow:
    0 0 0 1px rgba(139, 92, 246, 0.6),
    0 0 12px rgba(139, 92, 246, 0.6),
    0 0 30px rgba(124, 58, 237, 0.5),
    0 0 60px rgba(124, 58, 237, 0.35);
}

/* ============================================================================
 * OVERLAY
 * Capa inferior con el título, sobre la imagen de la card.
 *
 * Responsabilidades:
 * - Dar legibilidad al título con gradiente + blur
 * - Mantener el mismo borde glass que la card
 * ============================================================================ */

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 12px;

  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.95) 0%,
    rgba(0, 0, 0, 0.7) 40%,
    rgba(0, 0, 0, 0.3) 70%,
    transparent 100%
  );

  backdrop-filter: blur(8px);
}

/* borde glass sutil, mismo truco de mask que .similar-card::before. */
.overlay::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;

  background: linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.15),
    rgba(124, 58, 237, 0.5),
    rgba(255, 255, 255, 0.08)
  );

  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;

  pointer-events: none;
}

.title {
  /* block para que line-height se aplique correctamente sobre el span */
  display: block;
  font-size: 0.85rem;
  line-height: 1.05;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
  .similar-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
}

@media (max-width: 768px) {
  .similar-inner {
    padding: 10px;
  }

  .similar-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .title {
    font-size: 0.78rem;
  }
}

@media (max-width: 480px) {
  .similar-inner {
    padding: 6px;
  }

  .similar-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .overlay {
    padding: 10px;
  }

  .title {
    font-size: 0.72rem;
  }
}

</style>
