<script setup lang="ts">

/* ============================================================================
 * COMPONENT: PersonKnownFor.vue
 * ============================================================================
 *
 * Muestra la sección "Conocido por" dentro del perfil de una persona
 * (actor/actriz), destacando sus películas más populares en formato de
 * sidebar. Recibe la lista de películas desde el padre, las ordena por
 * popularidad, selecciona las 8 más destacadas y permite navegar al
 * detalle de cada una al hacer click.
 * ============================================================================ */

import { computed } from "vue"
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import noImagePoster from "@/assets/no-image-poster.jpg"

// Lista de películas de la persona recibida desde el componente padre
const props = defineProps<{
  credits: any[]
}>()

// t() para traducir el título "Conocido por"
const { t } = useI18n()

// Navegación al detalle de película
const router = useRouter()

// Parámetros de la ruta actual (lang, id, etc), usados para armar la navegación
const route = useRoute()

/**
 * Selecciona las 8 películas más populares para la sección "Conocido por".
 *
 * Clona props.credits para no mutar las props directamente, ordena por
 * popularity de mayor a menor y recorta al top 8, ideal para un sidebar
 * de "highlights" del perfil.
 */
const knownFor = computed(() =>
  [...props.credits]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 8)
)

/**
 * Navega al detalle de la película seleccionada, manteniendo el idioma
 * actual de la ruta (name: "MovieDetail" debe coincidir con la ruta
 * configurada en el router).
 */
function goToMovie(id: number) {
  router.push({
    name: "MovieDetail",
    params: {
      lang: route.params.lang,
      id
    }
  })
}

</script>

<template>

<div class="sidebar">

  <h3 class="sidebar-title">
    {{ t('personDetail.knownFor') }}
  </h3>

  <div
      v-for="movie in knownFor"
      :key="movie.id"
      class="sidebar-item"
      @click="goToMovie(movie.id)"
    >

      <img
        :src="movie.poster_path 
        ? 'https://image.tmdb.org/t/p/w185' + movie.poster_path
        : noImagePoster"
        class="sidebar-poster"
      />

      <span class="sidebar-text">
        {{ movie.title }}
        <small>
          ({{ movie.release_date?.slice(0,4) || '-' }})
        </small>
      </span>

  </div>

</div>

</template>

<style>

/* ============================================================================
 * SIDEBAR: PersonKnownFor
 * Sección "Conocido por" que muestra películas populares del actor/actriz.
 *
 * Responsabilidades:
 * - Contenedor general del sidebar con fondo glass
 * - Aplicar bordes, sombras y radio de borde
 * ============================================================================ */

.sidebar {
  margin-top: 10px;
  padding: 15px;
  border-radius: 14px;

  background: linear-gradient(
    160deg,
    rgba(40, 25, 80, 0.85),
    rgba(15, 10, 30, 0.95)
  );

  border: 1px solid rgba(167, 139, 250, 0.25);
  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.8),
    inset 0 0 25px rgba(124, 58, 237, 0.12),
    0 0 40px rgba(124, 58, 237, 0.18);
}

/* ============================================================================
 * SIDEBAR TITLE
 * Título de la sección "Conocido por" en la barra lateral.
 *
 * Responsabilidades:
 * - Mostrar el título con tamaño y peso adecuados
 * - Aplicar degradado al texto para efecto neon/cinematic
 * - Mostrar una línea decorativa con glow debajo (::after)
 * ============================================================================ */

.sidebar-title {
  position: relative; /* necesario para posicionar el ::after */
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;

  background: linear-gradient(
    90deg,
    #c4b5fd,
    #a78bfa,
    #7c3aed
  );

  -webkit-background-clip: text; /* recorta el degradado al texto (WebKit) */
  -webkit-text-fill-color: transparent; /* hace transparente el texto para mostrar el degradado */
  background-clip: text; /* propiedad estándar */
}

/* glow line bajo el título. */
.sidebar-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 100%;
  height: 1px;

  background: linear-gradient(
    90deg,
    rgba(124, 58, 237, 0.8),
    transparent
  );
}

/* ============================================================================
 * ITEM DE PELÍCULA
 * Cada película dentro de "Conocido por".
 *
 * Responsabilidades:
 * - Layout flex con poster y texto
 * - Línea separadora sutil entre items (::after)
 * - Efecto de brillo animado tipo "shine" en hover (::before)
 * - Hover con desplazamiento, sombra y glow
 * ============================================================================ */

.sidebar-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  z-index: 1;

  /* IMPORTANTE */
  border: 1px solid transparent;
  box-sizing: border-box;

  transition:
    background 0.35s ease,
    box-shadow 0.35s ease,
    border-color 0.35s ease;
}

/* línea separadora entre items, no se aplica al último; degradado para suavizarla. */
.sidebar-item:not(:last-child)::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 5px;
  width: calc(100% - 5px);
  height: 1px;

  background: linear-gradient(
    90deg,
    rgba(124, 58, 237, 0.5),
    transparent
  );
}

/* capa animada de brillo ("shine") que recorre el item en hover. */
.sidebar-item::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;

  background: linear-gradient(
    120deg,
    transparent,
    rgba(124, 58, 237, 0.5),
    rgba(255, 0, 100, 0.4),
    transparent
  );

  opacity: 0;
  transform: translateX(-100%);
  transition: all 0.5s ease;
}

.sidebar-item:hover {
  background: rgba(124, 58, 237, 0.15);

  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.8),
    0 0 25px rgba(124, 58, 237, 0.4),
    0 0 60px rgba(255, 0, 100, 0.2);

  border-color: rgba(167, 139, 250, 0.4);
}

.sidebar-item:hover::before {
  opacity: 1;
  transform: translateX(100%);
}

.sidebar-item:hover .sidebar-text {
  background: linear-gradient(
    90deg,
    #ffffff,
    #c4b5fd,
    #7c3aed
  );

  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ============================================================================
 * POSTER DE PELÍCULA
 *
 * Responsabilidades:
 * - Mostrar poster con tamaño fijo y bordes redondeados
 * - Aplicar sombra y ligera escala en hover del item
 * ============================================================================ */

.sidebar-poster {
  width: 45px;
  height: 68px;
  object-fit: cover;
  border-radius: 6px;

  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.6),
    0 0 10px rgba(124, 58, 237, 0.2);

  transition: transform 0.25s ease;
}

.sidebar-item:hover .sidebar-poster {
  transform: scale(1.05);
}

/* ============================================================================
 * TEXTO DEL ITEM
 *
 * Responsabilidades:
 * - Mostrar título con degradado suave
 * - Mantener legibilidad sobre fondo oscuro
 * - Mostrar año en tamaño reducido
 * ============================================================================ */

.sidebar-text {
  font-size: 0.88rem;
  line-height: 1.2;

  background: linear-gradient(
    90deg,
    #e5e7eb,
    #c4b5fd
  );

  -webkit-background-clip: text;
  background-clip: text; /* versión estándar para evitar warning */
  -webkit-text-fill-color: transparent;
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .sidebar {
    padding: 12px;
  }

  .sidebar-title {
    font-size: 0.95rem;
  }

  .sidebar-item {
    padding: 8px;
    gap: 8px;
  }

  .sidebar-poster {
    width: 40px;
    height: 60px;
  }

  .sidebar-text {
    font-size: 0.82rem;
  }

  /* desactiva desplazamiento hover en mobile */
  .sidebar-item:hover {
    transform: none;
  }
}

</style>