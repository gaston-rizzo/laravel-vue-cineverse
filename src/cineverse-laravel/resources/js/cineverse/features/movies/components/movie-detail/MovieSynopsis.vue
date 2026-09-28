<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieSynopsis.vue
 * ============================================================================
 *
 * Muestra la sinopsis de una película, colapsada por defecto con un botón
 * ▼/▲ para expandir. Al expandir, hace scroll automático hacia abajo; el
 * usuario puede tomar control del scroll manualmente en cualquier momento.
 * Detecta overflow real vía ResizeObserver y se resetea al cambiar de
 * película o idioma.
 * ============================================================================ */

import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

// Sinopsis recibida del padre. Cambia al cambiar de película o de idioma.
const props = defineProps<{
  overview: string;
}>();

// Hook de i18n para traducir el fallback cuando no hay sinopsis
const { t } = useI18n();

// Id del setInterval del auto-scroll, para poder detenerlo y evitar
// que se acumulen múltiples intervalos corriendo a la vez
let scrollInterval: number | null = null;

// Estado de expansión: false = colapsada (altura limitada),
// true = expandida (scroll interno habilitado)
const expanded = ref(false);

// Referencia al <p> de la sinopsis, usada para medir altura y scrollear
const synopsisRef = ref<HTMLElement | null>(null);

// Indica si el texto supera el límite visual (6.5em); controla si se
// muestra el botón ▼/▲
const hasOverflow = ref(false);

// Observer que detecta cambios reales de tamaño en el DOM (más confiable
// que nextTick para saber cuándo recalcular el overflow)
let observer: ResizeObserver | null = null;

/**
 * Inicia un scroll automático suave hacia abajo dentro de la sinopsis.
 * Se detiene solo al llegar al final. Se usa al expandir el texto.
 */
const startAutoScroll = () => {
  const el = synopsisRef.value;
  if (!el) return;

  // Evita acumular intervalos si ya había uno corriendo
  stopAutoScroll();

  scrollInterval = window.setInterval(() => {
    if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
      stopAutoScroll();
      return;
    }

    el.scrollBy({ top: 2 });
  }, 16); // ~60fps
};

/** Detiene cualquier auto-scroll activo. */
const stopAutoScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
};

/**
 * Sincroniza el estado visual con la posición real del scroll cuando el
 * usuario scrollea manualmente (por ejemplo con la scrollbar).
 * Si vuelve al tope, colapsa y detiene el auto-scroll.
 */
const handleScroll = () => {
  const el = synopsisRef.value;
  if (!el) return;

  if (el.scrollTop === 0) {
    expanded.value = false;
    stopAutoScroll();
  } else {
    expanded.value = true;
  }
};

/**
 * Alterna entre sinopsis colapsada y expandida (botón ▼/▲).
 * Al expandir, inicia el auto-scroll; al colapsar, lo detiene y
 * vuelve suavemente al inicio.
 */
const toggle = async () => {
  expanded.value = !expanded.value;

  // Espera a que Vue actualice las clases/estilos antes de medir o scrollear
  await nextTick();

  if (expanded.value) {
    startAutoScroll();
  } else {
    stopAutoScroll();

    synopsisRef.value?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};

/**
 * Detecta si el contenido de la sinopsis excede la altura visible (6.5em),
 * quitando temporalmente max-height/overflow para medir la altura real
 * y luego restaurando los estilos originales.
 */
const checkOverflow = () => {
  if (!synopsisRef.value) return;

  const el = synopsisRef.value;

  const prevMaxHeight = el.style.maxHeight;
  const prevOverflow = el.style.overflow;

  el.style.maxHeight = "none";
  el.style.overflow = "visible";

  const fullHeight = el.scrollHeight;

  el.style.maxHeight = prevMaxHeight;
  el.style.overflow = prevOverflow;

  const visibleHeight = 12 * parseFloat(getComputedStyle(el).fontSize);

  hasOverflow.value = fullHeight > visibleHeight;
};

/**
 * Al cambiar la sinopsis (nueva película o idioma), detiene el auto-scroll
 * y resetea el estado a colapsado para que siempre arranque desde el inicio.
 */
watch(
  () => props.overview,
  () => {
    stopAutoScroll();
    expanded.value = false;
  }
);

/**
 * Inicializa el ResizeObserver sobre el <p> y su contenedor padre, y hace
 * el chequeo inicial de overflow. Se observa también el padre porque los
 * cambios de ancho (responsive) afectan el wrapping del texto.
 */
onMounted(() => {
  if (!synopsisRef.value) return;

  observer = new ResizeObserver(() => {
    checkOverflow();
  });

  observer.observe(synopsisRef.value);

  if (synopsisRef.value.parentElement) {
    observer.observe(synopsisRef.value.parentElement);
  }

  checkOverflow();
});

/** Registra el listener de scroll manual sobre la sinopsis. */
onMounted(() => {
  if (synopsisRef.value) {
    synopsisRef.value.addEventListener("scroll", handleScroll);
  }
});

/** Limpia observer, auto-scroll y listener para evitar memory leaks. */
onUnmounted(() => {
  observer?.disconnect();
  stopAutoScroll();
  synopsisRef.value?.removeEventListener("scroll", handleScroll);
});

</script>

<template>

  <div class="movie-synopsis">

    <h3 class="synopsis-title">
      Sinopsis
    </h3>

    <div class="synopsis-wrapper">

      <p 
        ref="synopsisRef"
        class="synopsis-text" 
        :class="{ expanded, 'has-overflow': hasOverflow }"
      >
        {{ overview || t("movies.noDescription") }}
      </p>

      <button 
        v-if="hasOverflow"
        class="synopsis-toggle"
        @click="toggle"
      >
        {{ expanded ? "▲" : "▼" }}
      </button>

    </div>

  </div>

</template>

<style scoped>

/* ============================================================================
 * MOVIE SYNOPSIS CONTAINER
 * Contenedor principal de la sección de sinopsis.
 *
 * Responsabilidades:
 * - Limitar ancho máximo
 * - Aplicar padding y bordes redondeados
 * - Fondo semi-transparente con efecto glass
 * ============================================================================ */

.movie-synopsis {
  margin-top: 5px;              /* separación superior */
  max-width: 1200px;           /* ancho máximo */
  padding: 16px 18px;          /* espacio interno */
  border-radius: 14px;         /* bordes redondeados */
  background: rgba(0,0,0,0.35);/* fondo semi-transparente */
  backdrop-filter: blur(10px); /* efecto glass */
  border: 1px solid rgba(255,255,255,0.05); /* borde sutil */
  flex: 1; /* crece para ocupar el alto sobrante */
}

/* ============================================================================
 * SYNOPSIS TITLE
 * Título de la sección.
 *
 * Responsabilidades:
 * - Tamaño y color apropiados
 * - Espaciado inferior
 * ============================================================================ */

.synopsis-title {
  font-size: 0.8rem;           /* tamaño chico */
  letter-spacing: 1px;         /* separación letras */
  text-transform: uppercase;   /* mayúsculas */
  color: #888;                 /* gris tenue */
  margin-bottom: 8px;          /* espacio abajo */
}

/* ============================================================================
 * SYNOPSIS TEXT
 * Texto de la sinopsis.
 *
 * Responsabilidades:
 * - Limitar altura inicial
 * - Ocultar exceso (fade aplicado)
 * - Scroll interno al expandir
 * ============================================================================ */

.synopsis-text {
  font-size: 0.95rem;
  line-height: 1.6;   /* legibilidad */
  color: #ddd;
  max-height: 12em;   /* límite de líneas */
  overflow: hidden;   /* oculta exceso */
  position: relative; /* necesario para el fade */
}

/* Sinopsis expandida */
.synopsis-text.expanded {
  overflow-y: auto;            /* scroll vertical */
  padding-right: 6px;          /* espacio para scrollbar */
}

/* ============================================================================
 * CUSTOM SCROLLBAR
 * Scrollbar minimalista para sinopsis expandida.
 *
 * Responsabilidades:
 * - Reducir impacto visual del scrollbar
 * - Mantener estética moderna y limpia
 * ========================================================================== */

.synopsis-text.expanded::-webkit-scrollbar {
  width: 4px;
}

.synopsis-text.expanded::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
}

/* Gradiente visual cuando el texto está colapsado */
.synopsis-text.has-overflow:not(.expanded)::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  /* efecto desvanecido hacia arriba */
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

/* ============================================================================
 * SYNOPSIS WRAPPER
 * Contenedor relativo de la sinopsis.
 *
 * Responsabilidades:
 * - Servir como referencia para posicionamiento absoluto
 * - Permitir ubicar correctamente el botón ▼/▲ dentro del bloque
 * ========================================================================== */

.synopsis-wrapper {
  position: relative;
}

/* ============================================================================
 * SYNOPSIS TOGGLE
 * Botón ▼/▲
 *
 * Responsabilidades:
 * - Posición absoluta
 * - Fondo y efecto glass
 * - Hover con agrandamiento y cambio de color
 * ============================================================================ */

.synopsis-toggle {
  position: absolute;
  bottom: 6px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;

  background: rgba(0,0,0,0.6); /* fondo oscuro */
  border: 1px solid rgba(255,255,255,0.1);
  color: white;

  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  backdrop-filter: blur(6px);  /* glass */
  transition: all 0.2s ease;   /* animación hover */
}

.synopsis-toggle:hover {
  transform: scale(1.1);       
  background: rgba(255,255,255,0.15);
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .movie-synopsis {
    padding: 14px 14px;
  }

  .synopsis-text {
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .synopsis-toggle {
    /* botón más grande para touch */
    width: 34px;
    height: 34px;
    font-size: 0.9rem;
    /* más cómodo en mobile */
    bottom: 4px;
    right: 4px;
  }

  .synopsis-text.has-overflow:not(.expanded)::after {
    height: 32px;
  }
}

@media (max-width: 480px) {
  .movie-synopsis {
    padding: 12px 12px;
  }

  .synopsis-title {
    font-size: 0.75rem;
  }

  .synopsis-text {
    font-size: 0.88rem;
    line-height: 1.5;
  }

  .synopsis-toggle {
    width: 32px;
    height: 32px;
    bottom: 4px;
    right: 4px;
  }
}

</style>
