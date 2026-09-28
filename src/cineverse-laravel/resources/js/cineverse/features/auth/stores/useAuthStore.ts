/* ============================================================================
 * STORE: useAuthStore.ts
 * ============================================================================
 *
 * Store encargado de mantener el estado de autenticación del usuario.
 *
 * Conserva el usuario autenticado, el token CSRF y permite reconstruir
 * la sesión consultando al backend cuando la aplicación se inicia.
 * 
 * IMPORTANTE: 
 * La comunicación con el backend se realiza mediante auth.service.ts.
 * La única excepción es initialize(), que consulta al backend para
 * reconstruir el estado de autenticación al iniciar la aplicación.
 * Esta función pertenece al store porque actualiza el estado de autenticación,
 * mientras que auth.service.ts únicamente envía peticiones HTTP y
 * devuelve las respuestas del backend.
 * ============================================================================ */

import { defineStore } from "pinia";
import { ref, computed } from "vue";

import { 
  getAuthenticatedUser 
} from "@/features/auth/services/auth.service";

import type {
  AuthUser
} from "../types/auth";

/**
 * Store de autenticación de la aplicación.
 *
 * Mantiene el estado reactivo del usuario autenticado y expone las
 * acciones necesarias para administrar la sesión.
 */
export const useAuthStore = defineStore("auth", () => {

  const user = ref<AuthUser | null>(null);
  const csrfToken = ref<string | null>(null);
  const isAuthenticated = computed(() => user.value !== null);

  // Indica si initialize() ya terminó de correr (haya encontrado sesión
  // o no). El router guard lo usa para saber si puede confiar en
  // isAuthenticated todavía, o si tiene que esperar a que resuelva.
  const isInitialized = ref(false);

  // Promesa compartida de initialize(): si varias partes de la app la
  // llaman al mismo tiempo (ej. guard + app.ts), todas esperan la
  // misma request en vez de disparar el fetch dos veces.
  let initializePromise: Promise<void> | null = null;

  const setUser = (newUser: AuthUser) => {
    user.value = newUser;
  };

  const setCsrfToken = (token: string) => {
    csrfToken.value = token;
  };

  const clear = () => {
    user.value = null;
    csrfToken.value = null;
  };

  const initialize = () => {
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {

      try {
        const response = await getAuthenticatedUser();

        setUser(response.user);
        setCsrfToken(response.csrf_token);
      } catch {
        clear();
      } finally {
        isInitialized.value = true;
      }
      
    })();

    return initializePromise;
  };

  return {
    user,
    csrfToken,
    isAuthenticated,
    isInitialized,
    setUser,
    setCsrfToken,
    clear,
    initialize
  };
});
