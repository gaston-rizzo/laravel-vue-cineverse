/* ============================================================================
 * INTERFACES: profile.ts
 * ============================================================================
 *
 * Representa el resumen del perfil del usuario autenticado: cantidad total
 * de reviews y las últimas reviews publicadas.
 * ============================================================================ */

export interface ProfileReviewItem {
  id: number;
  movie_id: number;
  movie_title: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Profile {
  reviews_count: number;
  latest_reviews: ProfileReviewItem[];
}

export interface ProfileResponse {
  success: boolean;
  code: string;
  data: Profile;
}