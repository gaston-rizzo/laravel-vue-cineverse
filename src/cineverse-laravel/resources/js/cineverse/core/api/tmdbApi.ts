/* ============================================================================
 * API: tmdbApi.ts
 * ============================================================================
 *
 * Instancia compartida de Axios utilizada para comunicarse con la API
 * de TMDB (The Movie Database).
 * 
 * Configura la URL base y el token Bearer de autenticación necesarios
 * para realizar solicitudes HTTP a la API.
 * ============================================================================ */

import axios from "axios";

/**
 * URL base de la API de TMDB obtenida desde las variables de entorno.
 */
const baseURL = import.meta.env.VITE_TMDB_BASE_URL;

/**
 * Token Bearer utilizado para autenticar las solicitudes a la API de TMDB.
 *
 * "Bearer" indica que quien porta un token válido puede
 * acceder a los recursos autorizados por la API.
 */
const token = import.meta.env.VITE_TMDB_TOKEN;

/**
 * Instancia de Axios configurada para realizar requests a TMDB.
 *
 * Reutiliza la URL base y el token Bearer en todas las solicitudes,
 * además de establecer las cabeceras por defecto de la API.
 */
const api = axios.create({
  baseURL: baseURL, // URL base de todas las peticiones
  headers: {
    Authorization: `Bearer ${token}`, // Autenticación con Bearer Token
    "Content-Type": "application/json", // Tipo de contenido enviado y recibido
  },
});

// Exportamos la instancia para usarla en otros módulos
export default api;
