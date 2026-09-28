<script setup lang="ts">

/* ============================================================================
 * APP LAYOUT (App.vue)
 * ============================================================================
 * 
 * Estructura base de la aplicación.
 *
 * Se encarga de:
 * - Renderizar el header global (AppHeader)
 * - Renderizar el footer global (AppFooter)
 * - Mostrar las vistas dinámicas con RouterView
 * - Mantener el layout persistente entre rutas
 * - Mostrar un banner de aviso (BrowserWarningBanner) cuando detecta que
 *   el usuario está en Firefox, ya que algunos efectos visuales del sitio
 *   rinden peor en ese navegador
 * - Decidir cuándo remontar cada vista al navegar (evita perder el
 *   cache de Vue Query y el estado de los componentes al cambiar
 *   solo de idioma 
 * 
 * Este archivo actúa como estructura base de toda la app.
 * ============================================================================ */
 
import AppHeader from './layouts/components/AppHeader.vue';
import AppFooter from './layouts/components/AppFooter.vue';
import BrowserWarningBanner from '@/shared/components/BrowserWarningBanner.vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

// Genera el "key" que usa RouterView para decidir si remonta o no.
// Excluye "lang" a propósito: así cambiar de idioma no destruye
// el componente (mantiene el cache de Vue Query), pero cambiar
// :id, :pathMatch, etc. sí lo remonta.
function routeKey(route: RouteLocationNormalizedLoaded) {
  const { lang, ...rest } = route.params;
  return `${route.name as string}-${JSON.stringify(rest)}`;
}

</script>

<template>

  <BrowserWarningBanner />

  <!--
    Componente raíz del layout de la aplicación.

    AppHeader se renderiza fuera de RouterView para que el header
    sea persistente en todas las páginas y no se vuelva a montar
    en cada navegación.
  -->
    <div class="header-wrapper">
        <AppHeader />
    </div>
    
<!--
    CONTENEDOR PRINCIPAL DE LAS VISTAS (PÁGINAS)

    RouterView es el componente donde Vue Router renderiza
    dinámicamente la vista según la URL actual.

    Ejemplo:
    /              → HomeView
    /movies        → MoviesView
    /movies/1368   → MovieDetailView

    IMPORTANTE: :key="routeKey(route)"

    Se usa una key reactiva basada en el name de la ruta + sus params,
    EXCLUYENDO el param :lang, para decidir cuándo Vue debe recrear
    el componente y cuándo debe reutilizarlo.

    Esto incluye:
    - cambio de ID de película
      /movies/1368 → /movies/1378
      → key distinto → Vue SÍ remonta el componente

    - cambio de idioma
      /es/movies/1368 → /en/movies/1368
      → key igual (mismo name, mismo id, lang ignorado)
      → Vue NO remonta el componente

    Problema que resuelve (igual que antes):

    - Navegación entre rutas como:
        /movies/1368 → /movies/1378
    - Vue reutiliza el mismo componente por performance
    - Entonces NO se vuelve a ejecutar setup()
    - Resultado: datos viejos, UI no actualiza

    Con :key="routeKey(route)":

    - Si cambian los params reales (ej: :id) → Vue destruye el
      componente anterior y crea uno nuevo desde cero → setup()
      se ejecuta nuevamente → datos y estados se recalculan bien

    - Si SOLO cambia :lang → Vue reutiliza el componente actual
      → NO se pierde el estado interno ni el cache de Vue Query
      → evita el flicker de skeleton/spinner al cambiar ES/EN
      → los textos igual se actualizan solos porque vue-i18n
        es reactivo (no hace falta remount para traducir)

    Ver función routeKey() en el <script setup> de este archivo.
  -->
  <div class="app-content">
      <RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="routeKey(route)" />
      </RouterView>
  </div>

  <AppFooter />

</template>

<style>

/* ============================================================================
 * BODY
 * Configuración global del documento.
 *
 * Responsabilidades:
 * - Evitar scroll horizontal no deseado
 * - Prevenir desbordes visuales en layouts con animaciones o elementos anchos
 * - Definir el fondo base de la aplicación
 * ============================================================================ */

body{
  overflow-x: hidden;
  background: #0b0f19;
}

/* ============================================================================
 * HEADER WRAPPER
 * Contenedor del header global.
 *
 * Responsabilidades:
 * - Mantener el header fijo en la parte superior al hacer scroll
 * - Asegurar que se superponga correctamente al contenido (z-index)
 * - Servir como base para efectos visuales adicionales (ej: overlays)
 * ============================================================================ */

.header-wrapper{
  position: sticky;
  top: 0;
  z-index: 2000;
}

/* ============================================================================
 * HEADER WRAPPER :: AFTER
 * Capa visual superpuesta al header.
 *
 * Responsabilidades:
 * - Aplicar una viñeta horizontal sobre el header
 * - Oscurecer suavemente los bordes laterales
 * - Dirigir la atención hacia el centro
 * - No interferir con interacciones (pointer-events: none)
 * ============================================================================ */

.header-wrapper::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;

  background:
  linear-gradient(
    to right,
    rgba(0,0,0,0.98) 0%,
    rgba(0,0,0,0.85) 6%,
    rgba(0,0,0,0.55) 14%,
    transparent 28%,
    transparent 72%,
    rgba(0,0,0,0.55) 86%,
    rgba(0,0,0,0.85) 94%,
    rgba(0,0,0,0.98) 100%
  );

  z-index:1;
}

/* ============================================================================
 * APP CONTENT :: BEFORE
 * Viñeta global sobre el contenido.
 *
 * Responsabilidades:
 * - Oscurecer suavemente los bordes laterales de la pantalla
 * - Mantener el foco visual en el centro de la pantalla
 * - Cubrir toda la vista independientemente del scroll (position: fixed)
 * - No interferir con la interacción del usuario
 *
 * A diferencia de la capa ::after (que construye todo el ambiente
 * con halos y sombras profundas), esta capa solo
 *  un gradiente horizontal suave que oscurece los extremos
 *  y derecho. 
 * ============================================================================ */

.app-content::before{
  content:"";
  /* fixed hace que la capa quede pegada al viewport,
     no al contenedor. Así cubre siempre toda la pantalla
     incluso cuando se hace scroll. */
  position:fixed;
  /* inset:0 es equivalente a:
     top:0; right:0; bottom:0; left:0;
     Hace que la capa ocupe todo el viewport. */
  inset:0;
  /* Evita que esta capa bloquee clicks o interacciones
     con los elementos reales de la página. */
  pointer-events:none;

  /* Gradiente horizontal que oscurece los bordes de la pantalla
     y deja el centro completamente transparente.

     Esto dirige la atención visual hacia el centro
     donde está el contenido principal. */
  background:
  linear-gradient(
    to right,

    /* borde izquierdo muy oscuro */
    rgba(0,0,0,.92) 0%,

    /* transición hacia menos oscuro */
    rgba(0,0,0,.68) 6%,

    /* zona central totalmente visible */
    transparent 18%,
    transparent 82%
  );

  /* Se coloca debajo de la capa principal
     (que usa z-index 1000) pero encima del contenido normal. */
  z-index:999;
}

/* ============================================================================
 * APP CONTENT :: AFTER
 * Efecto "sala de cine" en los laterales.
 *
 * Construye el entorno visual alrededor del contenido usando múltiples capas:
 * - Oscurecimiento lateral (profundidad)
 * - Halos de luz tipo proyector
 * - Bordes luminosos del contenido
 *
 * Se adapta dinámicamente al viewport usando:
 * calc((100vw - layoutWidth) / 2)
 * → representa el espacio lateral en cada lado
 *
 * No interfiere con la interacción del usuario.
 * ============================================================================ */

.app-content::after{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;

  background:

/* --------------------------------------------------------------------------
   OSCURECIMIENTO PROFUNDO IZQUIERDO
   --------------------------------------------------------------------------
   Gradiente negro que simula la oscuridad de la sala de cine.

   to right → el negro comienza fuerte en el borde de la pantalla
              y se desvanece hacia el centro del contenido.

   Posición:
      0 0 → esquina superior izquierda

   Tamaño:
      ancho  = espacio lateral izquierdo
      alto   = 100% de la pantalla
-------------------------------------------------------------------------- */
linear-gradient(
  to right,
  rgba(0,0,0,0.96),
  rgba(0,0,0,0.88),
  rgba(0,0,0,0.65),
  transparent
)
0 0 / calc((100vw - 1400px)/2) 100% no-repeat,

/* --------------------------------------------------------------------------
   OSCURECIMIENTO PROFUNDO DERECHO
   --------------------------------------------------------------------------
   Mismo efecto que el lado izquierdo pero invertido.

   to left → el gradiente comienza oscuro desde el borde derecho
             y se desvanece hacia el centro.

   Posición:
      100% 0 → esquina superior derecha
-------------------------------------------------------------------------- */
linear-gradient(
  to left,
  rgba(0,0,0,0.96),
  rgba(0,0,0,0.88),
  rgba(0,0,0,0.65),
  transparent
)
100% 0 / calc((100vw - 1400px)/2) 100% no-repeat,

/* --------------------------------------------------------------------------
   HALO DE PROYECTOR IZQUIERDO
   --------------------------------------------------------------------------
   Gradiente radial que simula la luz difusa de un proyector
   iluminando el aire de la sala.

   ellipse at left center → el foco de luz nace desde el borde izquierdo
                            en el centro vertical de la pantalla.

   El halo se desvanece gradualmente hacia el interior.
-------------------------------------------------------------------------- */
radial-gradient(
  ellipse at left center,
  rgba(255,210,120,0.35) 0%,
  rgba(255,170,60,0.18) 30%,
  rgba(255,150,40,0.08) 50%,
  transparent 70%
)
0 center / calc((100vw - 1400px)/2) 100% no-repeat,

/* --------------------------------------------------------------------------
   BORDE LUMINOSO IZQUIERDO
   --------------------------------------------------------------------------
   Línea vertical que representa el borde de la "pantalla de cine".

   Se posiciona EXACTAMENTE donde comienza el contenido central.

   Posición horizontal:
      calc((100vw - 1400px)/2)

   Esto coloca la línea justo al final del espacio lateral izquierdo.
-------------------------------------------------------------------------- */
linear-gradient(
  to bottom,
  transparent,
  rgba(255,220,150,0.7),
  transparent
)
calc((100vw - 1400px)/2) center / 2px 70% no-repeat,

/* --------------------------------------------------------------------------
   HALO DE PROYECTOR DERECHO
   --------------------------------------------------------------------------
   Mismo efecto que el halo izquierdo pero reflejado.

   ellipse at right center → el foco nace desde el borde derecho.
-------------------------------------------------------------------------- */
radial-gradient(
  ellipse at right center,
  rgba(255,210,120,0.35) 0%,
  rgba(255,170,60,0.18) 30%,
  rgba(255,150,40,0.08) 50%,
  transparent 70%
)
100% center / calc((100vw - 1400px)/2) 100% no-repeat,

/* --------------------------------------------------------------------------
   BORDE LUMINOSO DERECHO
   --------------------------------------------------------------------------
   Línea vertical que marca el final del contenido central
   en el lado derecho.

   Se calcula restando el ancho lateral izquierdo al viewport:

      calc(100vw - ((100vw - 1400px)/2))

   Esto posiciona la línea justo donde termina el contenido
   y comienza el espacio oscuro derecho.
-------------------------------------------------------------------------- */
linear-gradient(
  to bottom,
  transparent,
  rgba(255,220,150,0.7),
  transparent
)
calc(100vw - ((100vw - 1400px)/2)) center / 2px 70% no-repeat;

z-index:1000;
}

/* ============================================================================
   SCROLLBAR
*  ============================================================================ */

/* ============================================================================
 * SCROLLBAR
 * Ajuste de ancho de la barra de scroll.
 *
 * Responsabilidades:
 * - Definir una scrollbar más ancha para mejor visibilidad y control
 * ============================================================================ */

::-webkit-scrollbar{
  width:18px;
}

/* ============================================================================
 * SCROLLBAR TRACK
 * Fondo de la barra de scroll.
 *
 * Responsabilidades:
 * - Definir el color de la pista (track)
 * - Integrarse con la estética oscura de la aplicación
 * ============================================================================ */

::-webkit-scrollbar-track{
  background:#06010c;
}

/* ============================================================================
 * SCROLLBAR THUMB
 * Estilo del indicador de scroll.
 *
 * Responsabilidades:
 * - Definir forma redondeada (border-radius)
 * - Aplicar gradiente oscuro para efecto sutil/camuflado
 * - Integrarse visualmente con el track mediante borde
 * ============================================================================ */

::-webkit-scrollbar-thumb{
  border-radius:14px;
  background:linear-gradient(
    180deg,
    #0b0216,
    #14042a,
    #0b0216
  );
  border:3px solid #06010c;
}

/* ============================================================================
 * SCROLLBAR THUMB : HOVER
 * Estado hover del indicador de scroll.
 *
 * Responsabilidades:
 * - Intensificar levemente el contraste al interactuar
 * - Mantener una transición sutil sin romper la estética oscura
 * ============================================================================ */

::-webkit-scrollbar-thumb:hover{
  background:linear-gradient(
    180deg,
    #14042a,
    #1e083f,
    #14042a
  );
}

/* ============================================================================
 * SCROLLBAR THUMB : ACTIVE
 * Estado activo del indicador de scroll.
 *
 * Responsabilidades:
 * - Aumentar el contraste durante la interacción (click/drag) 
 * ============================================================================ */

::-webkit-scrollbar-thumb:active{
  background:linear-gradient(
    180deg,
    #1e083f,
    #2b0b5a
  );
}

/* ============================================================================
 * HTML
 * Control del anclaje de scroll.
 *
 * Responsabilidades:
 * - Desactivar el ajuste automático de posición al cargar contenido
 * - Evitar saltos inesperados durante render dinámico
 * ============================================================================ */

html {
  overflow-anchor: none;
}

/* ============================================================================
 * FIREFOX SCROLLBAR + GLOBAL BACKGROUND
 *
 * Responsabilidades:
 * - Definir estilo de scrollbar en Firefox (color y grosor)
 * - Mantener coherencia visual con la versión WebKit
 * - Establecer el fondo global de la aplicación
 * ============================================================================ */

html{
  scrollbar-width:auto;
  scrollbar-color:#14042a #06010c;
}

</style>
