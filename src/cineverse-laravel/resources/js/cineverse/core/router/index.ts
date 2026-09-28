/* ============================================================================
 * ROUTER: ConfiguraciÃ³n de rutas
 * ============================================================================
 *
 * ConfiguraciÃ³n del router de la aplicaciÃ³n.
 *
 * Declara las rutas, configura Vue Router en modo history, conecta URLs con vistas, 
 * sincroniza el idioma de la URL con vue-i18n, define el comportamiento global del
 * scroll y gestiona las redirecciones y las rutas 404.
 * ============================================================================ */
 
// Importamos las funciones necesarias de Vue Router
import { createRouter, createWebHistory } from "vue-router";

import { useAuthStore } from "@/features/auth/stores/useAuthStore";

// Importamos la instancia de i18n para sincronizar idioma con la ruta
import i18n from "../i18n";

const HomeView = () => import("@/features/home/views/HomeView.vue");
const RegisterView = () => import("@/features/auth/views/RegisterView.vue");
const VerifyEmailView = () => import("@/features/auth/views/VerifyEmailView.vue");
const LoginView = () => import("@/features/auth/views/LoginView.vue");
const ForgotPasswordView = () => import("@/features/auth/views/ForgotPasswordView.vue");
const ResetPasswordView = () => import("@/features/auth/views/ResetPasswordView.vue");
const MoviesView = () => import("@/features/movies/views/MoviesView.vue");
const MovieDetailView = () => import("@/features/movies/views/MovieDetailView.vue");
const PersonDetailView = () => import("@/features/person/views/PersonDetailView.vue");
const ProfileView = () => import("@/features/profile/views/ProfileView.vue");
const MyReviewsView = () => import("@/features/profile/views/MyReviewsView.vue");
const MoviesFavoritesView = () => import("@/features/movies/views/MoviesFavoritesView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");

const router = createRouter({
  /**
   * Usamos history mode (sin hash #) para tener URLs limpias
   * como /en/movies en lugar de /#/en/movies.
   *
   * import.meta.env.BASE_URL define la raÃ­z donde estÃ¡ montada la aplicaciÃ³n.
   *
   * Ejemplo en desarrollo:
   * - http://localhost:5173/
   * - BASE_URL = "/"
   * - Resultado: /en/movies funciona correctamente
   *
   * Ejemplo en producciÃ³n (subcarpeta):
   * - https://dominio.com/cineverse/
   * - BASE_URL = "/cineverse/"
   * - Resultado: rutas como /cineverse/en/movies
   *
   * Sin esto, las rutas se romperÃ­an al cambiar el path base del deploy.
   */
  history: createWebHistory(import.meta.env.BASE_URL),
  /**
   * Controla la posiciÃ³n del scroll en cada navegaciÃ³n de Vue Router.
   *
   * Cada vez que cambia la ruta (ej: cambiar de pelÃ­cula,
   * cambiar idioma, ir a otra vista, etc),
   * esta funciÃ³n se ejecuta automÃ¡ticamente.
   *
   * return { top: 0 }:
   * - Hace scroll al inicio de la pÃ¡gina (arriba de todo)
   * - Equivale a: window.scrollTo(0, 0)
   *
   * Problema que soluciona:
   * - Vue Router mantiene el scroll anterior por defecto
   * - Al entrar a una nueva vista, podÃ©s quedar en el medio de la pÃ¡gina
   *
   * Resultado:
   * - Cada nueva vista empieza desde el top
   * - UX consistente y profesional
   */
  scrollBehavior() {    
    return { top: 0 };
  },
  // Rutas de la aplicaciÃ³n
  routes: [
    // Detecta idioma del navegador, si es espaÃ±ol
    // traduce el sitio a espaÃ±ol, sino a ingles
    // Solo se ejecuta cuando se ingresa a "/"
    // No afecta navegaciÃ³n interna
    {
      path: "/",
      redirect: () => {
        // Detecta idioma del navegador (ej: es-AR, en-US)
        const browserLang = navigator.language.toLowerCase();

        // Si empieza con "es" â†’ va a espaÃ±ol
        if (browserLang.startsWith("es")) {
          return "/es";
        }

        // En cualquier otro caso â†’ inglÃ©s
        return "/en";
      },
    },
    // Ruta para Home por idioma
    // Valida que :lang sea solo 'en' o 'es'
    // Evita rutas invÃ¡lidas como: /asdf/movies
    {
      path: "/:lang(en|es)",
      name: "Home",
      component: HomeView,
    },
    // Ruta para la pagina de registro
    {
      path: "/:lang(en|es)/register",
      name: "Register",
      component: RegisterView,
      meta: { requiresGuest: true }
    },
    // Ruta utilizada por el enlace enviado por email para verificar la cuenta.
    {
      path: "/:lang(en|es)/verify-email",
      name: "VerifyEmail",
      component: VerifyEmailView
    },
    // Ruta para la pÃ¡gina de inicio de sesiÃ³n
    {
      path: "/:lang(en|es)/login",
      name: "Login",
      component: LoginView,      
      meta: { requiresGuest: true }
    },
    // Ruta para solicitar la recuperaciÃ³n de contraseÃ±a.
    {
      path: "/:lang(en|es)/forgot-password",
      name: "ForgotPassword",
      component: ForgotPasswordView,
      meta: { requiresGuest: true }
    },
    // Ruta para restablecer la contraseÃ±a mediante el enlace recibido por correo electrÃ³nico.
    {
      path: "/:lang(es|en)/reset-password",
      name: "reset-password",
      component: ResetPasswordView
    },
    // Ruta para el listado de pelÃ­culas
    {
      path: "/:lang(en|es)/movies",
      name: "Movies",
      component: MoviesView,
    },
    // Ruta para ver el detalle de una pelÃ­cula
    // (\\d+): SÃ³lo acepta nÃºmeros
    {
      path: "/:lang(en|es)/movies/:id(\\d+)",
      name: "MovieDetail",
      component: MovieDetailView
    },            
    // Ruta para ver el detalle de una persona
    // (\\d+): SÃ³lo acepta nÃºmeros
    {
      path: "/:lang(en|es)/person/:id(\\d+)",
      name: "Person",
      component: PersonDetailView
    },    
    // Ruta para ver los favoritos
    {
      path: "/:lang(en|es)/favorites",
      name: "Favorites",
      component: MoviesFavoritesView,
    },
    // Ruta para ver el perfil del usuario
    {
      path: "/:lang(en|es)/profile",
      name: "Profile",
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    // Ruta para ver las reviews de un usuario
    {
      path: "/:lang(en|es)/profile/reviews",
      name: "MyReviews",
      component: MyReviewsView,
      meta: { requiresAuth: true }
    },
    // ==========================================
    // 404 - Ruta no encontrada con idioma
    // ==========================================
    // Esta ruta captura cualquier URL que:
    // - Empiece con /en o /es
    // - Pero no coincida con ninguna ruta existente
    //
    // Ejemplos:
    // /es/person/aaa
    // /en/movies/abc
    // /es/loquesea
    //
    // :lang(en|es) â†’ mantiene el idioma en la URL
    // :pathMatch(.*)* â†’ captura cualquier resto de la ruta
    //
    // Cuando matchea:
    // Vue Router renderiza la vista NotFoundView
    // dentro de <router-view>
    //
    // IMPORTANTE:
    // Debe ir despuÃ©s de todas las rutas vÃ¡lidas
    {
      path: "/:lang(en|es)/:pathMatch(.*)*",
      name: "NotFound",
      component: NotFoundView,
    },
    // ==========================================
    // 404 - Ruta no encontrada sin idioma
    // ==========================================
    // Esta ruta captura cualquier URL que:
    // - No tenga /en o /es al inicio
    // - No coincida con ninguna ruta existente
    //
    // Ejemplos:
    // /asdf
    // /123
    // /movies
    // /person/999
    //
    // :pathMatch(.*)* â†’ catch-all global
    //
    // Usa el idioma actual guardado en i18n
    // (Ãºltimo idioma seleccionado por el usuario)
    //
    // Cuando matchea:
    // Vue Router renderiza la vista NotFoundView
    // dentro de <router-view>
    //
    // IMPORTANTE:
    // Esta ruta debe ir siempre Ãºltima
    // porque captura absolutamente todo
    {
      path: "/:pathMatch(.*)*",
      name: "NotFoundNoLang",
      component: NotFoundView,
    }
  ],
});

// ==========================================
// SincronizaciÃ³n automÃ¡tica Router â†” i18n
// ==========================================

// beforeEach: Es una funciÃ³n que se ejecuta antes de cada cambio de ruta.

// Cada vez que el usuario:
//    Hace click en un <router-link>
//    Es redirigido
//    Escribe una URL nueva
//    Cambia de /en a /es
// beforeEach se ejecuta antes de que Vue cargue la nueva vista.

// Cada vez que cambia la URL:
// Lee :lang
// Si es "en" o "es"
// Cambia el idioma de vue-i18n

// Si vas a:
//     /en/movies
//     Idioma â†’ inglÃ©s

// Si vas a:
//   /es/movies
//   Idioma â†’ espaÃ±ol

// ==========================================
// Auth: espera diferida (solo rutas protegidas)
// ==========================================

// authStore.initialize() se dispara en app.ts sin esperarse (no bloquea
// el mount de la app), para que rutas pÃºblicas como Home naveguen de
// inmediato sin depender del backend de auth.
//
// AcÃ¡, en el guard, es donde si se espera esa misma promesa (isInitialized),
// pero solo si la ruta destino requiere autenticaciÃ³n. Si initialize() ya
// terminÃ³ en segundo plano mientras el usuario navegaba, no hay espera real.

// Guard global que se ejecuta antes de cada navegaciÃ³n
// un guard global es una funciÃ³n que se ejecuta antes
//  o despuÃ©s de una navegaciÃ³n.
router.beforeEach(async (to) => {

  const lang = to.params.lang as string;

  if (lang === "en" || lang === "es") {
    i18n.global.locale.value = lang;
  }

  // Tanto las rutas protegidas (requiresAuth) como las exclusivas para
  // invitados (requiresGuest) necesitan saber con certeza si hay una 
  // sesiÃ³n activa antes de decidir si dejan pasar la navegaciÃ³n. Por eso 
  // ambas comparten la misma espera sobre authStore.isInitialized.
  //
  // Rutas pÃºblicas (Home, Movies, etc.) no tienen ninguno de los dos
  // meta, asÃ­ que no entran acÃ¡ y navegan de inmediato sin esperar nada.
  if (to.meta.requiresAuth || to.meta.requiresGuest) {

    const authStore = useAuthStore();

    // Si initialize() todavÃ­a no terminÃ³ (puede seguir en curso desde
    // app.ts, o no haberse disparado nunca), esperamos acÃ¡ a que la
    // sesiÃ³n termine de reconstruirse antes de seguir. initialize()
    // reutiliza la misma promesa en curso, asÃ­ que esto no dispara un
    // segundo fetch al backend aunque app.ts ya lo haya llamado antes.
    if (!authStore.isInitialized) {
      await authStore.initialize();
    }

    // Caso 1: ruta protegida (ej: Profile) sin sesiÃ³n activa.
    // No dejamos entrar: redirige a Login manteniendo el idioma actual.
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return {
        name: "Login",
        params: { lang: lang || i18n.global.locale.value }
      };
    }

    // Caso 2: ruta exclusiva para invitados (ej: Login, Register,
    // ForgotPassword) pero el usuario ya tiene una sesiÃ³n activa.
    // No tiene sentido mostrarle el formulario de login/registro estando
    // ya logueado, asÃ­ que lo mandamos directo a Home.
    if (to.meta.requiresGuest && authStore.isAuthenticated) {
      return {
        name: "Home",
        params: { lang: lang || i18n.global.locale.value }
      };
    }
  }

  return true;
    
});

// Exportamos el router para usarlo en app.ts
export default router;
