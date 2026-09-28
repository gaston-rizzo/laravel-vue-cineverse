<?php

/* ============================================================================
 * MODEL: Review.php
 * ============================================================================
 *
 * Modelo de reseñas creadas por usuarios sobre películas.
 *
 * Mantiene el vínculo entre usuario, película, puntaje y comentario para las
 * pantallas de detalle de película y perfil.
 * ============================================================================ */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'user_id',
        'movie_id',
        'movie_title',
        'rating',
        'comment',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'movie_id' => 'integer',
        'rating' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relaciona la reseña con su usuario autor.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
