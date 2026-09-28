<script setup lang="ts">

/* ============================================================================
 * View: LoginView.vue
 * ============================================================================
 *
 * Formulario de inicio de sesión. Valida en el frontend, envía al backend,
 * y traduce los códigos de error del backend a mensajes de campo o banner
 * general. Si el login falla porque el email no está verificado, ofrece
 * reenviar el correo de verificación sin salir del formulario.
 * ============================================================================ */

import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import {
    KeyRound,
    Mail,
    TriangleAlert
} from "lucide-vue-next";

import {
    useAuthStore
} from "@/features/auth/stores/useAuthStore";

import {
    loginUser,
    resendVerificationEmail
} from "@/features/auth/services/auth.service";

import {
    validateLoginForm,
    validateEmail,
    validatePassword,
    EMAIL_MAX_LENGTH,
    PASSWORD_MAX_LENGTH
} from "@/features/auth/validation/login.validation";

import type {
    LoginErrors
} from "@/features/auth/types/auth";

// Traducción de textos e idioma actual.
const { t, locale } = useI18n();
// Router para la navegación entre vistas.
const router = useRouter();
// Store con el estado de autenticación del usuario.
const authStore = useAuthStore();

// Campos del formulario, en texto plano (la validación vive en login.validation.ts)
const email = ref("");
const password = ref("");

type LoginField = "email" | "password";

const loginFields: LoginField[] = [
    "email",
    "password"
];

// True luego del primer intento de submit; habilita la validación en tiempo real
// en los watchers de abajo, para no marcar errores mientras el usuario todavía
// está completando el campo por primera vez
const submitted = ref(false);

// Errores de validacion por campo; se muestran como tooltip individual.
const errors = ref<LoginErrors>({});
const focusedField = ref<LoginField | null>(null);
const hoveredField = ref<LoginField | null>(null);

// Mensaje de error general (banner), para códigos de backend que no
// corresponden a un campo específico (ej: credenciales inválidas, cuenta bloqueada)
const formError = ref("");

// Evita doble submit mientras la request de login está en curso
const isSubmitting = ref(false);

// Evita doble click mientras la request de reenvío de email está en curso
const isResendingEmail = ref(false);

// Alterna entre el formulario y la pantalla de confirmación de reenvío,
// una vez que el email de verificación fue reenviado con éxito
const resendSuccess = ref(false);

/**
 * Envía el login. Valida en el frontend antes de llamar al backend; si el
 * backend responde con éxito, guarda el usuario y el csrf token en el store
 * y redirige al Home. Si responde con error, lo traduce a un error de campo
 * o a un mensaje general en el banner (formError), siendo email no verificado
 * el unico caso que ademas habilita el boton de
 * reenvío de email en el footer del formulario.
 */
const login = async () => {

    // Protección adicional ante envíos duplicados.
    if (isSubmitting.value) {
        return;
    }

    // A partir del primer intento de envío,
    // los watchers comienzan a validar en tiempo real.
    submitted.value = true;

    // Limpia errores anteriores.
    errors.value = {};
    formError.value = "";

    const form = {
        email: email.value,
        password: password.value
    };

    // Validación frontend.
    errors.value = validateLoginForm(form);

    if (Object.keys(errors.value).length > 0) {
        return;
    }

    isSubmitting.value = true;

    try {

        const response = await loginUser(form);

        authStore.setUser(response.user);

        authStore.setCsrfToken(
            response.csrf_token
        );

        await router.push({
            name: "Home",
            params: {
                lang: locale.value
            }
        });
    }
    catch (error: any) {

        const status = error.response?.status;

        if (status === 429) {
            formError.value = "loginTemporarilyBlocked";
            return;
        }

        if (status === 403) {
            formError.value = "emailNotVerified";
            return;
        }

        if (status >= 500) {
            formError.value = "internalServerError";
            return;
        }

        // Laravel devuelve errores de validacion en errors.{field}.
        const laravelErrors = error.response?.data?.errors;

        if (laravelErrors?.email) {
            formError.value = "invalidCredentials";
            return;
        }

        if (laravelErrors?.password) {
            errors.value.password = "required";
            return;
        }

        formError.value = "unknownError";
    }
    finally {
        isSubmitting.value = false;        
    }
};

/**
 * Reenvia el email de verificacion cuando Laravel informa que la cuenta
 * todavia no verifico el correo.
 * Usa el email ya cargado en el formulario, sin pedirlo de nuevo.
 */
const resendEmail = async () => {

    if (isResendingEmail.value) {
        return;
    }

    resendSuccess.value = false;

    isResendingEmail.value = true;

    try {

        await resendVerificationEmail({
            email: email.value,
            language: locale.value as "es" | "en"
        });

        formError.value = "";
        resendSuccess.value = true;
    }
    catch (error: any) {
        const status = error.response?.status;

        if (status >= 500) {
            formError.value = "internalServerError";
            return;
        }

        formError.value = "unknownError";
    }
    finally {
        isResendingEmail.value = false;
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

function getFirstErroredField() {
    return loginFields.find((field) => Boolean(errors.value[field])) ?? null;
}

function setFocusedField(field: LoginField) {
    focusedField.value = field;
}

function clearFocusedField(field: LoginField) {
    if (focusedField.value === field) {
        focusedField.value = null;
    }
}

function setHoveredField(field: LoginField) {
    hoveredField.value = field;
}

function clearHoveredField(field: LoginField) {
    if (hoveredField.value === field) {
        hoveredField.value = null;
    }
}

function shouldShowFieldError(field: LoginField) {
    if (!errors.value[field]) {
        return false;
    }

    const activeField = focusedField.value ?? hoveredField.value;

    if (activeField) {
        return activeField === field;
    }

    return getFirstErroredField() === field;
}

function getFieldValidationMessage(field: LoginField) {
    const error = errors.value[field];
    return error ? getValidationMessage(error) : "";
}

/**
 * Valida email en vivo, solo después del primer submit (ver "submitted"),
 * para no mostrar errores mientras el usuario todavía está escribiendo
 * por primera vez.
 */
watch(email, (value) => {

    if (!submitted.value) return;

    const error = validateEmail(value);

    if (error) {
        errors.value.email = error;
    }
    else {
        delete errors.value.email;
    }

});

/**
 * Valida password en vivo, solo después del primer submit
 * (mismo criterio que el watcher de email).
 */
watch(password, (value) => {

    if (!submitted.value) return;

    const error = validatePassword(value);

    if (error) {
        errors.value.password = error;
    }
    else {
        delete errors.value.password;
    }

});

</script>

<template>

    <div class="page-wrapper login-page">

        <div class="login-card">

            <Transition name="fade">

                <div
                    v-if="formError"
                    class="form-error-banner"
                >                
                    <TriangleAlert class="error-icon" aria-hidden="true" />
                    {{ t(`auth.errors.${formError}`) }}
                </div>

            </Transition>

            <div class="login-card-bg"></div>

            <div class="login-content">

                <div class="login-header">
                    <template v-if="!resendSuccess">
                        <h1>{{ t("auth.login.title") }}</h1>
                        <p>{{ t("auth.login.subtitle") }}</p>
                    </template>
                    <template v-else>
                        <h1>{{ t("auth.success.resendSuccessTitle") }}</h1>
                        <p>{{ t("auth.success.resendSuccessSubtitle") }}</p>
                    </template>
                </div>
                <form
                    v-if="!resendSuccess"
                    novalidate
                    autocomplete="off"
                    class="login-form"
                    @submit.prevent="login"
                >

                    <div class="field">

                        <label>{{ t("auth.login.email") }}</label>

                        <div
                            class="input-wrapper"
                            @mouseenter="setHoveredField('email')"
                            @mouseleave="clearHoveredField('email')"
                        >

                            <input
                                v-model="email"
                                type="email"
                                :maxlength="EMAIL_MAX_LENGTH"
                                autocomplete="username"
                                :class="{ invalid: shouldShowFieldError('email') }"
                                @focus="setFocusedField('email')"
                                @blur="clearFocusedField('email')"
                            />

                            <div
                                v-if="shouldShowFieldError('email')"
                                class="error-tooltip"
                            >
                                <TriangleAlert class="error-icon" aria-hidden="true" />
                                {{ getFieldValidationMessage('email') }}
                            </div>

                        </div>

                    </div>

                    <div class="field">

                        <label>{{ t("auth.login.password") }}</label>

                        <div
                            class="input-wrapper"
                            @mouseenter="setHoveredField('password')"
                            @mouseleave="clearHoveredField('password')"
                        >

                        <input
                            v-model="password"
                            type="password"
                            :maxlength="PASSWORD_MAX_LENGTH"
                            autocomplete="current-password"
                            :class="{ invalid: shouldShowFieldError('password') }"
                            @focus="setFocusedField('password')"
                            @blur="clearFocusedField('password')"
                        />

                            <div
                                v-if="shouldShowFieldError('password')"
                                class="error-tooltip"
                            >
                                <TriangleAlert class="error-icon" aria-hidden="true" />
                                {{ getFieldValidationMessage('password') }}
                            </div>

                        </div>

                    </div>

                    <button
                        type="submit"
                        class="btn-login"
                        :disabled="isSubmitting"
                    >
                        {{ t("auth.login.submit") }}
                    </button>

                    <div class="register-link">
                        <span>{{ t("auth.login.noAccount") }}</span>
                        <RouterLink
                            :to="{ name: 'Register', params: { lang: locale } }"
                        >
                            {{ t("auth.login.register") }}
                        </RouterLink>
                    </div>

                    <div class="login-footer">

                        <RouterLink
                            :to="{ name: 'ForgotPassword', params: { lang: locale } }"
                            class="footer-action"
                        >
                            <KeyRound :size="18" />
                            <span>
                                {{ t("auth.login.forgotPassword") }}
                            </span>
                        </RouterLink>

                        <Transition name="fade">

                            <button
                                v-if="formError === 'emailNotVerified'"
                                type="button"
                                class="footer-action resend"
                                :disabled="isResendingEmail || resendSuccess"
                                @click="resendEmail"
                            >
                                <Mail :size="18" />

                                <span>
                                    {{ t("auth.login.resendVerificationEmail") }}
                                </span>

                            </button>

                        </Transition>

                    </div>

                </form>

                <div
                    v-else
                    class="resend-success"
                >
                    <div class="success-icon">
                        ✉️
                    </div>
                    <h2>
                        {{ t("auth.success.verificationEmailSentTitle") }}
                    </h2>
                    <p>
                        {{ t("auth.register.verifyEmailMessage") }}
                    </p>
                </div>

            </div>

        </div>

    </div>

</template>

<style scoped>

/* ============================================================================
 * LOGIN PAGE
 * Contenedor general de la vista de login.
 *
 * Responsabilidades:
 * - Define la altura mínima de la pantalla para centrar el contenido
 * - Ajusta el layout global restando el alto del header/navbar
 * ============================================================================ */

.login-page {
  min-height: calc(100vh - 133px);
}

/* ============================================================================
 * LOGIN CARD
 * Contenedor principal del formulario de login.
 *
 * Responsabilidades:
 * - Define el layout y tamaño del card de autenticación
 * - Centra el formulario dentro de la página
 * - Permite el posicionamiento de capas internas (background, overlays, banners)
 * - Controla el comportamiento de overflow para elementos decorativos
 * ============================================================================ */

.login-card {
    position: relative;
    width: 100%;
    max-width: 560px;
    margin: 80px auto;
    border-radius: 24px;   
    overflow: visible;
}

/* ============================================================================
 * LOGIN CARD BACKGROUND
 * Fondo visual del card de login.
 *
 * Responsabilidades:
 * - Definir el fondo principal del contenedor del login
 * - Aplicar gradientes, bordes y sombras del card
 * - Generar efecto de profundidad con blur y capas decorativas
 * - Añadir overlays decorativos con pseudo-elementos
 * ============================================================================ */

.login-card-bg {
    position: absolute;
    inset: 0;
    border-radius: inherit; 
    overflow: hidden;

    background:
        linear-gradient(
            145deg,
            rgba(24,18,45,.95),
            rgba(15,12,35,.92),
            rgba(10,10,25,.95)
        );
    border: 1px solid rgba(124,58,237,.28);
    box-shadow:
        0 30px 80px rgba(0,0,0,.65),
        0 0 18px rgba(124,58,237,.14),
        inset 0 0 0 1px rgba(255,255,255,.04);

    backdrop-filter: blur(24px);
}

/* Resplandor decorativo superior/inferior sobre el fondo del card */
.login-card-bg::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
        radial-gradient(
            circle at top left,
            rgba(236,72,153,.18),
            transparent 40%
        ),
        radial-gradient(
            circle at bottom right,
            rgba(124,58,237,.18),
            transparent 45%
        );
    pointer-events: none;
}

/* Borde interior sutil para reforzar el efecto glassmorphism */
.login-card-bg::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 1px solid rgba(255,255,255,.05);
    box-shadow:
        inset 0 0 0 1px rgba(255,255,255,.02);
    pointer-events: none;
}

/* ============================================================================
 * LOGIN CONTENT
 * Contenedor principal del contenido del login.
 *
 * Responsabilidades:
 * - Definir la capa de contenido encima del fondo del card
 * - Mantener el control de z-index del layout interno
 * - Aplicar herencia de bordes del contenedor principal
 * ============================================================================ */

.login-content {
    position: relative;
    z-index: 2;
    border-radius: inherit; 
}

/* ============================================================================
 * LOGIN HEADER
 * Cabecera del formulario de login.
 *
 * Responsabilidades:
 * - Definir la estructura visual del encabezado del login
 * - Mostrar título y subtítulo del formulario
 * - Aplicar estilos de fondo y jerarquía visual
 * ============================================================================ */

.login-header {
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

.login-header h1 {
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: -0.5px;

    background: linear-gradient(
        90deg,
        #ffffff 0%,
        #f5d0fe 45%,
        #c4b5fd 100%
    );

    
    -webkit-background-clip: text;
    background-clip: text;    
    -webkit-text-fill-color: transparent;
    color: transparent;

    text-shadow: 0 0 25px rgba(236,72,153,.15);
}

.login-header p{
    margin-top:8px;
    font-size:1rem;
    font-weight:500;
    color:rgba(255,255,255,.72);
    letter-spacing:.3px;
}

/* ============================================================================
 * LOGIN FORM
 * Contenedor del formulario de login.
 *
 * Responsabilidades:
 * - Definir el espaciado interno del formulario
 * - Agrupar los campos y acciones del login
 * ============================================================================ */

.login-form {
  padding: 28px;
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
    margin-bottom: 22px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  color: #e2e8f0;
  font-weight: 600;
}

.field input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(124,58,237,.25);
  color: white;
  transition: .3s;
}

.field input:focus {
    outline: none;
    border-color: #6d28d9;
    box-shadow:
        0 0 0 1px rgba(109,40,217,.60),
        0 0 20px rgba(109,40,217,.24);
}

.field input.invalid {
    border-color: #5b21b6;
    box-shadow:
        0 0 0 1px rgba(91,33,182,.50),
        0 0 16px rgba(91,33,182,.18);
}

.field input:-webkit-autofill,
.field input:-webkit-autofill:hover,
.field input:-webkit-autofill:focus,
.field input:-webkit-autofill:active {
    -webkit-text-fill-color: white !important;
    caret-color: white;
    -webkit-box-shadow:
        0 0 0 1000px rgba(255,255,255,.04) inset !important;
    transition: background-color 999999s ease-in-out 0s;
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
    position: relative;
}

/* ============================================================================
 * FORM ERROR BANNER
 * Estilos del banner de error general del formulario.
 *
 * Responsabilidades:
 * - Muestra errores globales del formulario
 * - Se posiciona sobre el card sin afectar layout
 * - Refuerza estados de error con énfasis visual
 * - Mantiene coherencia con sistema de alertas del UI
 * ============================================================================ */

.form-error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    position:absolute;
    left:0;
    right:0;
    top:-60px;
    padding:14px 18px;
    border-radius:12px;

    background:rgba(239,68,68,.12);
    border:1px solid rgba(239,68,68,.45);
    box-shadow:0 10px 30px rgba(0,0,0,.35);
    color:#fecaca;

    font-weight:600;
    z-index:20;
}

.error-icon {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    color: #facc15;
}

/* ============================================================================
 * ERROR TOOLTIP
 * Estilos del tooltip de error de validación de campo.
 *
 * Responsabilidades:
 * - Muestra mensajes de error específicos por campo
 * - Se posiciona junto al input correspondiente sin romper layout
 * - Mantiene alta legibilidad y jerarquía visual
 * - Refuerza estados de validación con feedback inmediato
 * ============================================================================ */

.error-tooltip {
    display: flex;
    align-items: center;
    gap: 8px;
    position: absolute;
    top: 50%;
    left: calc(100% + 14px);
    transform: translateY(-50%);
    padding: 10px 14px;
    border-radius: 12px;
    font-size: .85rem;
    font-weight: 500;
    white-space: nowrap;

    background:
        linear-gradient(
            180deg,
            rgba(24,18,45,.98),
            rgba(18,14,35,.98)
        );
    border: 1px solid rgba(168,85,247,.45);
    box-shadow:
        0 12px 30px rgba(0,0,0,.45),
        0 0 12px rgba(168,85,247,.18),
        inset 0 0 12px rgba(168,85,247,.05);
    color: #f8fafc;

    z-index: 100;
}

/* Flecha indicadora que apunta hacia el campo con error */
.error-tooltip::before {
    content: "";
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: inherit;
    border-left: inherit;
    border-bottom: inherit;
}

/* ============================================================================
 * LOGIN BUTTON
 * Botón principal del formulario de login.
 *
 * Responsabilidades:
 * - Definir la apariencia del botón de login
 * - Marcarlo como acción principal del formulario
 * - Mostrar estados hover y disabled de forma clara
 * ============================================================================ */

.btn-login {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 14px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(
    120deg,
    #ff0055,
    #ff3366
  );
  transition: .3s;
}

.btn-login:not(:disabled):hover {
    box-shadow:
        0 0 10px rgba(255,0,85,.20),
        0 0 20px rgba(236,72,153,.10);
}

.btn-login:disabled {
    opacity: .65;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

/* ============================================================================
 * REGISTER LINK
 * Enlace de registro dentro del login.
 *
 * Responsabilidades:
 * - Mostrar el acceso a registro desde el login
 * - Mantener el mismo estilo que otros enlaces de acciones del formulario
 * - Evitar que destaque más que el botón principal
 * ============================================================================ */

.register-link {
    margin-top: 18px;
    margin-bottom: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    font-size: .95rem;
    color: rgba(255,255,255,.68);
}

.register-link a {
    color: #f472b6;
    font-weight: 700;    
    text-decoration: none;
    transition: .25s;
}

.register-link a:hover {
    color: #fff;
}

/* ============================================================================
 * LOGIN FOOTER
 * Contenedor de acciones secundarias del login (recuperar contraseña,
 * reenvío de email de verificación, etc.).
 *
 * Responsabilidades:
 * - Agrupa enlaces y acciones auxiliares del formulario
 * - Separa visualmente la zona principal del login
 * - Organiza acciones en columna con espaciado consistente
 * ============================================================================ */

.login-footer {
    margin-top:16px;
    padding-top:16px;
    border-top:1px solid rgba(255,255,255,.08);
    display:flex;
    flex-direction:column;
    gap:12px;
}

/* ============================================================================
 * FOOTER ACTION BUTTON
 * Estilo base para acciones secundarias del footer (links y botones).
 *
 * Responsabilidades:
 * - Define el layout y comportamiento del botón de acción
 * - Unifica estilo entre RouterLink y <button>
 * - Maneja estados hover, disabled y variantes de color del icono
 * - Mantiene consistencia visual en acciones secundarias del login
 * ============================================================================ */

.footer-action {
    display:flex;
    align-items:center;
    justify-content:center;
    gap:10px;
    width:100%;
    padding:13px 16px;
    border-radius:14px;
    text-decoration:none;

    background:rgba(255,255,255,.025);
    border:1px solid rgba(255,255,255,.06);
    color:rgba(255,255,255,.72);

    font-size:.93rem;
    font-weight:500;

    cursor:pointer;
    transition:.25s;
}

.footer-action svg {
    color:#c084fc;
    transition:.25s;
}

.footer-action:hover {
    color:#ffffff;
    background:rgba(124,58,237,.10);
    border-color:rgba(168,85,247,.35);
    box-shadow:
        0 0 18px rgba(124,58,237,.15);
}

.footer-action:hover svg {
    color:#f472b6;
}

.footer-action:disabled {
    opacity: .6;
    cursor: not-allowed;    
    box-shadow: none;
}

.footer-action:disabled:hover {
    background: rgba(236,72,153,.05);
    border-color: rgba(236,72,153,.22);
    color: rgba(255,255,255,.55);
}

.footer-action:disabled svg {
    color: #9ca3af;
}

/* ============================================================================
 * RESEND 
 * Estilo del botón "Reenviar correo de verificación"
 *
 * Responsabilidades:
 * - Modifica el estilo base de .footer-action
 * - Resalta la acción de reenvío de email
 * - Usa un color de alerta suave (tono rosa)
 * - Indica acción secundaria importante pero no destructiva
 * ============================================================================ */

.resend {
    border-color:rgba(236,72,153,.22);
    background:rgba(236,72,153,.05);
}

/* ============================================================================
 * RESEND SUCCESS
 * Pantalla de confirmación tras reenviar el correo de verificación.
 *
 * Responsabilidades:
 * - Define la distribución del contenido
 * - Da formato al contenido de la confirmación
 * - Centra los elementos de la pantalla
 * ============================================================================ */

.resend-success {
    padding:50px 40px 60px;
    display:flex;
    flex-direction:column;
    align-items:center;
    text-align:center;
    animation:fadeUp .6s ease;
}

/* Animación de entrada con desvanecimiento y desplazamiento hacia arriba */
@keyframes fadeUp {
    from{
        opacity:0;
        transform:
        translateY(10px);
    }
    to{
        opacity:1;
        transform:
        translateY(0);
    }
}

.resend-success h2 {
    font-size: 1.65rem; 
    font-weight: 700;   
    letter-spacing: 0;
    color:white;
    text-shadow:
        0 0 20px rgba(124,58,237,.20);
}

.resend-success p {
    max-width:430px;
    color:rgba(255,255,255,.72);
    font-size:1.03rem;
    line-height:1.6;
    font-weight:400;
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

    background:
        radial-gradient(circle at top left, rgba(124,58,237,.18), transparent 60%),
        rgba(124,58,237,.06);
    border: 1px solid rgba(124,58,237,.28);
    box-shadow:
        0 0 6px rgba(124,58,237,.06),   /* glow exterior suave */
        0 0 12px rgba(124,58,237,.04),  /* glow exterior más amplio y difuso */
        inset 0 0 0 1px rgba(255,255,255,.04); /* borde interno sutil para dar profundidad */

    font-size:3rem;
}

/* ============================================================================
 * RESPONSIVE 
 * ============================================================================ */

@media (max-width: 1024px) {
    .login-card {
        margin: 60px auto;
        max-width: 92%;
    }

    .login-form {
        padding: 24px;
    }

    .login-header {
        padding: 24px;
    }

    .login-header h1 {
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
        white-space: normal;

        margin-top: 8px;
    }

    .field input {
        font-size: 0.95rem;
    }

    .btn-login {
        padding: 13px;
    }

    .login-footer {
        gap: 10px;
    }
}

@media (max-width: 768px) {
    .login-page {
        min-height: calc(100dvh - 133px);
        padding: 16px;
    }

    .login-card {
        margin: 30px auto;
        max-width: 100%;
        border-radius: 20px;
    }

    .login-header {
        padding: 20px;
    }

    .login-header h1 {
        font-size: 1.35rem;
    }

    .login-header p {
        font-size: 0.95rem;
    }

    .login-form {
        padding: 20px;
    }

    .field {
        margin-bottom: 18px;
    }

    .field input {
        padding: 12px 14px;
    }

    .btn-login {
        font-size: 0.95rem;
        padding: 12px;
    }

    .footer-action {
        padding: 12px 14px;
        font-size: 0.9rem;
    }

    .success-icon {
        width: 76px;
        height: 76px;
    }

    .resend-success h2 {
        font-size: 1.4rem;
    }
}

@media (max-width: 480px) {
    .login-page {
        padding: 10px;
        min-height: calc(100dvh - 133px);
    }

    .login-card {
        margin: 14px auto;
        border-radius: 16px;
    }

    .login-header {
        padding: 14px 12px;
    }

    .login-header h1 {
        font-size: 1.1rem;
        line-height: 1.2;
    }

    .login-header p {
        font-size: 0.8rem;
        line-height: 1.3;
        margin-top: 4px;
    }

    .login-form {
        padding: 14px;
    }

    .field {
        margin-bottom: 14px;
    }

    .field label {
        font-size: 0.85rem;
    }

    .field input {
        padding: 11px;
        font-size: 0.88rem;
        border-radius: 10px;
    }

    .error-tooltip {
        font-size: 0.78rem;
        padding: 8px 10px;
        margin-top: 6px;
    }

    .btn-login {
        padding: 11px;
        font-size: 0.88rem;
        border-radius: 12px;
    }

    .register-link {
        font-size: 0.82rem;
        gap: 3px;
    }

    .footer-action {
        font-size: 0.82rem;
        padding: 10px 12px;
        border-radius: 12px;
    }

    .resend-success {
        padding: 30px 16px;
    }

    .resend-success h2 {
        font-size: 1.05rem;
    }

    .resend-success p {
        font-size: 0.85rem;
        line-height: 1.4;
    }

    .success-icon {
        width: 64px;
        height: 64px;
        font-size: 2.2rem;
    }
}

</style>
