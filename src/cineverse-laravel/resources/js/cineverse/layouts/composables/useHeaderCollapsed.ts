/* ============================================================================
 * COMPOSABLE: useHeaderCollapsed.ts
 * ============================================================================
 *
 * Controla si el header está expandido o colapsado, compartiendo el estado
 * entre componentes.
 * ============================================================================ */

import { ref } from "vue";

// Estado del header, compartido entre todos los componentes que usen el composable
const isHeaderCollapsed = ref(false);

export function useHeaderCollapsed() {

  /** Alterna el estado del header entre expandido y colapsado. */
  function toggleHeader() {
    isHeaderCollapsed.value = !isHeaderCollapsed.value;
  }

  return {
    isHeaderCollapsed,
    toggleHeader,
  };
}