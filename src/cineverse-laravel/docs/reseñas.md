# Reseñas en CineVerse

Este documento resume el funcionamiento de las reseñas en CineVerse.  
La documentación técnica completa desarrolla estos flujos con mayor detalle, código y recorridos paso a paso.

## 1. Visión general

CineVerse separa los datos del catálogo audiovisual de la actividad propia de sus usuarios.

```text
TMDB
→ información de la película

MySQL
→ actividad propia de CineVerse
→ usuario + movie_id + movie_title + rating + comment
```

La película continúa perteneciendo a TMDB. MySQL guarda las reseñas y la relación entre cada usuario y la película reseñada.

## 2. Reglas de una reseña

Las reglas principales son:

```text
movie_id      entero positivo
movie_title   opcional, máximo 255 caracteres
rating        1–5
comment       20–1000 caracteres
```

Además:

- cada usuario puede publicar una sola reseña por película;
- solo el propietario puede editar o eliminar su reseña;
- Laravel vuelve a validar los datos aunque Vue ya haya realizado validaciones en la interfaz.

La restricción de una reseña por usuario y película también está protegida en la base de datos mediante `UNIQUE(user_id, movie_id)`.

## 3. Crear, editar y eliminar

Las operaciones de escritura requieren una sesión autenticada y protección CSRF.

### Crear

```text
Vue
→ POST /api/reviews
→ Laravel
→ validar datos
→ comprobar duplicado
→ MySQL
```

### Editar

```text
Vue
→ PUT /api/reviews/{id}
→ Laravel
→ validar cambios
→ buscar reseña
→ comprobar propietario
→ actualizar
```

### Eliminar

```text
Vue
→ DELETE /api/reviews/{id}
→ Laravel
→ comprobar propietario
→ eliminar
```

La autorización real se realiza en el backend. Ocultar botones en Vue mejora la experiencia, pero no sustituye las comprobaciones de Laravel.

## 4. Reseñas de una película

La lectura de reseñas de una película es pública.

```text
GET /api/movies/{movieId}/reviews?page=N
```

La respuesta separa conceptualmente:

```text
stats
pagination
user_review
reviews
```

Esto permite mostrar:

- estadísticas globales de la película;
- la reseña propia del usuario, si existe una sesión;
- las reseñas de la comunidad;
- información de paginación.

La reseña propia se devuelve separada de la comunidad para evitar mostrarla duplicada.

Las reseñas de comunidad se entregan en páginas de **10 elementos**.

## 5. Perfil e historial

CineVerse utiliza dos endpoints distintos porque cumplen funciones diferentes.

### Resumen del perfil

```text
GET /api/profile
→ total de reseñas
→ 6 reseñas más recientes
```

Este endpoint alimenta la vista de perfil.

### Historial completo

```text
GET /api/reviews?page=N
→ historial completo
→ 12 reseñas por página
```

Este endpoint permite recorrer todas las reseñas del usuario.

## 6. Rutas principales

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/api/reviews` | Crear una reseña |
| `PUT` | `/api/reviews/{id}` | Editar una reseña |
| `DELETE` | `/api/reviews/{id}` | Eliminar una reseña |
| `GET` | `/api/reviews?page=N` | Historial completo del usuario |
| `GET` | `/api/movies/{movieId}/reviews?page=N` | Reseñas de una película |
| `GET` | `/api/profile` | Resumen del perfil |

Las operaciones de creación, edición, eliminación, historial propio y perfil requieren autenticación.

La lectura de reseñas de una película es pública, aunque puede utilizar una sesión existente para identificar y separar la reseña propia.

## 7. Archivos principales

```text
routes/api.php

app/Http/Controllers/Api/ReviewController.php
app/Http/Controllers/Api/ProfileController.php
app/Models/Review.php

resources/js/cineverse/features/movies/
├── components/movie-detail/MovieReviews.vue
└── services/reviews.service.ts

resources/js/cineverse/features/profile/
├── views/ProfileView.vue
├── views/MyReviewsView.vue
└── services/profile.service.ts
```

Responsabilidades principales:

| Archivo o directorio | Función |
|---|---|
| `routes/api.php` | Rutas JSON de reseñas y perfil |
| `ReviewController.php` | Crear, editar, eliminar y consultar reseñas |
| `ProfileController.php` | Construir el resumen del perfil |
| `Review.php` | Modelo Eloquent de reseñas |
| `MovieReviews.vue` | Formulario y representación de reseñas de una película |
| `reviews.service.ts` | Solicitudes HTTP relacionadas con reseñas |
| `ProfileView.vue` | Vista de resumen del perfil |
| `MyReviewsView.vue` | Historial paginado de reseñas del usuario |
| `profile.service.ts` | Solicitud de datos del perfil |

## 8. Documentación técnica ampliada

Este archivo funciona como referencia rápida.

Para los recorridos completos de creación, edición, eliminación, paginación, autorización, CSRF, Eloquent y perfil, consultar la sección de reseñas y perfil de:

`CineVerse_Laravel_Documentacion_Tecnica(2).docx`
