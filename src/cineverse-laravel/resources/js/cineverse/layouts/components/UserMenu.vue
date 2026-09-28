<script setup lang="ts">

/* ============================================================================
 * COMPONENT: UserMenu.vue
 * ============================================================================
 *
 * Menú de usuario en el header: avatar/dropdown con perfil, favoritos y
 * logout. Se cierra al hacer click afuera y muestra un aviso temporal si
 * el logout falla.
 * ============================================================================ */

import { onMounted, onUnmounted, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import {
  ChevronDown,
  CircleAlert,
  Heart,
  LogOut,
  User,
  UserRound,
} from "lucide-vue-next";

import { useAuthStore } from "@/features/auth/stores/useAuthStore";

import { logoutUser } from "@/features/auth/services/auth.service";

// Instancia del router, usada para navegar (ej: redirigir a Home tras logout)
const router = useRouter();

// locale: idioma actual (para preservarlo al navegar); t: función de traducción
const { locale, t } = useI18n();

// Store de autenticación: expone el usuario actual y el método clear() para logout
const authStore = useAuthStore();

// Referencia al wrapper del menú, usada por handleClickOutside
const menuRef = ref<HTMLElement | null>(null);

// Controla si el dropdown está visible
const isOpen = ref(false);

// Muestra el aviso de error de logout durante 3s 
const logoutError = ref(false);

// Abre/cierra el dropdown
function toggleMenu() {
  isOpen.value = !isOpen.value;
}

// Cierra el dropdown
function closeMenu() {
  isOpen.value = false;
}

/**
 * Cierra el dropdown al detectar un click fuera del menú.
 * Se registra en onMounted y se remueve en onUnmounted.
 */
function handleClickOutside(event: MouseEvent) {

  if (!menuRef.value) return;

  const target = event.target as Node;

  if (!menuRef.value.contains(target)) {
    closeMenu();
  }
}

// Escucha clicks en toda la página para cerrar el dropdown si el usuario
// hace click fuera del menú 
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

// Remueve el listener al desmontar, evita fugas de memoria
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

/**
 * Cierra sesión: invalida el CSRF token en el backend, limpia el store
 * local y redirige a Home. Si algo falla (red, backend, etc.) muestra
 * un aviso temporal en el dropdown en vez de cortar la navegación.
 */
async function logout() {

  try {

    await logoutUser(authStore.csrfToken!);

    authStore.clear();
    closeMenu();

    await router.push({
      name: "Home",
      params: { lang: locale.value }
    });

  }
  catch (error) {
    showLogoutError();
  }

  function showLogoutError() {

    logoutError.value = true;

    setTimeout(() => {
      logoutError.value = false;
    }, 3000);
  }
}

</script>

<template>

  <div
    ref="menuRef"
    class="user-menu-wrapper"
  >

    <button
      class="user-menu"
      @click="toggleMenu"
    >
      <UserRound :size="18" />

      <span class="username">
        {{ authStore.user?.username }}
      </span>

      <ChevronDown
        :size="16"
        :class="{ open: isOpen }"
      />
    </button>

    <Transition name="dropdown">

      <div
        v-if="isOpen"
        class="user-dropdown"
      >

        <div class="dropdown-header">

          <div class="avatar">
            {{ authStore.user?.username?.substring(0, 2).toUpperCase() }}
          </div>

          <div class="user-info">

            <div class="name">
              {{ authStore.user?.username }}
            </div>

            <div class="subtitle">
              CineVerse
            </div>

          </div>

        </div>

        <div class="dropdown-divider"></div>

        <Transition name="fade">
          <div
            v-if="logoutError"
            class="logout-error"
          >
            <CircleAlert :size="18" />
            <span>{{ t("auth.errors.internalServerError") }}</span>
          </div>
        </Transition>

        <RouterLink
          :to="{ name: 'Profile', params: { lang: locale } }"
          class="dropdown-item"
          @click="closeMenu"
        >
          <User :size="18" />
          <span>{{ t("userMenu.profile") }}</span>
        </RouterLink>

        <RouterLink
          :to="{ name: 'Favorites', params: { lang: locale } }"
          class="dropdown-item"
          @click="closeMenu"
        >
          <Heart :size="18" />
          <span>
            {{ t("userMenu.favorites") }}
          </span>
        </RouterLink>

        <div class="dropdown-divider"></div>

        <button
          class="dropdown-item logout"
          @click="logout"
        >
          <LogOut :size="18" />
          <span>
            {{ t("userMenu.logout") }}
          </span>
        </button>

      </div>

    </Transition>

  </div>

</template>

<style scoped>

/* ============================================================================
 * WRAPPER
 * Contenedor raíz del menú de usuario.
 *
 * Responsabilidades:
 * - Servir de ancla posicional para el dropdown (position: absolute)
 * - Delimitar el área usada por handleClickOutside para detectar clicks fuera
 * ============================================================================ */

.user-menu-wrapper {
  position: relative;
}

/* ============================================================================
 * BOTÓN (trigger del menú)
 * Botón que abre/cierra el dropdown.
 *
 * Responsabilidades:
 * - Mostrar el ícono de usuario y el nombre autenticado
 * - Aplicar estilo glass consistente con el resto de la UI
 * - Rotar la flecha (ChevronDown) según el estado abierto/cerrado
 * ============================================================================ */

.user-menu {
  display: flex;
  align-items: center;
  gap: .6rem;
  height: 42px;
  padding: 0 .95rem;
  border-radius: 999px;

  background: rgba(255,255,255,.035);
  border: 1px solid rgba(255,255,255,.08);
  color: white;
  
  backdrop-filter: blur(16px);
  cursor: pointer;
  transition:
    background .25s,
    border-color .25s,
    box-shadow .25s,
    transform .25s;
}

.user-menu:hover {
  background: rgba(255,255,255,.06);
  border-color: rgba(229,9,20,.45);
  box-shadow: 0 0 18px rgba(229,9,20,.15);
}

.username {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: .92rem;
  font-weight: 600;
}

/* flecha del botón, rota cuando el dropdown está abierto */
.user-menu svg:last-child {
  transition: transform .25s ease;
}

.user-menu svg.open {
  transform: rotate(180deg);
}

/* ============================================================================
 * DROPDOWN
 * Panel flotante anclado abajo a la derecha del botón.
 *
 * Responsabilidades:
 * - Contener el header, los items y el aviso de error del menú
 * - Aplicar estilo glass (blur + gradiente) consistente con la UI
 * - Generar efectos decorativos de luz mediante pseudo-elementos
 * - Posicionarse por encima del resto del contenido (z-index)
 * ============================================================================ */

.user-dropdown {
  position: absolute;
  top: calc(100% + 7px);
  right: 0;
  width: 260px;
  padding: 10px;
  border-radius: 18px;
  overflow: hidden;

  background: linear-gradient(
    180deg,
    rgba(34,42,60,.90) 0%,
    rgba(21,27,42,.95) 45%,
    rgba(13,18,30,.98) 100%
  );
  border: 1px solid rgba(255,255,255,.12);
  box-shadow:
    0 28px 70px rgba(0,0,0,.60),
    0 0 45px rgba(229,9,20,.12),
    inset 0 1px 0 rgba(255,255,255,.08);

  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  transform-origin: top right;
  z-index: 200;
}

/* filo superior luminoso */
.user-dropdown::before {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  top: 0;
  height: 1px;

  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,.9),
    rgba(229,9,20,.8),
    transparent
  );
}

/* glow interno sutil, esquina superior derecha */
.user-dropdown::after {
  content: "";
  position: absolute;
  inset: 0;

  background: radial-gradient(
    circle at top right,
    rgba(229,9,20,.10),
    transparent 45%
  );

  pointer-events: none;
}

/* ============================================================================
 * HEADER DEL DROPDOWN (avatar + nombre)
 * Encabezado interno del panel, con el avatar y datos del usuario.
 *
 * Responsabilidades:
 * - Mostrar el avatar (iniciales) y el nombre de usuario
 * - Mantener jerarquía visual clara respecto al resto del dropdown
 * ============================================================================ */

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: white;

  background: linear-gradient(135deg, #ff2d55, #8b1cff);
  box-shadow: 0 0 18px rgba(229,9,20,.45);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.name {
  color: white;
  font-size: .95rem;
  font-weight: 700;
}

.subtitle {
  margin-top: 2px;
  color: #8d99ae;
  font-size: .78rem;
}

/* ============================================================================
 * ITEMS DEL MENÚ
 * Opciones del dropdown (perfil, favoritos, logout).
 *
 * Responsabilidades:
 * - Unificar estilo entre RouterLink y <button> dentro del menú
 * - Aplicar feedback visual en hover
 * - Marcar como activo/deshabilitado el item cuya ruta coincide con la actual
 * - Diferenciar visualmente la acción de logout del resto de items
 * ============================================================================ */

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 15px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #dce3ec;
  font-size: .94rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background .22s,
    transform .22s,
    color .22s;
}

/* router-link-exact-active: clase que Vue Router agrega automáticamente
   al RouterLink cuya ruta coincide exactamente con la ruta actual.
   Se usa acá para marcar "Mi perfil" como activo/deshabilitado cuando
   el usuario ya está en /profile, evitando hover y click redundantes. */
.dropdown-item.router-link-exact-active {
  color: white;
  background: rgba(229,9,20,.12);
  pointer-events: none;
  cursor: default;
}

.dropdown-item:hover {
  background: linear-gradient(
    90deg,
    rgba(229,9,20,.16),
    rgba(255,255,255,.04)
  );
  color: white;
}

.dropdown-item svg {
  flex-shrink: 0;
  opacity: .85;
}

/* variante logout: tono rojizo para diferenciarlo del resto de items */
.logout {
  color: #ffd7d7;
}

.logout:hover {
  background: linear-gradient(
    90deg,
    rgba(229,9,20,.24),
    rgba(255,255,255,.04)
  );
  color: white;
}

/* ============================================================================
 * DIVIDER
 * Línea separadora entre secciones del dropdown.
 *
 * Responsabilidades:
 * - Separar visualmente el header, los items y el logout
 * - Mantener un estilo sutil, sin competir con el resto del contenido
 * ============================================================================ */

.dropdown-divider {
  height: 1px;
  margin: 10px 6px;

  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,.12),
    transparent
  );
}

/* ============================================================================
 * AVISO DE ERROR DE LOGOUT
 * Se muestra dentro del dropdown durante 3s si logout() falla (ver script).
 *
 * Responsabilidades:
 * - Notificar al usuario que el cierre de sesión falló
 * - Mantener el dropdown abierto para mostrar el aviso sin interrumpir la UX
 * - Aplicar un estilo de alerta coherente con el resto de la UI
 * ============================================================================ */

.logout-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 12px 8px;
  padding: 12px 14px;
  border-radius: 12px;

  background: linear-gradient(
    135deg,
    rgba(185,24,24,.24),
    rgba(120,18,18,.18)
  );
  border: 1px solid rgba(255,90,90,.28);
  color: #ffe8e8;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 8px 20px rgba(0,0,0,.25);

  font-size: .85rem;
  line-height: 1.35;
}

.logout-error svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #ff9d9d;
}

/* ============================================================================
 * TRANSICIONES
 * dropdown-*: apertura/cierre del panel completo.
 * fade-*: aparición/desaparición del aviso de error de logout.
 *
 * Responsabilidades:
 * - Animar la entrada/salida del dropdown (opacidad + escala + desplazamiento)
 * - Animar la aparición/desaparición del aviso de error de logout
 * ============================================================================ */

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity .22s ease,
    transform .22s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(.96);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
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

</style>
