<script setup lang="ts">

/* ============================================================================
 * VIEW: PersonDetailView.vue
 * ============================================================================
 *
 * Vista del detalle de una persona. Obtiene el id desde la ruta, llama al
 * composable usePersonDetail para traer los datos desde TMDB, maneja los
 * estados de carga y error, y renderiza PersonHero controlando el loader
 * hasta que el hero esté completamente listo.
 * ============================================================================ */

import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import { useHeaderCollapsed } from "@/layouts/composables/useHeaderCollapsed";

import { usePersonDetail } from "../composables/usePersonDetail";

import PersonHero from "../components/PersonHero.vue";

// Acceso a los parámetros de la ruta actual
const route = useRoute()

// Extrae el id de la persona desde la URL; fallback a 0 si falla la conversión
const id = Number(route.params.id) || 0;

// t() para textos traducidos; locale se usa como dependencia reactiva de TMDB
const { t, locale } = useI18n()

// Composable que trae el detalle de la persona desde TMDB (data, loading, error)
const { data, isLoading, isError } = usePersonDetail(id, locale)

// Alias de isError, usado para mostrar la pantalla de error (ej: 404)
const error = isError;

// Indica si PersonHero terminó de renderizar; oculta el loader cuando es true
const heroReady = ref(false)

// Estado global del header (plegado/expandido), usado para ajustar alturas del layout
const { isHeaderCollapsed } = useHeaderCollapsed();

// Datos de la persona extraídos de data; undefined mientras no haya cargado
const person = computed(() => data.value)

// Fuerza a remontar el hero cuando cambia el idioma sin remontar toda la vista.
const detailRenderKey = computed(() => `${id}-${locale.value}`);

/**
 * Se ejecuta cuando PersonHero emite "ready" (renderizado completo).
 * Marca heroReady para ocultar el loader y evitar mostrar contenido
 * incompleto al usuario.
 */
function onHeroReady() {
  heroReady.value = true
}

// Al cambiar idioma o iniciar una recarga, se vuelve a coordinar la entrada
// para evitar que la vista quede vacia mientras llega la nueva data.
watch(
  () => locale.value,
  () => {
    heroReady.value = false;
  }
);

watch(isLoading, (loading) => {
  if (loading) {
    heroReady.value = false;
  }
});

</script>

<template>

  <div class="detail-wrapper"
      :class= "{ 'is-error': error,
                 'is-header-collapsed': isHeaderCollapsed
       }"
  >

    <!-- ERROR -->
    <div v-if="error" class="error-hero">

      <div class="error-content">

        <h1 class="error-title">
          <span class="error-icon">⭐</span>
          <span class="error-text">
            {{ t('personDetail.notFoundTitle') }}</span>
        </h1>

        <p class="error-sub">
          {{ t('personDetail.notFoundMessage') }}
        </p>

      <RouterLink class="btn-error" :to="`/${locale}/movies`">

        <svg
          class="icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        
        {{ t('movieDetail.backToMovies') }}

      </RouterLink>

      </div>

    </div>

    <!-- CONTENIDO -->
    <div v-else>

      <PersonHero
        v-if="person"
        :key="`hero-${detailRenderKey}`"
        :person="person"      
        @ready="onHeroReady"
      />

      <!-- overlay -->
      <div v-if="isLoading || !heroReady" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <h1 class="loading-title">
            {{ t('personDetail.loadingTitle') }}
          </h1>
        </div>
      </div>

    </div>

  </div>

</template>

<style>

/* ============================================================================
 * DETAIL WRAPPER
 * Contenedor principal de la vista de persona.
 *
 * Responsabilidades:
 * - Ocupa toda la pantalla
 * - Fondo oscuro
 * - Layout en columna
 * ============================================================================ */

.detail-wrapper {
  position: relative;
  background: #0b0f19;
  color: #e5e7eb;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.detail-wrapper.is-error {
  min-height: calc(100vh - 133px); /* header normal */
}

.detail-wrapper.is-header-collapsed {
  min-height: calc(100vh - 63px); /* header colapsado */
}

/* ============================================================================
 * LOADING OVERLAY
 * Capa que cubre toda la vista mientras cargan los datos.
 *
 * Responsabilidades:
 * - Bloquear la interacción
 * - Cubrir completamente la pantalla
 * - Centrar el loader
 * - Mantener coherencia visual con el fondo (::before) y contraste (::after)
 * ============================================================================ */

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(11, 15, 25, 0.6); /* overlay sutil, no fondo nuevo */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* fondo animado con gradientes radiales + blur. */
.loading-overlay::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.15), transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(124, 58, 237, 0.18), transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(30, 64, 175, 0.18), transparent 50%),
    linear-gradient(180deg, #0b0f19 0%, #0f172a 40%, #0b0f19 100%);
  filter: blur(90px);
  animation: backgroundDrift 45s ease-in-out infinite alternate;
}

/* movimiento suave del fondo: zoom leve + desplazamiento + variación de opacidad. */
@keyframes backgroundDrift {
  0% { transform: translate3d(-4%, -2%, 0) scale(1); }
  50% { transform: translate3d(3%, 2%, 0) scale(1.1); }
  100% { transform: translate3d(-2%, 4%, 0) scale(1.05); }
}

/* capa oscura superior, mejora contraste del texto y del spinner. */
.loading-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/noise.svg");
  opacity: 0.06;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* ============================================================================
 * LOADING CONTENT
 * Contenido visible del loader.
 *
 * Responsabilidades:
 * - Centrar texto y spinner
 * - Elevar contenido sobre el fondo
 * - Subir ligeramente el bloque
 * ============================================================================ */

.loading-content {
  transform: translateY(-10vh);
  text-align: center;
  z-index: 2;
}

/* ============================================================================
 * SPINNER
 * Indicador visual de carga.
 *
 * Características:
 * - Rotación infinita
 * - Color principal rojo
 * - Estilo moderno minimalista
 * ============================================================================ */

.spinner {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #ff0055;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

/* rotación continua del spinner. */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================================================
 * LOADING TITLE
 * Título animado del loader.
 *
 * Responsabilidades:
 * - Mostrar texto principal
 * - Aplicar gradiente animado (shimmer)
 * ============================================================================ */

.loading-title {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #fff, #ff0055, #fff);
  background-size: 200%;
  background-clip: text;           /* estándar */
  -webkit-background-clip: text;   /* soporte Chrome/Safari */
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}

/* brillo desplazándose sobre los textos con gradiente (loading-title, error-title, error-text). */
@keyframes shimmer {
  0% { background-position: 200%; }
  100% { background-position: -200%; }
}

/* ============================================================================
 * ERROR HERO
 * Pantalla mostrada cuando la persona no es encontrada.
 *
 * Responsabilidades:
 * - Mostrar mensaje de error claro al usuario
 * - Mantener estética de la app
 * - Centrar el contenido en la pantalla
 * - Reutilizar fondo animado coherente con el loader (::before)
 * ============================================================================ */

.error-hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0b0f19;
}

/* fondo animado vía pseudo-elemento, sin agregar nodos al DOM. */
.error-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(255, 0, 100, 0.2), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0, 150, 255, 0.2), transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.2), transparent 60%),
    #0b0f19;
  filter: blur(40px);
  animation: cinematicBg 12s ease-in-out infinite alternate;
  z-index: 0;
}

/* ============================================================================
 * ERROR CONTENT
 * Contenedor del contenido del error.
 *
 * Responsabilidades:
 * - Centrar texto e iconos
 * - Mantener jerarquía visual
 * - Elevar contenido sobre el fondo
 * ============================================================================ */

.error-content {
  position: relative;
  text-align: center;
  z-index: 2;
  max-width: 900px;
}

/* ============================================================================
 * ERROR TITLE
 * Título principal del error.
 *
 * Responsabilidades:
 * - Mostrar mensaje principal
 * - Aplicar gradiente animado
 * - Adaptarse a diferentes pantallas
 * ============================================================================ */

.error-title {
  font-size: clamp(38px, 4vw, 48px);
  white-space: nowrap;
  font-weight: 800;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #fff, #ff0055, #fff);
  background-size: 200%;
  background-clip: text;
  animation: shimmer 4s linear infinite;
  text-wrap: balance;
}

/* ============================================================================
 * ERROR ICON
 * Icono decorativo junto al título de error.
 *
 * Responsabilidades:
 * - Mantener color y estilo distintivo del estado de error
 * - Separar visualmente del texto principal del título
 * - Aplicar sombra decorativa para resaltar el icono
 * - No heredar gradiente del título
 * ============================================================================ */

.error-icon {
  margin-right: 16px;
  filter: drop-shadow(0 0 6px rgba(255, 200, 0, 0.6));
}

/* ============================================================================
 * ERROR TEXT
 * Texto principal dentro del título de error (excluyendo el icono).
 *
 * Responsabilidades:
 * - Aplicar gradiente animado (shimmer) sobre el texto
 * - Mantener transparencia para mostrar el gradiente
 * - Soporte cross-browser (Chrome/Safari con -webkit)
 * ============================================================================ */

.error-text {
  background: linear-gradient(90deg, #fff, #ff0055, #fff);
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}

/* ============================================================================
 * ERROR SUBTITLE
 * Texto de apoyo bajo el título de error.
 *
 * Responsabilidades:
 * - Dar contexto breve del problema
 * - Mantener buena legibilidad
 * - Acompañar al título sin competir visualmente
 * ============================================================================ */

.error-sub {
  color: #f1f5f9; /* blanco suave, no puro */
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 30px;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
}

/* ============================================================================
 * BOTÓN ERROR
 * Botón de acción para volver al catálogo.
 *
 * Responsabilidades:
 * - Permitir navegación de regreso a la página principal
 * - Aplicar efecto hover
 * ============================================================================ */

.btn-error {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  padding: 12px 24px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff0055, #ff3366);
  color: white;
  text-decoration: none;
  font-weight: 600;
  transition: 0.3s;
}

.btn-error:hover {
  transform: scale(1.005);
  box-shadow: 0 0 20px rgba(255, 0, 100, 0.5);
}

/* ============================================================================
 * ICON
 * Icono usado dentro del botón de error.
 *
 * Responsabilidades:
 * - Definir tamaño consistente del icono
 * - Mantener proporción visual con el texto
 * ============================================================================ */

.icon {
  width: 18px;
  height: 18px;
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .loading-content {
    transform: none;
    padding: 0 16px;
  }

  .loading-title {
    font-size: 22px;
    letter-spacing: 1px;
  }

  .spinner {
    width: 50px;
    height: 50px;
  }

  .error-hero {
    padding: 40px 0;
  }

  .error-content {
    padding: 0 16px;
  }

  .error-title {
    white-space: normal;
    font-size: 28px;
    line-height: 1.2;
  }

  .error-sub {
    font-size: 15px;
  }

  .btn-error {
    padding: 10px 18px;
    font-size: 0.9rem;
  }
}

</style>
