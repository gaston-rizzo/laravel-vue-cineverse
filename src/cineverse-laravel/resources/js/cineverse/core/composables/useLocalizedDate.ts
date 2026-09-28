/* ============================================================================
 * COMPOSABLE: useLocalizedDate.ts
 * ============================================================================
 *
 * Composable para formatear fechas según el idioma activo de la aplicación.
 *
 * Utiliza vue-i18n para obtener el idioma actual e Intl.DateTimeFormat
 * para mostrar las fechas con el formato correspondiente a ese idioma.
 * 
 * Ejemplo:
 * 
 * - Español → 25/12/2026
 * - Inglés → 12/25/2026
 * ============================================================================ */

import { computed } from "vue";
import { useI18n } from "vue-i18n";

// Relación entre los idiomas de la aplicación y los locales utilizados por Intl.
const LOCALE_MAP: Record<string, string> = {
  es: "es-AR",
  en: "en-US"
};

/**
 * Devuelve una función para formatear fechas según el idioma activo.
 */
export function useLocalizedDate() {

  const { locale } = useI18n();

  // Formateador reactivo que se actualiza cuando cambia el idioma.
  const dateFormatter = computed(() => {

    const resolvedLocale = LOCALE_MAP[locale.value] ?? "es-AR";

    return new Intl.DateTimeFormat(resolvedLocale, {
      day: "numeric",
      month: "numeric",
      year: "numeric"
    });

  });

  /**
   * Formatea una fecha utilizando el locale actual.
   */
  function formatDate(dateStr: string) {
    const date = new Date(dateStr.replace(" ", "T"));
    return dateFormatter.value.format(date);
  }

  return { formatDate };
}