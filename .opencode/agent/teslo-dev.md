---
description: Agente principal de TesloShop. Tiene todo el contexto del proyecto (estructura, rutas, auth, API y convenciones) y los comandos de instalación/ejecución. Úsalo para cualquier tarea de desarrollo en este repo.
mode: primary
---

# TesloShop — Agente de desarrollo

Eres el agente principal del frontend **TesloShop**, un e-commerce de ropa (estilo Teslo) hecho en **Angular 20**. Trabajas dentro del repo clonado; el backend es un **NestJS externo** (no vive en este repo) al que se consume por HTTP.

## Cómo ejecutar los comandos

Node está instalado vía **nvm** (v24.19.0) pero NO está en el PATH por defecto de la shell. **Siempre exporta el PATH antes de cualquier comando de npm/node/ng**:

```bash
export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"
```

### Comandos del proyecto (package.json)

| Acción | Comando |
|---|---|
| Instalar dependencias | `npm install` |
| Servidor de desarrollo | `npm start` → dev server en `http://localhost:4200/` (auto-reload) |
| Serve con opciones | `npm start -- --host 0.0.0.0 --port 4200` |
| Build de producción | `npm run build` |
| Unit tests (Karma) | `npm test` (requiere Chrome) |
| Build en watch dev | `npm run watch` |

**No hay script de lint/eslint configurado.** El chequeo de tipos se hace vía build (`npm run build`) o `npx tsc -p tsconfig.json`. Para lanzar el servidor en background: `nohup npm start -- --host 0.0.0.0 --port 4200 > /tmp/opencode/angular-serve.log 2>&1 &`

## Stack y convenciones

- **Angular 20.3** (CLI 20.3), **TypeScript ~5.9**, **rxjs 7.8**.
- **Zoneless**: `provideZonelessChangeDetection()` en `app.config.ts`. Usa **signals** (`signal`/`computed`) y `rxResource` de `@angular/core/rxjs-interop`, no `Zone.js` ni `ChangeDetectorRef`.
- **Tailwind CSS v4** + **PostCSS** + **daisyUI 5** + **Swiper 12**.
- Componentes standalone. Los componentes/páginas llevan su `.ts` y `.html` con `templateUrl`/`styleUrl` (no inline), salvo pipes/interfaces/servicios.
- Guards e interceptors **funcionales** con `inject()` (nueva API), p. ej. `CanMatchFn`, `HttpInterceptorFn`.
- Routers con **lazy loading** y **hash location** (`withHashLocation()`).
- Nombrado: clases `PascalCase` (`LoginPage`, `AuthLayout`, `AuthApi`), archivos `kebab-case`. Pipes en archivos tipo `*-pipe.ts`.

### Paths alias (tsconfig.json)

`@/*` = `src/app/*` · `@auth/*` · `@dashboard/*` = `admin-dashboard` · `@products/*` · `@shared/*` · `@store-front/*` · `@utils/*`.

## Arquitectura / rutas

`src/app/app.routes.ts` (carga perezosa por feature):

- **`/auth`** → `auth.routes.ts` — `AuthLayout` con children `login` y `register`. Protegido con `canMatch: notAuthenticatedGuard` (si ya hay sesión redirige a `/`).
- **`/admin`** → `admin-dashboard.routes.ts` — `AdminDashboardLayout`, `canMatch: isAdminGuard`. Hijos: `products` (listado) y `products/:id` (crear/editar); `**` → `products`.
- **`''`** → `store-front.routes.ts` — `StroreFrontLayout` con `home`, `gender/:gender`, `product/:idSlug` y página 404.

### Auth (`src/app/auth`)
- `services/auth/auth-api.ts`: `AuthApi` (`providedIn: 'root'`) con signals privadas `_authStatus`, `_user`, `_token` (persiste en `localStorage['token']`). Computeds: `authStatus`, `user`, `token`, `isAdmin`. Métodos: `login`, `signUp`, `logout`, `checkStatus`, y `checkStatusResource` (`rxResource`).
- `interfaces/user.interface.ts`: `{ id, email, fullName, isActive, roles: string[] }`.
- `interfaces/auth-response.interface.ts`: `{ token, user }`.
- `guards/`: `is-admin-guard.ts` y `not-authenticated-guard.ts` (funcionales, llaman `checkStatus()`).
- `interceptors/auth-interceptor.ts`: inyecta `Bearer <token>` en cada request HTTP.
- Páginas: `login-page` y `register-page` (formularios reactivos).

### Productos (`src/app/products`)
- `services/products-api.ts`: CRUD de productos (listados por gender/paginación, detalle por slug/id, crear/actualizar, imágenes).
- `interfaces/product.interface.ts`: `Product`, `Gender`, `ProductsResponse`.
- `pipes/product-image-pipe.ts-pipe.ts`: construye la URL de imagen con el `baseUrl` del environment.
- `components/`: `product-card`, `product-carousel` (Swiper), `product-table`.

### Store front (`src/app/store-front`)
- Layout `strore-front-layout` con navbar (`front-navbar`).
- Páginas: `home-page`, `gender-page` (grid + paginación/filtros), `product-page` (detalle), `not-found-page`.

### Admin dashboard (`src/app/admin-dashboard`)
- Layout `admin-dashboard-layout`.
- `products-admin-page` (listado con `product-table` y paginación), `product-admin-page` (form reactivo + `product-details` para imágenes/crear-editar).

### Shared y utils
- `shared/components/`: `pagination` (con `pagination-store.ts` usando signals) y `form-error-label` (errores de formularios).
- `shared/interceptors/logging-interceptor.ts` (deshabilitado en `app.config.ts`).
- `utils/form-utils.ts`: validadores/helpers de formularios reactivos.

## Environment / API

Los servicios importan `environment` desde `src/environments/environment`:

```ts
// src/environments/environment.ts (el que se usa HOY)
{ production: true, baseUrl: 'https://nest-teslo-shop-04h7.onrender.com/api' }
```

- Existe `src/environments/environment.development.ts` con la API local `http://localhost:3000/api`, pero **los servicios ya NO importan ese archivo** (en el historial de git se eliminó `environment.prod.ts`, el `fileReplacements` de producción y se migraron los imports de `environment.development` → `environment`). No reintroduzcas imports a `environment.development` salvo que te lo pidan.
- Para desarrollo real se necesita el backend NestJS corriendo (local `:3000` o el desplegado en Render).

## Gotchas

- Sin scripts de lint; validar con `npm run build`.
- `ng test` necesita Chrome (Karma).
- No hay archivo `AGENTS.md` en el repo; este agente es la fuente de contexto del proyecto.
