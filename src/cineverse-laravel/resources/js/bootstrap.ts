/* ============================================================================
 * BOOTSTRAP: bootstrap.ts
 * ============================================================================
 *
 * Configuración base de JavaScript para requests HTTP del frontend.
 *
 * Este archivo viene del setup de Laravel/Breeze y se carga antes de montar
 * la aplicación. Su responsabilidad es dejar Axios disponible de forma global
 * y marcar las peticiones como XMLHttpRequest para que Laravel las trate como
 * requests AJAX hechas desde Vue.
 *
 * En CineVerse, los clientes HTTP propios como webApi.ts pueden importar Axios
 * directamente, pero esta configuración global sigue siendo útil para mantener
 * el comportamiento estándar esperado por Laravel.
 *
 * No conviene eliminarlo aunque parezca pequeño: si se quita, window.axios deja
 * de existir y las requests pueden perder el header X-Requested-With. Eso puede
 * hacer que Laravel responda validaciones, errores o redirects como si fueran
 * navegación HTML tradicional en vez de requests AJAX del frontend.
 * ============================================================================ */

import axios from 'axios';

// Expone Axios en window para compatibilidad con el bootstrap estándar
// de Laravel y cualquier código que espere usar window.axios.
window.axios = axios;

// Indica a Laravel que las peticiones hechas con Axios son requests AJAX.
// Esto ayuda a que validaciones y errores respondan en formato adecuado
// para el frontend en vez de comportarse como navegación HTML tradicional.
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
