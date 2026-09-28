<script setup lang="ts">

/* ============================================================================
 * VIEW: MyReviewsView.vue
 * ============================================================================
 *
 * Listado completo de reviews del usuario autenticado, paginado
 * (a diferencia de ProfileView.vue, que solo muestra las últimas).
 * ============================================================================ */

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import { 
    MessageSquareText, 
    AlertTriangle, 
    ArrowLeft,
    LoaderCircle
} from "lucide-vue-next";

import { getUserReviews } from "@/features/movies/services/reviews.service";

import { useAuthStore } from "@/features/auth/stores/useAuthStore"; // 

import { useLocalizedDate } from "@/core/composables/useLocalizedDate";

import StarRating from "@/features/movies/components/movie-detail/StarRating.vue";

import type { Review } from "@/features/movies/types/movie-detail/reviews";

import "@/assets/styles/review-cards.css";

// Traducción de textos e idioma actual.
const { t, locale } = useI18n();
// Router para la navegación entre vistas.
const router = useRouter();
// Store con el estado de autenticación del usuario.
const authStore = useAuthStore();

// Función para formatear fechas según el idioma actual.
const { formatDate } = useLocalizedDate();

// Reviews del usuario autenticado (acumuladas página a página)
const reviews = ref<Review[]>([]);

// Estado de paginación
const currentPage = ref(1);
const hasNext = ref(false);

// Indica si se está cargando la primera página de reseñas.
const isLoading = ref(true);
// Indica si se está cargando una página adicional de reseñas.
const isLoadingMore = ref(false);
// Almacena el código del error ocurrido durante la carga.
const errorMessage = ref<string | null>(null);

/**
 * Pide una página de reviews del usuario autenticado al backend.
 * En la página 1 reemplaza el listado; en páginas siguientes, concatena.
 */
async function fetchReviews(page: number) {

  errorMessage.value = null;

  try {

    const response = await getUserReviews(page);
    const { data } = response;

    hasNext.value = data.pagination.has_next;
    currentPage.value = data.pagination.page;

    reviews.value =
      page === 1 ? data.reviews : [...reviews.value, ...data.reviews];

  } catch (error: any) {

    const code = error.response?.data?.code as string;

    if (code === "AUTH_REQUIRED") {
      authStore.clear();
      router.push({
        name: "Login",
        params: { lang: locale.value }
      });
      return;
    }

    errorMessage.value = "loadError";
  }
}

/** Carga la primera página de reviews del usuario. */ 
async function loadReviews() {

  isLoading.value = true;  
  try {
    await fetchReviews(1);
  } finally {
    isLoading.value = false;
  }
}

/** Pide la siguiente página de reviews (paginación "cargar más"). */
async function loadMore() {
  if (isLoadingMore.value || !hasNext.value) return;

  isLoadingMore.value = true;
  try {
    await fetchReviews(currentPage.value + 1);
  } finally {
    isLoadingMore.value = false;
  }
}

/** Navega al detalle de la película de la review, preservando el idioma. */
function goToMovie(movieId: number) {
  router.push({ name: "MovieDetail", params: { lang: locale.value, id: movieId } });
}

/** Vuelve a la vista de perfil, preservando el idioma. */
function goBack() {
  router.push({ name: "Profile", params: { lang: locale.value } });
}

// Carga la primera página de reviews del usuario al montar el componente
onMounted(loadReviews);

</script>

<template>

  <div class="page-wrapper">

    <div class="my-reviews-view">

      <button class="btn-back" @click="goBack">
        <ArrowLeft :size="16" />
        {{ t("profile.backToProfile") }}
      </button>

      <h1 class="section-title">
        {{ t("profile.allReviewsTitle") }}
      </h1>

      <div v-if="isLoading" class="reviews-loading my-reviews-loading">
        <div class="loading-orbit" aria-hidden="true">
          <LoaderCircle :size="28" />
        </div>
        <span class="loading-text">{{ t("reviews.loading") }}</span>
      </div>
      <div v-else-if="errorMessage" class="reviews-error">
        <AlertTriangle :size="28" />
        <p>
            {{ t(`reviews.errors.${errorMessage}`) }}
        </p>
      </div>
      <div v-else-if="reviews.length === 0" class="no-reviews">
        <MessageSquareText :size="32" />
        <p>
            {{ t("profile.noReviewsYet") }}
        </p>
      </div>
      <div v-else class="reviews-grid">

      <div
        v-for="review in reviews"
        :key="review.id"
        class="review-card"
        @click="goToMovie(review.movie_id)"
      >

          <div class="review-card-header">
            <span class="review-movie-title">{{ review.movie_title }}</span>
            <StarRating :rating="review.rating" :size="14" />
          </div>
          <p class="review-comment">
            {{ review.comment }}
          </p>
          <span class="review-date">
            {{ formatDate(review.created_at) }}
          </span>

        </div>

      </div>

      <button
        v-if="hasNext"
        class="btn-load-more"
        :disabled="isLoadingMore"
        @click="loadMore"
      >
        {{ isLoadingMore ?
            t("reviews.loading") :
            t("reviews.loadMore") }}
      </button>

    </div>

  </div>

</template>

<style scoped>

/* ============================================================================
 * WRAPPER
 * Contenedor principal de la vista de reviews del usuario.
 *
 * Responsabilidades:
 * - Centrar y limitar el ancho del contenido
 * - Definir el espaciado vertical entre secciones (header, grid, botón)
 * ============================================================================ */

.my-reviews-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section-title {
  margin-bottom: 0;
}

.page-wrapper {
  min-height: 100vh;
  overflow: visible;
  color: #e5e7eb;
  padding-top: 20px;
  padding-bottom: 40px;
  background: #0b0f19;
  isolation: isolate;
  position: relative;
}

.page-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;

  background:
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.15), transparent 40%),
    radial-gradient(
      circle at 80% 30%,
      rgba(124, 58, 237, 0.18),
      transparent 45%
    ),
    radial-gradient(
      circle at 50% 80%,
      rgba(30, 64, 175, 0.18),
      transparent 50%
    ),
    linear-gradient(180deg, #0b0f19 0%, #0f172a 40%, #0b0f19 100%);

  filter: blur(90px);
  animation: backgroundDrift 45s ease-in-out infinite alternate;
}

@keyframes backgroundDrift {
  0% {
    transform: translate3d(-4%, -2%, 0) scale(1);
  }

  50% {
    transform: translate3d(3%, 2%, 0) scale(1.1);
  }

  100% {
    transform: translate3d(-2%, 4%, 0) scale(1.05);
  }
}

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
 * LOADING
 * Contenedor mostrado mientras se obtienen las reseñas del usuario.
 *
 * Responsabilidades:
 * - Mostrar una animación mientras se obtienen las reseñas
 * - Informar que el contenido aún no está disponible
 * ============================================================================ */

.my-reviews-loading {
  position: relative;
  min-height: 220px;
  padding: 64px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  overflow: hidden;
  color: white;
}

/* Elementos decorativos del contenedor de carga. */
.my-reviews-loading::before,
.my-reviews-loading::after {
  content: "";
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
}

/* Línea luminosa que recorre el contenedor. */
.my-reviews-loading::before {
  width: min(520px, 90%);
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(244, 114, 182, .9),
    rgba(168, 85, 247, .9),
    transparent
  );
  box-shadow:
    0 0 18px rgba(244, 114, 182, .45),
    0 0 38px rgba(168, 85, 247, .25);
  animation: loadingScan 1.8s ease-in-out infinite;
}

/* Desplaza la línea luminosa de arriba hacia abajo. */
@keyframes loadingScan {
  0%,
  100% {
    transform: translateY(-42px) scaleX(.72);
    opacity: .45;
  }
  50% {
    transform: translateY(42px) scaleX(1);
    opacity: 1;
  }
}

/* Halo luminoso de fondo del contenedor. */
.my-reviews-loading::after {
  width: 170px;
  height: 170px;
  background:
    radial-gradient(circle, rgba(244, 114, 182, .22), transparent 62%),
    radial-gradient(circle, rgba(124, 58, 237, .18), transparent 68%);
  filter: blur(2px);
  animation: loadingPulse 1.9s ease-in-out infinite;
}

/* Anima el pulso del halo luminoso. */
@keyframes loadingPulse {
  0%,
  100% {
    transform: scale(.88);
    opacity: .55;
  }
  50% {
    transform: scale(1.08);
    opacity: .95;
  }
}

/* ============================================================================
 * LOADING ORBIT
 * Contenedor circular que aloja el ícono de carga.
 *
 * Responsabilidades:
 * - Centrar visualmente el ícono de carga
 * - Aplicar el estilo circular con efecto luminoso
 * ============================================================================ */

.loading-orbit {
  position: relative;
  z-index: 1;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #f9a8d4;
  background:
    radial-gradient(circle at center, rgba(255, 255, 255, .1), transparent 54%),
    linear-gradient(145deg, rgba(124, 58, 237, .26), rgba(236, 72, 153, .16));
  border: 1px solid rgba(244, 114, 182, .34);
  box-shadow:
    0 0 18px rgba(244, 114, 182, .28),
    0 0 34px rgba(124, 58, 237, .22),
    inset 0 0 18px rgba(255, 255, 255, .06);
}

/* Aplica la rotación continua al ícono de carga. */
.loading-orbit svg {
  animation: loadingSpin 1s linear infinite;
  filter: drop-shadow(0 0 8px rgba(244, 114, 182, .7));
}

/* Animación de rotación del ícono. */
@keyframes loadingSpin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================================================
 * TEXTO DE CARGA
 * Texto mostrado mientras se obtienen las reseñas del usuario.
 *
 * Responsabilidades:
 * - Mostrar el mensaje de carga al usuario
 * - Aplicar una animación de brillo sobre el texto
 * ============================================================================ */

.loading-text {
  position: relative;
  z-index: 1;
  font-size: 1.05rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: .18em;
  background: linear-gradient(90deg, #ffffff, #f9a8d4, #c4b5fd, #ffffff);
  background-size: 240% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 22px rgba(244, 114, 182, .22);
  animation: loadingText 1.7s ease-in-out infinite;
}

/* Anima el desplazamiento del degradado del texto. */
@keyframes loadingText {
  0%,
  100% {
    background-position: 0% 50%;
    opacity: .82;
  }
  50% {
    background-position: 100% 50%;
    opacity: 1;
  }
}

/* ============================================================================
 * BOTÓN VOLVER
 * Botón para regresar a la vista de perfil.
 *
 * Responsabilidades:
 * - Mostrar ícono + texto en línea
 * - Aplicar estilo tipo "pill" con feedback visual en hover
 * ============================================================================ */

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(124, 58, 237, .12);
  border: 1px solid rgba(124, 58, 237, .25);
  color: rgba(255, 255, 255, .75);
  font-weight: 600;
  font-size: .85rem;
  cursor: pointer;
  transition: .2s;
}

.btn-back:hover {
  background: rgba(124, 58, 237, .2);
  color: white;
}

/* ============================================================================
 * REVIEWS GRID
 * Grilla que contiene las tarjetas de reviews.
 *
 * Responsabilidades:
 * - Definir la cantidad de columnas del listado (desktop)
 * ============================================================================ */

.reviews-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* ============================================================================
 * REVIEW CARD
 * Tarjeta individual de review dentro del grid.
 *
 * Responsabilidades:
 * - Mostrar la info de la review con estilo "glass" (blur + gradiente)
 * - Animar la entrada de la tarjeta al montarse
 * - Aplicar efectos de hover (glow + resaltado del título)
 * - Alternar colores según posición (variantes 3n+1/3n y 3n+2)
 * ============================================================================ */

.review-card {
  position: relative;
  cursor: pointer;
  padding: 20px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;

  backdrop-filter: blur(10px);
  transition: transform .25s, box-shadow .25s;

  opacity: 0;
  animation: cardEnter .5s ease forwards;
}

/* animación de entrada de cada tarjeta al renderizarse. */
@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.review-card:hover {
  box-shadow:
    0 0 12px rgba(124, 58, 237, .16),
    0 0 30px rgba(124, 58, 237, .07),
    inset 0 0 10px rgba(124, 58, 237, .03);
}

.review-card:hover .review-movie-title {
  background: rgba(124, 58, 237, .22);
  border-color: rgba(192, 132, 252, .35);
}

/* variantes de color alternado (patrón de a 3, desktop) */
.review-card:nth-child(3n+1),
.review-card:nth-child(3n) {
  background: linear-gradient(155deg, rgba(124, 58, 237, .16), rgba(30, 20, 55, .55));
  border: 1px solid rgba(167, 139, 250, .25);
}

.review-card:nth-child(3n+2) {
  background: linear-gradient(155deg, rgba(236, 72, 153, .14), rgba(45, 18, 40, .55));
  border: 1px solid rgba(244, 114, 182, .25);
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
  .review-card {
    padding: 16px;
  }

  .reviews-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* en 2 columnas el patrón alternado pasa a ser par/impar */
  .review-card:nth-child(odd) {
    background: linear-gradient(155deg, rgba(124, 58, 237, .16), rgba(30, 20, 55, .55));
    border: 1px solid rgba(167, 139, 250, .25);
  }

  .review-card:nth-child(even) {
    background: linear-gradient(155deg, rgba(236, 72, 153, .14), rgba(45, 18, 40, .55));
    border: 1px solid rgba(244, 114, 182, .25);
  }
}

</style>
