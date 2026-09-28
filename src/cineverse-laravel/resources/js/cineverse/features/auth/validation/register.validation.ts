/* ============================================================================
 * VALIDATOR: register.validator.ts
 * ============================================================================
 *
 * Funciones de validación utilizadas por el formulario de registro.
 *
 * Permite validar individualmente el username, email y contraseña,
 * validar el formulario completo y calcular la seguridad de la contraseña
 * para mostrar feedback al usuario durante el registro.
 * ============================================================================ */

import type {
    RegisterData,
    RegisterErrors
} from "../types/auth";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const EMAIL_MAX_LENGTH = 80;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 32;

const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida el nombre de usuario ingresado durante el registro.
 *
 * Comprueba que el campo no esté vacío, respete los límites de longitud
 * permitidos y solo contenga letras, números o guiones bajos.
 */
export function validateUsername(username: string) {

    username = username.trim();

    if (username === "") {
        return "required";
    }

    if (username.length < USERNAME_MIN_LENGTH) {
        return "usernameMin";
    }

    if (username.length > USERNAME_MAX_LENGTH) {
        return "usernameMax";
    }

    if (!USERNAME_REGEX.test(username)) {
        return "usernameInvalid";
    }

    return undefined;
}

/**
 * Valida el email ingresado durante el registro.
 *
 * Comprueba que el campo no esté vacío, que no supere la longitud máxima
 * permitida y que tenga un formato de email válido.
 */
export function validateEmail(email: string) {

    if (email.trim() === "") {
        return "required";
    }

    if (email.length > EMAIL_MAX_LENGTH) {
        return "emailMax";
    }

    if (!EMAIL_REGEX.test(email)) {
        return "invalidEmail";
    }

    return undefined;
}

/**
 * Valida la contraseña ingresada durante el registro.
 *
 * Verifica la longitud mínima y máxima, además de comprobar que incluya
 * mayúsculas, minúsculas, números y caracteres especiales.
 */
export function validatePassword(password: string) {

    if (password.trim() === "") {
        return "required";
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        return "passwordMin";
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        return "passwordMax";
    }

    if (!hasUppercase(password)) {
        return "passwordUppercase";
    }

    if (!hasLowercase(password)) {
        return "passwordLowercase";
    }

    if (!hasNumber(password)) {
        return "passwordNumber";
    }

    if (!hasSpecialCharacter(password)) {
        return "passwordSpecialCharacter";
    }

    return undefined;
}

export function validateConfirmPassword(password: string, confirmPassword: string) {

    if (confirmPassword.trim() === "") {
        return "required";
    }

    if (password !== confirmPassword) {
        return "passwordsDoNotMatch";
    }

    return undefined;
}

/**
 * Valida el formulario completo de registro.
 *
 * Ejecuta las validaciones de todos los campos y devuelve un objeto que
 * contiene únicamente los errores encontrados.
 */
export function validateRegisterForm(
    form: RegisterData
): RegisterErrors {

    const errors: RegisterErrors = {};

    const usernameError = validateUsername(form.username);

    if (usernameError) {
        errors.username = usernameError;
    }

    const emailError = validateEmail(form.email);

    if (emailError) {
        errors.email = emailError;
    }

    const passwordError = validatePassword(form.password);

    if (passwordError) {
        errors.password = passwordError;
    }

    const confirmPasswordError = validateConfirmPassword(
        form.password,
        form.confirmPassword
    );

    if (confirmPasswordError) {
        errors.confirmPassword = confirmPasswordError;
    }

    return errors;
}

/**
 * Indica si la contraseña cumple la longitud mínima requerida.
 */
export function hasMinLength(password: string) {
    return password.length >= PASSWORD_MIN_LENGTH;
}

/**
 * Indica si la contraseña contiene al menos una letra mayúscula.
 */
export function hasUppercase(password: string) {
    return /[A-Z]/.test(password);
}

/**
 * Indica si la contraseña contiene al menos una letra minúscula.
 */
export function hasLowercase(password: string) {
    return /[a-z]/.test(password);
}

/**
 * Indica si la contraseña contiene al menos un número.
 */
export function hasNumber(password: string) {
    return /\d/.test(password);
}

/**
 * Indica si la contraseña contiene al menos un carácter especial.
 */
export function hasSpecialCharacter(password: string) {
    return /[^A-Za-z0-9]/.test(password);
}

/**
 * Calcula la seguridad de la contraseña.
 *
 * Asigna un punto por cada criterio cumplido (longitud mínima, mayúscula,
 * minúscula, número y carácter especial) y devuelve un puntaje entre 0 y 5.
 */
export function getPasswordStrength(password: string) {

    let score = 0;

    if (hasMinLength(password)) score++;
    if (hasUppercase(password)) score++;
    if (hasLowercase(password)) score++;
    if (hasNumber(password)) score++;
    if (hasSpecialCharacter(password)) score++;

    return score;
}

/**
 * Convierte el puntaje de la seguridad de la contraseña en una etiqueta legible para la UI.
 */
export function getPasswordStrengthLabel(score: number) {

    if (score <= 2) {
        return "weak";
    }

    if (score <= 4) {
        return "medium";
    }

    return "strong";
}
