<script setup lang="ts">

/* ============================================================================
 * View: ForgotPasswordView.vue
 * ============================================================================
 *
 * Formulario de recuperación de contraseña. Valida el email en el frontend
 * y le pide al backend que envíe el correo de reseteo. Al tener éxito,
 * muestra un mensaje de confirmación en vez del formulario.
 * ============================================================================ */

import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import {
    forgotPassword
} from "../services/auth.service";

import {
    validateEmail,
    EMAIL_MAX_LENGTH
} from "../validation/login.validation";

import type { 
    ForgotPasswordErrors 
} from "../types/auth";

const { t, locale } = useI18n();

// Campo del formulario, en texto plano (la validación vive en login.validation.ts)
const email = ref("");

// True luego del primer intento de submit; habilita la validación en tiempo real
// en el watcher de abajo, para no marcar error mientras el usuario todavía
// está escribiendo por primera vez
const submitted = ref(false);

// Alterna entre el formulario y la pantalla de confirmación de envío
const success = ref(false);

// Evita doble submit mientras la request al backend está en curso
const isSubmitting = ref(false);

// Mensaje de error general (banner), para códigos de backend que no
// corresponden al campo de email (ej: error interno del servidor)
const formError = ref("");

// Error de validación del email, se muestra como tooltip junto al input
const errors = ref<ForgotPasswordErrors>({});

/**
 * Pide al backend que envíe el email de reseteo de contraseña. Valida el
 * email en el frontend antes de llamar al backend; si la request tiene
 * éxito, muestra la pantalla de confirmación en vez de redirigir. No se
 * distingue si el email existe o no en el sistema: eso lo decide el
 * backend y, por seguridad, no se traduce a un error de campo específico.
 */
const sendResetEmail = async () => {

    if (isSubmitting.value) {
        return;
    }

    submitted.value = true;

    errors.value = {};
    formError.value = "";

    const error = validateEmail(email.value);

    if (error) {
        errors.value.email = error;
        return;
    }

    isSubmitting.value = true;

    try {

        await forgotPassword({
            email: email.value,
            language: locale.value as "es" | "en"
        });

        success.value = true;

    }
    catch (error: any) {
        const status = error.response?.status;

        if (status >= 500) {
            formError.value = "internalServerError";
            return;
        }

        const laravelErrors = error.response?.data?.errors;

        if (laravelErrors?.email) {
            errors.value.email = validateEmail(email.value) ?? "invalidEmail";
            return;
        }

        formError.value = "unknownError";
    }
    finally {
        isSubmitting.value = false;
    }
};

/**
 * Traduce una clave de error de validación a su mensaje correspondiente.
 * Las claves genéricas (required, invalidEmail) viven en un namespace de
 * i18n distinto al resto, por eso se resuelven aparte y el resto cae al
 * namespace por defecto de "auth.register.validation".
 */
function getValidationMessage(key: string) {

    switch (key) {

        case "required":
            return t("auth.validation.required");

        case "invalidEmail":
            return t("auth.validation.invalidEmail");

        default:
            return t(`auth.register.validation.${key}`);
    }
}

/**
 * Valida el email en vivo, solo después del primer submit (ver "submitted"),
 * para no mostrar el error mientras el usuario todavía está escribiendo
 * por primera vez.
 */
watch(email, (value) => {

    if (!submitted.value) {
        return;
    }

    const error = validateEmail(value);

    if (error) {
        errors.value.email = error;
    } else {
        delete errors.value.email;
    }

});

</script>

<template>

    <div class="page-wrapper forgot-password-page">

        <div class="forgot-password-card">

            <Transition name="fade">
                <div
                    v-if="formError"
                    class="form-error-banner"
                >
                    ⚠ {{ t(`auth.errors.${formError}`) }}
                </div>
            </Transition>

            <div class="forgot-password-card-bg"></div>

            <div class="forgot-password-content">

                <div
                    v-if="!success"
                    class="forgot-password-header"
                >
                    <h1>
                        {{ t("auth.forgotPassword.title") }}
                    </h1>
                    <p>
                        {{ t("auth.forgotPassword.subtitle") }}
                    </p>
                </div>

                <form
                    v-if="!success"
                    novalidate
                    autocomplete="off"
                    class="forgot-password-form"
                    @submit.prevent="sendResetEmail"
                >

                    <div class="field">

                        <label>
                            {{ t("auth.forgotPassword.email") }}
                        </label>

                        <div class="input-wrapper">

                            <input
                                v-model="email"
                                type="email"
                                :maxlength="EMAIL_MAX_LENGTH"
                                autocomplete="email"
                                :class="{ invalid: errors.email }"
                            />
                            <div
                                v-if="errors.email"
                                class="error-tooltip"
                            >
                                <span>⚠</span>
                                {{ getValidationMessage(errors.email) }}
                            </div>

                        </div>

                    </div>

                    <button
                        type="submit"
                        class="btn-send"
                        :disabled="isSubmitting"
                    >
                        {{ t("auth.forgotPassword.submit") }}
                    </button>

                    <div class="forgot-password-footer">

                        <RouterLink
                            :to="isSubmitting ? '' : `/${locale}/login`"
                            class="footer-action"
                            :class="{ disabled: isSubmitting }"
                        >
                            {{ t("auth.backToLogin") }}
                        </RouterLink>

                    </div>

                </form>

                <div
                    v-else
                    class="reset-success"
                >

                    <div class="success-icon">
                        ✉️
                    </div>                
                    <h2>
                        {{ t("auth.success.passwordResetEmailSentTitle") }}
                    </h2>
                    <p>
                        {{ t("auth.success.passwordResetEmailSentMessage") }}
                    </p>
                    <RouterLink
                        :to="`/${locale}/login`"
                        class="btn-login"
                    >
                        {{ t("auth.backToLogin") }}
                    </RouterLink>

                </div>

            </div>

        </div>

    </div>

</template>

<style scoped>

/* ============================================================================
 * FORGOT PASSWORD PAGE
 * Estilos de la página de recuperación de contraseña.
 *
 * Responsabilidades:
 * - Define la altura mínima de la vista completa
 * - Asegura que el layout ocupe todo el viewport disponible
 * ============================================================================ */

.forgot-password-page {
    min-height:calc(100vh - 133px);
}

/* ============================================================================
 * FORGOT PASSWORD CONTENT
 * Contenedor principal del contenido del formulario
 *
 * Responsabilidades:
 * - Define el contexto de posicionamiento del contenido
 * - Controla la capa visual por encima del fondo mediante z-index
 * - Mantiene la herencia del borde redondeado del contenedor padre
 * ============================================================================ */

.forgot-password-card {
    position:relative;
    width:100%;
    max-width:560px;
    margin:80px auto;
    border-radius:24px;
    overflow:visible;
}

/* ============================================================================
 * FORGOT PASSWORD CARD BACKGROUND
 * Estilos del fondo de la tarjeta del formulario.
 *
 * Responsabilidades:
 * - Define el fondo principal con gradientes y bordes
 * - Añade efectos de profundidad mediante sombras y blur 
 * ============================================================================ */

.forgot-password-card-bg {
    position:absolute;
    inset:0;
    border-radius:inherit;
    overflow:hidden;

    background:
        linear-gradient(
            145deg,
            rgba(24,18,45,.95),
            rgba(15,12,35,.92),
            rgba(10,10,25,.95)
        );
    border:1px solid rgba(124,58,237,.28);
    box-shadow:
        0 30px 80px rgba(0,0,0,.65),
        0 0 18px rgba(124,58,237,.14),
        inset 0 0 0 1px rgba(255,255,255,.04);

    backdrop-filter:blur(24px);
}

/* Resplandor decorativo superior/inferior sobre el fondo de la tarjeta */
.forgot-password-card-bg::before {
    content:"";
    position:absolute;
    inset:0;
    background:
        radial-gradient(circle at top left,
            rgba(236,72,153,.18),
            transparent 40%),
        radial-gradient(circle at bottom right,
            rgba(124,58,237,.18),
            transparent 45%);
}

/* Borde interior sutil para reforzar el efecto glassmorphism */
.forgot-password-card-bg::after {
    content:"";
    position:absolute;
    inset:0;
    border-radius:inherit;
    border:1px solid rgba(255,255,255,.05);
    box-shadow:
        inset 0 0 0 1px rgba(255,255,255,.02);
}

/* ============================================================================
 * FORGOT PASSWORD CONTENT
 * Contenedor principal del contenido del formulario
 *
 * Responsabilidades:
 * - Define el contexto de posicionamiento del contenido
 * - Controla la capa visual por encima del fondo (z-index)
 * - Mantiene el borde redondeado heredado del contenedor padre
 * ============================================================================ */

.forgot-password-content {
    position:relative;
    z-index:2;
    border-radius:inherit;
}

/* ============================================================================
 * FORGOT PASSWORD HEADER
 * Estilos del encabezado del formulario
 *
 * Responsabilidades:
 * - Define la apariencia del contenedor del encabezado
 * - Estiliza el título y la descripción
 * - Aplica el fondo degradado y separación visual del formulario
 * ============================================================================ */

.forgot-password-header {
    border-radius: inherit;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    padding: 28px;
    text-align: center;
    background: linear-gradient(
        120deg,
        rgba(124,58,237,.25),
        rgba(236,72,153,.25)
    );
    border-bottom: 1px solid rgba(255,255,255,.08);
}

.forgot-password-header h1 {
    font-size: 1.8rem;
    font-weight: 800;   
    letter-spacing: -0.5px;
    background: linear-gradient(
        90deg,
        #ffffff 0%,
        #f5d0fe 45%,
        #c4b5fd 100%
    );
    text-shadow:
        0 0 25px rgba(236,72,153,.15);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.forgot-password-header p {
    margin-top:8px;
    font-size:1rem;
    font-weight:500;
    color:rgba(255,255,255,.72);
    letter-spacing:.3px;
}

/* ============================================================================
 * FORGOT PASSWORD FORM
 * Estilos del contenedor del formulario
 *
 * Responsabilidades:
 * - Define el espaciado interno del formulario
 * - Separa visualmente el contenido del resto del layout
 * ============================================================================ */

.forgot-password-form {
    padding:28px;
}

/* ============================================================================
 * FIELD
 * Estilos base de los campos del formulario.
 *
 * Responsabilidades:
 * - Definir espaciado entre campos
 * - Estilizar labels e inputs
 * - Manejar estados de interacción (focus, error, autofill)
 * ============================================================================ */

.field {
    margin-bottom:22px;
}

.field label {
    display:block;
    margin-bottom:8px;
    color:#e2e8f0;
    font-weight:600;
}

.field input {
    width:100%;
    padding:14px 16px;
    border-radius:12px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(124,58,237,.25);
    color:#fff;
    transition:.3s;
}

.field input:focus {
    outline:none;
    border-color:#6d28d9;
    box-shadow:
        0 0 0 1px rgba(109,40,217,.6),
        0 0 20px rgba(109,40,217,.24);
}

.field input.invalid {
    border-color:#5b21b6;
    box-shadow:
        0 0 0 1px rgba(91,33,182,.5),
        0 0 16px rgba(91,33,182,.18);
}

.field input:-webkit-autofill,
.field input:-webkit-autofill:hover,
.field input:-webkit-autofill:focus,
.field input:-webkit-autofill:active {
    -webkit-text-fill-color:#fff !important;
    caret-color:#fff;
    -webkit-box-shadow:
        0 0 0 1000px rgba(255,255,255,.04) inset !important;
    transition:background-color 999999s ease-in-out 0s;
}

/* ============================================================================
 * INPUT WRAPPER
 * Contenedor de posicionamiento para elementos del input.
 *
 * Responsabilidades:
 * - Definir contexto para elementos posicionados en absoluto
 * - Soportar tooltips y elementos de validación asociados al input
 * ============================================================================ */

.input-wrapper {
    position:relative;
}

/* ============================================================================
 * FORM ERROR BANNER
 * Banner superior de errores generales.
 *
 * Responsabilidades:
 * - Muestra errores provenientes del servidor
 * - Destaca problemas que afectan al formulario completo
 * ============================================================================ */

.form-error-banner {
    position:absolute;
    top:-70px;
    left:0;
    right:0;
    padding:14px 18px;
    border-radius:12px;

    background:rgba(239,68,68,.12);
    border:1px solid rgba(239,68,68,.45);
    color:#fecaca;

    font-weight:600;
    z-index:20;
}

/* ============================================================================
 * ERROR TOOLTIP
 * Estilos y posicionamiento del tooltip de error.
 *
 * Responsabilidades:
 * - Define la apariencia del tooltip
 * - Posiciona el tooltip junto al campo correspondiente
 * - Dibuja la flecha indicadora mediante un pseudo-elemento
 * ============================================================================ */

.error-tooltip {
    display:flex;
    align-items:center;
    gap:8px;

    position:absolute;
    top:50%;
    left:calc(100% + 14px);

    transform:translateY(-50%);
    padding:10px 14px;
    border-radius:12px;
    white-space:nowrap;
    font-size:.85rem;

    background:
        linear-gradient(
            180deg,
            rgba(24,18,45,.98),
            rgba(18,14,35,.98)
        );
    border:1px solid rgba(168,85,247,.45);
    box-shadow:
        0 12px 30px rgba(0,0,0,.45),
        0 0 12px rgba(168,85,247,.18);
    color:#f8fafc;

    z-index:100;
}

/* Flecha indicadora que apunta hacia el campo con error */
.error-tooltip::before {
    content:"";
    position:absolute;
    left:-6px;
    top:50%;
    width:12px;
    height:12px;
    transform:translateY(-50%) rotate(45deg);
    background:inherit;
    border-left:inherit;
    border-bottom:inherit;
}

/* ============================================================================
 * SEND BUTTON
 * Estilos del botón de envío del formulario.
 *
 * Responsabilidades:
 * - Define la apariencia principal del botón
 * - Aplica estilos de interacción (hover)
 * - Indica estado deshabilitado del botón
 * ============================================================================ */

.btn-send {
    width:100%;
    padding:14px;
    border:none;
    border-radius:14px;
    cursor:pointer;
    color:#fff;
    font-weight:700;
    background:
        linear-gradient(
            120deg,
            #ff0055,
            #ff3366
        );
    transition:.3s;
}

.btn-send:hover:not(:disabled) {
    box-shadow:
        0 0 10px rgba(255,0,85,.2),
        0 0 20px rgba(236,72,153,.1);
}

.btn-send:disabled {
    opacity:.65;
    cursor:not-allowed;
}

/* ============================================================================
 * FORGOT PASSWORD FOOTER
 * Estilos del pie del formulario 
 *
 * Responsabilidades:
 * - Define el espaciado superior del footer
 * - Separa visualmente el formulario del enlace de acción
 * - Añade una línea divisoria sutil superior
 * ============================================================================ */

.forgot-password-footer {
    margin-top:28px;
    padding-top:22px;
    border-top:1px solid rgba(255,255,255,.08);
}

/* ============================================================================
 * FOOTER ACTION
 * Estilos del enlace del pie del formulario.
 *
 * Responsabilidades:
 * - Define la apariencia del enlace principal
 * - Centra y alinea el contenido
 * - Aplica estilos para los estados normal, hover y deshabilitado
 * ============================================================================ */

.footer-action {
    display:flex;
    justify-content:center;
    align-items:center;
    width:100%;
    padding:13px 16px;
    border-radius:14px;
    text-decoration:none;

    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.06);
    color:rgba(255,255,255,.72);

    transition:.25s;
}

.footer-action:not(.disabled):hover {
    color:#fff;
    background:rgba(124,58,237,.1);
    border-color:rgba(168,85,247,.35);
}

.footer-action.disabled {
    opacity: .6;
    cursor: not-allowed;
}

/* ============================================================================
 * RESET SUCCESS
 * Estilos de la pantalla de confirmación.
 *
 * Responsabilidades:
 * - Define la distribución del contenido
 * - Da formato al contenido de la confirmación
 * - Centra los elementos de la pantalla
 * ============================================================================ */

.reset-success {
    padding:50px 40px 60px;
    display:flex;
    flex-direction:column;
    align-items:center;
    text-align:center;
}

.reset-success h2 {
    font-size:1.65rem;
    font-weight:700;
    color:#fff;
}

.reset-success p {
    max-width:430px;
    line-height:1.8;
    color:rgba(255,255,255,.72);
}

/* ============================================================================
 * SUCCESS ICON
 * Icono de confirmación
 *
 * Responsabilidades:
 * - Representa visualmente la operación completada
 * - Refuerza el estado de éxito mediante efectos gráficos
 * ============================================================================ */

.success-icon {
    width:88px;
    height:88px;
    display:flex;
    align-items:center;
    justify-content:center;
    margin-bottom:24px;
    border-radius:50%;
    font-size:3rem;

    background:
        radial-gradient(circle at top left,
            rgba(124,58,237,.18),
            transparent 60%),
        rgba(124,58,237,.06);
    border:1px solid rgba(124,58,237,.28);
}

/* ============================================================================
 * LOGIN BUTTON
 * Estilos del botón de retorno al inicio de sesión.
 *
 * Responsabilidades:
 * - Define la apariencia del botón
 * - Aplica estilos de interacción (hover)
 * - Mantiene coherencia visual con el resto de botones
 * ============================================================================ */

.btn-login {
    display:inline-block;
    margin-top:34px;
    padding:14px 28px;
    border-radius:14px;
    text-decoration:none;
    color:#fff;
    font-weight:700;
    background:
        linear-gradient(
            120deg,
            #ff0055,
            #ff3366
        );
}

.btn-login:hover {
    box-shadow:
        0 0 10px rgba(255,0,85,.2),
        0 0 20px rgba(236,72,153,.1);
}

/* ============================================================================
 * RESPONSIVE
 * ============================================================================ */

@media (max-width: 1024px) {
    .forgot-password-card {
        margin: 60px auto;
        max-width: 92%;
    }

    .forgot-password-header,
    .forgot-password-form {
        padding: 24px;
    }

    .forgot-password-header h1 {
        font-size: 1.6rem;
    }

    .input-wrapper {
        overflow: hidden;
    }

    /* Tooltips pasan a flujo (evita overflow en tablets) */
    .error-tooltip {
        position: relative;
        top: auto;
        left: auto;
        transform: none;

        max-width: 100%;
        margin-top: 8px;
        white-space: normal;
    }

    .error-tooltip::before {
        display: none;
    }

    .field input {
        font-size: .95rem;
    }

    .btn-send,
    .btn-login {
        padding: 13px;
    }

    .reset-success {
        padding: 40px 32px 48px;
    }
}

@media (max-width: 768px) {
    .forgot-password-page {
        min-height: calc(100dvh - 133px);
        padding: 16px;
    }

    .forgot-password-card {
        margin: 30px auto;
        max-width: 100%;
        border-radius: 20px;
    }

    .forgot-password-header {
        padding: 20px;
    }

    .forgot-password-header h1 {
        font-size: 1.35rem;
    }

    .forgot-password-header p {
        font-size: .95rem;
    }

    .forgot-password-form {
        padding: 20px;
    }

    .field {
        margin-bottom: 18px;
    }

    .field input {
        padding: 12px 14px;
    }

    .btn-send,
    .btn-login {
        padding: 12px;
        font-size: .95rem;
    }

    .footer-action {
        padding: 12px 14px;
        font-size: .9rem;
    }

    .reset-success {
        padding: 36px 24px;
    }

    .reset-success h2 {
        font-size: 1.4rem;
    }

    .success-icon {
        width: 76px;
        height: 76px;
        font-size: 2.6rem;
    }
}

@media (max-width: 480px) {
    .forgot-password-page {
        padding: 10px;
        min-height: calc(100dvh - 133px);
    }

    .forgot-password-card {
        margin: 14px auto;
        border-radius: 16px;
    }

    .forgot-password-header {
        padding: 14px 12px;
    }

    .forgot-password-header h1 {
        font-size: 1.1rem;
        line-height: 1.2;
    }

    .forgot-password-header p {
        margin-top: 4px;
        font-size: .8rem;
        line-height: 1.3;
    }

    .forgot-password-form {
        padding: 14px;
    }

    .field {
        margin-bottom: 14px;
    }

    .field label {
        font-size: .85rem;
    }

    .field input {
        padding: 11px;
        font-size: .88rem;
        border-radius: 10px;
    }

    .error-tooltip {
        padding: 8px 10px;
        margin-top: 6px;
        font-size: .78rem;
    }

    .btn-send,
    .btn-login {
        padding: 11px;
        font-size: .88rem;
        border-radius: 12px;
    }

    .footer-action {
        padding: 10px 12px;
        font-size: .82rem;
        border-radius: 12px;
    }

    .reset-success {
        padding: 30px 16px;
    }

    .reset-success h2 {
        font-size: 1.05rem;
    }

    .reset-success p {
        font-size: .85rem;
        line-height: 1.4;
    }

    .success-icon {
        width: 64px;
        height: 64px;
        font-size: 2.2rem;
    }
}

</style>
