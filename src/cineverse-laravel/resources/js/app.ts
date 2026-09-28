/* ============================================================================
 * ENTRYPOINT: app.ts
 * ============================================================================
 *
 * Punto de entrada real del frontend dentro del proyecto Laravel/Inertia.
 * Carga el CSS global, inicia Inertia, crea la aplicación Vue, registra
 * los plugins necesarios de CineVerse y monta la app sobre el contenedor que
 * Laravel entrega desde la vista base.
 *
 * Dentro de Laravel, este archivo cumple el rol de entrada que antes tenía
 * main.ts en el frontend standalone. Ese main.ts ya no es necesario en esta
 * copia integrada porque Laravel/Vite inicia la app desde app.ts.
 * ============================================================================ */

import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createApp, DefineComponent, h } from 'vue';
import { ZiggyVue } from '../../vendor/tightenco/ziggy';
import { createPinia } from 'pinia';
import piniaPluginPersistedState from 'pinia-plugin-persistedstate';
import { VueQueryPlugin } from '@tanstack/vue-query';
import router from './cineverse/core/router';
import i18n from './cineverse/core/i18n';
import { useAuthStore } from './cineverse/features/auth/stores/useAuthStore';

// Nombre usado por Inertia para componer el título del documento.
// Si no existe VITE_APP_NAME en .env, Laravel queda como valor por defecto.
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Inicia Inertia y conecta la página puente de Laravel con la aplicación Vue.
// En este proyecto Laravel solo se renderiza la página puente "CineVerse"
// y Vue Router se encarga de las rutas internas como /es, /es/movies,
// /es/login, /es/profile, etc.
createInertiaApp({
    // Define el título del documento usando el nombre de la app Laravel.
    title: (title) => `${title} - ${appName}`,

    // Resuelve componentes Inertia desde resources/js/Pages.
    // Actualmente la página importante es Pages/CineVerse.vue, que monta
    // el frontend CineVerse completo.
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob<DefineComponent>('./Pages/**/*.vue'),
        ),

    // Recibe el contenedor HTML, el componente Inertia resuelto y las props
    // enviadas por Laravel. Acá se crea y configura la instancia Vue final.
    setup({ el, App, props, plugin }) {        
        // Pinia maneja estado global de CineVerse: auth, favoritos, etc.
        const pinia = createPinia();

        // Permite persistir stores seleccionados en localStorage.
        pinia.use(piniaPluginPersistedState);

        // Crea la app Vue usando el componente raíz que entrega Inertia.
        const app = createApp({ render: () => h(App, props) });

        // Registra plugins globales usados por Laravel, Inertia y CineVerse.
        app
            .use(plugin)
            .use(pinia)
            .use(router)
            .use(VueQueryPlugin)
            .use(i18n)
            .use(ZiggyVue);

        // Reconstruye la sesión del usuario consultando al backend Laravel.
        // Corre en paralelo; las rutas que necesitan certeza de auth esperan
        // esta misma promesa desde el guard de Vue Router.
        const authStore = useAuthStore();
        authStore.initialize();

        // En Laravel/Inertia este es el punto real donde se monta CineVerse.
        // Se espera a que Vue Router resuelva la navegación inicial para que
        // los guards de rutas exclusivas para invitados puedan redirigir antes
        // del primer render. Así, si el usuario ya está logueado y entra a
        // login, registro o recuperar contraseña, va directo a Inicio sin
        // mostrar por un instante el layout vacío con header y footer.
        router.isReady().then(() => {
            app.mount(el);
        });
    },

    // Color de la barra de progreso que muestra Inertia durante navegaciones.
    progress: {
        color: '#4B5563',
    },
});
