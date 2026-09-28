<!--
============================================================================
PAGE: CineVerse.vue
============================================================================

Página puente de Inertia entre Laravel y el frontend CineVerse.

Laravel renderiza esta página desde routes/web.php mediante:
Inertia::render('CineVerse')

Esta página no representa una pantalla visual propia. Su única
responsabilidad es montar la aplicación Vue original de CineVerse, ubicada en:
resources/js/cineverse/App.vue

Después de este punto, la navegación interna queda en manos de Vue Router:
/es
/es/movies
/es/login
/es/profile
etc.

En resumen:
- Laravel/Inertia entrega esta página como entrada.
- Esta página monta CineVerseApp.
- CineVerseApp renderiza header, footer y RouterView.
- Vue Router decide qué vista real mostrar.

Si esta página no existiera:
- Inertia::render('CineVerse') no tendría componente Vue para resolver.
- Laravel no podría entregar el frontend CineVerse desde sus rutas web.
- Al entrar a /es, /en o cualquier ruta interna, la app no montaría.

Si no se usara Inertia:
- Habría que montar Vue de otra forma, por ejemplo desde una vista Blade.
- Laravel tendría que devolver una plantilla manual con el div raíz y los
  assets de Vite.
- Se perdería este puente directo entre rutas Laravel y la app Vue.
============================================================================
-->

<script setup lang="ts">
import CineVerseApp from '@/cineverse/App.vue';
</script>

<template>
    <!-- Monta la aplicación CineVerse completa dentro de la página Inertia. -->
    <CineVerseApp />
</template>
