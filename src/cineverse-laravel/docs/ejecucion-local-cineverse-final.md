# Ejecución local de CineVerse Laravel

Esta guía resume cómo iniciar CineVerse Laravel en un entorno local de desarrollo una vez completada la instalación inicial del proyecto.

## Requisitos previos

Para ejecutar CineVerse Laravel se necesita:

- PHP 8.2 o una versión compatible superior.
- Composer.
- Node.js ^20.19.0 o >=22.12.0 y npm.
- MySQL.
- Las dependencias PHP instaladas con `composer install`.
- Las dependencias JavaScript instaladas con `npm install`.
- El archivo `.env` configurado.
- Una base de datos MySQL creada para CineVerse.
- Un token de acceso de TMDB configurado en las variables `VITE_TMDB_*`.

Si se quieren probar los correos reales de verificación y recuperación de contraseña, también debe configurarse SMTP.

Vite 7 requiere Node.js ^20.19.0 o >=22.12.0.

## Comprobaciones básicas

Antes de iniciar el proyecto puede comprobarse qué herramientas está utilizando la terminal:

```bash
php -v
composer --version
node --version
npm --version
```

## Configuración mínima del entorno

El archivo `.env` se crea a partir de la plantilla incluida en el proyecto:

```bash
cp .env.example .env
```

Después se genera la clave de Laravel:

```bash
php artisan key:generate
```

La conexión MySQL debe reflejar la instalación real del equipo. Por ejemplo:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=<puerto-mysql>
DB_DATABASE=cineverse_laravel
DB_USERNAME=<usuario-local>
DB_PASSWORD=<contraseña-local>
```

También deben configurarse las variables utilizadas por el frontend para acceder a TMDB:

```env
VITE_TMDB_BASE_URL="https://api.themoviedb.org/3"
VITE_TMDB_TOKEN="<API Read Access Token>"
```

Si se modifican variables `VITE_*`, debe reiniciarse Vite para que vuelva a cargarlas.

---

## Inicio manual

Durante el desarrollo, CineVerse necesita que MySQL esté disponible y dos terminales abiertas: una para Laravel y otra para Vite.

### 1. Iniciar MySQL

Debe estar activo el servidor MySQL configurado en `.env`.

### 2. Terminal 1: Laravel

Desde la raíz del proyecto:

```bash
php artisan serve
```

Laravel queda disponible normalmente en:

```text
http://127.0.0.1:8000
```

Esta es la URL principal de CineVerse durante el desarrollo.

### 3. Terminal 2: Vite

En otra terminal, también desde la raíz del proyecto:

```bash
npm run dev
```

Vite sirve los recursos JavaScript y CSS del frontend y mantiene la recarga durante el desarrollo.

El puerto que muestre Vite no reemplaza la URL de Laravel. La aplicación debe abrirse desde:

```text
http://127.0.0.1:8000
```

### 4. Abrir CineVerse

Con Laravel y Vite activos:

```text
http://127.0.0.1:8000
```

La ruta `/` redirige normalmente a `/es`.

---


## Inertia SSR

Esta versión de CineVerse **no utiliza Inertia SSR**.

El proyecto no define un entrypoint SSR ni necesita mantener activo:

```text
php artisan inertia:start-ssr
```

Por lo tanto, no debe agregarse un servidor SSR al procedimiento de ejecución local. Inertia entrega la aplicación y Vue se monta en el navegador.

---

## Error `ViteManifestNotFoundException`

Si Laravel no detecta el servidor de Vite y tampoco existe `public/build/manifest.json`, puede aparecer:

```text
ViteManifestNotFoundException
```

Durante el desarrollo, la solución normal es iniciar Vite:

```bash
npm run dev
```

y mantener esa terminal abierta.

Para generar los assets compilados se utiliza:

```bash
npm run build
```

---

## Nota sobre la instalación inicial

`composer install`, `npm install`, las migraciones y los seeders corresponden a la preparación inicial del proyecto y no se ejecutan cada vez que se inicia CineVerse.

La generación y carga de los datos de prueba se explica en `datos-de-prueba.md`.

---

## Nota sobre producción

Los comandos de esta guía corresponden al entorno local de desarrollo.

En producción no se mantiene `npm run dev` activo. Los assets del frontend se generan con:

```bash
npm run build
```

El servidor web debe exponer `public/` como raíz pública de Laravel.

Las migraciones de producción se ejecutan normalmente con:

```bash
php artisan migrate --force
```

Las credenciales reales, el token de TMDB y la configuración SMTP deben adaptarse al servidor y no deben publicarse en el repositorio.
