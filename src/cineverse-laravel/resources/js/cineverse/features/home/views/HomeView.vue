<script setup lang="ts">

/* ============================================================================
 * VIEW: HomeView.vue
 * ============================================================================
 *
 * Página de inicio: renderiza filas (HomeRow) de trending, en cartelera y
 * mejor valoradas, más un ticker animado con destacados de trending.
 * Cada fila controla su propio estado de carga en lugar de uno global.
 * ============================================================================ */

import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useHomeMovies } from "@/features/home/composables/useHomesMovies";

import HomeRow from "@/features/home/components/HomeRow.vue";

// Hook de i18n. Al cambiar "locale", useHomeMovies vuelve a pedir las
// películas en el nuevo idioma
const { t, locale } = useI18n();

// 3 queries independientes (trending, topRated, nowPlaying), cada una con
// su propio .data / .isLoading. Ninguna fila espera a las otras dos.
const { trending, topRated, nowPlaying } = useHomeMovies(locale);

// Limita cada categoría a un máximo de 10 películas, para no sobrecargar
// el carrusel y mantener consistencia visual
const movies = computed(() => ({
  trending: (trending.data.value ?? []).slice(0, 10),
  topRated: (topRated.data.value ?? []).slice(0, 10),
  nowPlaying: (nowPlaying.data.value ?? []).slice(0, 10),
}));

// Indican si cada categoría ya tiene datos, para no renderizar
// filas vacías mientras carga la data
const isTrendingReady = computed(() => movies.value.trending.length > 0);
const isNowPlayingReady = computed(() => movies.value.nowPlaying.length > 0);
const isTopRatedReady = computed(() => movies.value.topRated.length > 0);

/**
 * Arma la lista de textos que se muestran en la cinta animada del ticker.
 * Toma las primeras 5 películas de trending (título, año, rating), agrega
 * frases fijas de relleno, y duplica todo el resultado para lograr un
 * scroll continuo sin cortes (mientras la primera mitad sale, la segunda
 * entra sin dejar espacios).
 */
const tickerItems = computed(() => {
  const result: string[] = [];

  const trend = movies.value.trending;

  if (!trend.length) return result;

  for (const movie of trend.slice(0, 5)) {
    if (!movie) continue;

    const title = movie.title;
    const year = movie.release_date?.slice(0, 4) || "----";
    const rating = movie.vote_average?.toFixed(1) || "0.0";

    result.push(`🔥 ${title} (${year}) ⭐ ${rating}`);
  }

  result.push("🎬 " + t("home.ticker.globalTrends"));
  result.push("🍿 " + t("home.ticker.newReleases"));
  result.push("⭐ " + t("home.ticker.topRatedUsers"));

  return [...result, ...result];
});

</script>

<template>

<div class="home">

  <div class="container">

    <!-- TICKER -->
    <div class="ticker">
      <div v-if="trending.isLoading.value" class="ticker-skeleton" />
      <div v-else class="ticker-track">
        <span v-for="(item, i) in tickerItems" :key="i">
          {{ item }}
        </span>
      </div>
    </div>

    <HomeRow
      :title="'🔥 ' + t('home.trending')"
      :subtitle="t('home.subTrending')"
      :movies="movies.trending"
      :loading="!isTrendingReady"
    />

    <div class="row-separator" />

    <HomeRow
      :title="'🆕 ' + t('home.nowPlaying')"
      :subtitle="t('home.subNowPlaying')"
      :movies="movies.nowPlaying"
      :loading="!isNowPlayingReady"
    />

    <div class="row-separator" />

    <HomeRow
      :title="'⭐ ' + t('home.topRated')"
      :subtitle="t('home.subTopRated')"
      :movies="movies.topRated"
      :loading="!isTopRatedReady"
    />

  </div>
  
</div>

</template>

<style scoped>

/* ============================================================================
 * HOME
 * Contenedor principal de la vista.
 *
 * Responsabilidades:
 * - Limitar el ancho máximo del contenido
 * - Centrar la página horizontalmente
 * - Aplicar padding lateral general
 * - Mostrar el mismo fondo animado (luces radiales violeta/rosa + ruido)
 *   que se usa en Favorites, para mantener consistencia visual
 * ============================================================================ */

.home {
  position: relative;
  min-height: 100vh;
  overflow: visible;
  color: #e5e7eb;
  padding-top: 20px;
  padding-bottom: 40px;
  background: #0b0f19;
  isolation: isolate;
}

/* fondo animado con luces radiales, blur y movimiento continuo. */
.home::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;

  background:
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.15), transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(124, 58, 237, 0.18), transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(30, 64, 175, 0.18), transparent 50%),
    linear-gradient(180deg, #0b0f19 0%, #0f172a 40%, #0b0f19 100%);

  filter: blur(90px);
  animation: backgroundDrift 45s ease-in-out infinite alternate;
}

/* alterna suavemente posición y escala del fondo animado. */
@keyframes backgroundDrift {
  0% { transform: translate3d(-4%, -2%, 0) scale(1); }
  50% { transform: translate3d(3%, 2%, 0) scale(1.1); }
  100% { transform: translate3d(-2%, 4%, 0) scale(1.05); }
}

/* capa de ruido/textura sutil, sin interferir con interacciones. */
.home::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/noise.svg");
  opacity: 0.06;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* ============================================================================
 * CONTAINER
 * Contenedor interno de la Home.
 *
 * Responsabilidades:
 * - Aplicar padding lateral al contenido
 * - Ajustar levemente la alineación horizontal (margin-left)
 * ============================================================================ */

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

/* ============================================================================
 * ROW SEPARATOR
 * Línea divisoria visual entre filas (estilo neón animado).
 *
 * Responsabilidades:
 * - Separar secciones (HomeRow) de forma elegante
 * - Aportar dinamismo con un efecto de flujo horizontal
 * - Integrarse visualmente con la estética (colores + glow)
 * ============================================================================ */

.row-separator {
  height: 3px;

  background: linear-gradient(
    90deg,
    transparent,
    #ff2a7f,
    #7c3aed,
    #ff2a7f,
    transparent
  );

  animation: separatorFlow 8s linear infinite;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 10%,
    black 90%,
    transparent
  );
  mask-image: linear-gradient(
    to right,
    transparent,
    black 10%,
    black 90%,
    transparent
  );
}

/* Desplazamiento continuo del gradiente para el efecto de flujo */
@keyframes separatorFlow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

/* Capa de brillo difuso (glow) alrededor del separador */
.row-separator::after {
  content: "";
  position: absolute;
  inset: -4px; /* 👈 clave: se expande */

  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 42, 127, 0.6),
    rgba(124, 58, 237, 0.6),
    transparent
  );

  filter: blur(8px); /* 👈 esto crea glow real */
  opacity: 0.7;
  animation: pulse 2s ease-in-out infinite;
}

/* Variación de opacidad para simular pulsación de luz */
@keyframes pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.8; }
}

/* ============================================================================
/* CINTA ANIMADA 
/* ============================================================================ */

/* ============================================================================
 * TICKER
 * Contenedor principal de la cinta informativa animada.
 *
 * Responsabilidades:
 * - Delimitar el área visible del ticker
 * - Contener y alinear el contenido horizontal
 * - Aplicar fondo y bordes con estética sutil
 * - Suavizar los extremos mediante máscara
 * ============================================================================ */

.ticker {
  position: relative;
  overflow: hidden;
  height: 60px;
  display: flex;
  align-items: center;
  margin-bottom: 0px;

  background: radial-gradient(
    circle at 50% 50%,
    rgba(255,0,80,0.08),
    transparent 70%
  );

  border-top: 1px solid rgba(255,0,80,0.2);
  border-bottom: 1px solid rgba(255,0,80,0.2);

  /* para bordes */
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 8%,
    black 92%,
    transparent
  );
  mask-image: linear-gradient(
    to right,
    transparent,
    black 8%,
    black 92%,
    transparent
  );
}

/* Barrido luminoso que recorre el ticker */
.ticker::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 0, 80, 0.15),
    transparent
  );
  animation: scan 6s linear infinite;
}

/* Desplazamiento horizontal del efecto de barrido luminoso */
@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* ============================================================================
 * TICKER TRACK
 * Contenedor interno que agrupa los elementos del ticker.
 *
 * Responsabilidades:
 * - Organizar los ítems en una fila horizontal continua
 * - Mantener espaciado uniforme entre elementos
 * - Evitar saltos de línea en el contenido
 * - Aplicar el desplazamiento animado del ticker
 * ============================================================================ */

.ticker-track {
  display: flex;
  gap: 64px;
  white-space: nowrap;
  animation: tickerScroll 42s linear infinite;
}

/* Desplazamiento continuo del contenido para el efecto de loop infinito */
@keyframes tickerScroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

/* ============================================================================
 * TICKER ITEM (SPAN)
 * Estilo visual de cada elemento de texto dentro del ticker.
 *
 * Responsabilidades:
 * - Definir tipografía destacada y legible
 * - Aplicar estilo visual llamativo (color + glow)
 * - Reforzar la estética neón del ticker
 * ============================================================================ */

.ticker span {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #ff2a4f;
  text-shadow:
    0 0 6px rgba(255, 42, 79, 0.6),
    0 0 18px rgba(255, 42, 79, 0.4);
}

/* Separador visual (•) entre elementos del ticker */
.ticker span::after {
  content: "•";
  margin-left: 64px;
  color: #ff2a7f;

  text-shadow:
    0 0 6px #ff2a7f,
    0 0 12px #a855f7;
}

/* Elimina el separador después del último elemento */
.ticker span:last-child::after {
  content: "";
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

/* TABLET */
@media (max-width: 1024px) {
  .home {
    padding: 0 16px;
  }

  .container {
    margin-left: 0;
    padding: 0 8px;
  }

  .ticker {
    height: 50px;
  }

  .ticker-track {
    gap: 48px;
  }

  .ticker span {
    font-size: 18px;
  }
}

/* MOBILE */
@media (max-width: 768px) {
  .home {
    padding: 0 12px;
  }

  .container {
    margin-left: 0;
    padding: 0 8px;
  }

  .ticker {
    height: 44px;
  }

  .ticker-track {
    gap: 32px;
  }

  .ticker span {
    font-size: 14px;
    letter-spacing: 0.5px;
  }

  .row-separator {
    height: 2px;
  }

  .row-separator::after {
    filter: blur(4px);
    opacity: 0.4;
  }
}

/* MOBILE PEQUEÑO */
@media (max-width: 480px) {
  .ticker-track {
    gap: 20px;
    animation-duration: 28s;
  }

  .ticker span {
    font-size: 12px;
  }
}

</style>
