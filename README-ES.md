# CineVerse

CineVerse es una aplicación web para buscar y consultar películas. La información cinematográfica se obtiene desde **The Movie Database (TMDB)** y, desde el detalle de cada película, también es posible consultar su reparto, los perfiles de los actores y sus filmografías.

La aplicación permite además crear una cuenta de usuario, guardar películas favoritas en el navegador y publicar y gestionar reseñas.

El proyecto está desarrollado con **Laravel 12**, **Vue 3**, **Inertia.js 2** y **TypeScript**. Laravel gestiona la autenticación, las sesiones, las reseñas, el perfil y la persistencia de datos; Inertia conecta Laravel con Vue y Vue Router controla la navegación interna de la SPA.

## Qué permite hacer CineVerse

- Explorar tendencias, películas populares, en cartelera, próximas y mejor valoradas.
- Buscar, filtrar y ordenar películas.
- Consultar detalles, reparto, director, trailers y contenido relacionado.
- Consultar perfiles de actores y sus filmografías desde el reparto de una película.
- Registrarse, iniciar y cerrar sesión.
- Verificar el correo y recuperar la contraseña.
- Crear, editar y eliminar reseñas propias.
- Consultar reseñas de la comunidad y el historial del perfil.
- Guardar hasta 20 películas favoritas en el navegador.
- Utilizar la interfaz en español e inglés.

## Tecnologías principales

- PHP 8.2+
- Laravel 12
- Laravel Breeze
- Inertia.js 2
- Vue 3
- TypeScript
- Vue Router
- Pinia
- TanStack Vue Query
- Axios
- Vite 7
- MySQL 8
- TMDB API

## Estructura del repositorio

```text
cineverse-laravel/
├── README-ES.md
├── README-EN.md
├── database/
├── docs/
├── src/
└── *.mp4
```

- `database/`: contiene la base de datos SQL de prueba.
- `docs/`: contiene la documentación técnica y archivos Markdown (`.md`) con información complementaria y resultados de prueba.
- `src/`: contiene el proyecto Laravel completo y el frontend Vue integrado.
- Los videos incluidos en la raíz del repositorio muestran el sitio web en funcionamiento.

## Puesta en marcha

Desde `src/`:

```bash
composer install
npm install
```

Creá el archivo `.env` a partir de `.env.example` y generá la clave de la aplicación:

```bash
php artisan key:generate
```

Configurá en `.env`:

- la conexión a MySQL;
- `VITE_TMDB_BASE_URL`;
- `VITE_TMDB_TOKEN`;
- los datos SMTP si querés probar verificación de correo y recuperación de contraseña.

## Base de datos

La base puede prepararse de dos formas:

- importando la copia SQL incluida en `database/`;
- o creando una base vacía y generando su estructura y sus datos mediante las migraciones y seeders del proyecto.

Si se utiliza la segunda opción, primero debe crearse la base en MySQL y configurarse su conexión en `.env`.

Después, desde `src/`:

```bash
php artisan migrate --seed
```

El conjunto de datos incluido contiene **5.000 usuarios** y **24.322 reseñas**.

## Ejecución en desarrollo

La forma integrada de iniciar el proyecto es:

```bash
composer run dev
```

Este script inicia de forma concurrente el servidor de Laravel, el proceso de cola, Laravel Pail y Vite.

También pueden ejecutarse Laravel y Vite por separado:

```bash
php artisan serve
npm run dev
```

## Arquitectura

El recorrido principal de la interfaz es:

```text
Laravel
   ↓
Inertia
   ↓
Vue 3
   ↓
Vue Router
```

El frontend consulta TMDB para obtener información sobre películas y actores, mientras Laravel y MySQL administran los datos propios de CineVerse, como usuarios y reseñas.

## Documentación

La documentación técnica, los archivos Markdown complementarios y los resultados de los datos de prueba se encuentran en:

```text
docs/
```

La carpeta `database/` contiene la copia SQL preparada para la entrega, mientras que el proyecto en `src/` también puede reconstruir su estructura y sus datos de prueba mediante migraciones y seeders.
