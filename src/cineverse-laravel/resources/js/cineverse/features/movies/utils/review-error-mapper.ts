/* ============================================================================
 * MAP: reviewFieldErrorMap
 * ============================================================================
 *
 * Mapea los códigos de error que puede devolver el backend al crear/editar
 * una review, con la clave de traducción (i18n) correspondiente para
 * mostrar el mensaje adecuado en la UI.
 * ============================================================================ */

export const reviewFieldErrorMap = {

    // El id de la película enviado no es válido o no existe
    INVALID_MOVIE_ID: {        
        error: "invalidMovieID"
    },

    // El rating enviado está fuera del rango permitido
    INVALID_RATING: {        
        error: "invalidRating"
    },

    // El comentario es obligatorio y no fue enviado
    COMMENT_REQUIRED: {        
        error: "commentRequired"
    },

    // El comentario no cumple con la longitud mínima
    COMMENT_TOO_SHORT: {        
        error: "commentTooShort"
    },

    // El comentario supera la longitud máxima permitida
    COMMENT_TOO_LONG: {
        error: "commentTooLong"
    },

    // El usuario ya dejó una review para esta película
    REVIEW_ALREADY_EXISTS: {        
        error: "reviewAlreadyExists"
    },

    // No se encontró la review solicitada (ej: al editar/eliminar)
    REVIEW_NOT_FOUND: {        
        error: "reviewNotFound"
    },

    // El usuario no es el dueño de la review (no puede editarla/eliminarla)
    NOT_REVIEW_OWNER: {        
        error: "notReviewOwner"
    }

} as const;