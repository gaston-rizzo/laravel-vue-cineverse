<script setup lang="ts">

/* ============================================================================
 * VIEW: ProfileView.vue
 * ============================================================================
 *
 * Página de perfil del usuario autenticado: datos básicos, estadísticas
 * (cantidad de reviews) y listado de las últimas reviews publicadas.
 * ============================================================================ */

import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import {
  MessageSquareText,
  AlertTriangle,
  CalendarDays,
  Mail,
  Sparkles
} from "lucide-vue-next";

import { useAuthStore } from "@/features/auth/stores/useAuthStore";

import { getProfile } from "../services/profile.service";

import { useLocalizedDate } from "@/core/composables/useLocalizedDate";

import StarRating from "@/features/movies/components/movie-detail/StarRating.vue";

import type { ProfileReviewItem } from "../types/profile";

import "@/assets/styles/review-cards.css";

const { t, locale } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const { formatDate } = useLocalizedDate();

// Cantidad total de reviews publicadas por el usuario
const reviewsCount = ref(0);
// Últimas reviews del usuario, mostradas en la sección "Últimas reseñas"
const latestReviews = ref<ProfileReviewItem[]>([]);

// Indica si se está cargando el resumen del perfil
const isLoading = ref(true);
// Error al cargar el perfil (clave de traducción), si la carga falla
const errorMessage = ref<string | null>(null);

/** Carga el resumen del perfil. */
async function loadProfile() {

  isLoading.value = true;
  errorMessage.value = null;

  try {

    const response = await getProfile();

    reviewsCount.value = response.data.reviews_count;
    latestReviews.value = response.data.latest_reviews;

  } catch (error: any) {

    const code = error.response?.data?.code as string;

    if (code === "AUTH_REQUIRED") {
        // Se limpia la sesión
        authStore.clear();
        // Se redirige al login
        router.push({
          name: "Login",
          params: { lang: locale.value }
        });
        return;
      }

    errorMessage.value = "loadError";

  } finally {
    isLoading.value = false;
  }
}

/** Navega al detalle de la película de la review, preservando el idioma. */
function goToMovie(movieId: number) {
  router.push({
    name: "MovieDetail",
    params: {
      lang: locale.value,
      id: movieId,
    },
  });
}

/** Navega al listado completo de reviews del usuario, preservando el idioma. */
function goToAllReviews() {
  if (reviewsCount.value === 0) return; 
  router.push({ 
    name: "MyReviews", 
    params: { 
      lang: locale.value 
    } });
}

// Carga el resumen del perfil al montar el componente
onMounted(loadProfile);

</script>

<template>

  <div class="page-wrapper">

    <div class="profile-view">

      <div class="profile-header enter-block">

        <div class="header-glow"></div>

        <div class="avatar">
          <span class="avatar-ring"></span>
          {{ authStore.user?.username?.substring(0, 2).toUpperCase() }}
        </div>

        <div class="user-info">
          <h1 class="username">
            {{ authStore.user?.username }}
          </h1>

          <span class="email">
            <Mail :size="14" />
            {{ authStore.user?.email }}
          </span>

          <span class="joined" v-if="authStore.user?.created_at">
            <CalendarDays :size="14" />
            {{ t("profile.memberSince") }} {{ formatDate(authStore.user.created_at) }}
          </span>
        </div>

      </div>

        <div v-if="isLoading" class="profile-loading">
            {{ t("reviews.loading") }}
        </div>

        <div v-else-if="errorMessage" class="profile-error enter-block">
            <AlertTriangle :size="28" />
            <p>{{ t(`reviews.errors.${errorMessage}`) }}</p>
        </div>

        <template v-else>

            <div class="stats-grid enter-block delay-1">

                <div
                  :class="['stat-card', { clickable: reviewsCount > 0 }]"
                  @click="goToAllReviews"
              >
              
                  <span class="stat-value">
                    {{ reviewsCount }}
                  </span>
                  <span class="stat-label">
                    {{ t("profile.reviewsCount") }}
                  </span>
                </div>                

            </div>

            <div class="latest-reviews enter-block delay-2">

              <h2 class="section-title">
                <Sparkles :size="22" />
                {{ t("profile.latestReviews") }}
              </h2>

              <div v-if="latestReviews.length === 0" class="no-reviews">
                <MessageSquareText :size="32" />
                <p>{{ t("profile.noReviewsYet") }}</p>
              </div>

              <div v-else class="reviews-grid">

              <div
                v-for="review in latestReviews"
                :key="review.id"
                class="review-card"
                @click="goToMovie(review.movie_id)"
              >

                  <div class="review-card-header">
                    <span class="review-movie-title">
                      {{ review.movie_title }}
                    </span>
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

            </div>

        </template>

    </div>

  </div>

</template>

<style scoped>

/* ============================================================================
 * PROFILE VIEW
 * Contenedor raíz de la página de perfil.
 *
 * Responsabilidades:
 * - Limitar el ancho máximo y centrar el contenido
 * - Espaciar verticalmente las secciones (header, stats, últimas reviews)
 * ============================================================================ */

.profile-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 24px 60px;
  display: flex;
  flex-direction: column;
  gap: 36px;
}

/* ============================================================================
 * HEADER
 * Encabezado del perfil (avatar, nombre, email, fecha de alta).
 *
 * Responsabilidades:
 * - Mostrar los datos básicos del usuario autenticado
 * - Aplicar glows decorativos y el anillo pulsante del avatar
 * ============================================================================ */

.profile-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 28px;
  border-radius: 20px;
  overflow: hidden;

  background: linear-gradient(
    155deg,
    rgba(124, 58, 237, .14),
    rgba(20, 16, 40, .6)
  );
  border: 1px solid rgba(167, 139, 250, .25);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, .35),
    0 0 24px rgba(124, 58, 237, .1);
}

/* fondo con dos resplandores radiales en las esquinas superiores. */
.header-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;

  background:
    radial-gradient(circle at top left, rgba(229, 9, 20, .16), transparent 45%),
    radial-gradient(circle at top right, rgba(124, 58, 237, .2), transparent 50%);
}

.avatar {
  position: relative;
  width: 74px;
  height: 74px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.4rem;
  color: white;
  z-index: 1;

  background: linear-gradient(135deg, #ff2d55, #8b1cff);
  box-shadow: 0 0 22px rgba(229, 9, 20, .45);
}

/* Anillo pulsante alrededor del avatar */
.avatar-ring {
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1px solid rgba(196, 132, 252, .5);
  animation: avatarPulse 2.5s ease-in-out infinite;
  pointer-events: none;
}

/* pulso expansivo alrededor del avatar, se desvanece al crecer. */
@keyframes avatarPulse {
  0%, 100% {
    transform: scale(1);
    opacity: .6;
  }
  50% {
    transform: scale(1.15);
    opacity: 0;
  }
}

.user-info {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.username {
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
}

.email,
.joined {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: .8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, .75);

  background: rgba(124, 58, 237, .12);
  border: 1px solid rgba(124, 58, 237, .25);
}

.email svg,
.joined svg {
  color: #c084fc;
  flex-shrink: 0;
}

/* ============================================================================
 * LOADING / ERROR
 * Estados de carga y error al obtener el resumen del perfil.
 *
 * Responsabilidades:
 * - Mostrar un mensaje simple mientras se carga el perfil
 * - Mostrar un banner de error si la carga falla
 * ============================================================================ */

.profile-loading {
  padding: 40px;
  text-align: center;
  color: rgba(255, 255, 255, .6);
  font-weight: 500;
}

.profile-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
  border-radius: 18px;
  text-align: center;

  background: linear-gradient(155deg, rgba(239, 68, 68, .1), rgba(45, 18, 18, .4));
  border: 1px solid rgba(239, 68, 68, .3);
}

.profile-error svg {
  color: #fca5a5;
}

.profile-error p {
  font-size: .9rem;
  font-weight: 600;
  color: #fecaca;
}

/* ============================================================================
 * STATS
 * Grilla de estadísticas del usuario (cantidad de reseñas).
 *
 * Responsabilidades:
 * - Mostrar la cantidad de reviews en una card clickeable
 * - Dar feedback visual en hover (glow + text-shadow)
 * ============================================================================ */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 18px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 22px;
  border-radius: 16px;
  text-align: center;
  background: linear-gradient(120deg, rgba(124, 58, 237, .16), rgba(236, 72, 153, .1));
  border: 1px solid rgba(255, 255, 255, .08);
}

/* Habilita el cursor y las transiciones solo cuando la card es clickeable. */
.stat-card.clickable {
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
}

/* Aplica un borde y resplandor al pasar el cursor sobre una card interactiva. */
.stat-card.clickable:hover {
  border-color: rgba(167, 139, 250, .3);
  box-shadow: 0 0 12px rgba(124, 58, 237, .12);
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  /* Configura la animación del brillo del contador al cambiar de estado. */
  transition: transform .28s, text-shadow .28s;
}

/* Añade un brillo al contador de reseñas durante el hover. */
.stat-card.clickable:hover .stat-value {
  text-shadow: 0 0 16px rgba(255,255,255,.25);
}

/* Añade un brillo sutil al contador durante el hover. */
.stat-card.clickable:hover .stat-value {
  text-shadow: 0 0 16px rgba(255,255,255,.25);
}

.stat-label {
  font-size: .8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, .55);
  text-transform: uppercase;
  letter-spacing: .5px;
}

/* ============================================================================
 * LATEST REVIEWS
 * Grilla con las últimas reseñas del usuario.
 *
 * Responsabilidades:
 * - Mostrar cada review como card clickeable, con color alternado
 * - Mantener el layout coherente entre breakpoints
 * ============================================================================ */

.review-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 16px;
  /* Permite que el elemento se reduzca correctamente dentro de un contenedor flex. */
  min-width: 0;   
  transition: transform .25s, box-shadow .25s;
}

.review-card:hover {
  box-shadow:
    0 0 12px rgba(124, 58, 237, .16),
    0 0 30px rgba(124, 58, 237, .07),
    inset 0 0 10px rgba(124, 58, 237, .03);
}

.review-card:hover .review-movie-title {
  background: rgba(124,58,237,.22);
  border-color: rgba(192,132,252,.35);
}

.latest-reviews .reviews-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* Aplica el estilo violeta a la primera y tercera card de cada grupo de tres. */
.latest-reviews .review-card:nth-child(3n+1),
.latest-reviews .review-card:nth-child(3n) {
  background: linear-gradient(155deg, rgba(124, 58, 237, .16), rgba(30, 20, 55, .55));
  border: 1px solid rgba(167, 139, 250, .25);
}

/* Aplica el estilo rosa a la segunda card de cada grupo de tres. */
.latest-reviews .review-card:nth-child(3n+2) {
  background: linear-gradient(155deg, rgba(236, 72, 153, .14), rgba(45, 18, 40, .55));
  border: 1px solid rgba(244, 114, 182, .25);
}

/* ============================================================================
 * ENTRANCE ANIMATION
 * Animación de entrada de las secciones del perfil.
 *
 * Responsabilidades:
 * - Aplicar fade + slide al montar cada bloque
 * - Escalonar la aparición mediante delays (.delay-1, .delay-2)
 * ============================================================================ */

.enter-block {
  opacity: 0;
  transform: translateY(20px);
  animation: profileEnter .5s cubic-bezier(.22, .61, .36, 1) forwards;
}

/* aparece con un fundido y sube levemente desde su posición. */
@keyframes profileEnter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Retrasa levemente la animación de entrada del segundo bloque. */
.enter-block.delay-1 {
  animation-delay: .1s;
}

/* Retrasa un poco más la animación de entrada del tercer bloque. */
.enter-block.delay-2 {
  animation-delay: .2s;
}

/* ============================================================================
 * PAGE WRAPPER
 * Fondo animado consistente con el resto de la app (mismo estilo que
 * FavoritesView / MoviesView).
 *
 * Responsabilidades:
 * - Ocupar toda la altura de la pantalla
 * - Aplicar el fondo animado con gradientes radiales y textura de ruido
 * ============================================================================ */

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

/* fondo con gradientes radiales que se mueven lentamente en loop. */
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

/* desplaza y escala el fondo animado, generando sensación de movimiento. */
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

/* textura de ruido sutil superpuesta sobre el fondo. */
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
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
  .latest-reviews .reviews-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .latest-reviews .review-card:nth-child(odd) {
    background: linear-gradient(155deg, rgba(124, 58, 237, .16), rgba(30, 20, 55, .55));
    border: 1px solid rgba(167, 139, 250, .25);
  }

  .latest-reviews .review-card:nth-child(even) {
    background: linear-gradient(155deg, rgba(236, 72, 153, .14), rgba(45, 18, 40, .55));
    border: 1px solid rgba(244, 114, 182, .25);
  }
}

@media (max-width: 768px) {
  .latest-reviews .reviews-grid {
    grid-template-columns: 1fr;
  }

  .latest-reviews .review-card {
    background: linear-gradient(155deg, rgba(124, 58, 237, .16), rgba(30, 20, 55, .55));
    border: 1px solid rgba(167, 139, 250, .25);
  }
}

</style>