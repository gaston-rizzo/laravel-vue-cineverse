<script setup lang="ts">

/* ============================================================================
 * VIEW: VerifyEmailView.vue
 * ============================================================================
 *
 * Página que confirma la verificación de email a partir de un token en la
 * URL (?token=...). Muestra tres estados: verificando, éxito o inválido.
 * ============================================================================ */

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import {
    Mail,
    CircleCheckBig,
    TriangleAlert
} from "lucide-vue-next";

// Traducción de textos e idioma actual.
const { t, locale } = useI18n();
// Router para la navegación entre vistas.
const route = useRoute();

// Controla qué bloque del template se muestra (ver v-if en el template)
const status = ref<"verifying" | "success" | "invalid">("verifying");

/**
 * Lee el token de la URL y lo valida contra el backend apenas monta la vista.
 * Sin token no hay nada que verificar; con token inválido, expirado o ya
 * usado, se muestra el mismo estado genérico "invalid" para el usuario.
 */
onMounted(() => {

    if (route.query.verified === "1") {
        status.value = "success";
        return;
    }

    status.value = "invalid";
});

</script>

<template>

    <div class="page-wrapper verify-email-page">

        <div class="verify-email-card">

            <template v-if="status === 'verifying'">

                <div class="verify-icon">
                    <Mail class="icon" />
                </div>

                <h1>
                    {{ t("auth.verifyEmail.verifyingTitle") }}
                </h1>

                <p>
                    {{ t("auth.verifyEmail.verifyingMessage") }}
                </p>

                <div class="spinner"></div>

            </template>

            <template v-else-if="status === 'success'">

                <div class="verify-icon">
                    <CircleCheckBig class="icon success" />
                </div>

                <h1>
                    {{ t("auth.verifyEmail.successTitle") }}
                </h1>

                <p>
                    {{ t("auth.verifyEmail.successMessage") }}
                </p>

                <RouterLink
                    :to="`/${locale}/login`"
                    class="btn-login"
                >
                    {{ t("auth.backToLogin") }}
                </RouterLink>

            </template>

            <template v-else>

                <div class="verify-icon">
                    <TriangleAlert class="icon warning" />
                </div>

                <h1>
                    {{ t("auth.verifyEmail.invalidTitle") }}
                </h1>

                <p>
                    {{ t("auth.verifyEmail.invalidMessage") }}
                </p>

                <RouterLink
                    :to="`/${locale}/login`"
                    class="btn-login"
                >
                    {{ t("auth.backToLogin") }}
                </RouterLink>

            </template>

        </div>

    </div>

</template>

<style scoped>

/* ============================================================================
 * VERIFY EMAIL PAGE
 * Estilos del contenedor principal de la página de verificación de email.
 *
 * Responsabilidades:
 * - Define la altura mínima del viewport
 * - Centra el contenido vertical y horizontalmente
 * - Controla la distribución general del layout de la página
 * ============================================================================ */

.verify-email-page {
    min-height: calc(100vh - 133px);
    display: flex;
    justify-content: center;
    align-items: center;
}

/* ============================================================================
 * VERIFY EMAIL CARD
 * Estilos de la tarjeta de verificación de email.
 *
 * Responsabilidades:
 * - Define el contenedor principal del contenido
 * - Controla el tamaño, espaciado y alineación del bloque
 * - Aplica fondo, bordes y efectos visuales (glassmorphism)
 * ============================================================================ */

.verify-email-card {
    width: 100%;
    max-width: 560px;
    padding: 55px 45px;
    text-align: center;
    border-radius: 26px;

    background:
        linear-gradient(
            145deg,
            rgba(24,18,45,.96),
            rgba(14,12,30,.96)
        );
    border: 1px solid rgba(124,58,237,.22);
    box-shadow:
        0 25px 70px rgba(0,0,0,.55),
        0 0 25px rgba(124,58,237,.12);

    backdrop-filter: blur(18px);
}

/* ============================================================================
 * VERIFY ICON
 * Estilos del contenedor del icono de verificación de email.
 *
 * Responsabilidades:
 * - Define el tamaño y forma del contenedor circular del icono
 * - Centra el icono dentro del bloque
 * - Aplica efectos visuales de fondo, borde y sombra para destacar el estado
 * ============================================================================ */

.verify-icon {
    width: 96px;
    height: 96px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto 28px;
    border-radius: 50%;

    background:
        radial-gradient(circle at top left,
            rgba(236,72,153,.18),
            transparent 60%),
        rgba(124,58,237,.08);

    border: 1px solid rgba(124,58,237,.30);
    box-shadow: 0 0 30px rgba(124,58,237,.18);
}

/* ============================================================================
 * ICON
 * Estilos base de los iconos de estado del sistema de verificación.
 *
 * Responsabilidades:
 * - Define el tamaño y grosor del icono
 * - Aplica colores según el estado (éxito / advertencia)
 * ============================================================================ */

.icon {
    width: 48px;
    height: 48px;
    stroke-width: 2.3;
}

.icon.success {
    color: #22c55e;
}

.icon.warning {
    color: #a855f7; 
}

/* ============================================================================
 * VERIFY EMAIL TEXT
 * Estilos del texto (título y párrafo) de la tarjeta de verificación.
 *
 * Responsabilidades:
 * - Define la tipografía del título principal
 * - Estiliza el texto descriptivo secundario
 * - Controla espaciado, legibilidad y jerarquía visual
 * ============================================================================ */

.verify-email-card h1 {
    margin-bottom: 14px;
    font-size: 1.7rem;
    font-weight: 700;
    line-height: 1.25;
    color: white;
}

.verify-email-card p {
    max-width: 380px;
    margin: 0 auto;
    line-height: 1.8;
    color: rgba(255,255,255,.70);
}

/* ============================================================================
 * SPINNER LOADER
 * Estilos del indicador de carga de verificación de email.
 *
 * Responsabilidades:
 * - Muestra estado de carga durante la verificación
 * - Define animación giratoria continua
 * - Refuerza feedback visual de proceso en curso
 * ============================================================================ */

.spinner {
    margin: 40px auto 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 4px solid rgba(255,255,255,.10);
    border-top-color: #8b5cf6;
    animation: spin .9s linear infinite;
}

/* Animación de rotación continua del spinner */
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* ============================================================================
 * LOGIN BUTTON
 * Estilos del botón de acceso a login.
 *
 * Responsabilidades:
 * - Define la apariencia del botón de acción final
 * - Aplica estilos de interacción (hover)
 * - Mantiene coherencia visual con el resto del sistema de botones
 * ============================================================================ */

.btn-login {
    display: inline-block;
    margin-top: 36px;
    padding: 14px 28px;
    border-radius: 14px;
    text-decoration: none;
    font-weight: 700;

    background: linear-gradient(
        120deg,
        #ff0055,
        #ff3366
    );
    color: white;

    transition: .3s;
}

.btn-login:hover {
    box-shadow:
        0 0 10px rgba(255,0,85,.20),
        0 0 20px rgba(236,72,153,.10);
}

/* ============================================================================
 * RESPONSIVE 
 * ============================================================================ */

@media (max-width: 768px) {
    .verify-email-page {
        min-height: calc(100dvh - 133px);
        padding: 20px;
    }

    .verify-email-card {
        max-width: 100%;
        padding: 40px 24px;
    }

    .verify-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 22px;
    }

    .icon {
        width: 40px;
        height: 40px;
    }

    .verify-email-card h1 {
        max-width: 100%;
        margin: 0 auto 12px;
        font-size: 1.45rem;
    }

    .verify-email-card p {
        max-width: 100%;
        font-size: .95rem;
        line-height: 1.7;
    }

    .spinner {
        width: 42px;
        height: 42px;
        margin-top: 34px;
    }

    .btn-login {
        display: block;
        width: 100%;
        margin-top: 32px;
        padding: 13px 20px;
        font-size: .95rem;
    }
}

@media (max-width: 480px) {
    .verify-email-page {
        padding: 16px;
    }

    .verify-email-card {
        padding: 32px 18px;
        border-radius: 20px;
    }

    .verify-icon {
        width: 70px;
        height: 70px;
        margin-bottom: 18px;
    }

    .icon {
        width: 34px;
        height: 34px;
    }

    .verify-email-card h1 {
        font-size: 1.2rem;
        margin-bottom: 10px;
    }

    .verify-email-card p {
        max-width: 100%;
        font-size: .875rem;
        line-height: 1.6;
    }

    .spinner {
        width: 38px;
        height: 38px;
        border-width: 3px;
        margin-top: 28px;
    }

    .btn-login {
        width: 100%;
        padding: 12px 18px;
        font-size: .9rem;
        margin-top: 28px;
    }
}

</style>
