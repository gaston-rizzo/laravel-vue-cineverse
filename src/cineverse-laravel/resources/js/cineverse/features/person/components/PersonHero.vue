<script setup lang="ts">

/* ============================================================================
 * COMPONENT: PersonHero.vue
 * ============================================================================
 *
 * Componente principal del detalle de una persona. Renderiza el hero
 * (foto, nombre, fecha y lugar de nacimiento), la biografía con opción
 * "Leer más / Leer menos", el sidebar con "Known For" y la filmografía
 * completa. Controla la animación de entrada del hero y notifica al padre
 * cuando el contenido está listo (emit "ready") para ocultar el loader.
 * ============================================================================ */

import { ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";

import { useLocalizedDate } from "@/core/composables/useLocalizedDate";

import PersonKnownFor from "./PersonKnownFor.vue";
import PersonFilmography from "./PersonFilmography.vue";

import noImageAvatar from "@/assets/no-image-avatar.jpg";

import type { PersonDetail } from "../types/person-detail";

// Datos completos de la persona (TMDB) recibidos desde el padre
const props = defineProps<{
  person: PersonDetail  
}>()

// t() para traducciones dentro del componente
const { t } = useI18n()

// Formateador de fechas localizado (fecha de nacimiento)
const { formatDate } = useLocalizedDate();

// Notifica al padre que el hero está listo y puede ocultar el loader
const emit = defineEmits(["ready"])

// Base URL de imágenes de TMDB, se concatena con profile_path
const imageBase = "https://image.tmdb.org/t/p/w500"

// Controla la animación de entrada del hero (false = oculto, true = visible)
const isReady = ref(false)
const hasSignaledReady = ref(false)

// Controla si la biografía está expandida (true) o colapsada (false)
const expanded = ref(false)

// Cantidad máxima de caracteres visibles antes de truncar la biografía
const MAX_CHARS = 600

/**
 * Genera la versión resumida de la biografía, truncada a MAX_CHARS.
 * Devuelve string vacío si la persona no tiene biography.
 */
const shortBio = computed(() => {
  if (!props.person.biography) return ""
  return props.person.biography.slice(0, MAX_CHARS)
})

/**
 * Detecta si la biografía supera MAX_CHARS, para decidir si se muestra
 * el botón "Leer más". Usa optional chaining para evitar errores
 * cuando biography es null/undefined.
 */
const hasOverflow = computed(() => {
  return props.person.biography?.length > MAX_CHARS
})

// Valida si TMDB envio una ruta real de imagen de perfil.
function hasProfileImage(profilePath: string | null) {
  if (!profilePath) return false;

  // Evita usar valores basura que terminan generando una imagen rota.
  const cleanPath = profilePath.trim();

  return cleanPath !== "" && cleanPath !== "null" && cleanPath !== "undefined";
}

// URL final de la foto principal; si no hay imagen valida usa el avatar local.
const profileImage = computed(() => {
  return hasProfileImage(props.person.profile_path)
    ? imageBase + props.person.profile_path
    : noImageAvatar
})

// Avisa al padre que el hero ya puede mostrarse y activa la animacion de entrada.
function markHeroReady() {
  if (hasSignaledReady.value) return

  hasSignaledReady.value = true
  emit("ready")

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isReady.value = true
    })
  })
}

// Si la imagen remota falla al cargar, reemplaza el src por el avatar local.
function useAvatarFallback(event: Event) {
  const image = event.target as HTMLImageElement;

  // Evita un bucle de error si tambien fallara el fallback local.
  image.onerror = null;
  image.src = noImageAvatar;
  markHeroReady();
}

/**
 * Activa la animación de entrada del hero cuando llega "person" y
 * avisa al padre que puede ocultar el loader.
 *
 * nextTick() asegura que el DOM ya esté montado antes de emitir "ready".
 * El doble requestAnimationFrame espera a que el layout se estabilice
 * antes de agregar la clase "visible", evitando glitches en la transición.
 *
 * { immediate: true } es necesario porque "person" llega de forma
 * asíncrona desde vue-query, así que el watch debe correr también
 * en el primer render.
 */
watch(
  () => props.person,
  async (p) => {
    if (p) {
      isReady.value = false
      hasSignaledReady.value = false

      await nextTick()

      if (!hasProfileImage(p.profile_path)) {
        markHeroReady()
      }
    }
  },
  { immediate: true }
)

</script>

<template>

<section class="person-hero">

  <div class="hero-overlay"></div>
  
  <div class="hero-color-layer"></div>

  <Transition name="fade-up" appear>

    <div
      v-if="person"
      class="hero-container"
      :class="{ visible: isReady }"
    >

      <div class="hero-grid">

        <!-- COLUMNA IZQUIERDA -->
        <div class="hero-sidebar">

        <div class="hero-photo">
          
          <img
            :src="profileImage"
            :alt="person.name"
            @load="markHeroReady"
            @error="useAvatarFallback"
          />

        </div>

          <PersonKnownFor :credits="person.movie_credits?.cast || []" />

        </div>

        <!-- COLUMNA DERECHA -->
        <div class="hero-info">

          <h1 class="hero-name">
            {{ person.name }}
          </h1>

          <div class="hero-meta">
            <span v-if="person.birthday">
              🎂 {{ formatDate(person.birthday) }}
            </span>

            <span v-if="person.place_of_birth">
              📍 {{ person.place_of_birth }}
            </span>
          </div>

          <div class="bio-box">

            <p class="hero-bio">

              <!-- si no hay biografía -->                                                            
              <span v-if="!person.biography || person.biography.length === 0">
                {{ t('personDetail.biographyNotAvailable') }}
              </span>

              <!-- si hay biografía -->
              <template v-else>

                <span v-if="!expanded">
                  {{ shortBio }}
                  <span v-if="hasOverflow">...</span>
                </span>

                <span v-else>
                  {{ person.biography }}
                </span>

                <button
                  v-if="hasOverflow"
                  class="read-more"
                  @click="expanded = !expanded"
                >
                  {{ expanded ? 'Leer menos' : 'Leer más' }}
                </button>

              </template>

            </p>

          </div>

          <PersonFilmography :credits="person.movie_credits?.cast || []"/>

        </div>

      </div>

    </div>

</Transition>

</section>

</template>

<style>

/* ============================================================================
 * HERO SECTION
 * Contenedor principal del hero con fondo.
 *
 * Responsabilidades:
 * - Definir estructura base del hero (layout + dimensiones)
 * - Establecer fondo oscuro base consistente con la app
 * - Aislar capas internas (overlay, glow, contenido)
 * - Fondo dinámico con luces radiales y animación (::before)
 * ============================================================================ */

.person-hero {
  position: relative;
  min-height: 70vh;
  overflow: hidden;
  isolation: isolate;
  background: #0b0f19;
}

/* capa de fondo con luces radiales, blur y movimiento sutil (detrás del contenido). */
.person-hero::before {
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

.person-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: url("@/assets/noise.svg");
  opacity: 0.06;
  mix-blend-mode: overlay;
  pointer-events: none;
}

@keyframes backgroundDrift {
  0% { transform: translate3d(-4%, -2%, 0) scale(1); }
  50% { transform: translate3d(3%, 2%, 0) scale(1.1); }
  100% { transform: translate3d(-2%, 4%, 0) scale(1.05); }
}

/* ============================================================================
 * HERO OVERLAY
 * Mejora contraste del contenido sobre el fondo.
 *
 * Responsabilidades:
 * - Gradiente de arriba hacia abajo para foco en el contenido
 * ============================================================================ */

.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3),
    rgba(0, 0, 0, 0.9)
  );
}

/* ============================================================================
 * HERO COLOR LAYER
 * Fondo animado adicional, mezclado sobre el hero.
 *
 * Responsabilidades:
 * - Capas radiales animadas
 * - Mezcla con blend-mode screen y blur
 * ============================================================================ */

.hero-color-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.15), transparent 40%),
    radial-gradient(circle at 80% 30%, rgba(124, 58, 237, 0.18), transparent 45%),
    radial-gradient(circle at 50% 80%, rgba(30, 64, 175, 0.18), transparent 50%);
  mix-blend-mode: screen;
  opacity: 0.5;
  filter: blur(40px);
  animation: floatBg 20s ease-in-out infinite alternate;
}

/* mueve el fondo verticalmente con una leve escala. */
@keyframes floatBg {
  from {
    transform: translateY(0px) scale(1);
  }
  to {
    transform: translateY(-20px) scale(1.05);
  }
}

/* ============================================================================
 * HERO CONTAINER
 * Contenedor del contenido que se anima cuando llega la persona.
 *
 * Responsabilidades:
 * - Controlar la animación de entrada (opacity)
 * - Cambiar a opacity: 1 cuando isReady = true (clase .visible)
 * ============================================================================ */

.hero-container {
  opacity: 0;
  transition: opacity 0.4s ease;
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: auto;
  padding: 40px;
}

.hero-container.visible {
  opacity: 1;
}

/* ============================================================================
 * HERO GRID
 * Layout de dos columnas: sidebar + información.
 *
 * Responsabilidades:
 * - Grid de dos columnas
 * - Espacio entre sidebar e info
 * ============================================================================ */

.hero-grid {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 40px;
}

/* ============================================================================
 * HERO SIDEBAR
 * Columna izquierda.
 *
 * Responsabilidades:
 * - Contiene la foto y la sección "Known For"
 * ============================================================================ */

.hero-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ============================================================================
 * HERO PHOTO
 * Contenedor de la imagen de perfil.
 *
 * Responsabilidades:
 * - Define el tamaño del contenedor de la imagen
 * - Mantiene una proporción consistente (tipo poster)
 * - Permite que la imagen interna se adapte sin deformarse
 * ============================================================================ */

.hero-photo {
  /* ocupa todo el ancho disponible del contenedor padre */
  width: 100%;
  /* define proporción ancho / alto

     2 / 3 significa:
     por cada 2 unidades de ancho → 3 de alto

     el navegador calcula la altura automáticamente:
     height = width × (3 / 2)

     ejemplos:
     - si width = 200px → height = 300px
     - si width = 300px → height = 450px

     esto evita tener que definir height manualmente
     y mantiene todas las imágenes con la misma proporción
  */
  aspect-ratio: 2 / 3;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background-image: url("@/assets/no-image-avatar.jpg");
  background-size: cover;
  background-position: center;
}

.hero-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.9),
    0 0 30px rgba(124, 58, 237, 0.25);
  transition:
    transform 0.5s ease,
    box-shadow 0.4s ease;
}

/* ============================================================================
 * HERO INFO (GLASS UI)
 * Panel de información de la persona.
 *
 * Responsabilidades:
 * - Fondo glass con gradiente
 * - Bordes redondeados y blur
 * - Box-shadow para glow y doble borde
 * - Capa glow decorativa adicional sobre el panel (::before)
 * ============================================================================ */

.hero-info {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(20, 20, 30, 0.6),
    rgba(10, 10, 15, 0.6)
  );
  padding: 28px;
  border-radius: 20px;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(124, 58, 237, 0.35);
  box-shadow:
    0 0 0 1px rgba(255, 0, 100, 0.2),
    0 0 20px rgba(124, 58, 237, 0.25),
    0 30px 80px rgba(0, 0, 0, 0.8);
}

/* capa glow decorativa sobre el panel de información. */
.hero-info::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 20px;
  background: linear-gradient(
    120deg,
    rgba(124, 58, 237, 0.4),
    transparent,
    rgba(255, 0, 100, 0.3)
  );
  pointer-events: none;
  opacity: 0.6;
  box-shadow:
    0 40px 100px rgba(0, 0, 0, 0.9),
    0 0 60px rgba(124, 58, 237, 0.2);
}

/* ============================================================================
 * HERO NAME
 * Nombre de la persona.
 *
 * Responsabilidades:
 * - Texto degradado, fuente grande y bold
 * - Línea decorativa degradada debajo del nombre (::after)
 * ============================================================================ */

.hero-name {
  position: relative;
  margin-bottom: 24px;
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -1px;
  background: linear-gradient(
    110deg,
    #f5f3ff 0%,
    #ddd6fe 25%,
    #c4b5fd 45%,
    #a78bfa 65%,
    #7c3aed 90%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* línea decorativa degradada bajo el nombre. */
.hero-name::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 280px; /* más corta que el nombre */
  height: 2px;
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
 * HERO META
 * Fecha y lugar de nacimiento.
 *
 * Responsabilidades:
 * - Organizar los elementos en fila con separación
 * - Aplicar estilo "badge" (glass/neon) a cada item (span)
 * ============================================================================ */

.hero-meta {
  display: flex;
  gap: 16px;
  margin: 10px 0;
  color: #aaa;
}

.hero-meta span {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.85rem;
  color: #ddd;
  border: 1px solid rgba(124, 58, 237, 0.4);
  background: rgba(124, 58, 237, 0.2);
}

/* ============================================================================
 * BIO BOX
 * Caja glass que contiene la biografía.
 *
 * Responsabilidades:
 * - Fondo glass con gradiente
 * - Bordes redondeados, blur y box-shadow
 * ============================================================================ */

.bio-box {
  margin-top: 20px;
  padding: 20px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.12),
    rgba(20, 20, 30, 0.6)
  );
  border: 1px solid rgba(124, 58, 237, 0.25);
  backdrop-filter: blur(10px);
  box-shadow:
    0 0 20px rgba(124, 58, 237, 0.15),
    inset 0 0 20px rgba(255, 0, 100, 0.05);
}

/* ============================================================================
 * HERO BIO
 * Texto de la biografía.
 *
 * Responsabilidades:
 * - Controla line-height, color y opacidad del texto
 * ============================================================================ */

.hero-bio {
  line-height: 1.75;
  color: #cfcfd6;
  font-size: 0.95rem;
  max-width: 750px;
  opacity: 0.9;
}

/* ============================================================================
 * BOTÓN LEER MÁS
 *
 * Responsabilidades:
 * - Estilo de botón transparente con hover y transición
 * ============================================================================ */

.read-more {
  margin-left: 8px;
  color: #c4b5fd;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: opacity 0.2s ease;
}

/* ============================================================================
 * TRANSICIÓN DE ENTRADA (fade-up)
 * Animación del hero al montarse (ver Transition en el template).
 *
 * Responsabilidades:
 * - Animar opacidad y desplazamiento vertical con ligera escala
 * ============================================================================ */

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.97);
}

.fade-up-enter-active {
  transition: all 0.6s ease;
}

.fade-up-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .hero-container {
    padding: 20px 16px;
  }

  .hero-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .hero-sidebar {
    align-items: center;
  }

  .hero-photo {
    width: 160px;
  }

  .hero-info {
    padding: 18px;
  }

  .hero-name {
    font-size: 1.8rem;
    text-align: center;
  }

  .hero-name::after {
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
  }

  .hero-meta {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hero-meta span {
    font-size: 0.75rem;
    padding: 5px 10px;
  }

  .bio-box {
    padding: 16px;
  }

  .hero-bio {
    font-size: 0.9rem;
  }
}

</style>
