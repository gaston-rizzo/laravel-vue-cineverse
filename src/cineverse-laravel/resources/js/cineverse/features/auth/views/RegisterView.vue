<script setup lang="ts">

/* ============================================================================
 * VIEW: RegisterView.vue
 * ============================================================================
 *
 * Formulario de registro de usuario. Valida en el frontend, envia al
 * backend, y traduce los errores de validacion de Laravel a mensajes
 * de campo o banner general. Al tener exito, muestra el mensaje de
 * verificacion de email en vez de redirigir.
 * ============================================================================ */

import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
    TriangleAlert
} from "lucide-vue-next";

import {
    registerUser
} from "@/features/auth/services/auth.service";

import {
    validateRegisterForm,
    validateUsername,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialCharacter,
    getPasswordStrength,
    getPasswordStrengthLabel,
    USERNAME_MAX_LENGTH,
    EMAIL_MAX_LENGTH,
    PASSWORD_MAX_LENGTH
} from "@/features/auth/validation/register.validation";

import type {
    RegisterErrors
} from "@/features/auth/types/auth";

// Traducción de textos e idioma actual.
const { t, locale } = useI18n();

// Campos del formulario, en texto plano (la validación vive en register.validation.ts)
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

type RegisterField = "username" | "email" | "password" | "confirmPassword";

const registerFields: RegisterField[] = [
    "username",
    "email",
    "password",
    "confirmPassword"
];

// True luego del primer intento de submit; habilita la validación en tiempo real
// en los watchers de abajo. Antes del primer submit no queremos marcar errores
// mientras el usuario todavía está escribiendo por primera vez.
const submitted = ref(false);

// se muestran como tooltip individual junto al input correspondiente
const errors = ref<RegisterErrors>({});

// Controla si se muestra el tooltip de reglas de password o el de error;
// solo tiene sentido mientras el input de password tiene foco
const passwordFocused = ref(false);
const focusedField = ref<RegisterField | null>(null);
const hoveredField = ref<RegisterField | null>(null);

// Mensaje de error general (banner), para errores que no corresponden a un campo.
const formError = ref("");

// Alterna entre el formulario y la pantalla de "revisá tu email" al finalizar
const registerSuccess = ref(false);

// Evita doble submit mientras la request al backend está en curso
const isSubmitting = ref(false);

// Lista de reglas de password (longitud, mayúscula, número, etc.) con su
// estado actual (ok/no ok), usada para pintar el checklist del tooltip
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

// Nivel numérico de fortaleza de la contraseña (0-5), usado para el ancho de la barra
const passwordStrength = computed(() =>
    getPasswordStrength(password.value)
);

// Etiqueta textual ("weak" | "medium" | "strong") derivada del nivel numérico,
// usada tanto para el texto como para las clases de color de la barra
const passwordStrengthLabel = computed(() =>
    getPasswordStrengthLabel(passwordStrength.value)
);

const firstErroredField = computed<RegisterField | null>(() =>
    registerFields.find((field) => Boolean(errors.value[field])) ?? null
);

function setFocusedField(field: RegisterField) {
    focusedField.value = field;
}

function clearFocusedField(field: RegisterField) {
    if (focusedField.value === field) {
        focusedField.value = null;
    }
}

function setHoveredField(field: RegisterField) {
    hoveredField.value = field;
}

function clearHoveredField(field: RegisterField) {
    if (hoveredField.value === field) {
        hoveredField.value = null;
    }
}

function shouldShowFieldError(field: RegisterField) {
    if (!errors.value[field]) {
        return false;
    }

    const activeField = focusedField.value ?? hoveredField.value;

    if (activeField) {
        return activeField === field;
    }

    return firstErroredField.value === field;
}

function getFieldValidationMessage(field: RegisterField) {
    const error = errors.value[field];
    return error ? getValidationMessage(error) : "";
}

/**
 * Traduce una clave de error de validación a su mensaje correspondiente.
 * Las claves genéricas (required, invalidEmail) y las de unicidad
 * (username/email ya existentes) viven en namespaces distintos de i18n,
 * por eso los primeros casos se resuelven aparte y el resto cae al
 * namespace por defecto de "auth.register.validation".
 */
function getValidationMessage(key: string) {

    switch (key) {

        case "required":
            return t("auth.validation.required");

        case "invalidEmail":
            return t("auth.validation.invalidEmail");

        case "usernameAlreadyExists":
            return t("auth.errors.usernameAlreadyExists");

        case "emailAlreadyExists":
            return t("auth.errors.emailAlreadyExists");

        default:
            return t(`auth.register.validation.${key}`);
    }
}

/**
 * Valida username en vivo, pero solo después del primer submit
 * (ver "submitted"), para no mostrar errores mientras el usuario
 * todavía está completando el campo por primera vez.
 */
watch(username, (value) => {

    if (!submitted.value) return;

    const error = validateUsername(value);

    if (error) {
        errors.value.username = error;
    } else {
        delete errors.value.username;
    }
});

/**
 * Valida email en vivo, solo después del primer submit
 * (mismo criterio que el watcher de username).
 */
watch(email, (value) => {

    if (!submitted.value) return;

    const error = validateEmail(value);

    if (error) {
        errors.value.email = error;
    } else {
        delete errors.value.email;
    }
});

/**
 * Valida password en vivo, solo después del primer submit
 * (mismo criterio que los watchers de arriba). Nótese que esto es
 * independiente del checklist de "passwordRequirements": ese checklist
 * se muestra siempre que el input tiene foco, mientras que este error
 * de validación solo aparece cuando el input pierde el foco y no está
 * enfocado (ver v-else-if en el template).
 */
watch(password, (value) => {

    if (!submitted.value) return;

    const error = validatePassword(value);

    if (error) {
        errors.value.password = error;
    } else {
        delete errors.value.password;
    }

    const confirmPasswordError = validateConfirmPassword(value, confirmPassword.value);

    if (confirmPasswordError) {
        errors.value.confirmPassword = confirmPasswordError;
    } else {
        delete errors.value.confirmPassword;
    }
});

watch(confirmPassword, (value) => {

    if (!submitted.value) return;

    const error = validateConfirmPassword(password.value, value);

    if (error) {
        errors.value.confirmPassword = error;
    } else {
        delete errors.value.confirmPassword;
    }
});

/**
 * Envía el registro. Flujo:
 * 1) Evita doble submit si ya hay una request en curso
 * 2) Habilita la validación en tiempo real de los watchers (submitted = true)
 * 3) Limpia errores previos y corre la validación de frontend; si falla,
 *    corta acá sin llegar a golpear el backend
 * 4) Llama al backend; si responde con éxito, muestra la pantalla de
 *    verificación de email en vez de redirigir
 * 5) Si el backend devuelve un error, lo traduce a error de campo puntual
 */
const register = async () => {

    if (isSubmitting.value) {
        return;
    }

    // A partir de acá los watchers de arriba validan en tiempo real
    submitted.value = true;

    errors.value = {};
    formError.value = "";

    type Lang = "en" | "es";
    const lang = locale.value as Lang;

    const form = {
        username: username.value,
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value
    };

    errors.value = validateRegisterForm(form);

    if (Object.keys(errors.value).length > 0) {
        return;
    }

    isSubmitting.value = true;

    try {

        await registerUser({
            username: form.username,
            email: form.email,
            password: form.password,
            password_confirmation: form.confirmPassword,
            language: lang
        });

        formError.value = "";
        registerSuccess.value = true;
    }
    catch (error: any) {
        const status = error.response?.status;

        if (status >= 500) {
            formError.value = "internalServerError";
            return;
        }

        const laravelErrors = error.response?.data?.errors;

        if (laravelErrors?.username) {
            const usernameError = String(laravelErrors.username[0] ?? "").toLowerCase();

            if (usernameError.includes("unique") || usernameError.includes("taken") || usernameError.includes("registrado") || usernameError.includes("existe")) {
                errors.value.username = "usernameAlreadyExists";
                return;
            }

            errors.value.username = validateUsername(username.value) ?? "usernameInvalid";
            return;
        }

        if (laravelErrors?.email) {
            const emailError = String(laravelErrors.email[0] ?? "").toLowerCase();

            if (emailError.includes("unique") || emailError.includes("taken") || emailError.includes("registrado") || emailError.includes("existe")) {
                errors.value.email = "emailAlreadyExists";
                return;
            }

            if (emailError === "email_delivery_failed") {
                formError.value = "emailDeliveryFailed";
                return;
            }

            errors.value.email = validateEmail(email.value) ?? "invalidEmail";
            return;
        }

        if (laravelErrors?.password) {
            const passwordError = String(laravelErrors.password[0] ?? "").toLowerCase();

            if (passwordError.includes("confirm") || passwordError.includes("coincid")) {
                errors.value.confirmPassword = "passwordsDoNotMatch";
                return;
            }

            errors.value.password = validatePassword(password.value) ?? "passwordMin";
            return;
        }

        if (laravelErrors?.password_confirmation) {
            errors.value.confirmPassword = "passwordsDoNotMatch";
            return;
        }

        formError.value = "unknownError";
    }
    finally {
        isSubmitting.value = false;
    }
};

</script>

<template>

  <div class="page-wrapper register-page">

      <div class="register-card">

        <Transition name="fade">

            <div
                v-if="formError"
                class="form-error-banner"
            >
                <TriangleAlert class="error-icon" aria-hidden="true" />
                {{ t(`auth.errors.${formError}`) }}
            </div>

        </Transition>

        <div class="register-card-bg"></div>

        <div class="register-content">

            <div class="register-header">
                <template v-if="!registerSuccess">
                    <h1>
                        {{ t("auth.register.title") }}
                    </h1>
                    <p>
                        {{ t("auth.register.subtitle") }}
                    </p>
                </template>                
                <template v-else>
                    <h1>
                        {{ t("auth.register.successTitle") }}
                    </h1>
                    <p>
                        {{ t("auth.register.successSubtitle") }}
                    </p>
                </template>
            </div>

            <form
                v-if="!registerSuccess"
                    novalidate
                    autocomplete="off"
                    class="register-form"
                    @submit.prevent="register"
            >

                <div class="field">

                    <label>{{ t("auth.register.username") }}</label>

                    <div
                        class="input-wrapper"
                        @mouseenter="setHoveredField('username')"
                        @mouseleave="clearHoveredField('username')"
                    >

                        <input
                            v-model="username"                         
                            type="text"
                            :maxlength="USERNAME_MAX_LENGTH"
                            :class="{ invalid: shouldShowFieldError('username') }"
                            @focus="setFocusedField('username')"
                            @blur="clearFocusedField('username')"
                        />

                        <div
                            v-if="shouldShowFieldError('username')"
                            class="error-tooltip"
                        >
                            <TriangleAlert class="error-icon" aria-hidden="true" />
                            {{ getFieldValidationMessage('username') }}
                        </div>

                    </div>

                </div>

                <div class="field">

                    <label>{{ t("auth.register.email") }}</label>

                    <div
                        class="input-wrapper"
                        @mouseenter="setHoveredField('email')"
                        @mouseleave="clearHoveredField('email')"
                    >

                        <input
                            v-model="email"
                            type="email"
                            :maxlength="EMAIL_MAX_LENGTH"
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

                    <label>{{ t("auth.register.confirmPassword") }}</label>

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
                    class="btn-register"
                    :disabled="isSubmitting"
                >
                    {{ t("auth.register.submit") }}
                </button>

            </form>

            <div
                v-else
                class="register-success"
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
 * REGISTER PAGE
 * Estilos del contenedor principal de la página de registro.
 *
 * Responsabilidades:
 * - Define la altura mínima del viewport disponible
 * - Asegura que la página ocupe toda la pantalla menos el header
 * ============================================================================ */

.register-page {
  min-height: calc(100vh - 133px);
}

/* ============================================================================
 * REGISTER CARD
 * Contenedor principal del formulario de registro.
 *
 * Responsabilidades:
 * - Define el contenedor visual del formulario
 * - Controla el tamaño máximo y centrado
 * - Permite efectos visuales externos (overflow visible)
 * ============================================================================ */

.register-card {
    position: relative;
    width: 100%;
    max-width: 560px;
    margin: 80px auto;
    border-radius: 24px;   
    overflow: visible;
}

/* ============================================================================
 * REGISTER CARD BACKGROUND
 * Fondo visual decorativo del formulario de registro.
 *
 * Responsabilidades:
 * - Define el fondo con gradientes y efectos glassmorphism
 * - Añade profundidad con sombras y bordes sutiles
 * - Genera efectos de luz decorativa con pseudo-elementos
 * - Refuerza la estética visual del card sin afectar contenido
 * ============================================================================ */

.register-card-bg {
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

/* dos resplandores difusos en las esquinas superior-izquierda e inferior-derecha. */
.register-card-bg::before {
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

/* borde interno sutil, sobre el borde exterior del card. */
.register-card-bg::after {
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
 * REGISTER CONTENT
 * Contenedor interno del contenido del formulario de registro.
 *
 * Responsabilidades:
 * - Superpone el contenido sobre el fondo decorativo
 * - Controla el orden visual con z-index
 * - Mantiene herencia de bordes del card principal
 * ============================================================================ */

.register-content {
    position: relative;
    z-index: 2;
    border-radius: inherit; 
}

/* ============================================================================
 * REGISTER HEADER
 * Encabezado del formulario de registro.
 *
 * Responsabilidades:
 * - Muestra título y descripción del formulario
 * - Aplica estilo visual destacado con degradado
 * - Separa visualmente el header del resto del formulario
 * - Mejora jerarquía visual del contenido principal
 * ============================================================================ */

.register-header {
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

.register-header h1 {
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

.register-header p {
    margin-top:8px;
    font-size:1rem;
    font-weight:500;
    color:rgba(255,255,255,.72);
    letter-spacing:.3px;
}

/* ============================================================================
 * REGISTER FORM
 * Contenedor del formulario de registro.
 *
 * Responsabilidades:
 * - Define el padding interno del formulario
 * - Separa visualmente el contenido del header y bordes del card
 * - Mantiene consistencia de espaciado en los campos
 * ============================================================================ */

.register-form {
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
  margin-bottom: 20px;
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
 * PASSWORD TOOLTIP
 * Estilos del tooltip de ayuda de la contraseña.
 *
 * Responsabilidades:
 * - Muestra reglas de validación de contraseña en tiempo real
 * - Se posiciona junto al input de password sin alterar el layout
 * - Refuerza feedback visual sobre seguridad de la contraseña
 * - Mantiene jerarquía visual clara durante el focus del campo
 * ============================================================================ */

.password-tooltip {
    position: absolute;
    top: 50%;
    left: calc(100% + 14px);
    transform: translateY(-50%);
    background: rgba(20,20,35,.98);
    border: 1px solid rgba(124,58,237,.35);
    border-radius: 12px;
    padding: 14px 16px;
    min-width: 220px;
    z-index: 1000;
}

/* flecha apuntando al input, mismo fondo y bordes que el tooltip. */
.password-tooltip::before {
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
 * PASSWORD RULE
 * Estilos visuales de las reglas de la contraseña.
 *
 * Responsabilidades:
 * - Da estilo a cada regla de la contraseña
 * - Refleja visualmente estado activo/inactivo
 * - Mejora la lectura del feedback del usuario
 * ============================================================================ */

.password-rule {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #94a3b8;
    font-size: .85rem;
    margin: 6px 0;
    transition: .25s;
}

.password-rule span {
    width: 16px;
    text-align: center;
    font-weight: 700;
}

.password-rule.ok {
    color: #22c55e;
}

/* ============================================================================
 * PASSWORD STRENGTH
 * Contenedor del indicador de nivel de seguridad de la contraseña.
 *
 * Responsabilidades:
 * - Agrupa barra y texto de nivel de seguridad
 * - Organiza visualmente el feedback de fortaleza
 * - Mantiene separación consistente entre elementos
 * ============================================================================ */

.password-strength {
    margin-top:16px;
    display:flex;
    flex-direction:column;
    gap:8px;
}

/* ============================================================================
 * STRENGTH BAR
 * Estilos de la barra del nivel de seguridad de la contraseña.
 *
 * Responsabilidades:
 * - Representa visualmente el nivel de seguridad
 * - Contiene y estructura el indicador de progreso
 * - Mantiene un fondo base para el llenado dinámico
 * ============================================================================ */

.strength-bar {
    height:8px;
    border-radius:999px;
    overflow:hidden;
    background:rgba(255,255,255,.08);
}

/* ============================================================================
 * STRENGTH FILL
 * Estilos del indicador dinámico del nivel de seguridad de la contraseña
 *
 * Responsabilidades:
 * - Representa el progreso visual del nivel de seguridad
 * - Cambia de color según el nivel de seguridad
 * - Anima el ancho para feedback en tiempo real
 * ============================================================================
 */

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

/* flecha apuntando al input, mismo fondo y bordes que el tooltip. */
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
 * REGISTER BUTTON
 * Botón principal del formulario de registro.
 *
 * Responsabilidades:
 * - Ejecuta el envío del formulario
 * - Define la apariencia visual principal de la acción de registro
 * - Gestiona estados interactivos (hover y disabled)
 * - Proporciona feedback visual durante la interacción del usuario
 * ============================================================================ */

.btn-register {
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

.btn-register:disabled {
    opacity: .65;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

.btn-register:not(:disabled):hover {
    box-shadow:
        0 0 10px rgba(255,0,85,.20),
        0 0 20px rgba(236,72,153,.10);
}

/* ============================================================================
 * REGISTER SUCCESS
 * Estilos de la pantalla de confirmación.
 *
 * Responsabilidades:
 * - Define la distribución del contenido
 * - Estiliza el título y la descripción
 * - Centra los elementos de la pantalla
 * - Aplica la animación de entrada
 * ============================================================================ */

.register-success {
    padding:50px 40px 60px;
    display:flex;
    flex-direction:column;
    align-items:center;
    text-align:center;
    animation:fadeUp .6s ease;
}

/* aparece con un fundido y sube levemente desde abajo. */
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

.register-success h2 {
    font-size: 1.65rem; 
    font-weight: 700;   
    letter-spacing: 0;
    color:white;
    text-shadow:
        0 0 20px rgba(124,58,237,.20);
}

.register-success p {
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
    .register-card {
        margin: 60px auto;
        max-width: 900px;
    }

    .register-form {
        padding: 24px;
    }

    .register-header {
        padding: 24px;
    }

    .register-header h1 {
        font-size: 1.6rem;
    }

    .password-tooltip,
    .error-tooltip {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        transform: none;

        width: 100%;
        min-width: unset;

        margin-top: 0;
        white-space: normal;

        z-index: 100;
    }

    .password-tooltip {
        z-index: 1000;
    }

    .password-tooltip::before,
    .error-tooltip::before {
        display: none;
    }

    .field input {
        font-size: 0.95rem;
    }

    .btn-register {
        padding: 13px;
    }

    .input-wrapper {
        display: flex;
        flex-direction: column;
    }
}

@media (max-width: 768px) {
    .register-page {
        min-height: calc(100dvh - 133px);
        padding: 16px;
    }

    .register-card {
        margin: 30px auto;
        max-width: 100%;
        border-radius: 20px;
    }

    .register-header {
        padding: 20px;
    }

    .register-header h1 {
        font-size: 1.35rem;
    }

    .register-header p {
        font-size: 0.95rem;
    }

    .register-form {
        padding: 20px;
    }

    .field {
        margin-bottom: 18px;
    }

    .field input {
        padding: 12px 14px;
    }

    .btn-register {
        font-size: 0.95rem;
        padding: 12px;
    }

    .success-icon {
        width: 76px;
        height: 76px;
    }

    .register-success h2 {
        font-size: 1.4rem;
    }
}

@media (max-width: 480px) {
    .register-page {
        padding: 10px;
    }

    .register-card {
        margin: 18px auto;
        border-radius: 18px;
    }

    .register-header {
        padding: 16px;
    }

    .register-header h1 {
        font-size: 1.2rem;
    }

    .register-header p {
        font-size: 0.85rem;
    }

    .register-form {
        padding: 16px;
    }

    .field input {
        padding: 11px 12px;
        font-size: 0.9rem;
    }

    .btn-register {
        padding: 11px;
        font-size: 0.9rem;
    }

    .password-rule {
        font-size: 0.78rem;
    }

    .strength-text {
        font-size: 0.75rem;
    }

    .register-success h2 {
        font-size: 1.2rem;
    }

    .register-success p {
        font-size: 0.9rem;
    }
}

</style>
