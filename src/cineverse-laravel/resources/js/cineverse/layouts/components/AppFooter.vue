<script setup lang="ts">

/* ============================================================================
 * COMPONENT: AppFooter.vue
 * ============================================================================
 *
 * Footer de la aplicación: branding, copyright dinámico y atribución a TMDB,
 * con efectos visuales (halo, partículas, línea luminosa) acordes a la
 * estética general de la UI.
 * ============================================================================ */

import { useI18n } from "vue-i18n";

// Traducción de textos.
const { t } = useI18n();

// Año actual para el copyright, evita hardcodearlo
const year = new Date().getFullYear();

</script>

<template>
  <footer class="app-footer">

    <!-- halo superior -->
    <div class="footer-halo"></div>

    <!-- partículas -->
    <div class="footer-particles">
      <span v-for="n in 20" :key="n"></span>
    </div>

    <!-- contenido -->
    <div class="footer-container">

      <div class="footer-brand">
        CineVerse
      </div>

      <div class="footer-info">
        © {{ year }} Gastón Rizzo
      </div>

      <div class="footer-credit">
        {{ t("footer.tmdbAttribution") }}
      </div>

    </div>

  </footer>
</template>

<style scoped>

/* ============================================================================
 * FOOTER PRINCIPAL
 * Contenedor raíz del footer.
 *
 * Responsabilidades:
 * - Aplicar el fondo con gradientes
 * - Centrar el contenido
 * - Controlar el stacking de las capas (halo, partículas, línea superior)
 * ============================================================================ */

.app-footer {
  position: relative;
  z-index: 20;
  padding: 50px 20px 60px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, rgba(124,58,237,.25), transparent 60%),
    linear-gradient(180deg, #070b14 0%, #0b0f19 50%, #05070d 100%);
  overflow: hidden;
}

/* Línea luminosa superior, tipo neón */
.app-footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;

  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(124,58,237,.6) 15%,
    rgba(229,9,20,.9) 35%,
    rgba(255,255,255,1) 50%,
    rgba(229,9,20,.9) 65%,
    rgba(124,58,237,.6) 85%,
    transparent 100%
  );

  box-shadow:
    0 0 10px rgba(229,9,20,.7),
    0 0 25px rgba(229,9,20,.5),
    0 0 50px rgba(124,58,237,.4);

  animation: footerLineGlow 4s ease-in-out infinite;
}

/* Anima el brillo y desenfoque de la línea superior. */
@keyframes footerLineGlow {
  0%, 100% { opacity: .8; filter: blur(0px); }
  50% { opacity: 1; filter: blur(1px); }
}

/* Halo difuso adicional, complementa la línea luminosa (::before) */
.app-footer::after {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 40px;

  background: radial-gradient(
    ellipse at center,
    rgba(229,9,20,.35),
    rgba(124,58,237,.25),
    transparent 70%
  );

  filter: blur(25px);
  pointer-events: none;
}

/* Halo ambiental superior, simula luz de proyector */
.footer-halo {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 300px;
  background: radial-gradient(
    ellipse at center,
    rgba(229,9,20,.35),
    rgba(124,58,237,.25),
    transparent 70%
  );
  filter: blur(60px);
  animation: haloPulse 8s ease-in-out infinite;
}

/* Anima la escala y opacidad del halo ambiental. */
@keyframes haloPulse {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: .6; }
  50% { transform: translateX(-50%) scale(1.2); opacity: .3; }
}

/* Partículas de luz flotando en el footer */
.footer-particles span {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #c084fc;
  opacity: .6;
  animation: particleMove 10s linear infinite;
}

/* Desplaza las partículas hacia arriba y controla su opacidad. */
@keyframes particleMove {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: .7; }
  80% { opacity: .7; }
  100% { transform: translateY(-50px); opacity: 0; }
}

/* Posiciones y colores manuales, simulan distribución aleatoria sin JS */
.footer-particles span:nth-child(odd) { background: #ef4444; }

.footer-particles span:nth-child(1) { left: 10%; top: 20%; }
.footer-particles span:nth-child(2) { left: 80%; top: 30%; }
.footer-particles span:nth-child(3) { left: 50%; top: 10%; }
.footer-particles span:nth-child(4) { left: 20%; top: 60%; }
.footer-particles span:nth-child(5) { left: 70%; top: 70%; }
.footer-particles span:nth-child(6) { left: 30%; top: 40%; }
.footer-particles span:nth-child(7) { left: 90%; top: 50%; }
.footer-particles span:nth-child(8) { left: 5%; top: 80%; }

/* ============================================================================
 * CONTENIDO
 * Bloque de texto del footer (marca, copyright, atribución).
 *
 * Responsabilidades:
 * - Quedar por encima de halos y partículas (z-index) para mantenerse legible
 * - Centrar y espaciar verticalmente los tres textos
 * ============================================================================ */

.footer-container {
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.footer-brand {
  position: relative;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 2px;
  color: white;
  overflow: hidden;
}

.footer-info {
  font-size: 14px;
  color: #cbd5f5;
  opacity: .85;
}

.footer-credit {
  font-size: 12px;
  color: #94a3b8;
  opacity: .7;
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 768px) {

  .app-footer {
    padding: 40px 16px 50px;
  }

  .footer-brand {
    font-size: 22px;
    letter-spacing: 1.5px;
  }

  .footer-container {
    gap: 12px;
  }

  .footer-halo {
    width: 420px;
    height: 220px;
  }
}

@media (max-width: 480px) {

  .app-footer {
    padding: 32px 14px 40px;
  }

  .footer-brand {
    font-size: 20px;
  }

  .footer-info {
    font-size: 13px;
  }

  .footer-credit {
    font-size: 11px;
  }

  .footer-halo {
    width: 320px;
    height: 180px;
  }

  .footer-particles {
    display: none;
  }
}

</style>