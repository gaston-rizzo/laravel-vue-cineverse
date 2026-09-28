<script setup lang="ts">

/* ============================================================================
 * COMPONENT: BrowserWarningBanner.vue
 * ============================================================================
 *
 * Banner descartable que avisa a usuarios de Firefox que la experiencia
 * puede ser más lenta en ese navegador (ver useBrowserWarning). Se oculta
 * permanentemente al cerrarlo, vía localStorage.
 * ============================================================================ */

import { useI18n } from "vue-i18n";
import { useBrowserWarning } from "@/shared/composables/useBrowserWarning";

const { t } = useI18n();
const { showWarning, dismiss } = useBrowserWarning();

</script>

<template>

  <Transition name="banner-fade">

    <div v-if="showWarning" class="browser-warning">

      <span class="browser-warning-text">
        {{ t("common.browserWarning") }}
      </span>

      <button
        class="browser-warning-close"
        :aria-label="t('common.close')"
        @click="dismiss"
      >
        ✕
      </button>
      
    </div>

  </Transition>

</template>

<style scoped>

/* ============================================================================
 * BROWSER WARNING
 * Banner angosto de aviso, ubicado sobre el header.
 *
 * Responsabilidades:
 * - Mostrar el mensaje centrado con el botón de cierre a la derecha
 * - Animar entrada/salida vía <Transition name="banner-fade">
 * ============================================================================ */

.browser-warning {
  position: relative;
  z-index: 2001;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 16px;

  background: rgba(124, 58, 237, 0.15);
  border-bottom: 1px solid rgba(124, 58, 237, 0.3);
  color: #e9d5ff;
  font-size: 0.85rem;
  text-align: center;
}

.browser-warning-close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.browser-warning-close:hover {
  opacity: 1;
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

</style>