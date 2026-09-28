<script setup lang="ts">

/* ============================================================================
 * COMPONENT: AppHeader.vue
 * ============================================================================
 *
 * Header principal de la aplicación: logo, navegación, búsqueda, selector de
 * idioma, acceso/perfil y modo colapsable, con efectos visuales (glass, glow,
 * ruido) acordes a la estética general de la UI.
 * ============================================================================ */

import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import { User } from "lucide-vue-next";

import logo from "@/assets/logo.webp";

import { useAuthStore } from "@/features/auth/stores/useAuthStore";

import { useHeaderCollapsed } from "../composables/useHeaderCollapsed";

import UserMenu from "./UserMenu.vue";

// Traducción de textos e idioma actual.
const { t, locale } = useI18n();
// Router para la navegación entre vistas.
const router = useRouter();
// Router para la navegación entre vistas.
const route = useRoute();
// Store con el estado de autenticación del usuario.
const authStore = useAuthStore();

// Estado del header colapsable, agrupado en un composable compartido.
const { isHeaderCollapsed, toggleHeader } = useHeaderCollapsed();

function getInitialSearchQuery() {
  const isMoviesPath = /^\/(?:es|en)\/movies\/?$/.test(window.location.pathname);
  const initialSearch = new URLSearchParams(window.location.search).get("search");

  if (!isMoviesPath || !initialSearch) return "";

  return initialSearch;
}

// Texto local del input de búsqueda. Solo toma la URL al crear el header.
const searchQuery = ref(getInitialSearchQuery());

// true cuando el usuario bajó más de 40px, activa el modo "glass" del header.
const scrolled = ref(false);

// Desactiva el enlace del logo cuando ya estamos en la Home.
const isHomeRoute = computed(() => route.name === "Home");

/**
 * Registra el listener de scroll global que activa el modo "glass" del
 * header. Se remueve en onUnmounted para no dejarlo corriendo si el
 * componente se destruye.
 */
onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

/**
 * Remueve el listener de scroll al desmontar el componente,
 * evitando fugas de memoria o ejecuciones sobre un componente ya destruido.
 */
onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});

// Activa el modo "glass" del header una vez superado el umbral de scroll
function handleScroll() {
  scrolled.value = window.scrollY > 40;
}

/**
 * Navega a Movies con el término buscado como query string, manteniendo
 * el idioma actual. También fuerza list: "discover" y sort: "vote_average.desc"
 * para que el panel de filtros quede coherente con la búsqueda (listado y
 * orden reflejados, no vacíos). Si la búsqueda repite la que ya está en la
 * URL, fuerza una recarga completa (router.go) porque Vue Router no vuelve
 * a navegar cuando la URL no cambia.
 */
function handleSearch() {
  const query = searchQuery.value.trim();
  const current = route.query.search;

  if (!query) return;
  if (query.length < 3) return; // evita búsquedas ruidosas o irrelevantes

  if (current === query) {
    router.go(0);
    return;
  }

  router.push({
    name: "Movies",
    params: { lang: route.params.lang },
    // Fuerza list y sort para que el panel de filtros los refleje.
    // Ej: buscar "batman" → Listado: "Descubrir", Ordenar: "Mejor rating"
    // Sin esto, la URL quedaría solo con {search: "batman"},
    // useMoviesFilters resetearía listType a "popular" (default) y sortBy
    // a null, y el combo "Ordenar" se mostraría vacío aunque la búsqueda
    // igual ordene por rating (fallback en useMoviesQuery).    
    query: {
      search: query,
      list: "discover",
      sort: "vote_average.desc"   
    },
  });
}

/**
 * Cambia el idioma activo manteniendo la ruta y el resto de los parámetros
 * actuales, para no perder el contexto de navegación del usuario.
 */
function switchLang(lang: string) {
  router.push({
    name: route.name as string,
    params: { ...route.params, lang },
  });
}

</script>

<template>

  <header
    class="app-header"
    :class="{ scrolled, collapsed: isHeaderCollapsed }"
  >

    <!-- gradiente de fondo, visible solo mientras no hay scroll -->
    <div class="header-gradient" :class="{ hidden: scrolled }"></div>

    <div class="header-container">

      <!-- LOGO -->
      <RouterLink
        :to="{ name: 'Home', params: { lang: locale } }"
        class="logo-group"
        :class="{ inactive: isHomeRoute }"
      >
        <img :src="logo" alt="CineVerse" class="logo" />

        <span class="logo-text">
          <span class="logo-shine"></span>
          CineVerse
        </span>
      </RouterLink>

      <!-- NAV -->
      <nav class="nav">

        <RouterLink
          :to="{ name: 'Home', params: { lang: locale } }"
          class="nav-item"
        >
          {{ t("nav.home") }}
        </RouterLink>

        <RouterLink
          :to="{ name: 'Movies', params: { lang: locale } }"
          class="nav-item"
        >
          {{ t("nav.movies") }}
        </RouterLink>

        <RouterLink
          :to="{ name: 'Favorites', params: { lang: locale } }"
          class="nav-item"
        >
          {{ t("nav.favorites") }}
        </RouterLink>

      </nav>

      <!-- RIGHT SIDE -->
      <div class="right-side">

        <!-- SEARCH -->
        <form @submit.prevent="handleSearch">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('header.searchPlaceholder')"
            class="search"
          />
        </form>

        <!-- LANGUAGE -->
        <div class="lang-switch">
          <button
            @click="switchLang('es')"
            :class="{ active: locale === 'es' }"
            :disabled="locale === 'es'"
          >
            ES
          </button>
          <button
            @click="switchLang('en')"
            :class="{ active: locale === 'en' }"
            :disabled="locale === 'en'"
          >
            EN
          </button>
        </div>

        <RouterLink
          v-if="!authStore.isAuthenticated"
          :to="{ name: 'Login', params: { lang: locale } }"
          class="login-link"
        >
          <User :size="20" />
        </RouterLink>

        <UserMenu v-else />

      </div>

    </div>

    <button class="collapse-btn" @click="toggleHeader">
      <svg
        class="collapse-icon"
        :class="{ rotated: isHeaderCollapsed }"
        viewBox="0 0 24 24"
      >
        <path d="M6 15l6-6 6 6"/>
      </svg>
    </button>

  </header>

</template>

<style scoped>

/* ============================================================================
 * HEADER PRINCIPAL
 * Contenedor raíz del header.
 *
 * Responsabilidades:
 * - Ser sticky al top de la página
 * - Controlar el stacking de todas las capas (gradiente, ruido, línea inferior)
 * - Coordinar las transiciones entre estados (scroll, collapsed)
 * ============================================================================ */

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 130px;
  display: flex;
  align-items: center;
  overflow: visible;
  transition: all 0.35s ease;
}

/* Línea luminosa inferior, tipo neón */
.app-header::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;

  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(229,9,20,.8) 20%,
    rgba(255,255,255,.9) 50%,
    rgba(229,9,20,.8) 80%,
    transparent 100%
  );

  box-shadow:
    0 0 10px rgba(229,9,20,.6),
    0 0 20px rgba(229,9,20,.4),
    0 0 40px rgba(229,9,20,.3);

  pointer-events: none;
}

/* Textura de grano sutil sobre todo el header */
.app-header::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/noise.svg");
  opacity: .06;
  pointer-events: none;
}

/* ============================================================================
 * ESTADOS: SCROLL Y COLLAPSED
 * Variantes controladas desde Vue (scrolled / isHeaderCollapsed).
 *
 * Responsabilidades:
 * - Activar el modo "glass" del header al superar el umbral de scroll
 * - Ocultar el gradiente animado mientras el modo glass está activo
 * - Reducir altura y escalar los elementos internos en modo colapsado
 * ============================================================================ */

/* modo glass al hacer scroll */
.app-header.scrolled {
  backdrop-filter: blur(12px);
  background: rgba(11, 15, 25, 0.45);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
}

/* oculta el gradiente animado cuando el modo glass está activo */
.header-gradient.hidden {
  opacity: 0;
  transition: opacity .35s ease;
  pointer-events: none;
}

/* modo compacto: reduce altura y escala los elementos internos */
.app-header.collapsed {
  height: 60px;
}

.app-header.collapsed .logo {
  height: 50px;
}

.app-header.collapsed .logo-text {
  font-size: 28px;
}

.app-header.collapsed .nav {
  gap: 28px;
}

.app-header.collapsed .search {
  width: 180px;
}

/* ============================================================================
 * FONDO ANIMADO (estado inicial, sin scroll)
 * Gradiente animado de fondo del header.
 *
 * Responsabilidades:
 * - Aplicar el degradado cinematográfico de fondo
 * - Animar el desplazamiento del gradiente en loop
 * ============================================================================ */

.header-gradient {
  position: absolute;
  inset: 0;
  z-index: -1;

  background: linear-gradient(
    90deg,
    #0b0f19 0%,
    #121826 15%,
    #1b1f3a 35%,
    #3b1d36 55%,
    #5a1a23 70%,
    #1b1f3a 85%,
    #0b0f19 100%
  );

  box-shadow:
    inset 0 40px 80px rgba(0, 0, 0, 0.6),
    inset 0 -40px 80px rgba(0, 0, 0, 0.7);

  background-size: 200% 100%;
  animation: cinemaMove 18s ease-in-out infinite;
}

/* Desplaza el gradiente de fondo de un extremo al otro. */
@keyframes cinemaMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ============================================================================
 * LAYOUT GENERAL
 * Estructura horizontal del contenido del header.
 *
 * Responsabilidades:
 * - Limitar ancho máximo y centrar el contenido
 * - Distribuir logo, nav y right-side con espacio entre ellos
 * ============================================================================ */

.header-container {
  max-width: 1600px;
  width: 100%;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 60px;
}

.right-side {
  display: flex;
  align-items: center;
  gap: 22px;
}

/* ============================================================================
 * LOGO
 * Logo y nombre de la marca.
 *
 * Responsabilidades:
 * - Mostrar el isotipo y el texto "CineVerse"
 * - Aplicar glow y animación de hover sobre el logo
 * ============================================================================ */

.logo-group {
  display: flex;
  align-items: center;
  gap: 22px;
  text-decoration: none;
}

.logo-group.inactive {
  cursor: default;
  pointer-events: none;
}

.logo {
  height: 88px;
  filter: drop-shadow(0 0 12px rgba(229, 9, 20, 0.6))
    drop-shadow(0 0 28px rgba(229, 9, 20, 0.4));
  transition: transform 0.4s ease;
}

/* hover: leve escala/rotación + glow más intenso */
.logo-group:not(.inactive):hover .logo {
  transform: scale(1.12) rotate(-2deg);
  filter: drop-shadow(0 0 18px rgba(229, 9, 20, 0.8))
    drop-shadow(0 0 40px rgba(229, 9, 20, 0.6));
}

.logo-text {
  position: relative;
  font-size: 48px;
  font-weight: 900;
  letter-spacing: 2px;
  color: white;
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.2),
    0 0 25px rgba(229, 9, 20, 0.4);
  overflow: hidden; /* permite el efecto shine interno */
}

/* ============================================================================
 * NAVEGACIÓN
 * Enlaces principales del header (Home, Movies, Favorites).
 *
 * Responsabilidades:
 * - Mostrar los ítems de navegación con subrayado animado en hover
 * - Marcar el ítem activo (ruta actual) sin permitir interacción sobre él
 * ============================================================================ */

.nav {
  display: flex;
  gap: 46px;
}

.nav-item {
  font-size: 20px;
  font-weight: 700;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.25s ease;
  position: relative;
}

/* subrayado animado en hover */
.nav-item::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 0%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e50914, transparent);
  transition: width .35s ease;
}

.nav-item:hover {
  color: white;
  text-shadow:
    0 0 8px rgba(255,255,255,0.3),
    0 0 18px rgba(229, 9, 20, 0.7),
    0 0 35px rgba(229, 9, 20, 0.5);
}

/* Expande el subrayado al pasar el cursor sobre el enlace. */
.nav-item:hover::after {
  width: 100%;
}

/* estado activo (ruta actual): color fijo, sin interacción */
.nav-item.router-link-active {
  color: white;
  text-shadow: 0 0 12px rgba(229, 9, 20, 0.9);
  pointer-events: none;
}

/* Mantiene visible el subrayado del enlace correspondiente a la ruta activa. */
.nav-item.router-link-active::after {
  width: 100%;
}

/* ============================================================================
 * BUSCADOR
 * Input de búsqueda de películas.
 *
 * Responsabilidades:
 * - Mostrar el campo de búsqueda con estilo glass
 * - Aplicar borde y glow pulsante al enfocarse
 * ============================================================================ */

.search {
  width: 260px;
  background: rgba(18, 24, 38, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 30px;
  padding: 10px 18px;
  color: white;
  outline: none;
  backdrop-filter: blur(10px);
  transition: all 0.35s ease;
}

/* focus: borde rojo + pulso de glow */
.search:focus {
  border-color: #e50914;
  box-shadow:
    0 0 0 2px rgba(229, 9, 20, 0.35),
    0 0 18px rgba(229, 9, 20, 0.35),
    0 0 40px rgba(229, 9, 20, 0.25);
  animation: inputPulse 2.5s ease-in-out infinite;
}

/* Anima el efecto de pulso del resplandor del campo de búsqueda. */
@keyframes inputPulse {
  0% {
    box-shadow:
      0 0 0 2px rgba(229, 9, 20, 0.35),
      0 0 18px rgba(229, 9, 20, 0.35);
  }
  50% {
    box-shadow:
      0 0 0 2px rgba(229, 9, 20, 0.6),
      0 0 30px rgba(229, 9, 20, 0.6);
  }
  100% {
    box-shadow:
      0 0 0 2px rgba(229, 9, 20, 0.35),
      0 0 18px rgba(229, 9, 20, 0.35);
  }
}

/* ============================================================================
 * SELECTOR DE IDIOMA
 * Botones para alternar entre español e inglés.
 *
 * Responsabilidades:
 * - Mostrar ambos idiomas en un contenedor tipo pill
 * - Resaltar el idioma activo y deshabilitarlo (sin hover ni click)
 * ============================================================================ */

.lang-switch {
  display: flex;
  background: rgba(18, 24, 38, 0.8);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.lang-switch button {
  padding: 6px 14px;
  background: none;
  border: none;
  color: #9ca3af;
  font-weight: 700;
  cursor: pointer;
}

.lang-switch button.active {
  background: #e50914;
  color: white;
  border-radius: 30px;
  box-shadow: 0 0 12px rgba(229, 9, 20, 0.8);
}

.lang-switch button:disabled {
  cursor: default;
}

/* ============================================================================
 * ACCESO / PERFIL
 * Ícono de acceso al login (usuario no autenticado).
 *
 * Responsabilidades:
 * - Mostrar el ícono de acceso cuando no hay sesión iniciada
 * - Marcar como activo/deshabilitado cuando la ruta actual es Login
 * ============================================================================ */

.login-link {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid rgba(170,90,255,.22);
  color: #c8b8ff;
  transition: .25s;
}

.login-link:hover {
  color: white;
  border-color: rgba(206,132,255,.28);
  box-shadow:
    0 0 6px rgba(180,90,255,.22),
    0 0 14px rgba(180,90,255,.15);
}

.login-link.router-link-exact-active {
  color: white;
  background: rgba(229,9,20,.12);
  border-color: rgba(229,9,20,.7);
  box-shadow:
    0 0 8px rgba(229,9,20,.5),
    0 0 18px rgba(229,9,20,.35);
  pointer-events: none;
}

/* ============================================================================
 * BOTÓN COLAPSAR HEADER
 * Flotante, anclado al borde inferior del header (mitad dentro / mitad
 * fuera: 44px de alto, -22px de bottom).
 *
 * Responsabilidades:
 * - Alternar entre el estado expandido y colapsado del header
 * - Rotar el ícono según el estado actual
 * ============================================================================ */

.collapse-btn {
  position: absolute;
  width: 44px;
  height: 44px;
  right: 30px;
  bottom: -22px;
  border-radius: 50%;

  background: linear-gradient(
    180deg,
    #0b0f19 0%,
    #111527 40%,
    #1a1320 75%,
    #2a0f14 100%
  );
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  border: 1px solid rgba(255,255,255,.15);
  box-shadow:
    0 8px 25px rgba(0,0,0,.5),
    inset 0 1px 0 rgba(255,255,255,.25);

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .35s ease;
}

.collapse-btn:hover {
  background: #e50914;
  box-shadow:
    0 0 12px rgba(229,9,20,.9),
    0 0 30px rgba(229,9,20,.6),
    0 10px 35px rgba(0,0,0,.6);
}

.collapse-icon {
  width: 20px;
  height: 20px;
  stroke: white;
  stroke-width: 2.5;
  fill: none;
  transition: transform .35s ease;
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

/* ============================================================================
 * MENSAJE DE ERROR DE LOGOUT (feature en pausa, ver template)
 *
 * Responsabilidades:
 * - Mostrar un aviso flotante si el logout falla
 * - Animar su aparición/desaparición
 * ============================================================================ */

.logout-error {
  position: absolute;
  top: calc(100% + 14px);
  right: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  background: rgba(180, 20, 20, .95);
  color: white;
  box-shadow:
    0 10px 30px rgba(0,0,0,.35),
    0 0 18px rgba(229,9,20,.35);
  z-index: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: all .25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ============================================================================
 * RESPONSIVE
 * ≤1024px → tablet: compacta nav, logo y buscador.
 * ≤768px  → mobile: oculta nav horizontal, header más bajo.
 * ≤480px  → mobile chico: oculta texto del logo y partículas.
 * ============================================================================ */

@media (max-width: 1024px) {

  .header-container {
    padding: 0 30px;
  }

  .nav {
    gap: 24px;
  }

  .nav-item {
    font-size: 16px;
  }

  .logo-text {
    font-size: 34px;
  }

  .logo {
    height: 70px;
  }

  .search {
    width: 180px;
  }

  .login-link {
    width: 38px;
    height: 38px;
  }

  .login-link svg {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 768px) {

  .app-header {
    height: 90px;
  }

  .header-container {
    padding: 0 18px;
    gap: 12px;
  }

  .nav {
    display: none;
  }

  .logo {
    height: 58px;
  }

  .logo-text {
    font-size: 26px;
  }

  .search {
    width: 130px;
    padding: 8px 14px;
    font-size: 14px;
  }

  .right-side {
    gap: 10px;
  }

  .lang-switch {
    border-radius: 22px;
  }

  .lang-switch button {
    padding: 4px 8px;
    font-size: 12px;
  }

  .collapse-btn {
    right: 16px;
    width: 38px;
    height: 38px;
    bottom: -19px;
  }

  .login-link {
    width: 34px;
    height: 34px;
  }

  .login-link svg {
    width: 16px;
    height: 16px;
  }
}

@media (max-width: 480px) {

  .logo-text {
    display: none;
  }

  .search {
    width: 100px;
  }

  .lang-switch {
    transform: scale(.85);
    transform-origin: center;
  }

  .right-side {
    gap: 14px;
  }

  .login-link {
    width: 36px;
    height: 36px;
  }
}

</style>
