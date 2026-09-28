/* ============================================================================
 * INTERFACES: auth.ts
 * ============================================================================
 *
 * Representa los datos de autenticación de la aplicación: el usuario
 * autenticado, los payloads enviados al backend para cada acción (registro,
 * login, recuperación de contraseña, etc.), las respuestas del backend y
 * los errores de validación de los formularios de auth.
 *
 * Estas interfaces se utilizan para:
 * - Enviar los datos al backend al registrarse, loguearse o recuperar
 *   la contraseña
 * - Representar al usuario autenticado y su sesión
 * - Tipar las respuestas del backend para cada endpoint de auth
 * - Tipar los errores de validación mostrados en los formularios
 * ============================================================================ */

/* ============================================================================
 * INTERFACE: RegisterData
 * ----------------------------------------------------------------------------
 * Representa los datos del formulario de registro en el frontend.
 *
 * Responsabilidades:
 * - Almacenar los datos ingresados por el usuario
 * - Ser utilizada durante la validación del formulario
 * - Servir como fuente para construir el RegisterPayload
 * ============================================================================ */

export interface RegisterData {
  // Nombre de usuario elegido por el usuario
  username: string;
  // Email del usuario
  email: string;
  // Contraseña elegida por el usuario
  password: string;
  // Confirmación de la contraseña elegida
  confirmPassword: string;
}

/* ============================================================================
 * INTERFACE: LoginData
 * ----------------------------------------------------------------------------
 * Representa los datos del formulario de inicio de sesión en el frontend.
 *
 * Responsabilidades:
 * - Almacenar las credenciales ingresadas por el usuario
 * - Ser utilizada durante la validación del formulario
 * - Servir como fuente para construir el LoginPayload
 * ============================================================================ */

export interface LoginData {
  // Email del usuario
  email: string;
  // Contraseña del usuario
  password: string;
}

/* ============================================================================
 * INTERFACE: AuthUser
 * ----------------------------------------------------------------------------
 * Representa al usuario autenticado en la aplicación.
 *
 * Responsabilidades:
 * - Identificar al usuario de forma única
 * - Exponer sus datos básicos (username, email)
 * - Registrar la fecha de creación de la cuenta
/* ============================================================================ */

export interface AuthUser {
  // ID único del usuario en la base de datos
  id: number;
  // Nombre de usuario elegido al registrarse
  username: string;
  // Email del usuario
  email: string;
  // Fecha de creación de la cuenta en formato ISO
  // Ej: "2024-03-10T12:00:00.000Z"
  created_at: string;
}

/* ============================================================================
 * INTERFACE: RegisterPayload
 * ----------------------------------------------------------------------------
 * Representa los datos enviados al backend para registrar un nuevo usuario.
 *
 * Responsabilidades:
 * - Enviar los datos básicos del nuevo usuario
 * - Indicar el idioma en el que se debe enviar el email de verificación
/* ============================================================================ */

export interface RegisterPayload {
  // Nombre de usuario elegido por el usuario
  username: string;
  // Email del usuario
  email: string;
  // Contraseña elegida por el usuario
  password: string;
  // Confirmación de la contraseña esperada por Laravel
  password_confirmation: string;
  // Idioma del email de verificación enviado al usuario
  language: "en" | "es";
}

/* ============================================================================
 * INTERFACE: LoginPayload
 * ----------------------------------------------------------------------------
 * Representa los datos enviados al backend para iniciar sesión.
 *
 * Responsabilidades:
 * - Enviar las credenciales del usuario
/* ============================================================================ */

export interface LoginPayload {
  // Email del usuario
  email: string;
  // Contraseña del usuario
  password: string;
}

/* ============================================================================
 * INTERFACE: ResendVerificationEmailPayload
 * ----------------------------------------------------------------------------
 * Representa los datos enviados al backend para reenviar el email de
 * verificación de cuenta.
 *
 * Responsabilidades:
 * - Identificar el email al que se debe reenviar la verificación
 * - Indicar el idioma en el que se debe enviar el email
/* ============================================================================ */

export interface ResendVerificationEmailPayload {
  // Email del usuario que solicita el reenvío
  email: string;
  // Idioma del email de verificación
  language: "en" | "es";
}

/* ============================================================================
 * INTERFACE: ForgotPasswordPayload
 * ----------------------------------------------------------------------------
 * Representa los datos enviados al backend para iniciar la recuperación
 * de contraseña.
 *
 * Responsabilidades:
 * - Identificar el email al que se debe enviar el link de recuperación
 * - Indicar el idioma en el que se debe enviar el email
/* ============================================================================ */

export interface ForgotPasswordPayload {
  // Email del usuario que solicita la recuperación
  email: string;
  // Idioma del email de recuperación de contraseña
  language: "en" | "es";
}

/* ============================================================================
 * INTERFACE: ResetPasswordPayload
 * ----------------------------------------------------------------------------
 * Representa los datos enviados al backend para establecer una nueva
 * contraseña.
 *
 * Responsabilidades:
 * - Identificar el token de recuperación recibido por email
 * - Enviar la nueva contraseña elegida por el usuario
/* ============================================================================ */

export interface ResetPasswordPayload {
  email: string;
  // Token de recuperación recibido en el email
  token: string;
  // Nueva contraseña elegida por el usuario
  password: string;
  password_confirmation: string;
}

/* ============================================================================
 * INTERFACE: LoginResponse
 * ----------------------------------------------------------------------------
 * Representa la respuesta del backend al iniciar sesión correctamente.
 *
 * Responsabilidades:
 * - Indicar el resultado de la request (success, code)
 * - Exponer el usuario autenticado y el token CSRF de la sesión
/* ============================================================================ */

export interface LoginResponse {
  // Indica si la request se resolvió correctamente
  // Código interno de la respuesta (útil para manejo de errores)
    // Usuario autenticado
    user: AuthUser;
    // Token CSRF necesario para requests posteriores (ej: logout)
    csrf_token: string;
}

/* ============================================================================
 * INTERFACE: AuthenticatedUserResponse
 * ----------------------------------------------------------------------------
 * Representa la respuesta del backend al consultar el usuario
 * actualmente autenticado.
 *
 * Responsabilidades:
 * - Indicar el resultado de la request (success, code)
 * - Exponer el usuario autenticado y el token CSRF de la sesión
/* ============================================================================ */

export interface AuthenticatedUserResponse {
  // Indica si la request se resolvió correctamente
  // Código interno de la respuesta (útil para manejo de errores)
    // Usuario autenticado
    user: AuthUser;
    // Token CSRF necesario para requests posteriores (ej: logout)
    csrf_token: string;
}

/* ============================================================================
 * INTERFACE: LogoutResponse
 * ----------------------------------------------------------------------------
 * Representa la respuesta del backend al cerrar sesión.
 *
 * Responsabilidades:
 * - Indicar si el cierre de sesión se realizó correctamente
/* ============================================================================ */

export interface LogoutResponse {
  // Indica si el logout se realizó correctamente
}

/* ============================================================================
 * INTERFACE: RegisterErrors
 * ----------------------------------------------------------------------------
 * Representa los errores de validación del formulario de registro.
 *
 * Responsabilidades:
 * - Exponer un mensaje de error por cada campo del formulario
/* ============================================================================ */

export interface RegisterErrors {
  // Mensaje de error del campo username, si existe
  username?: string;
  // Mensaje de error del campo email, si existe
  email?: string;
  // Mensaje de error del campo password, si existe
  password?: string;
  // Mensaje de error del campo confirmPassword, si existe
  confirmPassword?: string;
}

/* ============================================================================
 * INTERFACE: LoginErrors
 * ----------------------------------------------------------------------------
 * Representa los errores de validación del formulario de login.
 *
 * Responsabilidades:
 * - Exponer un mensaje de error por cada campo del formulario
/* ============================================================================ */

export interface LoginErrors {
  // Mensaje de error del campo email, si existe
  email?: string;
  // Mensaje de error del campo password, si existe
  password?: string;
}

/* ============================================================================
 * INTERFACE: ForgotPasswordErrors
 * ----------------------------------------------------------------------------
 * Representa los errores de validación del formulario de recuperación
 * de contraseña.
 *
 * Responsabilidades:
 * - Exponer un mensaje de error del campo email
/* ============================================================================ */

export interface ForgotPasswordErrors {
  // Mensaje de error del campo email, si existe
  email?: string;
}

/* ============================================================================
 * INTERFACE: ResetPasswordErrors
 * ----------------------------------------------------------------------------
 * Representa los errores de validación del formulario de reseteo
 * de contraseña.
 *
 * Responsabilidades:
 * - Exponer un mensaje de error por cada campo del formulario
/* ============================================================================ */

export interface ResetPasswordErrors {
  // Mensaje de error del campo password, si existe
  password?: string;
  // Mensaje de error del campo confirmPassword, si existe
  confirmPassword?: string;
}
