<script setup lang="ts">

/* ============================================================================
 * COMPONENT: PersonFilmography.vue
 * ============================================================================
 *
 * Muestra la filmografía completa de una persona (actor/actriz) en formato
 * de timeline ordenada por año. Recibe la lista de películas (credits) desde
 * el padre, las ordena por fecha de estreno, las agrupa por año, y permite
 * navegar al detalle de cada película al hacer click.
 * ============================================================================ */

import { computed } from "vue"
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import noImagePoster from "@/assets/no-image-poster.jpg"

// Lista de películas (filmografía) recibida desde el componente padre
const props = defineProps<{
  credits: any[]
}>()

// t() para traducciones dentro del componente
const { t } = useI18n()

// Navegación al detalle de película
const router = useRouter()

// Parámetros de la ruta actual (lang, id, etc), usados para armar la navegación
const route = useRoute()

/**
 * Ordena la filmografía por fecha de estreno (más reciente primero).
 *
 * Clona props.credits para no mutar las props directamente, descarta
 * películas sin release_date (evita errores al construir el Date) y
 * compara por timestamp para un orden preciso.
 */
const sortedCredits = computed(() =>
  [...props.credits]
    .filter(m => m.release_date)
    .sort((a, b) =>
      new Date(b.release_date).getTime() -
      new Date(a.release_date).getTime()
    )
)

/**
 * Agrupa sortedCredits por año para construir la timeline.
 *
 * Extrae el año desde release_date (YYYY-MM-DD → YYYY), usando "—" como
 * fallback si no hubiera fecha válida. Agrupa en un objeto intermedio y
 * lo convierte a array ordenado de años, de más reciente a más antiguo.
 */
const groupedByYear = computed(() => {
  const map: Record<string, any[]> = {}

  sortedCredits.value.forEach(movie => {
    const year = movie.release_date?.slice(0, 4) || "—"
    if (!map[year]) map[year] = []
    map[year].push(movie)
  })

  return Object.entries(map)
    .sort((a, b) =>
      Number(b[0]) - Number(a[0])
    )
})

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

<section class="credits">

  <h2 class="credits-title">
     {{ t('personDetail.filmography') }}
  </h2>

  <div
    v-for="[year, movies] in groupedByYear"
    :key="year"
    class="year-block"    
  >

    <!-- AÑO -->
    <div class="year">{{ year }}</div>

    <!-- LISTA -->
    <div class="movie-list">

      <div
        v-for="movie in movies"
        :key="movie.id"
        class="movie-item"
        @click="goToMovie(movie.id)"
      >

        <!-- POSTER -->
        <img
          :src="movie.poster_path
            ? 'https://image.tmdb.org/t/p/w185' + movie.poster_path
            : noImagePoster"
          class="poster"
        />

        <!-- INFO -->
        <div class="info">

          <div class="title">
            {{ movie.title }}
          </div>

          <div v-if="movie.character">
            {{ t('personDetail.playedAs') }} {{ movie.character }}
          </div>

        </div>

      </div>

    </div>

  </div>

</section>

</template>

<style scoped>

/* ============================================================================
 * CREDITS SECTION
 * Contenedor general de la timeline de filmografía.
 *
 * Responsabilidades:
 * - Limitar ancho del contenido
 * - Centrar horizontalmente
 * - Mantener padding lateral
 * ============================================================================ */

.credits {
  max-width: 1200px;   /* limita ancho del contenido */
  margin: 22px auto;   /* centra horizontalmente */
  padding-right: 40px; /* espacio lateral derecho */
}

/* ============================================================================
 * CREDITS TITLE
 * Título principal de la sección filmografía.
 *
 * Responsabilidades:
 * - Mostrar encabezado con gradiente
 * - Aplicar separación inferior
 * - Línea glow decorativa debajo del título (::after)
 * ============================================================================ */

.credits-title {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 25px;
  position: relative;
  padding-bottom: 10px;
  background: linear-gradient(
    90deg,
    #ffffff,
    #c4b5fd,
    #7c3aed
  );
  background-clip: text;         /* estándar */
  -webkit-background-clip: text; /* compatibilidad */
  -webkit-text-fill-color: transparent;
  color: transparent; /* fallback sin soporte de background-clip */
}

/* línea glow decorativa bajo el título. */
.credits-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%; /* ocupa todo el ancho */
  height: 2px; /* grosor de la línea */
  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 58, 237, 0.8),
    rgba(255, 0, 100, 0.6),
    transparent
  );
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.6);
}

/* ============================================================================
 * YEAR BLOCK
 * Contenedor de películas agrupadas por año.
 *
 * Responsabilidades:
 * - Mantener referencia para línea vertical
 * - Separar bloques de años
 * - Línea vertical del timeline conectando las películas (::before)
 * ============================================================================ */

.year-block {
  position: relative;  /* referencia para la línea vertical */
  padding-left: 30px;  /* espacio para la línea timeline */
  margin-bottom: 35px; /* separación entre años */
}

/* línea vertical del timeline, con gradiente y desvanecido hacia abajo. */
.year-block::before {
  content: "";
  position: absolute;
  left: 12px; /* posición de la línea */
  top: 5px;
  bottom: 0;
  width: 2px; /* grosor */
  background: linear-gradient(
    to bottom,
    rgba(124, 58, 237, 0.7),
    rgba(255, 0, 100, 0.4),
    transparent
  );
}

/* ============================================================================
 * YEAR
 * Texto que indica el año de la filmografía.
 *
 * Responsabilidades:
 * - Mostrar año
 * - Preparar referencia para punto del timeline
 * - Punto decorativo junto al año (::before)
 * - Línea horizontal decorativa junto al año (::after)
 * ============================================================================ */

.year {
  display: flex; /* permite línea horizontal */
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #c4b5fd;
  margin-bottom: 12px;
  position: relative; /* referencia para el punto */
}

/* punto decorativo que señala la posición del año en el timeline. */
.year::before {
  content: "";
  position: absolute;
  left: -22px;
  top: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #7c3aed;
  box-shadow: 0 0 10px #7c3aed;
}

/* línea horizontal decorativa que acompaña al año. */
.year::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    rgba(124, 58, 237, 0.5),
    transparent
  );
}

/* ============================================================================
 * MOVIE LIST
 * Contenedor vertical de items por año.
 *
 * Responsabilidades:
 * - Mantener separación entre películas
 * - Organizar en columna
 * ============================================================================ */

.movie-list {
  display: flex;
  flex-direction: column; /* lista vertical */
  gap: 10px;               /* separación entre películas */
}

/* ============================================================================
 * MOVIE ITEM
 * Tarjeta interactiva de cada película.
 *
 * Responsabilidades:
 * - Mostrar poster y texto en fila, con estilo glass
 * - Glow y elevación al pasar el mouse
 * ============================================================================ */

.movie-item {
  position: relative;
  overflow: hidden;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border-radius: 10px;

  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);

  transition:
    background 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

/* .movie-item:nth-child(even) {
  transform: translateX(6px);
  background: rgba(255, 255, 255, 0.06);
} */

/* capa glow interna, oculta por defecto, se activa en hover. */
.movie-item::before {
  content: "";
  position: absolute;
  inset: 0; /* ocupa todo el item */
  border-radius: 10px;
  background: linear-gradient(
    120deg,
    rgba(124, 58, 237, 0.3),
    transparent,
    rgba(255, 0, 100, 0.25)
  );
  opacity: 0; /* oculto por defecto */
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.movie-item:hover {
  cursor: pointer;
  transform: translateY(-1px) scale(1.01);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(124, 58, 237, 0.5);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(124, 58, 237, 0.25);
}

.movie-item:hover::before {
  opacity: 1;
}

/* ============================================================================
 * POSTER
 * Imagen representativa de la película.
 *
 * Responsabilidades:
 * - Mantener tamaño y proporciones
 * - Aplicar border-radius y sombra
 * - Escalar y rotar ligeramente en hover del item
 * ============================================================================ */

.poster {
  transition: transform 0.35s ease, box-shadow 0.35s ease;
  width: 50px;
  height: 75px;
  object-fit: cover; /* recorte proporcional */
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
}

.movie-item:hover .poster {
  transform: scale(1.08) rotate(-1deg);
  box-shadow:
    0 10px 25px rgba(0, 0, 0, 0.9),
    0 0 12px rgba(124, 58, 237, 0.4);
}

/* ============================================================================
 * INFO
 * Contenedor de título y personaje.
 * ============================================================================ */

.info {
  display: flex;
  flex-direction: column;
}

/* ============================================================================
 * TITLE
 * Nombre de la película con gradiente violeta.
 *
 * Responsabilidades:
 * - Aplicar gradiente y mantener legibilidad
 * - Cambiar de color en hover del item
 * ============================================================================ */

.title {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  background: linear-gradient(
    90deg,
    #c4b5fd,
    #a78bfa,
    #7c3aed
  );
  background-clip: text;         /* estándar */
  -webkit-background-clip: text; /* compatibilidad */
  -webkit-text-fill-color: transparent;
  color: transparent; /* fallback sin soporte de background-clip */
  transition: all 0.25s ease;
}

.movie-item:hover .title {
  color: #c4b5fd;
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .credits {
    padding-right: 16px;
    margin: 16px auto;
  }

  .year-block {
    padding-left: 22px;
    margin-bottom: 26px;
  }

  .year {
    font-size: 1rem;
  }

  .movie-item {
    padding: 8px;
    gap: 10px;
  }

  /* elimina offset decorativo */
  .movie-item:nth-child(even) {
    transform: none;
  }

  .poster {
    width: 42px;
    height: 63px;
  }

  .title {
    font-size: 0.95rem;
  }
}

</style>