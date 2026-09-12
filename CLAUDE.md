# TesloShop — guía para Claude Code

## Proyecto

Frontend de un e-commerce de ropa (estilo Teslo) en **Angular 20.3**. El backend es un **NestJS externo** (no vive en este repo) que se consume por HTTP.

- **Zoneless** (`provideZonelessChangeDetection()`): `signal`/`computed` y `rxResource` de `@angular/core/rxjs-interop`. Nada de Zone.js ni `ChangeDetectorRef`.
- Componentes **standalone** con `templateUrl` (sin plantillas inline). Guards (`CanMatchFn`) e interceptors (`HttpInterceptorFn`) **funcionales** con `inject()`.
- Rutas **lazy** por feature con `withHashLocation()`: `/auth` (`notAuthenticatedGuard`), `/admin` (`isAdminGuard`) y `''` (store-front).
- **Tailwind CSS v4** + **daisyUI 5** (temas `emerald` / `dim`, preferencia en `ThemeStore`) + Swiper 12.
- Alias (`tsconfig.json`): `@/*` = `src/app/*`, `@auth/*`, `@dashboard/*` (admin-dashboard), `@products/*`, `@shared/*`, `@store-front/*`, `@utils/*`.
- Nombres: clases `PascalCase` (`LoginPage`, `AuthApi`), archivos `kebab-case`.
- Los servicios importan `src/environments/environment` (API desplegada en Render). No reintroducir imports de `environment.development`.
- Tests con **Karma + Jasmine**: cada componente o servicio tiene su `.spec.ts`, y los mocks compartidos viven en `src/testing/mocks.ts`.

| Acción | Comando |
|---|---|
| Servidor de desarrollo | `npm start` (http://localhost:4200) |
| Build (sirve de chequeo de tipos; no hay lint) | `npm run build` |
| Tests en modo watch | `npm test` |
| Tests una vez, headless | `npm run test:ci` |

## Contexto generado desde el historial de git

@.claude/context/project-context.md

## Flujo de trabajo obligatorio

1. **Contexto**: si el hook de inicio avisa que el contexto falta o está desactualizado, y siempre antes de planear o cambiar algo, invocar el sub-agente `git-context` y esperar su resumen.
2. **Planificación y análisis de features**:
   - aplicar la skill `grilling`: rondas sobre la frontera de decisiones abiertas, cada pregunta con una respuesta recomendada, y AskUserQuestion cuando las opciones sean cerradas;
   - usar `angular-developer` para el diseño Angular respetando la v20.3: **Karma + Jasmine; ignorar su guía de Vitest y de Signal Forms (v22+)**;
   - usar `frontend-design` si la feature toca UI.
3. **Implementación**:
   - tras aprobar el plan y antes del primer cambio, invocar `git-branch`;
   - si reporta cambios sin commitear o una rama existente, preguntar al usuario;
   - las ediciones en `main` están bloqueadas por hook. **Nunca escribir archivos con Bash/PowerShell para saltarse el bloqueo**.
4. **Verificación** (obligatoria al terminar de implementar, antes de commitear):
   - `npm run test:ci`. Con tests en rojo no se avanza: corregir y repetir;
   - `npm run build` como chequeo de tipos;
   - levantar la app (`npm start`, en segundo plano) y validarla en el navegador con la extensión de Claude en Chrome: el checklist base de «Smoke en navegador» más los checks propios de la feature;
   - con todo en verde, registrar el smoke: `node .claude/hooks/workflow.mjs smoke-ok "<qué se validó>"`;
   - cerrar la pestaña y apagar el dev server. En Windows, matar la tarea de `npm start` deja vivo el `ng serve`: comprobar con `curl` y, si el puerto sigue ocupado, `Get-NetTCPConnection -LocalPort 4200 -State Listen` + `Stop-Process`.
5. **Commit**:
   - al terminar, invocar `git-review` en modo `commit` **en primer plano** (`run_in_background: false`);
   - si devuelve hallazgos 🔴, mostrar el informe y preguntar: corregir, u override con la frase `override aprobado por el usuario: <razón>`;
   - **nunca `git commit` directo**: el hook lo rechaza si el índice no pasó por `git-review`, o si toca `src/` sin un smoke válido. Si lo rechaza por el smoke, volver al paso 4; no usar el escape.
6. **Push**:
   - mostrar el informe y los commits, y preguntar con AskUserQuestion «¿push de `<rama>` @ `<sha>`?»;
   - solo con un sí, invocar `git-review` en modo `push` (primer plano) con la frase `push confirmado por el usuario para <rama> @ <sha>`. El hook además pide el permiso nativo;
   - **nunca `git push` directo**, ni force, ni push a `main`.
7. **Ante cualquier duda, preguntar al usuario** antes de asumir.

## Smoke en navegador

Con `npm start` corriendo, abrir una pestaña nueva (`tabs_create_mcp`; nunca reusar una del usuario sin permiso) y recorrer el checklist. Todas las rutas usan hash location.

La primera carga despierta el backend en Render (free tier) y puede tardar ~50 s. Si falla, **no es un bug de la feature**: el `rxResource` cachea el error (`ResourceValueError` en consola, «No hay productos» en pantalla) y no reintenta solo. Comprobar la API con `curl .../api/products?limit=3&offset=0` y, si responde 200, recargar la pestaña antes de diagnosticar nada más.

- `#/` — el carrusel Swiper y el grid de productos renderizan.
- `#/gender/men` — grid filtrado y paginación.
- Detalle de producto **navegando desde el grid**, no con un slug fijo.
- `<theme-toggle>` — alterna claro/oscuro y la preferencia sobrevive a una recarga.
- `#/auth/login` con el usuario de `.claude/context/smoke.local.json` → redirige a `/`.
- `#/admin/products` — el listado admin carga.
- `read_console_messages` sin errores y `read_network_requests` sin 4xx/5xx inesperados.
- Los checks propios de la feature, derivados del plan aprobado.

Las capturas van al scratchpad de la sesión (nunca al repo); las relevantes se le muestran al usuario. Si algo falla: corregir, repetir tests y smoke. Cualquier cambio posterior en `src/` invalida el smoke anterior, porque la marca guarda una huella del contenido de `src/`.

## Notas

- El git del usuario tiene `pull.rebase=true`. Para actualizar `main` usar `git fetch origin main` + `git merge --ff-only origin/main`, no `git pull`.
- Las credenciales del usuario de prueba del smoke viven en `.claude/context/smoke.local.json` (`{ "email": "…", "password": "…" }`). No se commitean: `/.claude/context/` está en `.gitignore`. Nunca escribirlas en el chat, en el código ni en un commit.
- Escapes de los hooks, solo si el usuario lo pide: `CLAUDE_ALLOW_MAIN_EDITS=1`, `CLAUDE_SKIP_SMOKE=1` (salta solo el smoke) y `CLAUDE_SKIP_REVIEW=1` (salta ambas compuertas del commit).
