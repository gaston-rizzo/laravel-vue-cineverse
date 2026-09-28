/* ============================================================================
 * VALIDATOR: login.validator.ts
 * ============================================================================
 *
 * Funciones de validación utilizadas por el formulario de inicio de sesión.
 *
 * Permite validar individualmente el email y la contraseña, además de
 * validar el formulario completo devolviendo un objeto con los errores
 * correspondientes para cada campo.
 * ============================================================================ */

import type {
    LoginData,
    LoginErrors
} from "../types/auth";

export const EMAIL_MAX_LENGTH = 80;
export const PASSWORD_MAX_LENGTH = 32;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida el email ingresado en el formulario de login.
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
 * Valida la contraseña ingresada en el formulario de login.
 *
 * Solo verifica que el campo no esté vacío y que no supere la longitud
 * máxima permitida. Los requisitos de complejidad se validan únicamente
 * durante el registro.
 */
export function validatePassword(password: string) {

    if (password.trim() === "") {
        return "required";
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        return "passwordMax";
    }

    return undefined;
}

/**
 * Valida el formulario completo de inicio de sesión.
 *
 * Ejecuta las validaciones de cada campo y devuelve un objeto que contiene
 * únicamente los errores encontrados.
 */
export function validateLoginForm(
    form: LoginData
): LoginErrors {

    const errors: LoginErrors = {};

    const emailError = validateEmail(form.email);

    if (emailError) {
        errors.email = emailError;
    }

    const passwordError = validatePassword(form.password);

    if (passwordError) {
        errors.password = passwordError;
    }

    return errors;
}