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
4. **Commit**:
   - al terminar, invocar `git-review` en modo `commit` **en primer plano** (`run_in_background: false`);
   - si devuelve hallazgos 🔴, mostrar el informe y preguntar: corregir, u override con la frase `override aprobado por el usuario: <razón>`;
   - **nunca `git commit` directo**: el hook lo rechaza si el índice no pasó por `git-review`.
5. **Push**:
   - mostrar el informe y los commits, y preguntar con AskUserQuestion «¿push de `<rama>` @ `<sha>`?»;
   - solo con un sí, invocar `git-review` en modo `push` (primer plano) con la frase `push confirmado por el usuario para <rama> @ <sha>`. El hook además pide el permiso nativo;
   - **nunca `git push` directo**, ni force, ni push a `main`.
6. **Ante cualquier duda, preguntar al usuario** antes de asumir.

## Notas

- El git del usuario tiene `pull.rebase=true`. Para actualizar `main` usar `git fetch origin main` + `git merge --ff-only origin/main`, no `git pull`.
- Escapes de los hooks, solo si el usuario lo pide: `CLAUDE_ALLOW_MAIN_EDITS=1` y `CLAUDE_SKIP_REVIEW=1`.
