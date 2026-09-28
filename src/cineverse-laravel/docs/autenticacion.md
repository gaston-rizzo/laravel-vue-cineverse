# Autenticación en CineVerse

Este documento resume el funcionamiento de la autenticación en CineVerse.  
La documentación técnica completa desarrolla estos flujos con mayor detalle, código y recorridos paso a paso.

## 1. Visión general

CineVerse utiliza el guard `web` de Laravel y sesiones HTTP.

Laravel Breeze se utilizó como scaffolding inicial de autenticación, pero las pantallas visibles pertenecen al frontend Vue de CineVerse. En tiempo de ejecución, la autenticación la gestionan los mecanismos estándar de Laravel.

```text
Vue
→ Laravel
→ Auth / sesión
→ User / MySQL
→ Vue
```

La sesión de Laravel es la autoridad real. Pinia mantiene una representación reactiva del usuario autenticado para la interfaz.

## 2. Registro y verificación

El registro se realiza desde la interfaz Vue y crea el usuario en Laravel.

```text
RegisterView
→ POST /register
→ crear usuario
→ enviar correo de verificación
→ enlace firmado
→ verificar email
→ cuenta verificada
```

Puntos importantes:

- el registro no inicia sesión automáticamente;
- el usuario debe verificar su correo antes de iniciar sesión;
- CineVerse utiliza correos de verificación propios en español e inglés;
- la verificación se realiza mediante una URL firmada de Laravel.

## 3. Inicio y cierre de sesión

El inicio de sesión utiliza el formulario Vue y la sesión web de Laravel.

```text
LoginView
→ POST /login
→ validar credenciales
→ comprobar correo verificado
→ crear sesión Laravel
→ GET /user
→ Pinia
```

El login está protegido por `RateLimiter`.

Después de autenticarse, CineVerse consulta `GET /user` para recuperar el usuario de la sesión y actualizar el estado del frontend.

El cierre de sesión sigue el recorrido:

```text
POST /logout
→ cerrar sesión Laravel
→ invalidar sesión
→ regenerar token CSRF
→ limpiar estado de autenticación en Vue
```

## 4. Recuperación de contraseña

CineVerse utiliza el sistema de recuperación de contraseña de Laravel.

```text
ForgotPasswordView
→ POST /forgot-password
→ correo de recuperación
→ token
→ ResetPasswordView
→ POST /reset-password
→ nueva contraseña
```

Los correos de recuperación también utilizan plantillas propias en español e inglés.

## 5. Estado de autenticación en Vue

El frontend mantiene el estado de autenticación mediante Pinia.

```text
GET /user
→ user + csrf_token
→ useAuthStore
```

Cuando la aplicación se recarga, el estado JavaScript se pierde. `useAuthStore` consulta nuevamente a Laravel para reconstruir el usuario autenticado.

Por lo tanto:

```text
Laravel session
→ autenticación real

Pinia
→ representación reactiva para la interfaz
```

El token CSRF obtenido desde Laravel se utiliza en operaciones autenticadas que modifican datos, como reseñas y cierre de sesión.

## 6. Rutas principales

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/register` | Crear una cuenta |
| `POST` | `/login` | Iniciar sesión |
| `GET` | `/user` | Recuperar el usuario autenticado |
| `POST` | `/logout` | Cerrar sesión |
| `POST` | `/forgot-password` | Solicitar recuperación de contraseña |
| `POST` | `/reset-password` | Establecer una nueva contraseña |
| `GET` | `/verify-email/{id}/{hash}` | Verificar el correo electrónico |
| `POST` | `/email/verification-notification` | Reenviar el correo de verificación |

Las rutas de autenticación se encuentran principalmente en `routes/auth.php`.

## 7. Limitaciones actuales de verificación

### Reenvío del correo

La interfaz contempla el reenvío del correo de verificación, pero el endpoint actual requiere un usuario autenticado.

Al mismo tiempo:

```text
registro
→ no inicia sesión

usuario no verificado
→ no puede iniciar sesión
```

Por eso, el flujo normal de un usuario no verificado no puede utilizar ese endpoint de reenvío desde el login sin una sesión previa.

### Duración del enlace

El enlace de verificación vence a los **60 minutos**.

Las plantillas de correo en español e inglés informan el mismo tiempo de validez.

## 8. Archivos principales

```text
routes/auth.php

app/Http/Controllers/Auth/
app/Http/Requests/Auth/LoginRequest.php
app/Models/User.php
app/Notifications/

resources/js/cineverse/features/auth/
resources/js/cineverse/features/auth/stores/useAuthStore.ts
resources/js/cineverse/core/api/webApi.ts
```

Responsabilidades principales:

| Archivo o directorio | Función |
|---|---|
| `routes/auth.php` | Rutas de autenticación |
| `app/Http/Controllers/Auth/` | Registro, login, logout, verificación y recuperación |
| `LoginRequest.php` | Validación y autenticación del login |
| `User.php` | Modelo autenticable de Laravel |
| `app/Notifications/` | Correos personalizados de CineVerse |
| `features/auth/` | Vistas, servicios y estado de autenticación en Vue |
| `useAuthStore.ts` | Estado reactivo de usuario y token CSRF |
| `webApi.ts` | Cliente Axios para comunicarse con Laravel |

## 9. Documentación técnica ampliada

Este archivo funciona como referencia rápida.

Para los recorridos completos de registro, login, sesiones, verificación de correo, recuperación de contraseña, CSRF, RateLimiter y seguridad, consultar las secciones de autenticación y seguridad de:

`CineVerse_Laravel_Documentacion_Tecnica(2).docx`
