<script setup>

/* ============================================================================
 * VIEW: NotFoundView.vue
 * ============================================================================
 *
 * Vista mostrada cuando el usuario accede a una ruta inexistente.
 *
 * Responsabilidades:
 * - Mostrar la pantalla de error 404
 * - Traducir el contenido mediante vue-i18n
 * - Permitir regresar al inicio respetando el idioma actual
 * - Adaptar la altura según el estado del header
 * ============================================================================ */

import { useI18n } from "vue-i18n";
import { useHeaderCollapsed } from "@/layouts/composables/useHeaderCollapsed";

// destructuring de vue-i18n
// t -> función de traducción
// locale -> idioma actual activo
const { t, locale } = useI18n();

// obtiene el estado global del header (expandido o colapsado)
const { isHeaderCollapsed } = useHeaderCollapsed();

</script>

<template>

  <div class="not-found-wrapper"
  :class = "{ 'is-header-collapsed': isHeaderCollapsed }"  
  >

    <div class="not-found-bg"></div>

    <div class="not-found-content">

      <h1 class="not-found-code">
        404
      </h1>

      <h2 class="not-found-title">
        <span class="not-found-icon">🎬</span>
        {{ t("notFound.title") }}
      </h2>

      <p class="not-found-sub">
        {{ t("notFound.message") }}
      </p>

      <RouterLink
        class="btn-not-found"
        :to="`/${locale}`"
      >
        {{ t("notFound.goHome") }}
      </RouterLink>

    </div>

  </div>

</template>

<style scoped>

/* ============================================================================
 * NOT-FOUND WRAPPER
 * Contenedor principal de la vista 404.
 *
 * Responsabilidades:
 * - Centrar el contenido vertical y horizontalmente
 * - Definir el fondo oscuro y servir de base para el fondo animado
 * - Evitar overflow visual
 * ============================================================================ */

.not-found-wrapper {
  position: relative;
  min-height: 86vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0b0f19;
}

.not-found-wrapper.is-header-collapsed {
  min-height: calc(100vh - 63px); /* header colapsado */
}

/* ============================================================================
 * NOT-FOUND BACKGROUND
 * Fondo animado del 404.
 *
 * Responsabilidades:
 * - Generar profundidad visual con luces radiales
 * - Animar un movimiento suave, sin interferir con el contenido
 * ============================================================================ */

.not-found-bg {
  position: absolute;
  inset: 0;

  background:
    radial-gradient(circle at 20% 30%, rgba(255,0,100,0.25), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(0,150,255,0.25), transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(124,58,237,0.25), transparent 60%),
    #0b0f19;

  filter: blur(40px);
  animation: cinematicBg 12s ease-in-out infinite alternate;
}

/* movimiento suave del fondo (coherente con los loaders). */
@keyframes cinematicBg {
  0% {
    transform: scale(1) translate(0, 0);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2) translate(-2%, 2%);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.1) translate(2%, -2%);
    opacity: 0.7;
  }
}

/* ============================================================================
 * NOT-FOUND CONTENT
 * Contenedor del contenido principal del 404.
 *
 * Responsabilidades:
 * - Centrar texto e íconos, limitando el ancho máximo
 * - Elevar el contenido sobre el fondo animado (z-index)
 * ============================================================================ */

.not-found-content {
  position: relative;
  text-align: center;
  z-index: 2;
  max-width: 900px;
}

/* ============================================================================
 * 404 CODE
 * Número principal del error.
 *
 * Responsabilidades:
 * - Mostrar el código 404 en tamaño grande, con gradiente animado
 * - Adaptarse a distintos tamaños de pantalla (clamp)
 * ============================================================================ */

.not-found-code {
  font-size: clamp(120px, 12vw, 180px);
  font-weight: 900;
  line-height: 1;
  margin-bottom: 10px;

  background: linear-gradient(90deg, #fff, #ff0055, #7c3aed, #00d4ff, #fff);
  background-size: 300%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;

  animation: shimmer 6s linear infinite;
}

/* brillo desplazándose sobre los textos con gradiente (título y 404). */
@keyframes shimmer {
  0% { background-position: 200%; }
  100% { background-position: -200%; }
}

/* ============================================================================
 * NOT-FOUND TITLE
 * Título principal del 404.
 *
 * Responsabilidades:
 * - Mostrar el mensaje principal, con ícono y gradiente animado
 * - Centrar ícono y texto en línea
 * ============================================================================ */

.not-found-title {
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 800;
  margin-bottom: 15px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  background: linear-gradient(90deg, #fff, #ff0055, #fff);
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;

  animation: shimmer 4s linear infinite;
}

/* ============================================================================
 * NOT-FOUND ICON
 * Ícono decorativo del título.
 *
 * Responsabilidades:
 * - Aportar contexto visual, con color propio (sin heredar el gradiente)
 * ============================================================================ */

.not-found-icon {
  background: none;
  -webkit-text-fill-color: initial;
  color: #ff4d88;
}

/* ============================================================================
 * NOT-FOUND SUBTEXT
 * Texto secundario del 404.
 *
 * Responsabilidades:
 * - Explicar brevemente el error y guiar al usuario hacia el botón
 * ============================================================================ */

.not-found-sub {
  color: #9ca3af;
  font-size: 18px;
  margin-bottom: 35px;
}

/* ============================================================================
 * BOTÓN NOT-FOUND
 * Botón de acción para volver al inicio.
 *
 * Responsabilidades:
 * - Permitir la navegación de regreso a Home
 * - Aplicar escala y glow en hover
 * ============================================================================ */

.btn-not-found {
  display: inline-block;
  padding: 14px 28px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff0055, #ff3366);
  color: white;
  text-decoration: none;
  font-weight: 600;
  letter-spacing: .5px;
  transition: .3s;
}

.btn-not-found:hover {
  box-shadow: 0 0 20px rgba(255,0,100,0.5);
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {
  .not-found-wrapper {
    min-height: 70vh;
    padding: 40px 20px;
  }

  .not-found-content {
    max-width: 520px;
  }

  .not-found-sub {
    font-size: 16px;
    margin-bottom: 28px;
  }

  .btn-not-found {
    padding: 12px 22px;
    font-size: 14px;
  }

  .not-found-wrapper.is-header-collapsed {
    min-height: calc(100vh - 63px);
  }
}

@media (max-width: 480px) {
  .not-found-wrapper {
    padding: 30px 16px;
  }

  .not-found-title {
    gap: 8px;
  }

  .not-found-sub {
    font-size: 15px;
  }

  .btn-not-found {
    padding: 11px 20px;
    font-size: 13px;
  }
}

</style>