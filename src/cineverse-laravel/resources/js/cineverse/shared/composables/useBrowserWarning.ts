/* ============================================================================
 * COMPOSABLE: useBrowserWarning.ts
 * ============================================================================
 *
 * Detecta si el usuario está en Firefox y expone el estado de visibilidad
 * de un banner de aviso. La preferencia de "descartado" se persiste en
 * localStorage para no volver a mostrarlo en visitas futuras.
 * ============================================================================ */

import { ref, onMounted } from "vue";

const STORAGE_KEY = "browserWarningDismissed";

export function useBrowserWarning() {

  const showWarning = ref(false);

  onMounted(() => {

    // Se fija si el user agent dice "Firefox". El usuario puede modificar este
    // valor manualmente (devtools o extensiones) y hacerse pasar por otro
    // navegador, pero como esto es solo un aviso informativo (no controla
    // acceso a nada importante) no hace falta una detección más precisa
    const isFirefox = navigator.userAgent.includes("Firefox");

    // Si no es Firefox, ni siquiera hace falta chequear localStorage
    if (!isFirefox) return;

    // localStorage: API del navegador para guardar datos clave-valor que
    // persisten entre sesiones (sobreviven a recargar o cerrar la pestaña).
    // Solo guarda strings, por eso se compara con "true" en vez de un boolean.
    // getItem devuelve null si la clave todavía no fue seteada.
    const dismissed = localStorage.getItem(STORAGE_KEY) === "true";

    // Solo se muestra si es Firefox Y el usuario no lo cerró antes
    showWarning.value = isFirefox && !dismissed;

  });

  /** Oculta el banner y recuerda la elección para no volver a mostrarlo. */
  function dismiss() {
    showWarning.value = false;
    localStorage.setItem(STORAGE_KEY, "true");
  }

  return { showWarning, dismiss };
}