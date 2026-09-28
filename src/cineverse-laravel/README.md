# CineVerse

CineVerse es una aplicación web para buscar información sobre películas y personas, consultar información cinematográfica obtenida desde **The Movie Database (TMDB)** y gestionar reseñas de usuarios.

El proyecto combina **Laravel** en el backend con **Vue 3** en el frontend. **Inertia.js** actúa como puente entre ambos entornos y **Vue Router** administra la navegación interna de la aplicación.

## Tecnologías utilizadas

### Backend

- PHP 8.2 o superior.
- Laravel 12.
- Laravel Breeze para la base del sistema de autenticación.
- Inertia.js 2.
- MySQL.
- Sistema de sesiones y caché de Laravel, configurable mediante `.env`.

### Frontend

- Vue 3.
- TypeScript.
- Vue Router.
- Pinia.
- `pinia-plugin-persistedstate`.
- TanStack Vue Query.
- Axios.
- Vite 7.
- `vue-i18n`.
- Swiper y componentes auxiliares de interfaz.

### Servicios externos

- TMDB API para películas, personas, géneros, imágenes, trailers y contenido relacionado.
- SMTP para verificación de correo electrónico y recuperación de contraseña.

## Funcionalidades principales

CineVerse permite:

- consultar películas populares, en cartelera, próximas, mejor valoradas y tendencias;
- buscar películas por texto;
- filtrar y ordenar resultados;
- consultar el detalle de una película;
- visualizar reparto, director, trailers y películas relacionadas;
- consultar información y filmografía de personas;
- registrar usuarios e iniciar y cerrar sesión;
- verificar direcciones de correo electrónico;
- recuperar y restablecer contraseñas;
- crear, editar y eliminar reseñas propias;
- consultar reseñas de la comunidad;
- visualizar el perfil y el historial de reseñas del usuario;
- guardar hasta 20 películas favoritas en el navegador;
- utilizar la aplicación en español o inglés;
- mostrar una vista 404 para rutas internas inexistentes.

## Arquitectura general

Laravel sirve una única página puente de Inertia llamada `CineVerse`. A partir de ese punto, Vue Router controla las distintas pantallas del frontend.

```text
Laravel
   |
   v
routes/web.php
   |
   v
Inertia::render('CineVerse')
   |
   v
resources/views/app.blade.php
   |
   v
resources/js/app.ts
   |
   v
resources/js/Pages/CineVerse.vue
   |
   v
resources/js/cineverse/App.vue
   |
   v
Vue Router
   |
   +--> Inicio
   +--> Películas
   +--> Detalle de película
   +--> Persona
   +--> Favoritos
   +--> Perfil
   +--> Mis reseñas
   +--> Autenticación
   +--> 404
```

`resources/js/app.ts` inicializa Inertia y registra los plugins globales utilizados por CineVerse: Pinia, Vue Router, Vue Query, `vue-i18n` y Ziggy.

La navegación pública utiliza rutas localizadas como:

```text
/es
/en
/es/movies
/en/movies
/es/movies/{id}
/en/person/{id}
```

## Estructura principal del proyecto

```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── Api/
│   │   └── Auth/
│   └── Requests/
├── Logging/
├── Models/
├── Notifications/
├── Providers/
└── Support/

database/
├── factories/
├── migrations/
└── seeders/
    └── data/

docs/
├── arquitectura-laravel-inertia-vue.md
├── autenticacion.md
├── datos-de-prueba.md
├── ejecucion-local-cineverse-final.md
├── reseñas.md
├── resultado-datos-de-prueba.md

lang/
├── en/
└── es/

resources/
├── css/
├── js/
│   ├── Pages/
│   └── cineverse/
│       ├── core/
│       └── features/
└── views/

routes/
├── api.php
├── auth.php
└── web.php
```

## Requisitos

Para ejecutar el proyecto se necesita:

- PHP 8.2 o superior;
- Composer;
- Node.js ^20.19.0 o >=22.12.0 y npm;
- MySQL;
- una base de datos creada para CineVerse;
- un token Bearer de TMDB;
- acceso a un servidor SMTP si se desean probar los correos reales de verificación y recuperación de contraseña.

## Configuración del entorno

Crear el archivo `.env` a partir del ejemplo incluido:

```bash
cp .env.example .env
```

Generar la clave de Laravel:

```bash
php artisan key:generate
```

Después de copiar `.env.example`, establecer el nombre de la aplicación:

```env
APP_NAME=CineVerse
```

### Base de datos

Configurar la conexión MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=cineverse_laravel
DB_USERNAME=usuario
DB_PASSWORD=contraseña
```

### TMDB

El frontend consulta la API v3 de TMDB. Deben configurarse:

```env
VITE_TMDB_BASE_URL="https://api.themoviedb.org/3"
VITE_TMDB_TOKEN="token_bearer_de_tmdb"
```

El token se utiliza desde el frontend mediante Vite, por lo que después de modificar estas variables es necesario reiniciar el servidor de desarrollo de Vite.

### Correo electrónico

Para probar verificación de email y recuperación de contraseña se debe configurar SMTP:

```env
MAIL_MAILER=smtp
MAIL_HOST=servidor_smtp
MAIL_PORT=587
MAIL_USERNAME=usuario
MAIL_PASSWORD=contraseña
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="correo@dominio.com"
MAIL_FROM_NAME="CineVerse"
```

## Instalación

Instalar dependencias PHP:

```bash
composer install
```

Instalar dependencias JavaScript:

```bash
npm install
```

Crear `.env` y generar la clave si todavía no se hizo:

```bash
cp .env.example .env
php artisan key:generate
```

Una vez creada y configurada la base de datos, ejecutar las migraciones y cargar los datos de prueba:

```bash
php artisan migrate
php artisan db:seed
```

Si se necesita reconstruir completamente la base de datos de desarrollo:

```bash
php artisan migrate:fresh --seed
```

## Ejecución en desarrollo

La forma integrada de levantar el proyecto es:

```bash
composer run dev
```

Este script inicia de forma concurrente:

- El servidor de desarrollo de Laravel;
- Vite para el frontend.

Si solo se necesita ejecutar Vite:

```bash
npm run dev
```

Para generar el frontend de producción:

```bash
npm run build
```

## Base de datos y datos de prueba

Las **migraciones** crean y modifican la estructura de las tablas de la aplicación.

Los **seeders** cargan datos de prueba sobre esa estructura. `DatabaseSeeder` ejecuta, en este orden:

```text
UserSeeder
   |
   v
ReviewSeeder
```

Los datos se leen desde archivos NDJSON ubicados en:

```text
database/seeders/data/users.ndjson
database/seeders/data/reviews.ndjson
```

El conjunto incluido contiene:

- **5.000 usuarios**;
- **24.322 reseñas**.

`UserSeeder` requiere que la tabla `users` esté vacía. `ReviewSeeder` requiere que `reviews` esté vacía y que los 5.000 usuarios hayan sido cargados previamente.

## Autenticación

CineVerse utiliza el sistema de autenticación de Laravel basado en **sesiones web**.

El flujo incluye:

- registro;
- login;
- logout;
- recuperación de sesión desde el frontend;
- verificación de correo electrónico;
- envío del correo de verificación durante el registro;
- solicitud de enlace para restablecer contraseña;
- cambio de contraseña mediante token;
- protección CSRF;
- limitación de intentos de inicio de sesión.

Las pantallas visibles se integran dentro de la SPA de Vue, mientras que Laravel conserva la lógica real de autenticación y sesión.

Las rutas de autenticación del backend se encuentran en:

```text
routes/auth.php
```

## Reseñas

Las reseñas pertenecen a la base de datos local de CineVerse. La información de las películas, en cambio, se obtiene desde TMDB.

Cada reseña almacena:

- usuario;
- ID de película de TMDB;
- título de la película;
- calificación;
- comentario;
- fechas de creación y actualización.

La base de datos aplica una restricción única sobre:

```text
user_id + movie_id
```

Por lo tanto, cada usuario puede tener **como máximo una reseña por película**.

Las reglas principales son:

```text
rating  -> entero entre 1 y 5
comment -> entre 20 y 1000 caracteres
```

El backend normaliza el contenido del comentario antes de validarlo y guardarlo.

### Endpoints principales

```text
GET    /api/profile
GET    /api/reviews
POST   /api/reviews
PUT    /api/reviews/{id}
DELETE /api/reviews/{id}
GET    /api/movies/{movieId}/reviews
```

Los endpoints de perfil y CRUD de reseñas requieren una sesión autenticada.

La consulta de reseñas de una película es pública. Si existe una sesión, el backend puede separar la reseña propia del usuario de las reseñas de la comunidad.

### Paginación

El historial completo de reseñas propias se entrega de **12 en 12**.

En el detalle de una película, las reseñas de la comunidad se entregan de **10 en 10** y la reseña propia, si existe, se devuelve separadamente.

El perfil muestra:

- cantidad total de reseñas del usuario;
- las **6 reseñas más recientes**.

## Integración con TMDB

CineVerse utiliza TMDB como fuente externa de información cinematográfica.

Desde el frontend se consultan datos como:

- tendencias;
- películas populares;
- películas en cartelera;
- próximos estrenos;
- películas mejor valoradas;
- búsquedas;
- géneros;
- detalle de películas;
- créditos y reparto;
- personas y filmografías;
- videos y trailers;
- contenido relacionado.

La capa de acceso a TMDB se encuentra principalmente en:

```text
resources/js/cineverse/core/api/tmdbApi.ts
```

Las consultas de catálogo utilizan Vue Query para gestionar carga, caché y paginación.

## Favoritos

Los favoritos no se almacenan en MySQL.

Se administran en el frontend mediante **Pinia** y persistencia local del navegador. El límite actual es de:

```text
20 películas favoritas
```

Esto permite conservar favoritos entre recargas del navegador sin crear registros adicionales en la base de datos del servidor.

## Internacionalización

CineVerse está preparado para español e inglés mediante `vue-i18n`.

Los textos principales del frontend se encuentran en:

```text
resources/js/cineverse/core/i18n/es.json
resources/js/cineverse/core/i18n/en.json
```

La URL también incorpora el idioma:

```text
/es/...
/en/...
```

Vue Router valida y conserva ese segmento durante la navegación.

## Manejo de errores y logs

El backend incorpora utilidades propias de CineVerse para registrar fallos inesperados y responder de forma diferenciada según el tipo de petición.

Las piezas principales se encuentran en:

```text
app/Logging/CineVerseLogFormatter.php
app/Support/CineVerseLog.php
config/logging.php
```

La ubicación del **log personalizado de CineVerse** puede configurarse mediante:

```env
CINEVERSE_LOG_PATH=storage/logs
```

## Documentación adicional

La carpeta `docs/` contiene documentación complementaria del proyecto:

- [`arquitectura-laravel-inertia-vue.md`](docs/arquitectura-laravel-inertia-vue.md): arquitectura general e integración Laravel, Inertia y Vue.
- [`autenticacion.md`](docs/autenticacion.md): autenticación, sesiones, verificación y recuperación de contraseña.
- [`datos-de-prueba.md`](docs/datos-de-prueba.md): migraciones, seeders y dataset de prueba.
- [`ejecucion-local-cineverse-final.md`](docs/ejecucion-local-cineverse-final.md): requisitos, configuración y ejecución del proyecto en entorno local.
- [`reseñas.md`](docs/reseñas.md): reglas, endpoints y funcionamiento de las reseñas.
- [`resultado-datos-de-prueba.md`](docs/resultado-datos-de-prueba.md): resumen de los datos generados por los seeders.
