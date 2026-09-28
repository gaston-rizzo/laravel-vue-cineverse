/* ============================================================================
 * CONFIGURACIÓN: i18n
 * ============================================================================
 *
 * Configuración global de vue-i18n para soporte multi-idioma.
 *
 * Define los idiomas disponibles, el idioma por defecto, el idioma de
 * respaldo y registra los archivos de traducción utilizados por la UI.
 * ============================================================================ */
 
import { createI18n } from "vue-i18n";

// Importamos los archivos de traducción
// Cada uno contiene los textos organizados por claves
import en from "./en.json";
import es from "./es.json";

/**
 * Instancia global de vue-i18n utilizada por toda la aplicación.
 */
const i18n = createI18n({
  // legacy: false permite usar Composition API
  // (useI18n dentro de setup())
  legacy: false,

  // Idioma inicial por defecto
  // Luego lo sincronizamos dinámicamente con el router (:lang)
  locale: "es",

  // Idioma de respaldo en caso de que falte
  // alguna clave de traducción
  fallbackLocale: "en",

  // Registramos los mensajes disponibles
  // La clave debe coincidir con el :lang del router
  messages: {
    en,
    es,
  },
});

// Exportamos la instancia para usarla en app.ts
export default i18n;
