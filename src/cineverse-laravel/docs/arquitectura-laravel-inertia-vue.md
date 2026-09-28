# Arquitectura de CineVerse

Este documento ofrece una visión rápida de la arquitectura de CineVerse.  
La documentación técnica completa del proyecto desarrolla estos temas con mayor profundidad, ejemplos, código y recorridos paso a paso.

## 1. Visión general

CineVerse combina Laravel en el servidor con Vue 3 en el navegador.

Laravel recibe las solicitudes HTTP, gestiona autenticación, sesiones, validación, reseñas, perfil y persistencia en MySQL.  
Inertia conecta Laravel con la aplicación Vue.  
Una vez montada la aplicación, Vue Router decide qué vista interna debe mostrarse.

```text
Navegador
   ↓
Laravel
   ↓
Inertia
   ↓
Pages/CineVerse.vue
   ↓
cineverse/App.vue
   ↓
Vue Router
   ↓
View actual
```

CineVerse mantiene una única página Inertia principal y conserva Vue Router como router interno de la SPA.

## 2. Entrada de la aplicación

Los archivos principales del recorrido inicial son:

### `routes/web.php`

Define las rutas web de entrada y entrega la página Inertia principal:

```php
Inertia::render('CineVerse')
```

### `resources/views/app.blade.php`

Es el documento HTML raíz utilizado por Inertia.

Carga los assets mediante Vite e incluye el punto donde se monta la aplicación Vue.

### `resources/js/app.ts`

Es el punto de entrada del frontend integrado.

Inicializa Inertia y Vue y registra los plugins principales:

- Pinia
- Vue Router
- TanStack Vue Query
- vue-i18n
- Ziggy

### `resources/js/Pages/CineVerse.vue`

Es la página que Inertia resuelve cuando Laravel entrega `CineVerse`.

Actúa como adaptador entre la convención de páginas de Inertia y la estructura propia del frontend.

### `resources/js/cineverse/App.vue`

Es el componente principal de CineVerse.

Contiene el `RouterView` donde Vue Router monta la vista correspondiente a la URL actual.

## 3. Navegación interna con Vue Router

Laravel e Inertia participan en la carga inicial de la aplicación, pero no seleccionan cada pantalla interna.

Una vez que CineVerse está montado, Vue Router interpreta la URL y decide qué View mostrar.

Ejemplos:

```text
/es
→ HomeView

/es/movies
→ MoviesView

/es/movies/550
→ MovieDetailView

/es/profile
→ ProfileView
```

La separación puede resumirse así:

```text
Carga completa
Navegador → Laravel → Inertia → Vue → Vue Router → View

Navegación interna
View / componente → Vue Router → RouterView → nueva View
```

## 4. Backend Laravel

Laravel concentra la infraestructura del servidor.

Las rutas principales se distribuyen entre:

```text
routes/
├── web.php
├── auth.php
└── api.php
```

Y las piezas principales del backend se encuentran en:

```text
app/
├── Http/Controllers/
├── Http/Requests/
├── Models/
└── Notifications/
```

Laravel administra, entre otras funciones:

- autenticación y sesiones;
- registro y verificación de correo;
- recuperación de contraseña;
- validación;
- reseñas;
- perfil;
- notificaciones por correo;
- acceso a MySQL mediante Eloquent.

Laravel Breeze se utilizó como scaffolding inicial de autenticación.  
La aplicación utiliza pantallas Vue propias y los mecanismos estándar de Laravel en tiempo de ejecución.

## 5. Datos externos y datos locales

CineVerse separa el catálogo audiovisual de los datos propios de la aplicación.

### TMDB

TMDB proporciona:

- películas;
- personas;
- géneros;
- créditos;
- imágenes;
- videos;
- películas similares;
- información de catálogo.

El catálogo completo no se copia a MySQL.

### MySQL

MySQL conserva los datos propios de CineVerse, entre ellos:

- usuarios;
- reseñas;
- tokens de recuperación;
- tablas de infraestructura de Laravel según los drivers configurados.

Una reseña guarda el identificador de la película de TMDB, pero CineVerse no mantiene una tabla local con una copia completa del catálogo de películas.

## 6. Estado y servicios del frontend

El frontend utiliza varias herramientas con responsabilidades diferentes.

### Pinia

Mantiene estado compartido de la aplicación, principalmente autenticación y favoritos.

### TanStack Vue Query

Gestiona consultas de datos remotos, caché y estados de carga, especialmente para la información obtenida desde TMDB.

### vue-i18n

Gestiona la interfaz en español e inglés.

### Axios

Se utiliza para realizar solicitudes HTTP tanto a Laravel como a TMDB.

## 7. Estructura principal

```text
resources/
└── js/
    ├── app.ts
    ├── Pages/
    │   └── CineVerse.vue
    └── cineverse/
        ├── App.vue
        ├── core/
        ├── features/
        └── shared/

routes/
├── web.php
├── auth.php
└── api.php

app/
├── Http/
├── Models/
└── Notifications/

database/
├── migrations/
└── seeders/
```

| Archivo o directorio | Función |
|---|---|
| `routes/web.php` | Entrada web e Inertia |
| `resources/views/app.blade.php` | Documento HTML raíz |
| `resources/js/app.ts` | Arranque de Vue e Inertia |
| `resources/js/Pages/CineVerse.vue` | Adaptador de la página Inertia |
| `resources/js/cineverse/App.vue` | Componente principal de CineVerse |
| `resources/js/cineverse/core/router/` | Navegación interna |
| `resources/js/cineverse/features/` | Funcionalidades del frontend |
| `routes/api.php` | Endpoints JSON de Laravel |
| `app/Models/` | Modelos Eloquent |
| `database/migrations/` | Estructura versionada de la base |
| `database/seeders/` | Carga de datos de prueba |

## 8. Flujos resumidos

### Carga completa

```text
Navegador
→ Laravel
→ Inertia
→ CineVerse.vue
→ App.vue
→ Vue Router
→ View
```

### Datos propios de CineVerse

```text
Vue
→ API Laravel
→ Controller
→ Eloquent
→ MySQL
→ JSON
→ Vue
```

### Catálogo audiovisual

```text
Vue
→ Vue Query
→ Service
→ Axios
→ TMDB
→ Vue Query
→ interfaz
```

## 9. Documentación técnica ampliada

Este archivo funciona como referencia rápida de arquitectura.

Para la explicación completa de Inertia, Laravel, Vue Router, backend, TMDB, base de datos, autenticación, reseñas, seguridad, instalación, pruebas y recorridos paso a paso, consultar:

`CineVerse_Laravel_Documentacion_Tecnica.docx`
