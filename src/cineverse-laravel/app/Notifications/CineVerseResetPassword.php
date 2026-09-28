<?php

/* ============================================================================
 * NOTIFICATION: CineVerseResetPassword.php
 * ============================================================================
 *
 * Notificación de restablecimiento de password de CineVerse.
 *
 * Genera el enlace hacia la pantalla Vue/Inertia de reset y renderiza el mail
 * personalizado segun el idioma de la solicitud.
 * ============================================================================ */

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CineVerseResetPassword extends Notification
{
    use Queueable;

    /**
     * Guarda el token generado por el password broker de Laravel.
     */
    public function __construct(
        private readonly string $token
    ) {
    }

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
     * Construye el mail de restablecimiento de password.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // El idioma define asunto y plantilla del mail.
        $language = $this->language();

        // El link apunta a la pantalla Vue/Inertia, no a una vista Blade.
        $resetUrl = url(sprintf(
            '/%s/reset-password?token=%s&email=%s',
            $language,
            $this->token,
            urlencode($notifiable->getEmailForPasswordReset())
        ));

        // Se renderiza el mail propio de CineVerse.
        return (new MailMessage)
            ->subject($language === 'en' ? 'Reset your CineVerse password' : 'Restablecer contraseña | CineVerse')
            ->view("emails.reset-password-{$language}", [
                'resetUrl' => $resetUrl,
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
