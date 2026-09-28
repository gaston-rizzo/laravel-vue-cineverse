# CineVerse Laravel — Datos de prueba

CineVerse Laravel incluye una base de datos de prueba con usuarios y reseñas.

La base de datos puede cargarse importando el archivo SQL incluido en el repositorio o generarse desde cero mediante las migraciones y los seeders del proyecto.

## Base de datos incluida

El archivo SQL se encuentra en la carpeta `database` con el nombre `cineverse_laravel.sql`.

Este archivo contiene la base de datos de prueba completa de CineVerse Laravel y puede importarse directamente en MySQL sin necesidad de ejecutar los seeders.

El dump incluye la creación de la base `cineverse_laravel`, la estructura generada por las migraciones y los datos de usuarios y reseñas.

## Generar la base de datos con los seeders

La base también puede generarse desde el proyecto Laravel.

Primero debe crearse la base vacía en MySQL:

```sql
CREATE DATABASE cineverse_laravel
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Después, el archivo `.env` debe apuntar a `cineverse_laravel` con los datos de conexión correspondientes al equipo local.

Desde la raíz del proyecto, ejecutar:

```bash
php artisan migrate
php artisan db:seed
```

`php artisan migrate` crea la estructura de la base de datos.

`php artisan db:seed` ejecuta `DatabaseSeeder`, que llama primero a `UserSeeder` y después a `ReviewSeeder`.

Los datos se leen desde:

```text
database/seeders/data/users.ndjson
database/seeders/data/reviews.ndjson
```

`UserSeeder` procesa los usuarios en lotes de 500 registros y `ReviewSeeder` procesa las reseñas en lotes de 250.

Si se quiere reconstruir completamente un entorno de prueba que ya contiene datos, puede utilizarse:

```bash
php artisan migrate:fresh --seed
```

`migrate:fresh` elimina todas las tablas de la base configurada, vuelve a ejecutar las migraciones y finalmente carga los datos de prueba mediante los seeders.

Este comando es destructivo. Si la base contiene información que deba conservarse, debe realizarse una copia de seguridad antes de utilizarlo.

## Usuarios de prueba

El dataset contiene 5.000 usuarios. Entre las cuentas que pueden utilizarse para probar el inicio de sesión se encuentran:

```text
rachelbrown.1108@gmail.com - RachelBrown	
gonzalo_rodriguez.707@yahoo.com	- Gonzalo_Rodriguez
mateo81.1019@yahoo.com - Mateo81
avaw12.604@gmail.com - AvaW12
lucasr80.566@outlook.com - LucasR80
```

Estas cuentas forman parte del dataset generado y tienen el correo marcado como verificado.

## Contraseña de prueba

Los 5.000 usuarios generados utilizan la misma contraseña:

```text
password
```

La contraseña no se almacena en texto plano. Los registros contienen el hash correspondiente y Laravel compara la contraseña ingresada con ese hash durante el inicio de sesión.

## Datos generados

La base contiene:

- 5.000 usuarios registrados.
- 4.800 usuarios con el correo verificado.
- 200 usuarios sin verificar.
- 3.448 usuarios con al menos una reseña.
- 1.552 usuarios sin reseñas.
- 24.322 reseñas.

Las reseñas se distribuyen de la siguiente manera:

- 553 reseñas de 1 estrella.
- 2.437 reseñas de 2 estrellas.
- 6.191 reseñas de 3 estrellas.
- 8.594 reseñas de 4 estrellas.
- 6.547 reseñas de 5 estrellas.

Además:

- 314 películas distintas tienen al menos una reseña.
- 1.766 reseñas tienen una actualización posterior a su fecha de creación.
- La puntuación media del conjunto es aproximadamente 3,75 sobre 5.

Los valores finales del escenario de prueba se resumen también en:

```text
docs/resultado-datos-prueba.md
```

## Correos electrónicos de prueba

Los usuarios generados utilizan direcciones con formatos variados y dominios públicos como:

```text
gmail.com
hotmail.com
outlook.com
yahoo.com
```

Estos dominios son reales y las direcciones del dataset no deben tratarse como dominios reservados para pruebas.

Por ese motivo, las pruebas de verificación de correo y recuperación de contraseña deben realizarse con una configuración de correo local o controlada para evitar envíos accidentales a direcciones reales.

## Películas y contenido externo

CineVerse no almacena una copia completa del catálogo de películas en MySQL.

La tabla `reviews` conserva `movie_id` y `movie_title` para identificar la película asociada a cada reseña.

Los datos generales de las películas, como sinopsis, posters, reparto, trailers y películas similares, se obtienen desde TMDB durante el funcionamiento de la aplicación.

## Comprobaciones de integridad

Los seeders realizan comprobaciones antes y durante la carga para evitar que el escenario quede incompleto o se duplique sobre datos existentes.

Entre otras cosas, verifican:

- que `users` esté vacía antes de ejecutar `UserSeeder`;
- que `reviews` esté vacía antes de ejecutar `ReviewSeeder`;
- que existan exactamente 5.000 usuarios antes de cargar las reseñas;
- que `users.ndjson` produzca exactamente 5.000 registros;
- que `reviews.ndjson` produzca exactamente 24.322 registros.

Si una cantidad procesada no coincide con el valor esperado, el seeder lanza una `RuntimeException` en lugar de aceptar un dataset incompleto.

La base de datos agrega además restricciones estructurales sobre las reseñas:

- `reviews.user_id` referencia a `users.id` mediante una clave foránea;
- la eliminación de un usuario elimina sus reseñas mediante `ON DELETE CASCADE`;
- la combinación `user_id + movie_id` es única, por lo que un usuario no puede tener dos reseñas para la misma película.
