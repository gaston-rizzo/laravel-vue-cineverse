<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieReviews.vue
 * ============================================================================
 *
 * Sección de reseñas de una película: estadísticas (promedio y total),
 * listado paginado de reseñas de otros usuarios, y la reseña propia del
 * usuario autenticado (con opción de crear, editar y eliminar).
 * ============================================================================ */

import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";

import {
  MessageSquareText,
  UserCircle2,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-vue-next";

import { useAuthStore } from "@/features/auth/stores/useAuthStore";

import {
  getMovieReviews,
  createReview,
  updateReview,
  deleteReview,
} from "@/features/movies/services/reviews.service";

import { useLocalizedDate } from "@/core/composables/useLocalizedDate";

import StarRating from "./StarRating.vue";

import { reviewFieldErrorMap } from "../../utils/review-error-mapper";

import type {
  Review,
  ReviewsStats
} from "../../types/movie-detail/reviews";

import "@/assets/styles/review-cards.css";

// Props: 
// id de la película para la que se piden/crean reseñas
// titulo de la pelicula
const props = defineProps<{
  movieId: number;
  movieTitle: string;
}>();

// Hook de i18n para traducir textos
const { t } = useI18n();

// Store de autenticación (usuario actual y token CSRF)
const authStore = useAuthStore();

// Formateador de fechas localizado según el idioma activo
const { formatDate } = useLocalizedDate();

// Reseñas de otros usuarios (paginadas)
const reviews = ref<Review[]>([]);

// Reseña del usuario autenticado, si ya escribió una (se muestra aparte)
const userReview = ref<Review | null>(null);

// Estadísticas agregadas (promedio y cantidad total de reseñas)
const stats = ref<ReviewsStats | null>(null);

// Estado de paginación
const currentPage = ref(1);
const hasNext = ref(false);

// Estados de carga
const isLoading = ref(false);
const isLoadingMore = ref(false);

// Error de carga del listado (clave de traducción)
const errorMessage = ref<string | null>(null);

/* ============================================================================
 * FORM (crear / editar)
 * ========================================================================== */

// Controla si el formulario de reseña está abierto y en qué modo
const isFormOpen = ref(false);
const formMode = ref<"create" | "edit">("create");

// Campos del formulario
const formRating = ref(0);
const formComment = ref("");

// Indica si se está enviando el formulario (crear o editar)
const isSubmitting = ref(false);
// Error del formulario (clave de traducción), si el submit falla
const formError = ref<string | null>(null);

// Indica si se está eliminando la review propia
const isDeleting = ref(false);
// Controla si se muestra la confirmación antes de eliminar
const confirmingDelete = ref(false);
// Error del borrado (clave de traducción), si la eliminación falla
const deleteError = ref<string | null>(null);

// Límites de validación del comentario
const COMMENT_MIN_LENGTH = 20;
const COMMENT_MAX_LENGTH = 1000;

const commentLength = computed(() => normalizedReviewCommentLength(formComment.value));

const isCommentTooShort = computed(
  () => commentLength.value > 0 && commentLength.value < COMMENT_MIN_LENGTH
);

const isCommentTooLong = computed(
  () => commentLength.value > COMMENT_MAX_LENGTH
);

// El formulario solo puede enviarse con un rating elegido y un comentario
// dentro del rango de longitud permitido
const canSubmitForm = computed(
  () =>
    formRating.value > 0 &&
    commentLength.value >= COMMENT_MIN_LENGTH &&
    commentLength.value <= COMMENT_MAX_LENGTH
);

/** Abre el formulario vacío en modo creación. */
function openCreateForm() {
  formMode.value = "create";
  formRating.value = 0;
  formComment.value = "";
  formError.value = null;
  isFormOpen.value = true;
}

/** Abre el formulario precargado con la reseña actual del usuario, en modo edición. */
function openEditForm() {
  if (!userReview.value) return;

  formMode.value = "edit";
  formRating.value = userReview.value.rating;
  formComment.value = userReview.value.comment;
  formError.value = null;
  isFormOpen.value = true;
}

/** Cierra el formulario y limpia cualquier error mostrado. */
function closeForm() {
  isFormOpen.value = false;
  formError.value = null;
}

/**
 * Envía el formulario: crea una reseña nueva o actualiza la existente
 * según "formMode". Al finalizar con éxito, recarga la primera página
 * de reseñas para reflejar el cambio.
 */
async function submitForm() {
  if (!canSubmitForm.value || isSubmitting.value) return;

  const csrfToken = authStore.csrfToken;

  if (!csrfToken) {
    formError.value = "authRequired";
    return;
  }

  isSubmitting.value = true;
  formError.value = null;

  const normalizedComment = normalizeLineBreaks(formComment.value);

  try {

    if (formMode.value === "create") {
      await createReview(
        {          
          movie_id: props.movieId,
          movie_title: props.movieTitle,
          rating: formRating.value,
          comment: normalizedComment          
        },
        csrfToken
      );
    } else {
      if (!userReview.value) return;

      await updateReview(
        userReview.value.id,
        {
          rating: formRating.value,
          comment: normalizedComment
        },
        csrfToken
      );
    }

    isFormOpen.value = false;
    await fetchReviews(1);
    
  } catch (error: any) {

    const code = error.response?.data?.code as string;

    const reviewError =
      reviewFieldErrorMap[code as keyof typeof reviewFieldErrorMap];

    formError.value = reviewError
      ? reviewError.error
      : mapGeneralReviewError(code);

  } finally {
    isSubmitting.value = false;
  }
}

/** Normaliza saltos de línea: recorta espacios y limita saltos de línea consecutivos a un máximo de 1 línea en blanco (2 saltos de línea). */
function normalizeReviewCommentTyping(value: string) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizeLineBreaks(value: string) {
  return normalizeReviewCommentTyping(value).trim();
}

function handleCommentInput(event: Event) {
  const textarea = event.target as HTMLTextAreaElement;
  const normalizedComment = normalizeReviewCommentTyping(textarea.value)
    .slice(0, COMMENT_MAX_LENGTH);

  formComment.value = normalizedComment;

  if (textarea.value !== normalizedComment) {
    textarea.value = normalizedComment;
  }
}

function normalizedReviewCommentLength(value: string) {
  return normalizeLineBreaks(value).length;
}

/* ============================================================================
 * DELETE
 * ========================================================================== */

/** Muestra la confirmación antes de borrar la reseña propia. */
function requestDelete() {
  confirmingDelete.value = true;
}

/** Cancela el flujo de borrado sin eliminar nada. */
function cancelDelete() {
  confirmingDelete.value = false;
}

/** Confirma y ejecuta el borrado de la reseña propia, luego recarga el listado. */
async function confirmDelete() {
  if (!userReview.value || isDeleting.value) return;

  const csrfToken = authStore.csrfToken;

  if (!csrfToken) {
    deleteError.value = "authRequired";
    return;
  }

  isDeleting.value = true;
  deleteError.value = null;

  try {
    await deleteReview(userReview.value.id, csrfToken);

    confirmingDelete.value = false;
    await fetchReviews(1);
  } catch (error: any) {
    const code = error.response?.data?.code as string;

    const reviewError =
      reviewFieldErrorMap[code as keyof typeof reviewFieldErrorMap];

    deleteError.value = reviewError
      ? reviewError.error
      : mapGeneralReviewError(code);
  } finally {
    isDeleting.value = false;
  }
}

/* ============================================================================
 * ERRORES GENERALES
 * ========================================================================== */

/**
 * Traduce un código de error de backend no cubierto por "reviewFieldErrorMap"
 * a una clave de traducción genérica.
 * @param code - Código de error devuelto por la API
 */
function mapGeneralReviewError(code?: string) {
  switch (code) {
    case "INVALID_JSON_BODY":
      return "invalidJson";
    case "AUTH_REQUIRED":
    case "INVALID_CSRF_TOKEN":
      return "authRequired";
    case "INTERNAL_SERVER_ERROR":
      return "internalServerError";
    default:
      return "unknownError";
  }
}

/* ============================================================================
 * FETCH
 * ========================================================================== */

/**
 * Pide una página de reseñas al backend. En la página 1 también actualiza
 * las estadísticas y la reseña propia; en páginas siguientes, concatena
 * los resultados a la lista existente.
 * @param page - Número de página a solicitar
 */
const fetchReviews = async (page: number) => {
  errorMessage.value = null;

  try {
    const response = await getMovieReviews(props.movieId, page);

    const { data } = response;

    stats.value = data.stats;
    hasNext.value = data.pagination.has_next;
    currentPage.value = data.pagination.page;

    if (page === 1) {
      userReview.value = data.user_review;
    }

    reviews.value =
      page === 1 ? data.reviews : [...reviews.value, ...data.reviews];
  } catch (error) {
    errorMessage.value = "loadError";
  }
};

/** Carga la primera página de reseñas al montar el componente. */
const loadInitial = async () => {
  isLoading.value = true;
  try {
    await fetchReviews(1);
  } finally {
    isLoading.value = false;
  }
};

/** Pide la siguiente página de reseñas (paginación "cargar más"). */
const loadMore = async () => {
  if (isLoadingMore.value || !hasNext.value) return;

  isLoadingMore.value = true;
  try {
    await fetchReviews(currentPage.value + 1);
  } finally {
    isLoadingMore.value = false;
  }
};

// Carga la primera página de reseñas al montar el componente
onMounted(loadInitial);

</script>

<template>

  <div class="movie-reviews">

    <div v-if="isLoading" class="reviews-loading movie-reviews-loading">
      {{ t("reviews.loading") }}
    </div>

    <div v-else-if="errorMessage" class="reviews-error">
      <AlertTriangle :size="28" />
      <p>{{ t(`reviews.errors.${errorMessage}`) }}</p>
    </div>

    <template v-else>

      <div v-if="stats" class="reviews">

        <div class="reviews-info">

          <div class="reviews-summary-stars">

            <span class="reviews-label">
              {{ t("reviews.averageRating") }}
            </span>
            <StarRating
              :rating="stats.average_rating"
              :size="24"
              show-value
            />
            <span class="total-count">
              {{ stats.total_reviews }} {{ t("reviews.reviews") }}
            </span>

          </div>

        </div>

        <button
          v-if="authStore.isAuthenticated && !userReview && !isFormOpen"
          class="btn-write-review"
          @click="openCreateForm"
        >
          {{ t("reviews.writeReview") }}
        </button>

      </div>

      <!-- Formulario crear / editar -->
      <div v-if="isFormOpen" class="review-form">

        <div class="review-form-header">

          <h3>
            {{ t(formMode === "create" ? 
                "reviews.newReview" : 
                "reviews.editReview") }}
          </h3>

          <div class="form-rating">

            <span class="reviews-label">
              {{ t("reviews.yourRating") }}
            </span>
            <StarRating
              :rating="formRating"
              :size="24"
              interactive
              @update:rating="formRating = $event"
            />
          </div>

          <button class="btn-close-form" @click="closeForm">
            <X :size="18" />
          </button>

        </div>

        <textarea
          v-model="formComment"
          class="review-textarea"
          rows="6"
          :maxlength="COMMENT_MAX_LENGTH"
          :placeholder="t('reviews.commentPlaceholder')"
          @input="handleCommentInput"
        />

        <div class="char-counter" :class="{ warning: isCommentTooShort || isCommentTooLong }">
          {{ commentLength }} / {{ COMMENT_MAX_LENGTH }}
          <span v-if="isCommentTooShort">
            · {{ t("reviews.errors.commentTooShort") }}
          </span>
        </div>

        <div v-if="formError" class="form-error">
            ⚠ {{ t(`reviews.errors.${formError}`) }}
        </div>

        <div class="review-form-actions">

          <button
            class="btn-cancel"
            :disabled="isSubmitting"
            @click="closeForm"
          >
            {{ t("reviews.cancel") }}
          </button>
          <button
            class="btn-submit"
            :disabled="!canSubmitForm || isSubmitting"
            @click="submitForm"
          >            
            {{ isSubmitting ? 
                t("reviews.saving") : 
                t("reviews.save") }}
          </button>

        </div>

      </div>

      <div v-if="userReview && !isFormOpen" class="review-card user-review">

        <span class="badge badge-large">
          {{ t("reviews.yourReview") }}
        </span>

        <div class="review-header">

          <div class="user-info">
            <UserCircle2 :size="26" />                  
            <span class="username">
              {{ authStore.user?.username }}
            </span>
          </div>
          <StarRating :rating="userReview.rating" :size="30" />

        </div>

        <p class="review-comment">
          {{ userReview.comment }}
        </p>
        <span class="review-date">
          {{ formatDate(userReview.created_at) }}
        </span>

        <div v-if="deleteError" class="form-error">
        ⚠ {{ t(`reviews.errors.${deleteError}`) }}
        </div>

        <div class="user-review-actions">

          <button
            class="btn-icon-action edit"
            :disabled="isFormOpen"
            @click="openEditForm"
          >
            <Pencil :size="15" />
            {{ t("reviews.edit") }}
          </button>

          <button
            v-if="!confirmingDelete"
            class="btn-icon-action delete"
            @click="requestDelete"
          >
            <Trash2 :size="15" />
            {{ t("reviews.delete") }}
          </button>

          <template v-else>
            
            <button
              class="btn-icon-action delete confirm"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              {{ isDeleting ? 
                t("reviews.deleting") : 
                t("reviews.confirmDelete") }}
            </button>

            <button
              class="btn-icon-action"
              :disabled="isDeleting"
              @click="cancelDelete"
            >
              Cancelar
            </button>

          </template>

        </div>

      </div>

      <div v-if="reviews.length === 0 && !userReview" class="no-reviews">
        <MessageSquareText :size="32" />
        <p>
            {{ t("reviews.noReviews") }}
        </p>
      </div>

      <div v-else class="reviews-grid">
        <div
          v-for="(review, index) in reviews"
          :key="review.id"
          class="review-card"
          :class="index % 2 === 0 ? 'variant-violet' : 'variant-pink'"
          :style="{ animationDelay: `${(index % 10) * 0.05}s` }"
        >
          <div class="review-header">
            <div class="user-info">
              <UserCircle2 :size="22" />
              <span class="username">{{ review.username }}</span>
            </div>
            <StarRating :rating="review.rating" :size="14" />
          </div>
          <p class="review-comment">{{ review.comment }}</p>
          <span class="review-date">{{ formatDate(review.created_at) }}</span>
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

    </template>

  </div>

</template>

<style scoped>

/* ============================================================================
 * MOVIE REVIEWS
 * Contenedor raíz de la sección de reseñas.
 *
 * Responsabilidades:
 * - Apilar en columna las distintas subsecciones con espaciado uniforme
 * ============================================================================ */

.movie-reviews {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ==========================================================================
 * MOVIE REVIEWS LOADING
 *
 * Responsabilidades:
 * - Mantener el alto del panel mientras se cargan las reseñas
 * - Centrar el texto de carga dentro de la pestaña
 * ========================================================================== */

.movie-reviews-loading {
  min-height: 154px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
}

/* ==========================================================================
 * TOTAL COUNT
 *
 * Responsabilidades:
 * - Mostrar la cantidad total de reseñas junto al promedio
 * - Mantener una jerarquía visual secundaria respecto al puntaje
 * ========================================================================== */

.total-count {
  font-size: .9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, .6);
}

/* ==========================================================================
 * REVIEW CARD (base)
 *
 * Responsabilidades:
 * - Definir el layout interno en columna con separación uniforme
 * - Animar la entrada de la tarjeta (fade + slide-up)
 * - Elevarse levemente en hover
 * ========================================================================== */

.review-card {
  position: relative;
  padding: 20px;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  backdrop-filter: blur(10px);
  transition: transform .25s, box-shadow .25s;

  opacity: 0;
  animation: cardEnter .5s ease forwards;
}

.review-card:hover {
  transform: translateY(-4px);
}

/* aparece con un fundido y sube levemente desde abajo. */
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

/* ==========================================================================
 * COLOR VARIANTS (alternadas)
 *
 * Responsabilidades:
 * - Alternar el color de cada tarjeta según si le toca violeta o rosa
 * - Reforzar el color y el glow al hacer hover
 * ========================================================================== */

.variant-violet {
  background: linear-gradient(
    155deg,
    rgba(124, 58, 237, .16),
    rgba(30, 20, 55, .55)
  );
  border: 1px solid rgba(167, 139, 250, .25);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, .35),
    0 0 24px rgba(124, 58, 237, .10);
}

.variant-violet:hover {
  border-color: rgba(167, 139, 250, .45);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, .4),
    0 0 30px rgba(124, 58, 237, .22);
}

.variant-pink {
  background: linear-gradient(
    155deg,
    rgba(236, 72, 153, .14),
    rgba(45, 18, 40, .55)
  );
  border: 1px solid rgba(244, 114, 182, .25);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, .35),
    0 0 24px rgba(236, 72, 153, .10);
}

.variant-pink:hover {
  border-color: rgba(244, 114, 182, .45);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, .4),
    0 0 30px rgba(236, 72, 153, .22);
}

/* ==========================================================================
 * USER REVIEW (destacada)
 *
 * Responsabilidades:
 * - Diferenciarse visualmente del resto (acento dorado)
 * - Mostrar el badge "Tu reseña" sobresaliendo del borde superior
 * ========================================================================== */

.user-review {
  background: linear-gradient(
    155deg,
    rgba(250, 204, 21, .10),
    rgba(45, 35, 10, .5)
  );
  border: 1px solid rgba(250, 204, 21, .3);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, .35),
    0 0 24px rgba(250, 204, 21, .12);
}

.badge {
  position: absolute;
  top: -18px;
  right: 16px;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;

  background: linear-gradient(120deg, #facc15, #f59e0b);
  color: #1c1408;
  box-shadow: 0 4px 14px rgba(250, 204, 21, 0.35);
}

/* ==========================================================================
 * REVIEW HEADER / USER INFO / USERNAME
 *
 * Responsabilidades:
 * - Header: alinear usuario y estrellas en fila, separados a los extremos
 * - User info: agrupar ícono + nombre de usuario
 * - Username: fondo degradado violeta a rosa con bordes redondeados
 * ========================================================================== */

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, .85);
}

.user-info svg {
  color: #c084fc;
}

.username {
    font-family:"Manrope",sans-serif;
    font-size:.95rem;
    font-weight:700;
    color:#fff;
    padding:3px 10px;
    border-radius:999px;

    background:linear-gradient(
        90deg,
        rgba(124,58,237,.28),
        rgba(236,72,153,.22)
    );
    border:1px solid rgba(192,132,252,.28);
}

/* ==========================================================================
 * WRITE REVIEW BUTTON
 * Botón que abre el formulario para escribir una reseña nueva.
 *
 * Responsabilidades:
 * - Fondo degradado violeta a rosa con bordes redondeados
 * - Mostrar un resplandor violeta al pasar el mouse
 * ========================================================================== */

.btn-write-review {
  margin-right: 24px;
  padding: 12px 24px;
  border-radius: 999px;

  background: linear-gradient(120deg, rgba(124,58,237,.25), rgba(236,72,153,.2));
  border: 1px solid rgba(167, 139, 250, .35);
  color: white;

  font-weight: 700;
  font-size: .9rem;
  cursor: pointer;
  transition: .25s;
  white-space: nowrap;
}

.btn-write-review:hover {
  box-shadow: 0 0 24px rgba(124, 58, 237, .3);
}

/* ==========================================================================
 * REVIEW FORM
 *
 * Responsabilidades:
 * - Fondo con degradado violeta oscuro y los campos ordenados
 *   uno debajo del otro
 * - Header: título con estilo "label" + acción de cerrar
 * - Textarea: campo de comentario con scrollbar personalizado
 * ========================================================================== */

.review-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
  border-radius: 18px;

  background: linear-gradient(155deg, rgba(124,58,237,.14), rgba(20,16,40,.6));
  border: 1px solid rgba(167, 139, 250, .3);
}

.review-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-form-header h3{
    font-size: .82rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 3px;

    background: linear-gradient(
        180deg,
        #f2f2f2 0%,
        #cfcfcf 45%,
        #8d8d8d 100%
    );

    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;

    opacity: .82;

    text-shadow:
        0 1px 0 rgba(255,255,255,.08),
        0 0 10px rgba(255,255,255,.08);
}

/* Línea decorativa debajo del título del formulario */
.review-form-header h3::after{
    content:"";
    display:block;
    width:100%;
    height:2px;
}

/* ==========================================================================
 * BTN CLOSE FORM
 * Botón para cerrar el formulario (ícono X).
 *
 * Responsabilidades:
 * - Sin fondo ni borde, solo el ícono
 * - Aclararse al pasar el mouse
 * ========================================================================== */

.btn-close-form {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, .6);
  cursor: pointer;
  transition: .2s;
}

.btn-close-form:hover {
  color: white;
}

/* ==========================================================================
 * REVIEW TEXTAREA
 * Campo de texto donde el usuario escribe el comentario de la reseña.
 *
 * Responsabilidades:
 * - Fondo degradado sutil y tamaño fijo (sin permitir redimensionar)
 * - Scrollbar propio con gradiente rosa a violeta, para Firefox y Chrome
 * - Resaltar el borde con un resplandor violeta al enfocarse
 * ========================================================================== */

.review-textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  resize: none;
  overflow-y: auto;

  font-family: "Source Sans 3", sans-serif;
  font-size: .97rem;
  line-height: 1.8;
  font-weight: 400;
  letter-spacing: .15px;

  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.05),
      rgba(124,58,237,.08)
  );
  border: 1px solid rgba(124, 58, 237, .25);
  color: white;

  scrollbar-width: thin;
  scrollbar-color: #8b5cf6 rgba(255,255,255,.04);
}

/* Ancho de la barra de scroll personalizada (Chrome/Edge) */
.review-textarea::-webkit-scrollbar{
    width:10px;
}

/* Fondo de la barra de scroll completa (detrás de la parte que se arrastra) */
.review-textarea::-webkit-scrollbar-track{
    background:rgba(255,255,255,.03);
    border-radius:999px;
}

/* Gradiente rosa a violeta de la parte que se arrastra en la barra de scroll */
.review-textarea::-webkit-scrollbar-thumb{
    border-radius:999px;

    background:linear-gradient(
        180deg,
        #ff4da6,
        #9b5cff
    );

    border:2px solid rgba(20,16,40,.9);
}

/* Aclara la parte que se arrastra en la barra de scroll al pasar el mouse */
.review-textarea::-webkit-scrollbar-thumb:hover{
    background:linear-gradient(
        180deg,
        #ff73ba,
        #b56cff
    );
}

.review-textarea:focus {
  outline: none;
  border-color: #6d28d9;
  box-shadow: 0 0 0 1px rgba(109, 40, 217, .6), 0 0 20px rgba(109, 40, 217, .24);
}

/* ==========================================================================
 * FORM ERROR
 * Mensaje de error del formulario (validación o fallo al guardar).
 *
 * Responsabilidades:
 * - Fondo y borde rojos para señalar el error
 * ========================================================================== */

.form-error {
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(239, 68, 68, .12);
  border: 1px solid rgba(239, 68, 68, .45);
  color: #fecaca;
  font-size: .85rem;
  font-weight: 600;
}

/* ==========================================================================
 * REVIEW FORM ACTIONS
 * Fila con los botones cancelar/guardar del formulario.
 *
 * Responsabilidades:
 * - Alinear los botones a la derecha, uno al lado del otro
 * ========================================================================== */

.review-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ==========================================================================
 * BTN CANCEL
 * Botón para cancelar y cerrar el formulario sin guardar cambios.
 *
 * Responsabilidades:
 * - Sin relleno de color, solo un borde sutil
 * - Aclararse levemente al pasar el mouse
 * ========================================================================== */

.btn-cancel {
  border: 1px solid rgba(255, 255, 255, .12);
  background: transparent;
  color: rgba(255, 255, 255, .75);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, .05);
}

/* ==========================================================================
 * BTN SUBMIT
 * Botón para guardar la reseña (crear o editar).
 *
 * Responsabilidades:
 * - Fondo degradado violeta a rosa, sin borde
 * - Mostrar un resplandor violeta al pasar el mouse (si no está deshabilitado)
 * ========================================================================== */

.btn-submit {
  border: none;
  background: linear-gradient(120deg, #7c3aed, #ec4899);
  color: white;
}

.btn-submit:not(:disabled):hover {
  box-shadow: 0 0 20px rgba(124, 58, 237, .35);
}

/* ==========================================================================
 * BTN CANCEL / BTN SUBMIT (BASE)
 * Estilos compartidos por los dos botones del formulario.
 *
 * Responsabilidades:
 * - Mismo tamaño, tipografía y bordes redondeados para ambos botones
 * - Verse apagado y bloquear el cursor cuando están deshabilitados
 * ========================================================================== */

.btn-submit:disabled,
.btn-cancel:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.btn-cancel,
.btn-submit {
  padding: 10px 22px;
  border-radius: 999px;
  font-weight: 700;
  font-size: .85rem;
  cursor: pointer;
  transition: .2s;
}

/* ==========================================================================
 * USER REVIEW ACTIONS
 *
 * Responsabilidades:
 * - Poner los botones uno al lado del otro, con espacio parejo entre ellos
 * - Darle otro color a los botones de eliminar/confirmar, para que se note
 *   que es una acción irreversible
 * ========================================================================== */

.user-review-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.btn-icon-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: .8rem;
  font-weight: 600;
  cursor: pointer;
  transition: .2s;

  border: 1px solid rgba(255, 255, 255, .1);
  background: rgba(255, 255, 255, .03);
  color: rgba(255, 255, 255, .75);
}

.btn-icon-action:hover {
  background: rgba(255, 255, 255, .08);
  color: white;
}

.btn-icon-action.delete {
  border-color: rgba(239, 68, 68, .3);
  color: #fca5a5;
}

.btn-icon-action.delete:hover {
  background: rgba(239, 68, 68, .12);
}

.btn-icon-action.delete.confirm {
  background: rgba(239, 68, 68, .18);
  border-color: rgba(239, 68, 68, .5);
  color: #fecaca;
}

.btn-icon-action:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.char-counter {
  align-self: flex-end;
  font-size: .8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, .45);
}

.char-counter.warning {
  color: #fca5a5;
}

/* ==========================================================================
 * REVIEWS (promedio, estrellas, contador y botón de escribir)
 *
 * Responsabilidades:
 * - Poner label + estrellas + contador en una sola fila (sin wrap)
 * - Empujar el botón "Escribir una reseña" al extremo derecho de esa
 *   misma fila mediante justify-content: space-between
 * ========================================================================== */

.reviews {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;  
  flex-wrap: wrap;
  min-height: 48px;
}

.reviews-info {
  display: flex;
  align-items: center;
}

.reviews-summary-stars {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: nowrap;
}

.reviews-summary-stars :deep(.star-rating) {
  margin-left: 6px;
}

.reviews-label {
    font-size: .82rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2.5px;

    background: linear-gradient(
        90deg,
        #ffd7ff 0%,
        #ff67c4 45%,
        #b86cff 100%
    );

    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;

    text-shadow: 0 0 12px rgba(255,80,180,.35);

    position: relative;
}

/* Línea decorativa degradada debajo del label */
.reviews-label::after{
    content:"";
    display:block;
    width:100%;
    height:2px;
    margin-top:5px;

    background:linear-gradient(
        90deg,
        #ff4da6,
        #9b5cff,
        transparent
    );

    border-radius:999px;
}

.total-count {
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #c084fc;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(192, 132, 252, 0.2);
}

/* ==========================================================================
 * FORM RATING
 * Agrupa "Tu puntuación" + estrellas dentro del header del formulario.
 *
 * Responsabilidades:
 * - Poner label y estrellas en una sola fila (antes faltaba esta regla,
 *   por eso quedaban apiladas verticalmente)
 * - Quedar ubicado entre el título y el botón de cerrar, gracias al
 *   justify-content: space-between del padre (.review-form-header)
 * ========================================================================== */

.form-rating {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ==========================================================================
 * RESPONSIVE
 * ========================================================================== */

@media (max-width: 768px) {
  .reviews {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .btn-write-review {
    width: 100%;
    text-align: center;
  }
}

</style>
