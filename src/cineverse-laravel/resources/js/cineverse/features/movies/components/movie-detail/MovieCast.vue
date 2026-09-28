<script setup lang="ts">

/* ============================================================================
 * COMPONENT: MovieCast.vue
 * ============================================================================
 *
 * Muestra el reparto principal de una película en una fila horizontal
 * scrolleable, con imagen, nombre y personaje de cada actor. Navega al
 * detalle de la persona al hacer click, preservando el idioma actual.
 * ============================================================================ */

import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { Users } from "lucide-vue-next";

import noImageAvatar from "@/assets/no-image-avatar.jpg";

import type { CastMember } from "../../types/movie-detail/cast";

// Props: lista de actores (ya limitada desde el composable del padre)
const props = defineProps<{
  cast: CastMember[];
}>();

// Navegación y lectura de params de la ruta actual (para preservar el idioma)
const router = useRouter();
const route = useRoute();

// Hook de i18n para traducir textos (ej: mensaje de reparto no disponible)
const { t } = useI18n();

// Base URL de imágenes de TMDB (w185 = perfiles de 185px de ancho)
const imageBase = "https://image.tmdb.org/t/p/w185";

// Valida si TMDB envio una ruta real de imagen de perfil.
function hasProfileImage(profilePath: string | null) {
  if (!profilePath) return false;

  // Evita usar valores basura que terminan generando una imagen rota.
  const cleanPath = profilePath.trim();

  return cleanPath !== "" && cleanPath !== "null" && cleanPath !== "undefined";
}

// URL final de cada actor; si no hay imagen valida usa el avatar local.
function actorImage(actor: CastMember) {
  return hasProfileImage(actor.profile_path)
    ? imageBase + actor.profile_path
    : noImageAvatar;
}

// Si la imagen remota falla al cargar, reemplaza el src por el avatar local.
function useAvatarFallback(event: Event) {
  const image = event.target as HTMLImageElement;

  // Evita un bucle de error si tambien fallara el fallback local.
  image.onerror = null;
  image.src = noImageAvatar;
}

/**
 * Navega al detalle de la persona seleccionada, preservando el idioma
 * actual de la URL. Se ejecuta al hacer click en una tarjeta.
 * @param id - Id de la persona
 */
function goToPerson(id: number) {
  router.push({
    name: "Person",
    params: {
      lang: route.params.lang,
      id,
    },
  });
}

</script>

<template>
  <section class="movie-cast">

    <div class="cast-row"
         :class="{ 'no-scroll': cast.length < 6 }"
    >

      <div 
        v-for="actor in cast" 
        :key="actor.id"
        class="cast-card"
        @click="goToPerson(actor.id)"
      >

        <img
          :src="actorImage(actor)"
          :alt="actor.name"
          @error="useAvatarFallback"
        />

        <div class="cast-info">
          <span class="actor-name">
            {{ actor.name }}
          </span>

          <span class="character-name">
            {{ actor.character }}
          </span>
        </div>
      </div>

      <div v-if="cast.length === 0" class="cast-empty">
        <Users :size="32" />
        <p>{{ t('cast.notAvailable') }}</p>
      </div>

    </div>
  </section>
</template>

<style scoped>

/* ============================================================================
 * MOVIE CAST CONTAINER
 * Contenedor principal de la sección de reparto.
 *
 * Responsabilidades:
 * - Servir de wrapper para la fila scrolleable de actores
 * ============================================================================ */

.movie-cast {
  max-width: none;
  margin: 0;
  padding: 0;
}

/* ============================================================================
 * CAST ROW
 * Fila horizontal scrolleable de actores.
 *
 * Responsabilidades:
 * - Mostrar las cards en fila con scroll lateral cuando hay overflow
 * - Compensar el padding lateral con márgenes negativos, para que el
 *   glow/hover del primer y último actor no se corte contra el borde
 * - Personalizar la scrollbar horizontal
 * ============================================================================ */

.cast-row {
  position: relative;
  display: flex;
  gap: 16px;
  overflow-x: auto;
  overflow-y: visible;
  scrollbar-width: thin;
  scrollbar-color: #8b5cf6 rgba(8, 12, 24, 0.85);

  padding-left: 16px;
  margin-left: -16px;
  padding-right: 16px;
  margin-right: -16px;
  padding-bottom: 10px;
  padding-top: 12px;
}

/* Variante sin scroll cuando hay pocos actores para completar la fila. */
.no-scroll {
  overflow: hidden;
  justify-content: flex-start;
}

/* ============================================================================
 * SCROLLBAR
 * Personalización de la barra de desplazamiento horizontal.
 *
 * Responsabilidades:
 * - Definir la apariencia de la scrollbar en navegadores WebKit
 * - Mantener una estética consistente con el diseño glass de la aplicación
 * ============================================================================ */

/* Define el tamaño de la scrollbar horizontal. */
.cast-row::-webkit-scrollbar {
  height: 10px;
}

/* Define el fondo por donde se desplaza la scrollbar. */
.cast-row::-webkit-scrollbar-track {
  background: rgba(8, 12, 24, 0.85);
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.16);
}

/* Define la apariencia del control desplazable de la scrollbar. */
.cast-row::-webkit-scrollbar-thumb {
  background: #8b5cf6;
  border: 2px solid rgba(8, 12, 24, 0.95);
  border-radius: 999px;
}

/* Cambia el gradiente de la scrollbar al pasar el cursor. */
.cast-row::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #a855f7, #ec4899);
}

/* Oscurece el gradiente mientras se arrastra el control. */
.cast-row::-webkit-scrollbar-thumb:active {
  background: linear-gradient(90deg, #9333ea, #db2777);
}

/* ============================================================================
 * CAST EMPTY
 * Estilos del contenedor, ícono y texto cuando no hay reparto disponible.
 *
 * Responsabilidades:
 * - Centrar el contenido dentro del área disponible
 * - Definir la apariencia visual del ícono y del mensaje
 * - Mantener una jerarquía visual discreta mediante tamaños y opacidades
 * ============================================================================ */

.cast-empty {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 50px 20px;
  color: rgba(255, 255, 255, .5);
}

.cast-empty svg {
  width: 42px;
  height: 42px;
  color: rgba(255, 255, 255, .28);
  stroke-width: 1.8;
}

.cast-empty p {
  margin: 0;
  font-size: .95rem;
  font-weight: 500;
  letter-spacing: .03em;
  color: rgba(255, 255, 255, .58);
}

/* ============================================================================
 * CAST CARD
 * Tarjeta individual de actor.
 *
 * Responsabilidades:
 * - Mantener tamaño fijo dentro del scroll horizontal
 * - Animar su entrada y aplicar estilo glass con borde degradado
 * - Elevarse y brillar en hover
 * ============================================================================ */

.cast-card {
  position: relative;
  z-index: 1;
  min-width: 140px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(6px);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  overflow: hidden;
  opacity: 0;
  animation: castCardEnter 0.4s ease forwards;
}

/* entra levemente desde la derecha, acorde a la lectura izq→der de la fila. */
@keyframes castCardEnter {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* borde degradado, recortado con mask para no tapar el contenido. */
.cast-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 1.1px;

  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25),
    rgba(124, 58, 237, 0.6),
    rgba(255, 255, 255, 0.08)
  );

  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;

  pointer-events: none;
}

/* glow superior, oculto por defecto y activado en hover. */
.cast-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 14px;

  background: radial-gradient(
    circle at 50% 0%,
    rgba(124, 58, 237, 0.25),
    transparent 70%
  );

  opacity: 0;
  transition: opacity 0.25s ease;
}

.cast-card:hover {
  transform: translateY(-1px) scale(1.01);
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.55),
    0 0 10px rgba(124, 58, 237, 0.45),
    0 0 18px rgba(124, 58, 237, 0.25);
}

/* ============================================================================
 * CAST IMAGE
 * Foto de perfil del actor.
 *
 * Responsabilidades:
 * - Mantener proporción tipo poster sin deformar
 * - Aumentar saturación/contraste al hacer hover sobre la card
 * ============================================================================ */

.cast-card img {
  width: 100%;
  aspect-ratio: 2 / 3;
  height: 200px;
  object-fit: cover;
  border-radius: 12px 12px 8px 8px;
  filter: grayscale(10%) brightness(0.9);
}

.cast-card:hover img {
  filter: saturate(1.15) brightness(1.05) contrast(1.05);
}

/* ============================================================================
 * CAST INFO
 * Nombre del actor y del personaje, debajo de la foto.
 *
 * Responsabilidades:
 * - Organizar nombre y personaje en columna, con spacing chico entre ellos
 * - Diferenciar jerarquía: nombre con mayor contraste, personaje más sutil
 * ============================================================================ */

.cast-info {
  margin-top: 10px;
  padding: 0 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.actor-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: #f5f5f5;
}

.character-name {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.6);
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .movie-cast {
    padding: 16px;
  }

  .cast-row {
    gap: 12px;
    padding-left: 12px;
    margin-left: -12px;
    padding-right: 12px;
    margin-right: -12px;
  }

  .cast-card {
    min-width: 120px;
  }

  .cast-card:hover {
    transform: none;
    box-shadow: none;
  }

  .cast-card img {
    height: 170px;
  }

  .actor-name {
    font-size: 0.85rem;
  }

  .character-name {
    font-size: 0.72rem;
  }
}

@media (max-width: 480px) {
  .cast-row {
    gap: 10px;
    padding-left: 10px;
    margin-left: -10px;
    padding-right: 10px;
    margin-right: -10px;
    scroll-snap-type: x mandatory;
  }

  .cast-card {
    min-width: 100px;
    scroll-snap-align: start;
  }

  .cast-card img {
    height: 145px;
  }

  .actor-name {
    font-size: 0.78rem;
  }

  .character-name {
    font-size: 0.68rem;
  }
}

</style>
