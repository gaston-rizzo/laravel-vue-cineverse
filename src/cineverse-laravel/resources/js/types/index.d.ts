/* ============================================================================
 * TYPES: index.d.ts
 * ============================================================================
 *
 * Tipos compartidos por las props globales de Inertia.
 *
 * Describe la forma mínima del usuario autenticado que Laravel comparte con Vue
 * y el contenedor PageProps usado por las páginas Inertia.
 * ============================================================================ */

/**
 * Usuario autenticado compartido desde Laravel.
 */
export interface User {
    id: number;
    username: string;
    email: string;
    email_verified_at?: string;
}

/**
 * Props globales disponibles en las páginas Inertia.
 */
export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
