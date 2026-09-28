<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieFilters.vue
 * ============================================================================
 *
 * Gestiona y muestra todos los filtros de películas: tipo de listado, texto
 * de búsqueda, rango de años, rating, géneros y orden. Sincroniza el texto
 * de búsqueda con la URL, permite reordenar los paneles con drag & drop,
 * y aplica efectos visuales de tilt 3D y scroll con botones ▲▼ cuando el
 * contenido excede el alto visible.
 * ============================================================================ */

// Importamos utilidades reactivas de Vue
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";

// Hook de internacionalización para traducir textos
import { useI18n } from "vue-i18n";

// Slider para seleccionar rango de rating
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

// Librería para permitir drag & drop (reordenar paneles)
import draggable from "vuedraggable";

// Uso del select de vue
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.css";

// Query que obtiene los géneros de películas desde la API
import { useMovieGenresQuery } from "@/features/movies/composables/useMoviesGenresQuery";

// Tipado del objeto de filtros
import type { MovieFilters } from "@/features/movies/composables/useMoviesFilters";

// Tipo que define los valores posibles del tipo de listado de películas
// (discover, popular, now_playing, upcoming, top_rated)
import type { MovieListType } from "@/features/movies/types/movie-list-type";

// Recibimos desde el componente padre el objeto reactivo con todos los filtros
const props = defineProps<{
  movieFilters: MovieFilters;
}>();

// Hook de i18n para obtener traducción
const { t, locale } = useI18n();

// Clave de localStorage para persistir el orden de paneles entre sesiones
const PANELS_ORDER_KEY = "moviesFilters:panelsOrder";

// Clave de localStorage para persistir el estado abierto/cerrado de paneles
const OPEN_PANELS_KEY = "moviesFilters:openPanels";

// Desestructuramos los filtros para usarlos directamente en el template
const {
  listType, // Listado de tipo de películas
  txtMovie, // texto de búsqueda
  debouncedQuery, // texto con debounce, usado para el fetch real
  yearFrom, // año desde
  yearTo, // año hasta
  ratingRange, // rango de rating [min,max]
  selectedGenres, // géneros seleccionados
  sortBy, // criterio de ordenamiento
  hasText, // indica si hay una búsqueda activa
  hasFilters, // indica si hay filtros avanzados activos
} = props.movieFilters;

// Ejecuta la query para traer los géneros según el idioma actual
const { data: movieGenres } = useMovieGenresQuery(locale);

// Devuelve siempre un array (si la API aún no respondió, [])
const genres = computed(() => movieGenres.value ?? []);

// Los demás filtros solo se habilitan si el listado es discover
const filtersEnabled = computed(() => listType.value === "discover");

const listTypesOptions = computed<ListTypeOption[]>(() => [
  { label: t("filters.typesOptions.discover"), value: "discover" },
  { label: t("filters.typesOptions.popular"), value: "popular" },
  { label: t("filters.typesOptions.now_playing"), value: "now_playing" },
  { label: t("filters.typesOptions.upcoming"), value: "upcoming" },
  { label: t("filters.typesOptions.top_rated"), value: "top_rated" },
]);

// Listado de tipos
type ListTypeOption = {
  label: string;
  value: MovieListType;
};

// Lista de ordenar
type SortOption = {
  label: string;
  value: string;
};

const sortOptions = computed<SortOption[]>(() => [
  { label: t("filters.sortOptions.mostPopular"), value: "popularity.desc" },
  { label: t("filters.sortOptions.mostRecent"), value: "release_date.desc" },
  { label: t("filters.sortOptions.oldest"), value: "release_date.asc" },
  { label: t("filters.sortOptions.bestRating"), value: "vote_average.desc" },
]);

// Rango seleccionado en el slider de rating [min, max]
const sliderRating = ref([
  ratingRange.value?.[0] ?? 0,
  ratingRange.value?.[1] ?? 10,
]);

/** Genera las marcas (0 a 10) del slider de rating. */
const ratingMarks = computed(() => {
  const marks: Record<number, any> = {};

  for (let r = 0; r <= 10; r++) {
    marks[r] = {
      label: String(r),
    };
  }

  return marks;
});

// Rango de años que maneja el slider [añoInicio, añoFin]
const sliderYears = ref([
  yearFrom.value ?? 1900,
  yearTo.value ?? new Date().getFullYear(),
]);

/** Genera las marcas (ticks) del slider de años cada 20 años, desde 1900 hasta el actual. */
const decadeMarks = computed(() => {
  const marks: Record<number, any> = {};

  const max = new Date().getFullYear();

  for (let y = 1900; y <= max; y += 20) {
    marks[y] = {
      label: "", // sin texto para no saturar la UI
    };
  }

  marks[1900] = { label: "1900" };
  marks[max] = { label: String(max) };

  return marks;
});

// Paneles

let rect: DOMRect;
let frame = 0;
let mouseX = 0;
let mouseY = 0;

// Tipos posibles de paneles del sidebar
type PanelId = "list" | "filters" | "genres" | "sort";

const PANEL_IDS: PanelId[] = ["list", "filters", "genres", "sort"];

// Orden default de los paneles del sidebar, usado tanto al inicializar
// como al resetear
const DEFAULT_PANELS_ORDER: PanelId[] = [...PANEL_IDS];

const DEFAULT_OPEN_PANELS: Record<PanelId, boolean> = {
  list: true,
  filters: true,
  genres: true,
  sort: true,
};

// Lista de paneles renderizados en el sidebar (reordenable por drag & drop).
// Se inicializa con el orden guardado en localStorage si existe; si no,
// usa el orden default.
const panels = ref<PanelId[]>(
  readPanelsOrder() ?? DEFAULT_PANELS_ORDER
);

const panelTitles = computed(() => ({
  list: t("filters.panels.list"),
  filters: t("filters.panels.filters"),
  genres: t("filters.panels.genres"),
  sort: t("filters.panels.sort"),
}));

// Estado de apertura/cierre de cada panel (objeto en vez de array
// para acceder directamente por id sin recorrer estructuras)
const openPanels = ref<Record<PanelId, boolean>>(readOpenPanels());

// Controla si el usuario está en modo "personalizar paneles"
const customizingPanels = ref(false);

let openPanelsBeforeCustomize: Record<PanelId, boolean> | null = null;

const hasDefaultPanelsOrder = computed(() =>
  panels.value.length === DEFAULT_PANELS_ORDER.length &&
  panels.value.every((id, index) => id === DEFAULT_PANELS_ORDER[index])
);

const isResetDisabled = computed(
  () =>
    listType.value === "popular" &&
    !txtMovie.value.trim() &&
    !debouncedQuery.value &&
    !hasText.value &&
    !hasFilters.value &&
    hasDefaultPanelsOrder.value
);

// Estado de scroll del contenedor

// Indica si hay contenido por encima del scroll actual (visibilidad del botón ▲)
const canScrollUp = ref(false);

// Indica si hay contenido por debajo del scroll actual (visibilidad del botón ▼)
const canScrollDown = ref(false);

// Indica si el contenedor de filtros tiene overflow vertical,
// para mostrar/ocultar los botones ▲ ▼
const hasOverflow = ref(false);

// Referencia al contenedor scrolleable de todos los paneles de filtros
const filtersRef = ref<HTMLElement | null>(null);

// Detecta cambios de tamaño del contenedor o su contenido (al abrir/cerrar
// paneles, llegar datos de la API, o cambiar el layout)
let resizeObserver: ResizeObserver | null = null;

// Id del setInterval del scroll continuo, para poder detenerlo al soltar el botón
let scrollInterval: number | null = null;

/**
 * Aplica al filtro real el rango actual del slider de rating.
 * Se ejecuta al terminar de arrastrar el slider (@drag-end).
 */
function applyRatingFilter() {
  const [min, max] = sliderRating.value;
  ratingRange.value = [min ?? 0, max ?? 10];
}

/**
 * Aplica al filtro real el rango actual del slider de años.
 * Se ejecuta al terminar de arrastrar el slider (@drag-end). Además, saca
 * el foco del handle para que el tooltip no quede visible tras el drag.
 */
function applyYearFilter() {
  const [from, to] = sliderYears.value;

  yearFrom.value = from ?? null;
  yearTo.value = to ?? null;

  // El handle puede quedar enfocado tras el drag, dejando el tooltip visible
  const el = document.activeElement as HTMLElement;
  if (el) el.blur();
}

/**
 * Activa o desactiva el modo "personalizar paneles" (drag & drop de paneles).
 */
function toggleCustomizePanels() {
  if (!customizingPanels.value) {
    openPanelsBeforeCustomize = { ...openPanels.value };

    PANEL_IDS.forEach((id) => {
      openPanels.value[id] = false;
    });

    writeOpenPanels(openPanels.value);
    customizingPanels.value = true;
    return;
  }

  customizingPanels.value = false;

  if (openPanelsBeforeCustomize) {
    openPanels.value = { ...openPanelsBeforeCustomize };
    writeOpenPanels(openPanels.value);
    openPanelsBeforeCustomize = null;
  }
}

/**
 * Alterna el estado abierto/cerrado de un panel.
 * @param id - Id del panel
 */
function togglePanel(id: PanelId) {
  openPanels.value[id] = !openPanels.value[id];
  writeOpenPanels(openPanels.value);
}

/**
 * Guarda el bounding box del panel al entrar el cursor, para poder calcular
 * la posición del mouse dentro del elemento durante el efecto de tilt.
 */
function handlePanelMouseEnter(e: MouseEvent) {
  const panel = e.currentTarget as HTMLElement;
  rect = panel.getBoundingClientRect();
}

/**
 * Efecto "Magnetic Panel Tilt": inclina el panel en 3D siguiendo la posición
 * del cursor. Usa requestAnimationFrame para no recalcular más de una vez
 * por evento mousemove.
 */
function handlePanelMouseMove(e: MouseEvent) {
  const panel = e.currentTarget as HTMLElement;

  mouseX = e.clientX;
  mouseY = e.clientY;

  if (!frame) {
    frame = requestAnimationFrame(() => updateTilt(panel));
  }
}

/**
 * Calcula y aplica la inclinación 3D del panel según la posición del cursor
 * respecto al centro, limitando la rotación a maxTilt grados.
 */
function updateTilt(panel: HTMLElement) {
  const x = mouseX - rect.left;
  const y = mouseY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const maxTilt = 8;

  const rotateX = Math.max(
    Math.min(((y - centerY) / centerY) * -maxTilt, maxTilt),
    -maxTilt,
  );

  const rotateY = Math.max(
    Math.min(((x - centerX) / centerX) * maxTilt, maxTilt),
    -maxTilt,
  );

  panel.style.transform = `
            perspective(900px)
            translateY(0px)
            translateZ(0px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
        `;

  panel.style.setProperty("--x", `${x}px`);
  panel.style.setProperty("--y", `${y}px`);

  frame = 0;
}

/**
 * Restablece el panel a su posición plana cuando el cursor sale (mouseleave),
 * cancelando cualquier frame pendiente para evitar un micro salto visual.
 */
function resetPanelTilt(e: MouseEvent) {
  const panel = e.currentTarget as HTMLElement;

  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  panel.style.transform = `
        perspective(900px)
        rotateX(0deg)
        rotateY(0deg)
        `;
}

/**
 * Resetea solo los filtros avanzados (años, rating, géneros, orden), sin
 * tocar el texto de búsqueda. El texto de búsqueda es independiente del
 * listType (useMoviesQuery lo usa igual en cualquier listado), así que no
 * debe perderse cuando el usuario sale de "discover" automáticamente
 * (ej: al buscar desde el header, que resetea el listType a "popular").
 */
const resetAdvancedFilters = () => {
  yearFrom.value = null;
  yearTo.value = null;
  ratingRange.value = [0, 10];
  selectedGenres.value = [];
  sortBy.value = "vote_average.desc";
  sliderYears.value = [1900, new Date().getFullYear()];
  sliderRating.value = [0, 10];
};

/**
 * Resetea todos los filtros excepto el tipo de listado (si se incluyera,
 * el combo siempre volvería a "discover"), incluyendo el texto de
 * búsqueda. Se usa solo en acciones explícitas del usuario (botón ↺),
 * nunca en el watcher automático de filtersEnabled.
 *
 * txtMovie y debouncedQuery se limpian juntos, en el mismo tick, junto
 * con el resto de los filtros avanzados (yearFrom, ratingRange, etc. en
 * resetAdvancedFilters). Si debouncedQuery no se limpiara acá, quedaría
 * con el valor de búsqueda anterior (ej: "batman") durante la ventana de
 * 500ms hasta que el watcher de txtMovie lo actualice por su cuenta. En
 * esa ventana, queryKey quedaría con una combinación inconsistente
 * (listType ya reseteado + debouncedQuery viejo), y useMoviesQuery
 * dispararía una búsqueda por texto de más antes de asentarse en el estado
 * final correcto, haciendo titilar la grilla dos veces.
 */
const resetFiltersExceptList = () => {
  txtMovie.value = "";
  debouncedQuery.value = "";
  resetAdvancedFilters();
};

/**
 * Resetea todos los filtros, incluyendo el tipo de listado, a su estado inicial
 * y también resetea el orden de los paneles a sus valores por defecto.
 */
const resetFilters = () => {
  listType.value = "popular";
  resetFiltersExceptList();  
  panels.value = [...DEFAULT_PANELS_ORDER];
  PANEL_IDS.forEach((id) => {
    openPanels.value[id] = id === "list";
  });
  writeOpenPanels(openPanels.value);
};

/**
 * Actualiza la visibilidad de los botones ▲ ▼ según la posición actual
 * del scroll dentro del contenedor de filtros.
 */
function checkScrollPosition() {
  const el = filtersRef.value;
  if (!el) return;

  canScrollUp.value = el.scrollTop > 10;
  canScrollDown.value = el.scrollTop + el.clientHeight < el.scrollHeight - 10;
}

/**
 * Determina si el contenedor de filtros tiene overflow vertical
 * (más contenido del que puede mostrarse en pantalla).
 */
function checkOverflow() {
  const el = filtersRef.value;
  if (!el) return;

  hasOverflow.value = el.scrollHeight > el.clientHeight;
}

/**
 * Recalcula overflow y posición de scroll al terminar la animación de
 * apertura/cierre de un panel. Necesario porque el ResizeObserver
 * observa el contenedor .filters, que tiene max-height fijo: su tamaño
 * exterior no cambia aunque el contenido interno (scrollHeight) crezca
 * al abrirse un panel, así que el observer no se entera solo.
 */
function onPanelTransitionEnd() {
  checkOverflow();
  checkScrollPosition();
}

/**
 * Inicia scroll continuo hacia arriba (botón ▲), deteniéndose al llegar al tope.
 */
const startScrollUp = () => {
  const el = filtersRef.value;
  if (!el) return;

  // Evita acumular intervalos si el usuario ya venía scrolleando
  stopScroll();

  scrollInterval = window.setInterval(() => {

    if (el.scrollTop <= 0) {
      stopScroll();
      return;
    }

    el.scrollBy({ top: -20 });

    checkScrollPosition();
  }, 16); // ~60fps
};

/**
 * Inicia scroll continuo hacia abajo (botón ▼), deteniéndose al llegar al final.
 */
const startScrollDown = () => {
  const el = filtersRef.value;
  if (!el) return;

  stopScroll();

  scrollInterval = window.setInterval(() => {
    if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
      stopScroll();
      return;
    }

    el.scrollBy({ top: 20 });

    checkScrollPosition();
  }, 16);
};

/**
 * Detiene cualquier scroll continuo activo (mouseup / mouseleave del botón).
 */
const stopScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
};

/**
 * Indica si un panel es el último del contenedor. Necesario porque el orden
 * puede cambiar por drag & drop, así que no se puede asumir uno fijo.
 * @param id - Id del panel
 */
function isLastPanel(id: PanelId) {
  const last = panels.value[panels.value.length - 1];
  return last === id;
}

/**
 * Indica si un panel está deshabilitado (filtros no disponibles y no es "list").
 * @param id - Id del panel
 */
function isPanelDisabled(id: PanelId) {
  return !filtersEnabled.value && id !== "list";
}

/**
 * Evita abrir un Multiselect si su panel está deshabilitado; si está
 * habilitado, delega en onSelectOpen para el ajuste de scroll/padding.
 * @param element - Id del panel dueño del Multiselect
 */
function handleOpen(element: PanelId) {
  if (isPanelDisabled(element)) return false;

  onSelectOpen(element);
}

/**
 * Si el Multiselect pertenece al último panel (y está expandido), agrega
 * padding extra al contenedor y hace scroll para que el dropdown no quede
 * cortado por el límite del scroll.
 * @param id - Id del panel dueño del Multiselect
 */
function onSelectOpen(id: PanelId) {
  if (!isLastPanel(id)) return;
  if (!openPanels.value[id]) return;

  const el = filtersRef.value;
  if (!el) return;

  el.style.paddingBottom = "320px";

  // Espera al próximo frame para que el layout tome el nuevo padding
  requestAnimationFrame(() => {
    el.scrollBy({
      top: 200,
      behavior: "smooth",
    });
  });
}

/**
 * Restaura el padding original del contenedor al cerrar el Multiselect
 * del último panel.
 * @param id - Id del panel dueño del Multiselect
 */
function onSelectClose(id: PanelId) {
  if (!isLastPanel(id)) return;

  const el = filtersRef.value;
  if (!el) return;

  el.style.paddingBottom = "80px";
}

/** Lee el orden de paneles guardado. Si no hay nada, o el valor guardado
 *  no es un array válido de PanelId, devuelve null y se usa el default. */
function readPanelsOrder(): PanelId[] | null {
  try {

    const raw = localStorage.getItem(PANELS_ORDER_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const valid: PanelId[] = ["list", "filters", "genres", "sort"];

    // Válido solo si tiene exactamente los 4 ids esperados, sin duplicados
    // ni ids desconocidos (por si en el futuro se agregan/quitan paneles)
    if (
      Array.isArray(parsed) &&
      parsed.length === valid.length &&
      valid.every((id) => parsed.includes(id))
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/** Lee el estado abierto/cerrado guardado y completa faltantes con defaults. */
function readOpenPanels(): Record<PanelId, boolean> {
  try {
    const raw = localStorage.getItem(OPEN_PANELS_KEY);
    if (!raw) return { ...DEFAULT_OPEN_PANELS };

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_OPEN_PANELS };
    }

    const savedKeys = Object.keys(parsed);
    if (savedKeys.some((key) => !PANEL_IDS.includes(key as PanelId))) {
      return { ...DEFAULT_OPEN_PANELS };
    }

    const saved = parsed as Partial<Record<PanelId, unknown>>;
    const openState = { ...DEFAULT_OPEN_PANELS };

    PANEL_IDS.forEach((id) => {
      if (typeof saved[id] === "boolean") {
        openState[id] = saved[id];
      }
    });

    return openState;
  } catch {
    return { ...DEFAULT_OPEN_PANELS };
  }
}

/** Guarda el orden actual de paneles. */
function writePanelsOrder(order: PanelId[]) {
  try {
    localStorage.setItem(PANELS_ORDER_KEY, JSON.stringify(order));
  } catch {
    // no crítico, simplemente no persiste
  }
}

/** Guarda el estado abierto/cerrado elegido por el usuario. */
function writeOpenPanels(openState: Record<PanelId, boolean>) {
  try {
    localStorage.setItem(OPEN_PANELS_KEY, JSON.stringify(openState));
  } catch {
    // no crítico, simplemente no persiste
  }
}

/**
 * Persiste el orden de paneles en localStorage cada vez que cambia (al
 * soltar un panel arrastrado), para que sobreviva a salir y volver a
 * entrar a Movies.
 */
watch(panels, (newOrder) => {
  writePanelsOrder(newOrder);
}, { deep: true });

/**
 * Si los filtros se deshabilitan (listType ≠ "discover"), resetea
 * automáticamente los filtros avanzados para mantener coherencia con la UI.
 */
watch(filtersEnabled, (enabled) => {
  if (!enabled) {
    resetAdvancedFilters();
  }
});

/** 
 * Mantiene sliderYears sincronizado cuando yearFrom/yearTo cambian por
 * una vía distinta al propio drag del slider (ej: la URL cambia por fuera,
 * como al buscar desde el header estando ya en /movies sin remount del
 * componente, o al resetear filtros). Sin este watch, sliderYears queda
 * "congelado" en el valor con el que se montó el componente, aunque el
 * filtro real (yearFrom/yearTo) ya haya cambiado.
 */
watch([yearFrom, yearTo], ([newFrom, newTo]) => {
  sliderYears.value = [
    newFrom ?? 1900,
    newTo ?? new Date().getFullYear(),
  ];
});

/**
 * Mismo caso que sliderYears: mantiene sliderRating sincronizado cuando
 * ratingRange cambia por una vía externa al drag del slider.
 */
watch(ratingRange, (newRange) => {
  sliderRating.value = [
    newRange?.[0] ?? 0,
    newRange?.[1] ?? 10,
  ];
});

/**
 * Inicializa los listeners de scroll del contenedor, ResizeObserver del
 * contenedor y resize del viewport, y calcula el estado inicial de overflow/scroll.
 */
onMounted(() => {
  const el = filtersRef.value;
  if (!el) return;

  // Actualiza los botones ▲ ▼ al scrollear dentro del panel
  el.addEventListener("scroll", checkScrollPosition);

  // Detecta cambios de altura del contenedor o su contenido
  resizeObserver = new ResizeObserver(() => {
    checkOverflow();
    checkScrollPosition();
  });

  resizeObserver.observe(el);

  // El resize de ventana también puede afectar el overflow del contenedor
  window.addEventListener("resize", () => {
    checkOverflow();
    checkScrollPosition();
  });

  // Chequeo inicial al montar
  checkOverflow();
  checkScrollPosition();
});

/**
 * Limpia observers y listeners para evitar memory leaks.
 */
onBeforeUnmount(() => {
  const el = filtersRef.value;

  if (resizeObserver && el) {
    resizeObserver.unobserve(el);
  }

  window.removeEventListener("resize", checkOverflow);
});

</script>

<template>
  <div class="filters-wrapper">
    <Transition name="scroll-btn">
      <button
        v-if="hasOverflow && canScrollUp"
              class="filters-scroll up"
              @mousedown="startScrollUp"
              @mouseup="stopScroll"
              @mouseleave="stopScroll"
      >
        ▲
      </button>
    </Transition>

    <div class="filters" ref="filtersRef">

      <div class="filters-header">

        <button @click="toggleCustomizePanels" class="customize-btn">

          <span class="btn-layer" :class="{ active: !customizingPanels }">
            ⚙ {{ t("filters.header.customizePanels") }}
          </span>

          <span class="btn-layer" :class="{ active: customizingPanels }">
            ✔ {{ t("filters.header.saveOrder") }}
          </span>

        </button>

        <button class="btn-reset" 
                  @click="resetFilters"
                  :disabled="isResetDisabled"
                  >
                  ↺
        </button>
        
      </div>

      <!-- 
      DRAGGABLE PANELS      
      Este componente permite reordenar los paneles de filtros mediante drag & drop.

      Se utiliza la librería VueDraggable (basada en SortableJS) para manejar
      la interacción de arrastrar y reordenar elementos.
      Solo activo en modo personalización (:disabled="!customizingPanels");
      fuera de ese modo, panels.value mantiene el orden guardado.
      -->

      <draggable
        v-model="panels"
        item-key="id"
        class="filters-panels"
        :disabled="!customizingPanels"
        :class="{ 'customize-mode': customizingPanels }"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-active"
        animation="200"
      >
        <!--
        SLOT "item" DE DRAGGABLE

        draggable usa un slot llamado "item" para renderizar cada elemento del array.

        - { element }
        Es el objeto actual del array `panels` que se está renderizando.

        En este caso `element` tiene esta estructura:
        {
          id: "filters" | "genres" | "sort",
          title: string
        }

        Por lo tanto dentro de este template estamos dibujando
        cada panel del sidebar usando los datos del array.
        -->

        <template #item="{ element }">
          <div
            class="panel"
            :class="{
              disabled:
                !filtersEnabled && element !== 'list' && !customizingPanels,
            }"
            @mouseenter="handlePanelMouseEnter"
            @mousemove="handlePanelMouseMove"
            @mouseleave="resetPanelTilt"
          >
            <div class="panel-tilt">

              <div
                class="panel-header"
                @click="
                  !customizingPanels &&
                  (filtersEnabled || element === 'list') &&
                  togglePanel(element)
                "
              >
                <div class="panel-title">
                  <span
                    class="drag-handle"
                    :class="{ show: customizingPanels }"
                  >
                    ⋮⋮
                  </span>

                  <span>{{ panelTitles[element as PanelId] }}</span>
                </div>

                <span
                  class="arrow"
                  :class="{ open: openPanels[element as PanelId] }"
                >
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      stroke-width="2"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </div>
              
              <Transition name="panel" @after-enter="onPanelTransitionEnd" @after-leave="onPanelTransitionEnd">

                <div v-show="openPanels[element as PanelId]" class="panel-body">

                  <!-- LISTA DE TIPOS -->
                  <template v-if="element === 'list'">

                    <div class="panel-divider"></div>

                    <Multiselect
                      class="multiselect"
                      :model-value="listTypesOptions.find((o) => o.value === listType)"
                      :options="listTypesOptions"
                      label="label"
                      track-by="value"
                      :searchable="false"
                      :append-to-body="true"
                      :placeholder="t('common.selectOption')"
                      @select="(o: ListTypeOption) => (listType = o.value)"
                      @clear="listType = 'discover'"
                      selectLabel=""
                      deselectLabel=""
                      selectedLabel=""
                      @open="onSelectOpen(element)"
                      @close="onSelectClose(element)"
                    />

                    <div v-if="!filtersEnabled" class="filters-disabled-msg">
                      🔒 {{ t('filters.advancedFiltersOnlyInDiscover') }}
                    </div>

                  </template>

                  <!-- FILTROS -->
                  <template v-if="element === 'filters'">

                    <div class="panel-divider"></div>

                    <input
                      v-model="txtMovie"
                      type="text"
                      :placeholder="t('filters.searchPlaceholder')"
                      class="filter-input search-input"
                    />

                    <div class="panel-divider"></div>

                    <div class="filter-block">
                      
                      <label class="filter-label filter-label-year">
                        
                        {{ t("filters.year") }}
                        <span class="filter-value">
                          {{ sliderYears[0] }} – {{ sliderYears[1] }}
                        </span>
                      </label>

                      <VueSlider
                        ref="yearSlider"
                        v-model="sliderYears"
                        :min="1900"
                        :max="new Date().getFullYear()"
                        :interval="1"
                        :marks="decadeMarks"                        
                        :clickable="false"
                        @drag-end="applyYearFilter"
                      />

                    </div>

                    <div class="panel-divider"></div>

                    <div class="filter-block">

                      <label class="filter-label">

                        {{ t("filters.rating") }}

                        <span class="filter-value">
                          {{ ratingRange[0] }} – {{ ratingRange[1] }}
                        </span>

                      </label>

                      <VueSlider
                        v-model="sliderRating"
                        :min="0"
                        :max="10"
                        :interval="0.5"
                        :marks="ratingMarks"
                        :clickable="false"
                        @drag-end="applyRatingFilter"
                      />

                    </div>

                  </template>

                  <!-- GENEROS -->
                  <template v-if="element === 'genres'">

                    <div class="panel-divider"></div>

                    <div class="genres">
                      <span
                        v-for="genre in genres"
                        :key="genre.id"
                        @click="movieFilters.toggleGenre(genre.id)"
                        :class="[
                          'genre-chip',
                          selectedGenres.includes(genre.id) ? 'active' : '',
                        ]"
                      >
                        {{ genre.name }}
                      </span>

                    </div>

                  </template>

                  <!-- LISTA PARA ORDENAR -->
                  <template v-if="element === 'sort'">

                    <div class="panel-divider"></div>

                    <Multiselect
                      class="multiselect"
                      :model-value="sortOptions.find((o) => o.value === sortBy)"
                      :options="sortOptions"
                      label="label"
                      track-by="value"
                      :searchable="false"
                      :append-to-body="true"
                      :placeholder="t('common.selectOption')"
                      @select="(o: SortOption) => (sortBy = o.value)"                      
                      @clear="sortBy = 'vote_average.desc'"
                      selectLabel=""
                      deselectLabel=""
                      selectedLabel=""
                      @open="handleOpen(element)"
                      @close="onSelectClose(element)"
                      :class="{ 'fake-disabled': isPanelDisabled(element) }"
                    />

                  </template>

                </div>

              </Transition>

            </div>
          </div>
        </template>
      </draggable>
    </div>

    <Transition name="scroll-btn">
      <button
        v-if="hasOverflow && canScrollDown"
              class="filters-scroll down"
              @mousedown="startScrollDown"
              @mouseup="stopScroll"
              @mouseleave="stopScroll"
        >
        ▼
      </button>
    </Transition>
  </div>
</template>

<style>

/* ============================================================================
 * FILTERS CONTAINER
 * Contenedor principal y scrolleable de todos los paneles de filtros.
 *
 * Responsabilidades:
 * - Scroll vertical con altura máxima, scrollbar nativa oculta
 * ============================================================================ */

.filters {
  position: relative; /* necesario para ::before y ::after */
  scroll-behavior: smooth;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  overflow-x: visible;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  padding-bottom: 80px; /* espacio extra para que el último panel pueda subir del todo */
  border-radius: 20px;

  background:
    radial-gradient(circle at 15% 10%, rgba(229, 9, 20, 0.12), transparent 45%),
    radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.15), transparent 50%),
    radial-gradient(circle at 40% 90%, rgba(30, 64, 175, 0.12), transparent 60%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.55), rgba(2, 6, 23, 0.65));

  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.06);

  box-shadow:
    0 35px 80px rgba(0, 0, 0, 0.75),
    0 0 60px rgba(124, 58, 237, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  animation: ambientShift 14s ease-in-out infinite;
}

/* rota levemente el tono (hue) del fondo, de forma sutil y continua. */
@keyframes ambientShift {
  0% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(20deg); }
  100% { filter: hue-rotate(0deg); }
}

.filters::-webkit-scrollbar {
  display: none; /* Chrome / Edge / Safari */
}

/* capa de glow que comparte la misma animación que el fondo. */
.filters::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: ambientShift 14s ease-in-out infinite;
}

/* textura de ruido/grano sutil, mezclada con overlay para no verse plana. */
.filters::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/noise.svg");
  opacity: 0.08;
  mix-blend-mode: overlay;
  pointer-events: none;
  border-radius: inherit;
}

.filters > button {
  padding-right: 50px; /* corre el botón para que no choque con los scroll buttons */
}

.filters-panels {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ============================================================================
 * FILTERS HEADER
 * Barra superior del sidebar (botón personalizar + botón reset).
 * ============================================================================ */

.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* ============================================================================
 * CUSTOMIZE BUTTON
 * Botón "personalizar paneles" del header.
 *
 * Responsabilidades:
 * - Alterna dos textos superpuestos (normal / guardar orden)
 * - Anima la transición entre ambos con fade + translateY
 * ============================================================================ */

.customize-btn {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  cursor: pointer;
}

.btn-layer {
  position: absolute;
  transition: all 0.25s ease;
  opacity: 0;
  transform: translateY(6px);
  white-space: nowrap;
}

.btn-layer.active {
  opacity: 1;
  transform: translateY(0);
}

/* ============================================================================
 * RESET BUTTON
 * Botón circular (↺) para resetear los filtros.
 *
 * Responsabilidades:
 * - Estados normal, hover (glow) y disabled
 * ============================================================================ */

.btn-reset {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.35),
    rgba(79, 70, 229, 0.35)
  );

  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-reset:hover {
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.45);
}

.btn-reset:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

/* ============================================================================
 * PANEL
 * Tarjeta base de cada panel del sidebar (list, filters, genres, sort).
 *
 * Responsabilidades:
 * - Fondo, bordes y sombras "flotantes"; base 3D para el efecto de tilt
 * ============================================================================ */

.panel {
  position: relative;
  z-index: 0;

  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.45),
    rgba(15, 23, 42, 0.55)
  );

  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: visible;
  transform-style: flat; /* necesario en Firefox, sino no se despliegan los paneles */

  transition:
    transform 0.15s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  will-change: transform; /* el tilt cambia "transform" con frecuencia */

  /* 3 capas de sombra + highlight superior, para efecto "flotando" */
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.45),
    0 10px 25px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.panel-tilt {
  transform-style: preserve-3d;
  transition: transform 0.15s ease;
  will-change: transform;
}

/* glow radial que sigue al cursor, centrado en --x/--y (actualizadas por JS). */
.panel::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at var(--x) var(--y),
    rgba(124, 58, 237, 0.18),
    transparent 40%
  );
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

/* eleva el panel con un Multiselect abierto, para que su dropdown no quede tapado. */
.panel:has(.multiselect--active) {
  z-index: 100;
}

/* overlay de luces (highlight superior + glows de esquina) para reforzar el glass. */
.panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;

  background:
    linear-gradient(
      180deg,
      rgba(124, 58, 237, 0.35) 0%,
      rgba(124, 58, 237, 0.15) 15%,
      rgba(124, 58, 237, 0) 40%
    ),
    radial-gradient(circle at 20% -10%, rgba(229, 9, 20, 0.25), transparent 55%),
    radial-gradient(circle at 80% 0%, rgba(124, 58, 237, 0.18), transparent 60%);

  mix-blend-mode: overlay;
  pointer-events: none;
  opacity: 0.9;
}

/* Muestra el glow radial que sigue al cursor al pasar el mouse por el panel */
.panel:hover::after {
  opacity: 1;
}

/* Realza borde y sombra al pasar el mouse, si el panel no está deshabilitado */
.panel:not(.disabled):hover {
  border-color: rgba(124, 58, 237, 0.45);
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.75),
    0 0 35px rgba(124, 58, 237, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* estado deshabilitado: atenúa, congela animaciones y bloquea interacción interna. */
.panel.disabled {
  opacity: 0.45;
  filter: grayscale(0.4);
  transform: none !important;
  transition: none;
}

/* Oculta el glow del cursor cuando el panel está deshabilitado */
.panel.disabled::after {
  opacity: 0 !important;
}

.panel.disabled .panel-body {
  pointer-events: none;
}

.panel.disabled .panel-header {
  cursor: not-allowed;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transform: translateZ(18px);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-body {
  padding: 6px 14px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: visible;
  transform: none !important;
}

/* ============================================================================
 * ARROW
 * Flecha indicadora de apertura/cierre del panel.
 *
 * Responsabilidades:
 * - Rota 90° cuando el panel está abierto
 * ============================================================================ */

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: transform 0.25s ease;
  opacity: 0.8;
}

.arrow svg {
  width: 16px;
  height: 16px;
}

.arrow.open {
  transform: rotate(90deg);
}

/* ============================================================================
 * DRAG & DROP DE PANELES
 * Estados visuales aplicados por vuedraggable durante el arrastre.
 *
 * Responsabilidades:
 * - .drag-ghost: placeholder que queda mientras se arrastra
 * - .drag-chosen / .drag-active: panel elegido / siendo arrastrado
 * ============================================================================ */

.drag-ghost {
  opacity: 0.6;
  transform: scale(0.98);
  filter: blur(0.5px);
  box-shadow:
    0 30px 70px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(124, 58, 237, 0.5);
}

.drag-chosen {
  cursor: grabbing;
  transform: scale(1.03);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}

.drag-active {
  cursor: grabbing;
}

/* evita que SortableJS deje un transform residual en el origen al arrastrar otro panel. */
.sortable-drag {
  transform: none !important;
}

/* ============================================================================
 * FILTER BLOCK / LABEL / VALUE
 * Bloque de un filtro individual (ej: rango de años, rating) con su label.
 *
 * Responsabilidades:
 * - Layout en columna con separación consistente
 * - El "value" muestra el rango actual en formato badge
 * ============================================================================ */

.filter-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 14px;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #e2e8f0;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-label-year .filter-value {
  margin-left: 21px; 
}

.filter-value {
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.35);
  margin-left: 5px;
  box-shadow:
    inset 0 0 6px rgba(124, 58, 237, 0.25),
    0 0 6px rgba(124, 58, 237, 0.25);
}

/* ============================================================================
 * FILTER INPUT (búsqueda)
 * Input de texto libre del panel de filtros.
 *
 * Responsabilidades:
 * - Estilo base y estados hover/focus
 * - .search-input agrega el ícono de lupa como fondo
 * ============================================================================ */

.filter-input {
  background: linear-gradient(
    135deg,
    rgba(2, 6, 23, 0.9),
    rgba(15, 23, 42, 0.9)
  );
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 8px 10px;
  color: white;
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.15s ease;
}

.search-input {
  padding-left: 32px;
  background-image: url("@/assets/search.svg");
  background-repeat: no-repeat;
  background-position: 10px center;
}

.filter-input::placeholder {
  color: #64748b;
}

.filter-input:hover {
  border-color: rgba(124, 58, 237, 0.5);
}

.filter-input:focus {
  border-color: #7c3aed;
  box-shadow:
    0 0 0 1px rgba(124, 58, 237, 0.6),
    0 0 18px rgba(124, 58, 237, 0.35);
  transform: translateY(-1px);
}

/* ============================================================================
 * SLIDER (vue-slider-component)
 * Estilos del slider de rango para años y rating.
 *
 * Responsabilidades:
 * - Rail, rango activo (process), handle, marcas y tooltip
 * - Halo ambiental alrededor del slider (::after)
 * ============================================================================ */

.vue-slider-mark-step {
  width: 2px;
  height: 18px;
  background: rgba(255, 255, 255, 0.25);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

/* marcas dentro del rango seleccionado. */
.vue-slider-mark-active .vue-slider-mark-step {
  background: #7c3aed;
}

.vue-slider-mark-label {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 6px;
}

.vue-slider-dot-tooltip-inner {
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.9),
    rgba(79, 70, 229, 0.9)
  ) !important;

  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  box-shadow:
    0 4px 15px rgba(124, 58, 237, 0.45),
    0 0 8px rgba(124, 58, 237, 0.25);
}

/* flecha del tooltip que apunta al handle (color forzado, la librería lo define por defecto). */
.vue-slider-dot-tooltip-inner::after {
  border-top-color: rgba(124, 58, 237, 0.9) !important;
}

.vue-slider {
  position: relative; /* necesario para el halo ::after */
}

/* halo de luz ambiental alrededor del slider (no representa el rango). */
.vue-slider::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(124, 58, 237, 0.15),
    transparent 60%
  );
  opacity: 0.4;
  pointer-events: none;
}

.vue-slider-rail {
  height: 6px;
  background: linear-gradient(90deg, #020617, #1e293b);
  border-radius: 999px;
}

.vue-slider-process {
  background: linear-gradient(90deg, #7c3aed, #4f46e5, #2563eb);
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.6);
}

.vue-slider-dot-handle {
  width: 16px;
  height: 16px;
  background: radial-gradient(circle, #ffffff, #7c3aed);
  border: none;
  box-shadow:
    0 0 14px rgba(124, 58, 237, 0.8),
    0 0 25px rgba(124, 58, 237, 0.4);
}

.vue-slider-dot-handle:hover {
  transform: scale(1.2);
  box-shadow:
    0 0 20px rgba(124, 58, 237, 1),
    0 0 40px rgba(124, 58, 237, 0.7);
}

/* ============================================================================
 * GENEROS
 * Chips seleccionables de géneros de películas.
 *
 * Responsabilidades:
 * - Estilo base, hover y estado activo (seleccionado)
 * ============================================================================ */

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genre-chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;

  background: linear-gradient(
    135deg,
    rgba(88, 28, 135, 0.55),
    rgba(49, 46, 129, 0.75)
  );

  border: 1px solid rgba(124, 58, 237, 0.45);
  color: #e9d5ff;
  cursor: pointer;
  transition: all 0.25s ease;
}

.genre-chip:hover {
  transform: translateY(-1px);
  border-color: #7c3aed;
  box-shadow: 0 0 14px rgba(124, 58, 237, 0.45);
}

.genre-chip.active {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white;
  box-shadow: 0 0 18px rgba(124, 58, 237, 0.8);
}

/* ============================================================================
 * MULTISELECT (vue-multiselect)
 * Estilos del combo de selección (tipo de lista, orden).
 *
 * Responsabilidades:
 * - Input, flecha, dropdown y opciones
 * - Fuerza la apertura del dropdown siempre hacia abajo
 * ============================================================================ */

.multiselect {
  font-size: 13px;
  width: 100%;
}

.multiselect__tags {
  background: linear-gradient(
    135deg,
    rgba(2, 6, 23, 0.9),
    rgba(15, 23, 42, 0.9)
  );
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 8px 34px 8px 10px;
  color: white;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.15s ease;
}

.multiselect:hover .multiselect__tags {
  border-color: #7c3aed;
}

.multiselect--active .multiselect__tags {
  border-color: #7c3aed;
  box-shadow:
    0 0 0 1px rgba(124, 58, 237, 0.6),
    0 0 18px rgba(124, 58, 237, 0.35);
}

/* corrige un desalineado vertical del texto tras el padding custom de .multiselect__tags. */
.multiselect__single {
  transform: translateY(2px);
}

.multiselect__select {
  height: 100%;
  z-index: 10;
}

/* Color de la flecha del select */
.multiselect__select::before {
  border-color: #7c3aed transparent transparent;
  top: 50%;
}

.multiselect__content-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 99999 !important;

  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.95),
    rgba(2, 6, 23, 0.95)
  );

  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  margin-top: 6px;
  backdrop-filter: blur(12px);
  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.75),
    0 0 25px rgba(124, 58, 237, 0.25);
}

.multiselect__option {
  color: #e5e7eb;
  padding: 10px 12px;
  transition: transform 0.15s ease;
}

.multiselect__option--highlight,
.multiselect__option--selected {
  background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;
  color: white !important;
}

.multiselect__input,
.multiselect__single {
  background: transparent;
}

/* vue-multiselect abre el dropdown hacia arriba si detecta poco espacio abajo;
   en este sidebar 3D eso pisa otros paneles, así que se fuerza siempre hacia abajo. */
.multiselect--above .multiselect__content-wrapper {
  bottom: auto !important;
  top: 100% !important;
  margin-top: 4px;
}

.fake-disabled {
  opacity: 0.45;
  filter: grayscale(0.4);
  pointer-events: none;
  cursor: not-allowed;
}

/* ============================================================================
 * PANEL TRANSITION
 * Animación de apertura/cierre del cuerpo del panel (Transition name="panel").
 *
 * Responsabilidades:
 * - Anima max-height y opacity, tipo "acordeón"
 * ============================================================================ */

.panel-leave-active {
  position: relative;
}

.panel-enter-active,
.panel-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.2s ease;
  overflow: hidden;
}

.panel-enter-from,
.panel-leave-to {
  max-height: 0;
  opacity: 0;
}

.panel-enter-to,
.panel-leave-from {
  max-height: 500px;
  opacity: 1;
}

/* ============================================================================
 * DRAG HANDLE
 * Icono "⋮⋮" que indica que un panel es arrastrable.
 *
 * Responsabilidades:
 * - Oculto fuera del modo personalización, aparece con fade + slide
 * ============================================================================ */

.drag-handle {
  margin-right: 4px;
  font-size: 14px;
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
  cursor: grab;
}

.drag-handle.show {
  opacity: 0.6;
  transform: translateX(0);
}

/* ============================================================================
 * CUSTOMIZE MODE
 * Estilos de los paneles mientras el modo personalización está activo.
 *
 * Responsabilidades:
 * - Cursor "grab" y borde resaltado con pulso de glow continuo
 * ============================================================================ */

.customize-mode .panel-header {
  cursor: grab;
}

.customize-mode .panel {
  cursor: grab;
  border-color: rgba(124, 58, 237, 0.35);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 25px rgba(124, 58, 237, 0.35);
  animation: panelEditPulse 3s ease-in-out infinite;
}

/* pulso de glow continuo sobre el borde del panel en modo personalización. */
@keyframes panelEditPulse {
  0% {
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.8),
      0 0 15px rgba(124, 58, 237, 0.2);
  }
  50% {
    box-shadow:
      0 25px 65px rgba(0, 0, 0, 0.9),
      0 0 35px rgba(124, 58, 237, 0.4);
  }
  100% {
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.8),
      0 0 15px rgba(124, 58, 237, 0.2);
  }
}

/* ============================================================================
 * SCROLL BUTTONS (▲ ▼)
 * Botones flotantes para scrollear el contenedor de filtros.
 *
 * Responsabilidades:
 * - Posición flotante sobre el borde derecho, estilo glass
 * - Estado hover con glow; ▲ y ▼ ubicados a distinta altura
 * ============================================================================ */

.filters-scroll {
  position: absolute;
  right: -14px; /* sobresale del borde del panel */
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: #a78bfa;

  background: rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);

  transition:
    opacity 0.35s ease,
    transform 0.15s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  opacity: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.filters-scroll[style*="display: none"] {
  opacity: 0;
}

.filters-scroll:hover {
  color: #c4b5fd;
  border-color: rgba(124, 58, 237, 0.6);
  box-shadow:
    0 10px 35px rgba(0, 0, 0, 0.75),
    0 0 18px rgba(124, 58, 237, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.filters-scroll.up {
  top: 40%;
}

.filters-scroll.down {
  top: 55%;
}

/* ============================================================================
 * SCROLL BUTTON TRANSITION
 * Animación de entrada/salida de los botones ▲ ▼ (Transition name="scroll-btn").
 *
 * Responsabilidades:
 * - Anima opacity + translateY al aparecer/desaparecer
 * ============================================================================ */

.scroll-btn-enter-active,
.scroll-btn-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.scroll-btn-enter-from,
.scroll-btn-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.scroll-btn-enter-to,
.scroll-btn-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* ============================================================================
 * PANEL DIVIDER
 * Línea degradada que separa bloques dentro de un panel.
 *
 * Responsabilidades:
 * - Dibujar una línea delgada con gradiente violeta/azul en los extremos
 *   transparente
 * ============================================================================ */

.panel-divider {
  position: relative;
  height: 1px;
  margin: 0px 0;

  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 58, 237, 0.45),
    rgba(79, 70, 229, 0.55),
    rgba(124, 58, 237, 0.45),
    transparent
  );
}

/* glow suave alrededor de la línea, para un aspecto más "neon". */
.panel-divider::after {
  content: "";
  position: absolute;
  inset: -2px 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 58, 237, 0.25),
    rgba(79, 70, 229, 0.25),
    transparent
  );
  filter: blur(6px);
  opacity: 0.7;
}

/* ============================================================================
 * FILTERS DISABLED MESSAGE
 * Mensaje que indica que los filtros avanzados no están disponibles.
 *
 * Responsabilidades:
 * - Texto pequeño y atenuado debajo del selector de tipo de listado
 * ============================================================================ */

.filters-disabled-msg {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.65;
  color: #cbd5e1;
  padding-left: 2px;
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .filters {
    padding: 14px;
    gap: 14px;
    border-radius: 16px;
    max-height: calc(100vh - 100px);
  }

  .filters-scroll {
    display: none;
  }

  .panel {
    border-radius: 14px;
  }

  .panel-header {
    padding: 10px 12px;
  }

  .panel-body {
    padding: 6px 12px 12px 12px;
    gap: 12px;
  }

  /* desactiva el tilt 3D: en touch no hay mousemove real */
  .panel-tilt {
    transform: none !important;
  }

  .panel::after {
    opacity: 0 !important;
  }
}

@media (max-width: 480px) {
  .filters {
    padding: 10px;
    gap: 10px;
  }

  .panel-header {
    padding: 8px 10px;
    font-size: 0.92rem;
  }

  .panel-body {
    padding: 4px 10px 10px 10px;
    gap: 10px;
  }

  .genres {
    gap: 6px;
  }

  .genre-chip {
    padding: 5px 10px;
    font-size: 11px;
  }

  .filter-label {
    font-size: 10px;
  }

  .filter-value {
    font-size: 11px;
    padding: 2px 6px;
  }

  .vue-slider-mark-label {
    font-size: 9px;
  }

  .multiselect {
    font-size: 12px;
  }

  .multiselect__tags {
    padding: 7px 30px 7px 8px;
  }

  .filters-disabled-msg {
    font-size: 10px;
  }
}

</style>
