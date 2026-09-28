/* ============================================================================
 * INTERFACE: video.ts
 * ============================================================================
 * 
 * Representa un video asociado a una película en TMDB.
 *
 * Ejemplos de videos:
 * - Trailers
 * - Teasers
 * - Clips
 * - Featurettes
 *
 * Nota:
 * - La mayoría de los videos provienen de YouTube.
 * - El campo "key" se utiliza para construir la URL del video.
 *   Ejemplo: https://www.youtube.com/watch?v={key}
 * ============================================================================ */

export interface Video {
  // ID único del video en TMDB
  // No corresponde al ID de la película ni de la persona
  id: string;
  // Clave del video dentro de la plataforma (ej: YouTube)
  // Se usa para construir la URL o embed del video
  // Ej: https://www.youtube.com/watch?v={key}
  key: string;
  // Plataforma donde está alojado el video
  // Ejemplos: "YouTube", "Vimeo"
  site: string;
  // Tipo de contenido del video
  // Ejemplos: "Trailer", "Teaser", "Clip", "Featurette"
  type: string;
  // Indica si el video es oficial (publicado por el estudio/productora)
  official: boolean;
  // Fecha de publicación del video en formato ISO
  // Ej: "2023-07-10T12:00:00.000Z"
  published_at: string;
}