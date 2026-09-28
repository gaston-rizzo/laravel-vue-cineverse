<?php

/* ============================================================================
 * MODEL: User.php
 * ============================================================================
 *
 * Modelo principal de usuarios autenticables de CineVerse.
 *
 * Usa la estructura estándar de Laravel/Breeze para login, registro,
 * verificación de email y restablecimiento de password.
 * ============================================================================ */

namespace App\Models;

use App\Notifications\CineVerseResetPassword;
use App\Notifications\CineVerseVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'email_verified_at',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Define conversiones automáticas de atributos del usuario.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Envía el mail personalizado de restablecimiento de password.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new CineVerseResetPassword($token));
    }

    /**
     * Envía el mail personalizado de verificación de cuenta.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new CineVerseVerifyEmail());
    }
}
