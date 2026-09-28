/* ============================================================================
 * TYPES: global.d.ts
 * ============================================================================
 *
 * Declaraciones globales usadas por TypeScript en la app Vue/Inertia.
 *
 * Extiende objetos globales como window, route de Ziggy, propiedades de Vue e
 * interfaces de Inertia para que el frontend tenga tipos correctos.
 * ============================================================================ */

import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { AxiosInstance } from 'axios';
import { route as ziggyRoute } from 'ziggy-js';
import { PageProps as AppPageProps } from './';

declare global {
    /**
     * Axios queda disponible globalmente desde bootstrap.ts.
     */
    interface Window {
        axios: AxiosInstance;
    }

    /**
     * Helper global de Ziggy para generar URLs nombradas de Laravel.
     */
    /* eslint-disable no-var */
    var route: typeof ziggyRoute;
}

declare module 'vue' {
    /**
     * Permite usar this.route dentro de componentes Vue si fuera necesario.
     */
    interface ComponentCustomProperties {
        route: typeof ziggyRoute;
    }
}

declare module '@inertiajs/core' {
    /**
     * Une las props base de Inertia con las props propias de CineVerse.
     */
    interface PageProps extends InertiaPageProps, AppPageProps {}
}
