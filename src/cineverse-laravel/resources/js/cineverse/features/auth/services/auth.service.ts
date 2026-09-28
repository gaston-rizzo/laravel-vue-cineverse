/* ============================================================================
 * SERVICE: auth.service.ts
 * ============================================================================
 *
 * Servicio para manejar autenticación contra rutas web de Laravel/Breeze.
 * ============================================================================ */

import webApi from "@/core/api/webApi";

import type {
  LoginPayload,
  RegisterPayload,
  ResendVerificationEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  LoginResponse,
  AuthenticatedUserResponse,
} from "@/features/auth/types/auth";

/**
 * Registra un nuevo usuario en Laravel.
 */
export const registerUser = async (payload: RegisterPayload) => {
  await webApi.post("/register", payload);
};

/**
 * Inicia sesión con las credenciales del usuario.
 */
export const loginUser = async (payload: LoginPayload): Promise<LoginResponse> => {
  await webApi.post("/login", payload);
  return getAuthenticatedUser();
};

/**
 * Obtiene el usuario actualmente autenticado segun la sesión activa.
 */
export const getAuthenticatedUser = async (): Promise<AuthenticatedUserResponse> => {
  const { data } = await webApi.get<AuthenticatedUserResponse>("/user");
  return data;
};

/**
 * Reenvia el email de verificacion de cuenta.
 */
export const resendVerificationEmail = async (payload: ResendVerificationEmailPayload) => {
  await webApi.post("/email/verification-notification", payload);
};

/**
 * Solicita el envio de un email para recuperar la contrasena.
 */
export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  await webApi.post("/forgot-password", payload);
};

/**
 * Establece una nueva contrasena a partir del token de recuperacion.
 */
export const resetPassword = async (payload: ResetPasswordPayload) => {
  await webApi.post("/reset-password", payload);
};

/**
 * Cierra la sesión del usuario autenticado.
 */
export const logoutUser = async (csrfToken: string): Promise<void> => {
  await webApi.post(
    "/logout",
    {},
    { headers: { "X-CSRF-Token": csrfToken } }
  );
};