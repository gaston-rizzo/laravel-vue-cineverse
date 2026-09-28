/* ============================================================================
 * INTERFACE: cast.ts
 * ============================================================================
 *
 * Representa un miembro del reparto (actor/actriz) de una película,
 * según la respuesta del endpoint /movie/{id}/credits de TMDB.
 *
 * Contiene la información necesaria para renderizar la sección de cast
 * en la UI, incluyendo datos visuales y de contexto narrativo.
 *
 * Responsabilidades:
 * - Identificar de forma única a la persona (id)
 * - Mostrar nombre del actor/actriz
 * - Indicar el personaje interpretado
 * - Proveer imagen de perfil (opcional)
 * - Mantener orden de aparición en créditos
 *
 * Esta interface se utiliza en:
 * - MovieCast.vue (render del reparto)
 * - composables de detalle de película
 * ============================================================================ */

export interface CastMember {
  /* ID único de la persona en TMDB */
  id: number;
  /* Nombre real del actor/actriz */
  name: string;
  /* Nombre del personaje interpretado en la película */
  character: string;
  /**
   * Ruta de la imagen de perfil en TMDB.
   * Puede ser null si el actor no tiene imagen disponible.
   */
  profile_path: string | null;
  /**
   * Orden de aparición en los créditos.
   * Valores más bajos = mayor relevancia (top cast).
   */
  order: number;
}