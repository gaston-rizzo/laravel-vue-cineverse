<?php

/* ============================================================================
 * NOTIFICATION: CineVerseVerifyEmail.php
 * ============================================================================
 *
 * Notificación de verificación de email de CineVerse.
 *
 * Genera un enlace firmado temporal de Laravel y renderiza el mail propio de
 * CineVerse según el idioma actual.
 * ============================================================================ */

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class CineVerseVerifyEmail extends Notification
{
    use Queueable;

    /**
     * Define los canales usados para enviar la notificacion.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Construye el mail de verificacion de cuenta.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // El idioma sale del request actual o del locale activo.
        $language = $this->language();

        // Laravel genera una URL firmada con expiración.
        // La firma permite comprobar que el enlace no fue modificado
        // y que sigue dentro del tiempo válido de verificación.
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(config('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
                'lang' => $language,
            ]
        );

        // Se usa una vista propia de CineVerse en vez del mail default.
        return (new MailMessage)
            ->subject($language === 'en' ? 'CineVerse Account Verification' : 'Verificación de cuenta | CineVerse')
            ->view("emails.verify-account-{$language}", [
                'verificationUrl' => $verificationUrl,
            ]);
    }

    /**
     * Obtiene el idioma usado por el mail.
     */
    private function language(): string
    {
        // Solo se aceptan idiomas soportados por las vistas de email.
        $language = request()->input('language', app()->getLocale());

        return in_array($language, ['en', 'es'], true) ? $language : 'en';
    }
}
