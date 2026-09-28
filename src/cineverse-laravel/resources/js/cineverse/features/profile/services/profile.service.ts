/* ============================================================================
 * SERVICE: profile.service.ts
 * ============================================================================
 *
 * Servicio para obtener el resumen del perfil del usuario autenticado
 * (estadísticas y últimas reviews).
 * ============================================================================ */

import webApi from "@/core/api/webApi";

import type { 
    ProfileResponse 
} from "../types/profile";

/**
 * Obtiene el resumen del perfil (reviews_count + latest_reviews) del
 * usuario autenticado. Requiere sesión activa (cookie).
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  const { data } = await webApi.get<ProfileResponse>("/api/profile");
  return data;
};
