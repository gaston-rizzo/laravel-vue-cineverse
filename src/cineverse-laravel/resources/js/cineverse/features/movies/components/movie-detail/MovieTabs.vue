<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieTabs.vue
 * ============================================================================
 *
 * Panel de pestañas del detalle de película (Reparto / Reseñas / Similares).
 * Mantiene el tab activo en estado local y renderiza el componente
 * correspondiente, usando KeepAlive para preservar su estado entre cambios.
 * ============================================================================ */

import { ref } from "vue";
import { useI18n } from "vue-i18n";

import { 
  Users, 
  Clapperboard, 
  MessageSquareText 
} from "lucide-vue-next";

import MovieCast from "./MovieCast.vue";
import SimilarMovies from "./SimilarMovies.vue";
import MovieReviews from "./MovieReviews.vue";

// Props: reparto, películas similares, id y titulo de la película actual
// (el id y el titulo se pasan a MovieReviews)
defineProps<{
  cast: any[];
  similar: any[];
  movieId: number;
  movieTitle: string;
}>();

const { t } = useI18n();

// Identificadores posibles de pestaña
const TABS = {
  CAST: "cast",
  SIMILAR: "similar",
  REVIEWS: "reviews",
} as const;

type Tab = (typeof TABS)[keyof typeof TABS];

// Pestaña actualmente seleccionada (Reparto por defecto)
const activeTab = ref<Tab>(TABS.CAST);

// Configuración de las pestañas a renderizar en el header (id, label, ícono)
const tabs = [
  {
    id: TABS.CAST,
    label: t("movieDetail.tabs.cast"),    
    icon: Users,
  },
  {
    id: TABS.REVIEWS,
    label: t("movieDetail.tabs.reviews"),
    icon: MessageSquareText,
  },
  {
    id: TABS.SIMILAR,
    label: t("movieDetail.tabs.similar"),    
    icon: Clapperboard,
  },
];

</script>

<template>
  <section class="movie-tabs">
    <div class="tabs-panel">

      <div class="tabs-header">

        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="18" class="tab-icon" />
          <span>{{ tab.label }}</span>
        </button>
        
      </div>

      <div class="tabs-content">

        <KeepAlive>

          <MovieCast
            v-if="activeTab === TABS.CAST"
            :cast="cast"
          />

          <SimilarMovies
            v-else-if="activeTab === TABS.SIMILAR"
            :movies="similar"
          />

          <MovieReviews
            v-else
            :movie-id="movieId"
            :movie-title="movieTitle"
          />

        </KeepAlive>

      </div>

    </div>
  </section>
</template>

<style scoped>

/* ============================================================================
 * MOVIE TABS
 * Contenedor raíz de la sección de pestañas.
 *
 * Responsabilidades:
 * - Limitar y centrar el ancho máximo del contenido
 * - Animar la entrada del panel completo (ver .movie-tabs / heroEnter)
 * ============================================================================ */

.movie-tabs {
  max-width:1400px;
  margin:auto;
  padding:0 30px;
}

/* ============================================================================
 * TABS PANEL
 * Panel principal que envuelve el header y el contenido de las pestañas.
 *
 * Responsabilidades:
 * - Definir el fondo con gradientes, blur y sombras (glassmorphism)
 * - Servir de contexto para los efectos decorativos (::before / ::after)
 * ============================================================================ */

.tabs-panel {
  position:relative;
  overflow:hidden;
  border-radius:26px;

  background:
    radial-gradient(circle 560px at top left,
      rgba(229,9,20,.16),
       transparent 70%),

    radial-gradient(circle 620px at top right,
      rgba(124,58,237,.18),
       transparent 72%),
       linear-gradient(
            145deg,
            rgba(28,22,52,.92),
            rgba(15,18,38,.96)
       );

    border:1px solid rgba(255,255,255,.08);
    box-shadow:
        0 25px 70px rgba(0,0,0,.45),
        0 0 40px rgba(124,58,237,.10),
        inset 0 1px 0 rgba(255,255,255,.08);

    backdrop-filter:blur(22px);
}

/* Degradado superior sutil para reforzar la profundidad del panel */
.tabs-panel::before {
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(
      to bottom,
        rgba(120,70,190,.12) 0%,
         rgba(170,50,140,.05) 60px,
         transparent 180px
      );
}

/* Resplandor difuso inferior que se asoma por debajo del panel */
.tabs-panel::after {
  content:"";
  position:absolute;
  left:50%;
  bottom:-140px;
  transform:translateX(-50%);
  width:900px;
  height:340px;

  background:
    radial-gradient(
      ellipse at center,
        rgba(110,55,190,.22) 0%,
         rgba(165,45,135,.12) 38%,
         rgba(110,20,60,.06) 58%,
         transparent 75%
      );

  filter:blur(60px);
  pointer-events:none;
}

/* ============================================================================
 * TABS HEADER
 * Fila de botones de navegación entre pestañas.
 *
 * Responsabilidades:
 * - Alinear los botones en fila con espaciado uniforme
 * - Separar visualmente el header del contenido con un borde inferior
 * ============================================================================ */

.tabs-header {
  display:flex;
  gap:12px;
  padding:18px 22px;
  border-bottom:1px solid rgba(255,255,255,.08);
  background:rgba(255,255,255,.02);
}

/* ============================================================================
 * TAB BUTTON
 * Botón individual de cada pestaña.
 *
 * Responsabilidades:
 * - Definir la apariencia base (inactivo)
 * - Destacar visualmente la pestaña activa, simulando que "sobresale"
 *   del borde inferior del header
 * ============================================================================ */

.tab-btn {
  display:flex;
  align-items:center;
  gap:10px;
  padding:12px 20px;
  border:none;
  border-radius:12px;

  background:transparent;
  color:#bfc7d8;

  font-size:.95rem;
  font-weight:600;

  cursor:pointer;
    transition:
      background-color .25s,
      color .25s,
      border-color .25s;
}

.tab-btn.active {
  position:relative;

  background: linear-gradient(
    180deg,
    rgba(124,58,237,.22),
    rgba(124,58,237,.10)
  );
  border:1px solid rgba(255,255,255,.08);
  
  border-bottom:none;
  border-radius:16px 16px 0 0;
  margin-bottom:-19px;
  padding-bottom:28px;

  z-index:5;
}

/* ============================================================================
 * TABS CONTENT
 * Contenedor del contenido renderizado según la pestaña activa.
 *
 * Responsabilidades:
 * - Aplicar el padding interno del área de contenido
 * ============================================================================ */

.tab-icon {
  width:18px;
  height:18px;
}

.tabs-content {
  padding:26px;
  overflow-x: hidden;
}

/* ============================================================================
 * FADE TRANSITION
 * Transición aplicada al cambiar de pestaña.
 *
 * Responsabilidades:
 * - Desvanecer y desplazar levemente el contenido al entrar/salir
 * ============================================================================ */

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity .25s,
    transform .25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity:0;
  transform:translateY(8px);
}

/* ============================================================================
 * ENTRADA DEL PANEL
 * Estado inicial y disparador de la animación de aparición del panel.
 *
 * Responsabilidades:
 * - Definir el estado inicial (oculto, desplazado y con blur) 
 * ============================================================================ */

.movie-tabs {
  opacity: 0;
  transform: translateY(50px) scale(.95);
  filter: blur(10px);
  animation: heroEnter .8s cubic-bezier(.34,1.56,.64,1) forwards;
}

/* Entra desde abajo con rebote de dos pasos antes de asentarse */
@keyframes heroEnter {
    0%{
        opacity:0;
        transform:translateY(50px) scale(.95);
        filter:blur(10px);
    }

    40%{
        opacity:1;
        transform:translateY(-6px) scale(1.04);
        filter:blur(0);
    }

    65%{
        transform:translateY(3px) scale(.995);
    }

    85%{
        transform:translateY(-1px) scale(1.01);
    }

    100%{
        opacity:1;
        transform:translateY(0) scale(1);
        filter:blur(0);
    }
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
  .movie-tabs {
    padding: 0 20px;
  }

  .tabs-header {
    padding: 16px 18px;
  }

  .tabs-content {
    padding: 22px;
  } 
}

@media (max-width: 768px) {
  .movie-tabs {
    padding: 0 16px;
  }

  .tabs-header {
    overflow-x: auto;
    padding: 14px;
  }

  .tab-btn {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .tabs-content {
    padding: 18px;
  }
}

@media (max-width: 480px) {
  .movie-tabs {
    padding: 0 10px;
  }

  .tabs-header {
    gap: 8px;
    padding: 10px;
  }

  .tab-btn {
    padding: 10px 14px;
    font-size: .85rem;
    gap: 7px;
  }

  .tab-btn.active {
    margin-bottom: -14px;
    padding-bottom: 20px;
  }

  .tab-icon {
    width: 16px;
    height: 16px;
  }

  .tabs-content {
    padding: 14px;
  }
}

</style>
