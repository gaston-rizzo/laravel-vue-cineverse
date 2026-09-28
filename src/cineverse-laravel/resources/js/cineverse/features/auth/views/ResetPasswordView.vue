<script setup lang="ts">

/* ============================================================================
 * VIEW: ResetPasswordView.vue
 * ============================================================================
 *
 * Formulario de restablecimiento de contraseña a partir de un token en la
 * URL (?token=...).
 *
 * Al montar la vista, valida el token contra el backend (tokenStatus:
 * "checking" | "valid" | "invalid") antes de mostrar el formulario, para
 * evitar que el usuario complete la contraseña nueva y recién ahí se
 * entere de que el link ya no es válido.
 *
 * Al enviar, valida en el frontend, envía al backend, y traduce los
 * códigos de error del backend a mensajes de campo o banner general.
 * ============================================================================ */

import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import {
    LockKeyhole,
    TriangleAlert
} from "lucide-vue-next";

import {
    resetPassword
} from "../services/auth.service";

import {
    validatePassword,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialCharacter,
    getPasswordStrength,
    getPasswordStrengthLabel,
    PASSWORD_MAX_LENGTH
} from "../validation/register.validation";

import type {
    ResetPasswordErrors
} from "@/features/auth/types/auth";

// Traducción de textos e idioma actual.
const { t, locale } = useI18n();
// Router para la navegación entre vistas.
const route = useRoute();

// Token recibido desde el link de email
const token = route.query.token as string | undefined;
const email = route.query.email as string | undefined;

// Estado de validación del token contra el backend, verificado al montar
// la vista. "checking" mientras se consulta, "valid" si el token existe
// y no expiró (recién ahí se muestra el formulario), "invalid" si no hay
// token en la URL o el backend lo rechazó (inexistente o vencido).
const tokenStatus = ref<"checking" | "valid" | "invalid">("checking");

// Nueva contraseña
const password = ref("");

// Confirmación de la nueva contraseña
const confirmPassword = ref("");

type ResetPasswordField = "password" | "confirmPassword";

const resetPasswordFields: ResetPasswordField[] = [
    "password",
    "confirmPassword"
];

// True luego del primer intento de submit; habilita la validación en tiempo real (ver watchers)
const submitted = ref(false);

// Indica si la contraseña fue restablecida correctamente.
const success = ref(false);
// Errores de validación del formulario.
const errors = ref<ResetPasswordErrors>({});
// Indica si el campo de contraseña tiene el foco.    
const passwordFocused = ref(false);
const focusedField = ref<ResetPasswordField | null>(null);
const hoveredField = ref<ResetPasswordField | null>(null);
// Indica si el formulario se está enviando.
const isSubmitting = ref(false);
// Código del error general del formulario.
const formError = ref("");

// Requisitos que debe cumplir la contraseña.
const passwordRequirements = computed(() => [
    {
        text: t("auth.register.passwordRequirements.minLength"),
        ok: hasMinLength(password.value)
    },
    {
        text: t("auth.register.passwordRequirements.uppercase"),
        ok: hasUppercase(password.value)
    },
    {
        text: t("auth.register.passwordRequirements.lowercase"),
        ok: hasLowercase(password.value)
    },
    {
        text: t("auth.register.passwordRequirements.number"),
        ok: hasNumber(password.value)
    },
    {
        text: t("auth.register.passwordRequirements.symbol"),
        ok: hasSpecialCharacter(password.value)
    }
]);

// Nivel de seguridad de la contraseña.
const passwordStrength = computed(() =>
    getPasswordStrength(password.value)
);

// Etiqueta descriptiva del nivel de seguridad.
const passwordStrengthLabel = computed(() =>
    getPasswordStrengthLabel(passwordStrength.value)
);

/**
 * Envía el formulario. Valida en el frontend antes de llamar al backend, y
 * traduce los errores de Laravel a errores de campo o al banner general.
 */
const sendResetPassword = async () => {

     if (isSubmitting.value) {
        return;
    }

    submitted.value = true;
    errors.value = {};

    const passwordError = validatePassword(password.value);

    if (passwordError) {
        errors.value.password = passwordError;
    }

    if (password.value !== confirmPassword.value) {
        errors.value.confirmPassword = "passwordsDoNotMatch";
    }

    if (Object.keys(errors.value).length > 0) {
        return;
    }
    
    if (!token || !email) {
        formError.value = "invalidOrExpiredResetToken";
        return;
    }
    
    isSubmitting.value = true;

    try {

        await resetPassword({
            email,
            token,
            password: password.value,
            password_confirmation: confirmPassword.value
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

        if (laravelErrors?.password) {
            errors.value.password = validatePassword(password.value) ?? "passwordMin";
            return;
        }

        if (laravelErrors?.password_confirmation) {
            errors.value.confirmPassword = "passwordsDoNotMatch";
            return;
        }

        if (laravelErrors?.email || laravelErrors?.token) {
            formError.value = "invalidOrExpiredResetToken";
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
 * "passwordsDoNotMatch" usa una clave propia de esta pantalla; el resto
 * cae en las traducciones compartidas de registro/validación genérica.
 * @param key - Clave de error (ej: "required", "passwordsDoNotMatch", etc)
 */
function getValidationMessage(key: string) {

    switch (key) {

        case "required":
            return t("auth.validation.required");

        case "passwordsDoNotMatch":
            return t("auth.resetPassword.passwordsDoNotMatch");

        default:
            return t(`auth.register.validation.${key}`);
    }
}

const firstErroredField = computed<ResetPasswordField | null>(() =>
    resetPasswordFields.find((field) => Boolean(errors.value[field])) ?? null
);

function setFocusedField(field: ResetPasswordField) {
    focusedField.value = field;
}

function clearFocusedField(field: ResetPasswordField) {
    if (focusedField.value === field) {
        focusedField.value = null;
    }
}

function setHoveredField(field: ResetPasswordField) {
    hoveredField.value = field;
}

function clearHoveredField(field: ResetPasswordField) {
    if (hoveredField.value === field) {
        hoveredField.value = null;
    }
}

function shouldShowFieldError(field: ResetPasswordField) {
    if (!errors.value[field]) {
        return false;
    }

    const activeField = focusedField.value ?? hoveredField.value;

    if (activeField) {
        return activeField === field;
    }

    return firstErroredField.value === field;
}

function getFieldValidationMessage(field: ResetPasswordField) {
    const error = errors.value[field];
    return error ? getValidationMessage(error) : "";
}

/**
 * Revalida la contraseña y su confirmación en cada tecla, pero solo después
 * de que el usuario ya intentó enviar el formulario una vez (submitted).
 * Antes de ese primer submit no se muestran errores para no ser intrusivos.
 */
watch(password, (value) => {

    if (!submitted.value) {
        return;
    }

    const error = validatePassword(value);

    if (error) {
        errors.value.password = error;
    } else {
        delete errors.value.password;
    }

    if (
        confirmPassword.value !== "" &&
        confirmPassword.value !== value
    ) {
        errors.value.confirmPassword = "passwordsDoNotMatch";
    } else {
        delete errors.value.confirmPassword;
    }

});

/**
 * Revalida la confirmación contra la contraseña actual en cada tecla,
 * también condicionado a que ya se haya intentado enviar el formulario.
 */
watch(confirmPassword, (value) => {

    if (!submitted.value) {
        return;
    }

    if (value !== password.value) {
        errors.value.confirmPassword = "passwordsDoNotMatch";
    } else {
        delete errors.value.confirmPassword;
    }

});

/**
 * Valida el token contra el backend apenas se monta la vista, antes de
 * mostrarle el formulario al usuario. Evita que complete toda la
 * contraseña nueva para recién enterarse al final de que el link ya
 * no servía.
 */
onMounted(async () => {

    if (!token || !email) {
        tokenStatus.value = "invalid";
        return;
    }

    tokenStatus.value = "valid";
});

</script>

<template>

    <div class="page-wrapper reset-password-page">

        <div class="reset-password-card">

            <Transition name="fade">

                <div
                    v-if="formError"
                    class="form-error-banner"
                >
                    <TriangleAlert class="error-icon" aria-hidden="true" />
                    {{ t(`auth.errors.${formError}`) }}
                </div>

            </Transition>

            <div class="reset-password-card-bg"></div>

            <div class="reset-password-content">

                <div v-if="!success"
                    class="reset-password-header"
                    :class="{ 'header-only': tokenStatus !== 'valid' }"
                >
                    <template v-if="tokenStatus === 'checking'">
                        <h1>{{ t("auth.resetPassword.checkingTitle") }}</h1>
                        <p>{{ t("auth.resetPassword.checkingMessage") }}</p>
                    </template>
                    <template v-else-if="tokenStatus === 'valid'">
                        <h1>{{ t("auth.resetPassword.title") }}</h1>
                        <p>{{ t("auth.resetPassword.subtitle") }}</p>
                    </template>
                    <template v-else>
                        <h1>{{ t("auth.resetPassword.invalidTitle") }}</h1>
                        <p>{{ t("auth.resetPassword.invalidMessage") }}</p>
                    </template>
                </div>

                <div
                    v-if="!success && tokenStatus === 'checking'"
                    class="checking-spinner"
                >
                    <div class="spinner"></div>
                </div>

                <form          
                    v-if="!success && tokenStatus === 'valid'"                              
                    class="reset-password-form"
                    @submit.prevent="sendResetPassword"
                >

                    <div class="field">

                        <label>{{ t("auth.register.password") }}</label>

                        <div
                            class="input-wrapper"
                            @mouseenter="setHoveredField('password')"
                            @mouseleave="clearHoveredField('password')"
                        >

                            <input
                                v-model="password"
                                type="password"
                                :maxlength="PASSWORD_MAX_LENGTH"
                                autocomplete="new-password"
                                :class="{ invalid: shouldShowFieldError('password') }"
                                @focus="setFocusedField('password'); passwordFocused = true"
                                @blur="clearFocusedField('password'); passwordFocused = false"
                            />

                            <div
                                v-if="passwordFocused"
                                class="password-tooltip"
                            >

                                <div
                                    v-for="rule in passwordRequirements"
                                    :key="rule.text"
                                    class="password-rule"
                                    :class="{ ok: rule.ok }"
                                >
                                    <span>{{ rule.ok ? "✓" : "•" }}</span>
                                    {{ rule.text }}
                                </div>

                                <div class="password-strength">

                                    <div class="strength-bar">

                                        <div
                                            class="strength-fill"
                                            :class="passwordStrengthLabel"
                                            :style="{ width: `${passwordStrength * 20}%` }"
                                        />

                                    </div>

                                    <span
                                        class="strength-text"
                                        :class="passwordStrengthLabel"
                                    >
                                        {{ t(`auth.register.passwordRequirements.${passwordStrengthLabel}`) }}
                                    </span>

                                </div>

                            </div>

                            <div
                                v-else-if="shouldShowFieldError('password')"
                                class="error-tooltip"                        
                            >
                                <TriangleAlert class="error-icon" aria-hidden="true" />
                                {{ getFieldValidationMessage('password') }}
                            </div>

                        </div>

                    </div>

                    <div class="field">

                        <label>{{ t("auth.resetPassword.confirmPassword") }}</label>

                        <div
                            class="input-wrapper"
                            @mouseenter="setHoveredField('confirmPassword')"
                            @mouseleave="clearHoveredField('confirmPassword')"
                        >

                            <input
                                v-model="confirmPassword"
                                type="password"
                                :maxlength="PASSWORD_MAX_LENGTH"
                                autocomplete="new-password"
                                :class="{ invalid: shouldShowFieldError('confirmPassword') }"
                                @focus="setFocusedField('confirmPassword')"
                                @blur="clearFocusedField('confirmPassword')"
                            />

                            <div
                                v-if="shouldShowFieldError('confirmPassword')"
                                class="error-tooltip"
                            >
                                <TriangleAlert class="error-icon" aria-hidden="true" />
                                {{ getFieldValidationMessage('confirmPassword') }}
                            </div>

                        </div>

                    </div>

                    <button
                        type="submit"
                        class="btn-reset-password"
                        :disabled="isSubmitting"
                    >
                        {{ t("auth.resetPassword.submit") }}
                    </button>

                </form>

                <div
                    v-else-if="success"
                    class="reset-success"
                >

                    <div class="success-icon">
                        <LockKeyhole :size="64" />
                    </div>

                    <h2>
                        {{ t("auth.success.passwordResetSuccessTitle") }}
                    </h2>

                    <p>
                        {{ t("auth.success.passwordResetSuccessMessage") }}
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
 * RESET PASSWORD PAGE
 * Contenedor principal de la página de restablecimiento de contraseña.
 *
 * Responsabilidades:
 * - Define la altura mínima de la página
 * - Compensa la altura del header global
 * - Mantiene el contenido visible dentro del viewport
 * ============================================================================ */

.reset-password-page {
    min-height:calc(100vh - 133px);
}

/* ============================================================================
 * RESET PASSWORD CARD
 * Tarjeta principal del formulario.
 *
 * Responsabilidades:
 * - Limita el ancho máximo del contenido
 * - Centra la tarjeta horizontalmente
 * - Define el contenedor para fondos y overlays
 * - Conserva el borde redondeado principal
 * ============================================================================ */

.reset-password-card {
    position:relative;
    width:100%;
    max-width:560px;
    margin:80px auto;
    border-radius:24px;
    overflow:visible;
}

/* ============================================================================
 * RESET PASSWORD CARD BACKGROUND
 * Estilos visuales del fondo de la tarjeta.
 *
 * Responsabilidades:
 * - Define la apariencia principal del fondo
 * - Aplica efectos de iluminación mediante pseudo-elementos
 * - Añade bordes, sombras y efecto glassmorphism
 * ============================================================================ */

.reset-password-card-bg {
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
.reset-password-card-bg::before {
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
.reset-password-card-bg::after {
    content:"";
    position:absolute;
    inset:0;
    border-radius:inherit;
    border:1px solid rgba(255,255,255,.05);
    box-shadow:
        inset 0 0 0 1px rgba(255,255,255,.02);
}

/* ============================================================================
 * RESET PASSWORD CONTENT
 * Contenedor principal del contenido.
 *
 * Responsabilidades:
 * - Posiciona el contenido sobre el fondo
 * - Mantiene el orden de capas mediante z-index
 * - Conserva el radio de la tarjeta
 * ============================================================================ */

.reset-password-content {
    position:relative;
    z-index:2;
    border-radius:inherit;
}

/* ============================================================================
 * RESET PASSWORD HEADER
 * Estilos visuales del encabezado del formulario.
 *
 * Responsabilidades:
 * - Define la apariencia del contenedor del encabezado
 * - Estiliza el título y la descripción
 * - Aplica el fondo degradado y la jerarquía tipográfica
 * ============================================================================ */

.reset-password-header {
    border-radius:inherit;
    border-bottom-left-radius:0;
    border-bottom-right-radius:0;
    padding:28px;
    text-align:center;
    background:linear-gradient(
        120deg,
        rgba(124,58,237,.25),
        rgba(236,72,153,.25)
    );
    border-bottom:1px solid rgba(255,255,255,.08);
}

.reset-password-header h1 {
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

.reset-password-header p {
    margin-top:8px;
    font-size:1rem;
    font-weight:500;
    color:rgba(255,255,255,.72);
}

/* ============================================================================
 * HEADER ONLY
 * Variante del encabezado cuando no existe un formulario.
 *
 * Responsabilidades:
 * - Restaura el borde inferior redondeado
 * - Mantiene una apariencia consistente
 * ============================================================================ */

.header-only {
    border-bottom-left-radius: inherit;
    border-bottom-right-radius: inherit;
}

/* ============================================================================
 * CHECKING SPINNER
 * Indicador mostrado mientras se valida el token de restablecimiento.
 *
 * Responsabilidades:
 * - Centrar el indicador de espera en la vista
 * - Mostrar una animación durante la validación del token
 * ============================================================================ */

.checking-spinner {
    display: flex;
    justify-content: center;
    padding: 10px 0 40px;
}

/* ============================================================================
 * SPINNER
 * Círculo animado del indicador de espera.
 *
 * Responsabilidades:
 * - Mostrar el indicador visual de espera
 * - Aplicar la animación de rotación continua
 * ============================================================================ */
 
.spinner {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 4px solid rgba(255,255,255,.10);
    border-top-color: #8b5cf6;
    animation: spin .9s linear infinite;
}

/* Anima la rotación continua del indicador. */
@keyframes spin {
    to { transform: rotate(360deg); }
}

/* ============================================================================
 * RESET PASSWORD FORM
 * Contenedor del formulario.
 *
 * Responsabilidades:
 * - Define el padding interno
 * - Agrupa todos los campos de entrada
 * ============================================================================ */

.reset-password-form {
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
        0 0 0 1px rgba(109,40,217,.60),
        0 0 20px rgba(109,40,217,.24);
}

.field input.invalid {
    border-color:#5b21b6;
    box-shadow:
        0 0 0 1px rgba(91,33,182,.50),
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
 * PASSWORD TOOLTIP
 * Tooltip informativo de requisitos de contraseña.
 *
 * Responsabilidades:
 * - Muestra información contextual sobre la contraseña
 * - Se posiciona al lado del campo de entrada
 * - Dibuja una flecha indicadora mediante pseudo-elemento
 * ============================================================================ */

.password-tooltip {
    position:absolute;
    top:50%;
    left:calc(100% + 14px);
    transform:translateY(-50%);

    background:rgba(20,20,35,.98);
    border:1px solid rgba(124,58,237,.35);

    border-radius:12px;
    padding:14px 16px;
    min-width:220px;
    z-index:1000;
}

/* Flecha indicadora que apunta hacia el campo de contraseña */
.password-tooltip::before {
    content:"";
    position:absolute;
    left:-6px;
    top:50%;
    transform:translateY(-50%) rotate(45deg);
    width:12px;
    height:12px;
    background:inherit;
    border-left:inherit;
    border-bottom:inherit;
}

/* ============================================================================
 * PASSWORD RULE
 * Estilos visuales de las reglas de la contraseña
 *
 * Responsabilidades:
 * - Define la apariencia base de cada requisito
 * - Alinea el indicador visual y el texto
 * - Resalta los requisitos que ya fueron cumplidos
 * ============================================================================ */

.password-rule {
    display:flex;
    align-items:center;
    gap:10px;
    color:#94a3b8;
    font-size:.85rem;
    margin:6px 0;
    transition:.25s;
}

.password-rule span {
    width:16px;
    text-align:center;
    font-weight:700;
}

.password-rule.ok {
    color:#22c55e;
}

/* ============================================================================
 * PASSWORD STRENGTH
 * Contenedor del indicador del nivel de seguridad de la contraseña.
 *
 * Responsabilidades:
 * - Agrupa barra y texto descriptivo
 * - Organiza los elementos verticalmente
 * ============================================================================ */

.password-strength {
    margin-top:16px;
    display:flex;
    flex-direction:column;
    gap:8px;
}

/* ============================================================================
 * STRENGTH BAR
 * Barra base del indicador.
 *
 * Responsabilidades:
 * - Representa el nivel máximo posible
 * - Sirve de fondo para el progreso
 * ============================================================================ */

.strength-bar {
    height:8px;
    border-radius:999px;
    overflow:hidden;
    background:rgba(255,255,255,.08);
}

/* ============================================================================
 * STRENGTH FILL
 * Barra de progreso del indicador de seguridad de la contraseña.
 *
 * Responsabilidades:
 * - Define la apariencia base de la barra
 * - Anima los cambios de progreso
 * - Cambia el color según el nivel de fortaleza detectado
 * ============================================================================ */

.strength-fill {
    height:100%;
    width:0;
    transition:
        width .35s ease,
        background .35s ease;
}

.strength-fill.weak {
    background:#ef4444;
}

.strength-fill.medium {
    background:#f59e0b;
}

.strength-fill.strong {
    background:#22c55e;
}

/* ============================================================================
 * STRENGTH TEXT
 * Texto descriptivo del nivel de seguridad de la contraseña.
 *
 * Responsabilidades:
 * - Define la apariencia base del indicador
 * - Cambia el color según el nivel de fortaleza detectado
 * - Refuerza el feedback visual para el usuario
 * ============================================================================ */

.strength-text {
    font-size:.8rem;
    font-weight:600;
    transition:.3s;
}

.strength-text.weak {
    color:#ef4444;
}

.strength-text.medium {
    color:#f59e0b;
}

.strength-text.strong {
    color:#22c55e;
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
    display:flex;
    align-items:center;
    gap:8px;
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
    flex:0 0 auto;
    width:16px;
    height:16px;
    color:#facc15;
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
    font-size:.85rem;
    font-weight:500;
    white-space:nowrap;

    background:
        linear-gradient(
            180deg,
            rgba(24,18,45,.98),
            rgba(18,14,35,.98)
        );
    border:1px solid rgba(168,85,247,.45);
    box-shadow:
        0 12px 30px rgba(0,0,0,.45),
        0 0 12px rgba(168,85,247,.18),
        inset 0 0 12px rgba(168,85,247,.05);
    color:#f8fafc;

    z-index:100;
}

/* Flecha indicadora que apunta hacia el campo con error */
.error-tooltip::before {
    content:"";
    position:absolute;
    left:-6px;
    top:50%;
    transform:translateY(-50%) rotate(45deg);
    width:12px;
    height:12px;
    background:inherit;
    border-left:inherit;
    border-bottom:inherit;
}

/* ============================================================================
 * RESET PASSWORD BUTTON
 * Estilos del botón principal del formulario.
 *
 * Responsabilidades:
 * - Define la apariencia base del botón
 * - Aplica estilos para los estados deshabilitado y hover
 * - Proporciona feedback visual durante la interacción
 * ============================================================================ */

.btn-reset-password {
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

.btn-reset-password:disabled {
    opacity:.65;
    cursor:not-allowed;
    box-shadow:none;
    transform:none;
}

.btn-reset-password:not(:disabled):hover {
    box-shadow:
        0 0 10px rgba(255,0,85,.20),
        0 0 20px rgba(236,72,153,.10);
}

/* ============================================================================
 * RESET SUCCESS
 * Estilos de la pantalla de confirmación.
 *
 * Responsabilidades:
 * - Define la distribución del contenido
 * - Estiliza el título y la descripción
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
    color: #d4af37;

    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.15));    
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
    .reset-password-card {
        margin: 60px auto;
    }

    .password-tooltip,
    .error-tooltip {
        left: auto;
        right: 0;
        transform: translateY(-50%);
    }
}

@media (max-width: 768px) {
    .reset-password-page {
        min-height: calc(100dvh - 133px);
        padding: 14px;
    }

    .reset-password-card {
        margin: 24px auto;
        max-width: 100%;
    }

    .reset-password-header {
        padding: 20px;
    }

    .reset-password-form {
        padding: 20px;
    }

    .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    /* TOOLTIP: versión mobile limpia */
    .password-tooltip,
    .error-tooltip {
        position: relative;
        top: auto;
        left: auto;
        transform: none;

        width: 100%;
        min-width: unset;

        margin-top: 8px;
        white-space: normal;
    }

    .password-tooltip::before,
    .error-tooltip::before {
        display: none;
    }

    .btn-reset-password {
        padding: 13px;
        font-size: 0.95rem;
    }

    .reset-password-header h1 {
        font-size: 1.35rem;
    }

    .reset-password-header p {
        font-size: 0.95rem;
    }
}

@media (max-width: 480px) {
    .reset-password-page {
        padding: 10px;
    }

    .reset-password-card {
        margin: 16px auto;
    }

    .reset-password-form {
        padding: 16px;
    }

    .reset-password-header {
        padding: 16px;
    }

    .field input {
        padding: 12px 14px;
    }

    .btn-reset-password {
        font-size: 0.9rem;
        padding: 12px;
    }

    .password-rule {
        font-size: 0.78rem;
    }

    .strength-text {
        font-size: 0.75rem;
    }
}

</style>
