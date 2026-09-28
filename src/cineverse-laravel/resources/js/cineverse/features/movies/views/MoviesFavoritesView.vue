<script setup lang="ts">

/* ============================================================================
 * VIEW: FavoritesView.vue
 * ============================================================================
 *
 * Vista de la página de favoritos. Obtiene las películas favoritas desde el
 * store global, renderiza la grilla de MovieCard, muestra el estado vacío
 * cuando no hay favoritos, y maneja el modal de confirmación para limpiar
 * la lista completa (bloqueando el scroll mientras está abierto).
 * ============================================================================ */

import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useFavoritesStore } from "@/features/movies/stores/useMoviesFavoritesStore";

import { useHeaderCollapsed } from "@/layouts/composables/useHeaderCollapsed";

import MovieCard from "@/features/movies/components/MovieCard.vue";

// t() para textos traducidos; locale se usa en el link de "volver a movies"
const { t, locale } = useI18n();

// Store global de favoritos: lista, contador y acción de limpiar
const favoritesStore = useFavoritesStore();

// Controla la visibilidad del modal de confirmación de limpieza
const showConfirm = ref(false);

// Estado global del header (plegado/expandido), usado para ajustar el layout
const { isHeaderCollapsed } = useHeaderCollapsed();

/**
 * Detecta si hay pocos favoritos (<= 5) para reducir la altura mínima
 * de la página y evitar que el footer quede flotando en el medio.
 */
const hasFewFavorites = computed(() => {
  return favoritesStore.favorites.length <= 5;
});

/**
 * Abre el modal de confirmación (botón "Limpiar todo").
 */
const openConfirm = () => {
  showConfirm.value = true;
};

/**
 * Cierra el modal de confirmación (botón cancelar o la X).
 */
const closeConfirm = () => {
  showConfirm.value = false;
};

/**
 * Confirma la limpieza: vacía el store de favoritos y cierra el modal.
 */
const confirmClear = () => {
  favoritesStore.clearFavorites();
  showConfirm.value = false;
};

/**
 * Bloquea el scroll del body mientras el modal está abierto y lo
 * restaura al cerrarlo, para evitar interacción con el fondo.
 */
watch(showConfirm, (val) => {
  document.body.style.overflow = val ? "hidden" : "";
});

</script>

<template>

    <div class="page-wrapper"
         :class="{ 'few-favorites': hasFewFavorites,
                   'is-header-collapsed': isHeaderCollapsed
           }"
    >

      <div class="movies-layout">

          <div class="favorites-header">

            <div class="favorites-info">

              <span class="favorites-count-main">
                {{ favoritesStore.favoritesCount }}/20
              </span>

              <span class="favorites-label">
                {{ t('favorites.title') }}
              </span>

            </div>

              <!-- SOLO SI HAY FAVORITOS -->
            <button
              v-if="favoritesStore.favoritesCount > 0"
              class="btn-clear"
              @click="openConfirm"
            >
              {{ t('favorites.clearAll') }}
            </button>

          </div>

          <div v-if="favoritesStore.favorites.length === 0" class="empty-hero">

            <div class="empty-content">

              <h1 class="empty-title">
                <span class="empty-icon">💜</span>
                {{ t('favorites.emptyTitle') }}
              </h1>

              <p class="empty-sub">
                {{ t('favorites.emptySubtitle') }}
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

          <div class="movies-grid">
                <MovieCard
                    v-for="(movie, i) in favoritesStore.favorites"
                    :key="movie.id"
                    :movie="movie"
                    :delay="i * 40"
                />
          </div>

            <!-- el modal sale de .page-wrapper para que se deshabilite el header también  -->
          <Teleport to="body"> 

            <transition name="fade">

              <div v-if="showConfirm" class="confirm-overlay">

                <div class="confirm-box">

                    <!-- HEADER -->
                    <div class="confirm-header">
                      <span>
                        {{ t('favorites.modal.title') }}
                      </span>
                      <button class="btn-close" @click="closeConfirm">✕</button>
                    </div>

                    <!-- BODY -->
                    <div class="confirm-body">
                      <h2>
                        {{ t('favorites.modal.confirmTitle') }}
                      </h2>
                      <p>
                        {{ t('favorites.modal.confirmMessage') }}
                      </p>
                    </div>

                    <!-- FOOTER -->
                    <div class="confirm-actions">
                      <button class="btn-cancel" @click="closeConfirm">
                        {{ t('favorites.modal.cancel') }}
                      </button>
                      <button class="btn-confirm" @click="confirmClear">                                                
                        {{ t('favorites.modal.confirm') }}
                      </button>
                    </div>

                </div>

              </div>
                
            </transition>

          </Teleport> 

      </div>
  
    </div>

</template>

<style>

/* ============================================================================
 * PAGE WRAPPER
 * Contenedor principal de la página de favoritos.
 *
 * Responsabilidades:
 * - Fondo oscuro, texto claro, padding vertical
 * - Altura mínima ajustada según pocos favoritos / header colapsado
 * - Fondo animado con luces radiales (::before) + textura de ruido (::after)
 * ============================================================================ */

.page-wrapper {
  position: relative; /* necesario para ::before y ::after */
  min-height: 100vh;
  overflow: visible;
  color: #e5e7eb;
  padding-top: 20px;
  padding-bottom: 40px;
  background: #0b0f19;
  isolation: isolate;
}

.page-wrapper.few-favorites {
  min-height: calc(100vh - 133px); /* header normal */
}

.page-wrapper.is-header-collapsed {
  min-height: calc(100vh - 63px); /* header colapsado */
}

/* fondo animado con luces radiales, blur y movimiento continuo. */
.page-wrapper::before {
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
.page-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/noise.svg");
  opacity: 0.06;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* ============================================================================
 * MOVIES LAYOUT
 * Contenedor central del contenido de favoritos (header + grid/empty).
 *
 * Responsabilidades:
 * - Centrar y limitar el ancho del contenido
 * - Layout en columna con altura mínima para evitar que el footer flote
 * ============================================================================ */

.movies-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  min-height: 70vh;
}

/* ============================================================================
 * MOVIES GRID
 * Grilla responsive de tarjetas de películas favoritas.
 *
 * Responsabilidades:
 * - auto-fill / minmax(220px, 1fr): columnas que se adaptan al ancho
 * - perspective: habilita efectos 3D en MovieCard
 * ============================================================================ */

.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 32px;
  perspective: 1000px;
  position: relative;
}

/* ============================================================================
 * FAVORITES HEADER
 * Fila superior con el contador de favoritos y el botón "Limpiar todo".
 *
 * Responsabilidades:
 * - Alinear el contenido a la derecha
 * - Separar visualmente del grid
 * ============================================================================ */

.favorites-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 28px;
}

/* ============================================================================
 * FAVORITES INFO / COUNT / LABEL
 * Badge tipo "píldora" con el contador de favoritos (ej: "5/20 Favoritos").
 *
 * Responsabilidades:
 * - Estilo glassmorphism (blur + glow violeta)
 * - Jerarquía tipográfica: número protagonista, etiqueta secundaria
 * ============================================================================ */

.favorites-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.25);
  backdrop-filter: blur(8px); 
}

.favorites-count-main {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
}

.favorites-label {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: linear-gradient(90deg, #ec4899, #7c3aed);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  opacity: 0.8;
}

/* ============================================================================
 * BOTÓN LIMPIAR (header)
 * Abre el modal de confirmación para vaciar favoritos.
 *
 * Responsabilidades:
 * - Estilo glass acorde al theme violeta
 * - Hover: más contraste + glow
 * - Shimmer interno (::before) que se activa en hover
 * ============================================================================ */

.btn-clear {
  position: relative;
  margin-left: 12px;
  padding: 8px 16px;
  border-radius: 999px;
  
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid rgba(124, 58, 237, 0.25);
  color: rgba(255, 255, 255, 0.85);

  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  backdrop-filter: blur(6px);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.btn-clear:hover {  
  border-color: rgba(236, 72, 153, 0.5);
  background: rgba(124, 58, 237, 0.15);
  color: #fff;
  box-shadow:
    0 0 10px rgba(124, 58, 237, 0.3),
    0 0 20px rgba(236, 72, 153, 0.2);
}

/* capa de brillo, oculta por defecto, visible en hover. */
.btn-clear::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(236, 72, 153, 0.25),
    rgba(124, 58, 237, 0.25),
    transparent
  );
  opacity: 0;
}

.btn-clear:hover::before {
  opacity: 1;
}

/* ============================================================================
 * FADE TRANSITION
 * Transición global de Vue para overlay y modal de confirmación.
 * ============================================================================ */

.fade-enter-active,
.fade-leave-active {
  transition: all 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

/* ============================================================================
 * CONFIRM OVERLAY
 * Fondo del modal de confirmación (cubre toda la pantalla).
 *
 * Responsabilidades:
 * - Bloquear y oscurecer el contenido de fondo (blur + z-index alto)
 * - Centrar el modal
 * ============================================================================ */

.confirm-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  background: rgba(10, 10, 20, 0.55);
  backdrop-filter: blur(14px);
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ============================================================================
 * CONFIRM BOX
 * Contenedor del modal de confirmación (glassmorphism).
 * ============================================================================ */

.confirm-box {
  width: 460px;
  border-radius: 20px;
  overflow: hidden;

  background: rgba(15, 23, 42, 0.25);  
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.6),
    0 10px 30px rgba(0, 0, 0, 0.4);
  animation: modalIn 0.3s ease;

  backdrop-filter: blur(20px) saturate(160%);  
}

/* entrada del modal: desde abajo, más chico y transparente. */
@keyframes modalIn {
  from {
    transform: translateY(20px) scale(0.97);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* ============================================================================
 * CONFIRM HEADER
 * Título del modal + botón de cierre (X).
 * ============================================================================ */

.confirm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;

  background: linear-gradient(
    120deg,
    rgba(124, 58, 237, 0.25),
    rgba(236, 72, 153, 0.25)
  );
  color: #f3f4f6;
  box-shadow:
    inset 0 -1px 0 rgba(255, 255, 255, 0.05),
    0 0 20px rgba(124, 58, 237, 0.25);

  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-size: 0.9rem;
  font-weight: 600;
}

/* ============================================================================
 * BOTÓN CERRAR (MODAL)
 * Botón de cierre (X) del modal de confirmación.
 *
 * Responsabilidades:
 * - Cerrar el modal al hacer click
 * - Aplicar hover con fondo sutil
 * ============================================================================ */

.btn-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

/* ============================================================================
 * CONFIRM BODY
 * Mensaje de confirmación (título + descripción).
 *
 * Responsabilidades:
 * - Mostrar el título y el texto de confirmación
 * - Mantener jerarquía visual entre ambos
 * ============================================================================ */

.confirm-body {
  padding: 24px 22px 10px;
  text-align: left;
}

.confirm-body h2 {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #fff;
}

.confirm-body p {
  color: #9ca3af;
  font-size: 0.95rem;
}

/* ============================================================================
 * CONFIRM ACTIONS
 * Fila de botones cancelar / confirmar, alineados a la derecha.
 *
 * Responsabilidades:
 * - Agrupar los botones del modal
 * - Mantener separación uniforme entre ellos
 * ============================================================================ */

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 20px;
}

/* ============================================================================
 * BOTÓN CANCELAR
 * Acción secundaria del modal de confirmación.
 *
 * Responsabilidades:
 * - Cerrar el modal sin ejecutar cambios (acción no destructiva)
 * - Aplicar estilo glass acorde al theme violeta/rosa
 * - Aplicar hover con mayor contraste y glow
 * ============================================================================ */

.btn-cancel {
  padding: 10px 16px;
  border-radius: 10px;
  background: linear-gradient(
    120deg,
    rgba(124, 58, 237, 0.15),
    rgba(236, 72, 153, 0.15)
  );
  border: 1px solid rgba(124, 58, 237, 0.35);
  color: #e9d5ff;
  font-weight: 500;
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.2);
}

.btn-cancel:hover {
  color: #fff;
  border-color: rgba(236, 72, 153, 0.6);
  background: linear-gradient(
    120deg,
    rgba(124, 58, 237, 0.25),
    rgba(236, 72, 153, 0.25)
  );
  box-shadow:
    0 0 14px rgba(124, 58, 237, 0.35),
    0 0 28px rgba(236, 72, 153, 0.25);
}

/* ============================================================================
 * BOTÓN CONFIRMAR
 * Acción primaria/destructiva del modal de confirmación.
 *
 * Responsabilidades:
 * - Ejecutar la eliminación de favoritos al hacer click
 * - Color rojo para comunicar la irreversibilidad de la acción
 * - Aplicar hover con rojo más intenso y glow
 * - Reducir ligeramente el tamaño al hacer click (active)
 * ============================================================================ */
.btn-confirm {
  padding: 10px 16px;
  border-radius: 10px;
  background: linear-gradient(120deg, #b91c1c, #ef4444);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 6px 18px rgba(185, 28, 28, 0.4);
}

.btn-confirm:hover {
  border-color: rgba(239, 68, 68, 0.6);
  background: linear-gradient(120deg, #7f1d1d, #dc2626);
  box-shadow:
    0 10px 24px rgba(127, 29, 29, 0.7),
    0 0 14px rgba(220, 38, 38, 0.5);
}

.btn-confirm:active {
  transform: scale(0.96);
}

/* ============================================================================
 * EMPTY HERO
 * Estado vacío cuando el usuario no tiene favoritos.
 *
 * Responsabilidades:
 * - Centrar el mensaje vertical y horizontalmente
 * - Ocupar el espacio disponible del layout
 * ============================================================================ */

.empty-hero {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: transparent;
}

.empty-content {
  position: relative;
  text-align: center;
  z-index: 2;
  max-width: 900px;
}

.empty-title {
  font-size: clamp(34px, 4vw, 44px);
  font-weight: 800;
  margin-bottom: 16px;
  background: linear-gradient(90deg, #fff, #7c3aed, #ec4899, #fff);
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}

/* brillo desplazándose sobre el título (reutiliza el mismo patrón shimmer del resto de la app). */
@keyframes shimmer {
  0% { background-position: 200%; }
  100% { background-position: -200%; }
}

.empty-icon {
  margin-right: 10px;
  color: #c084fc;
}

.empty-sub {
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
 * Botón para volver al catálogo desde el estado vacío.
 *
 * Responsabilidades:
 * - Navegar de regreso a /movies
 * - Aplicar efecto hover (escala + glow)
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

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
  .movies-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 26px;
  }
}

@media (max-width: 768px) {
  .movies-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 22px;
  }
}

@media (max-width: 480px) {
  .movies-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

</style>