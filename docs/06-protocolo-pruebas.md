# Protocolo de pruebas — `scripts/visual-check`

> Mecanismo común a los 4 repos del operador (EventSystem, UNLIMITED_Web, UNLIMITED_Services_Web, gurruchagaweb) para validar visualmente el frontend antes de cerrar tarea. Playwright .NET headless captura PNGs full-page de las rutas indicadas y los deja en disco para que un agente IA (o el operador) los evalúe sin abrir navegador.
> Última actualización: 2026-05-18.

---

## Resumen

Cuando se toca CSS o JSX, el ciclo era: edit → "abro Vite a ojo → mando captura". Ahora la captura la hace el script y un agente puede ver el resultado directamente con la tool `Read` de imágenes. Pilla regresiones obvias (layout roto, overflow, contraste malo, errores renderizados). **NO sustituye al ojo del operador** para polish/marca ni microinteracciones (hover, animaciones, marquee en movimiento, carrusel).

## Estado actual

### Cómo se usa

```powershell
# Rutas por defecto del frontend público (/ + /expositor + /contacto)
scripts\visual-check.ps1

# Rutas explícitas
scripts\visual-check.ps1 / /expositor

# Móvil
scripts\visual-check.ps1 -Viewport 375x812

# Vite ya corriendo en otra terminal — no lo arranques tú
scripts\visual-check.ps1 -NoServerStart

# No matar Vite al terminar (iteración intensiva)
scripts\visual-check.ps1 -KeepServer
```

Capturas en `scripts/screenshots/<yyyyMMdd-HHmmss>/<ruta>.png`. Log de Vite (cuando el script lo arranca) en `scripts/screenshots/server-<timestamp>.log`.

### Cómo funciona por dentro

- `scripts/visual-check/VisualCheck.csproj` — proyecto .NET 8 console con `Microsoft.Playwright`. Standalone, **no entra en ninguna .sln**. Solo se usa cuando el operador (o un agente) lo invoca.
- `scripts/visual-check/Program.cs` — invocado con `--no-login` desde el wrapper (el frontend es público). Lanza Chromium headless con `IgnoreHTTPSErrors=true`, viewport configurable, espera `NetworkIdle + 800 ms` de hidratación (React+Vite es rápido) y captura full-page.
- `scripts/visual-check.ps1` — pinguea `http://localhost:5173/`. Si no responde, hace `npm run dev` dentro de `web/` en background con `Start-Process`, espera hasta 60s, captura y al terminar mata el árbol con `taskkill /T /F` (porque `Stop-Process` no mata los hijos del wrapper de npm).
- **Tecnología elegida**: Playwright .NET (no JS) — mismo binario y misma técnica que en los otros 3 repos del operador, evita meter Playwright como devDependency en `web/package.json`. Chromium se cachea globalmente en `~/AppData/Local/ms-playwright`, **una sola descarga compartida** entre los 4 repos.

### Cobertura por defecto y limitaciones

**Cubre por defecto** (frontend público de demogurru):
- `/` — landing (hero, carrusel, marquee, "lo que hacemos", about, teaser Modular, CTA).
- `/expositor` — catálogo de proyectos.
- `/contacto` — formulario.

**NO cubre** (sin trabajo extra):
- **Modular** (`demomodular`, Blazor en `:7264`): gateado por cookie `modular_demo=ok` con clave `0007`. Para capturarlo habría que setear la cookie en Playwright (`ctx.AddCookiesAsync(...)`) antes de navegar y lanzar con `-BaseUrl https://localhost:7264`. **No está hecho** — si hace falta, ampliar `Program.cs` con flag `--gate-cookie` o validar Modular a mano.
- **Estados con interacción**: hover, focus, dropdowns abiertos, scroll-triggered framer-motion, marquee en movimiento.
- **API de contacto**: si Express no está arriba, `/contacto` carga visualmente pero submit fallaría. La captura solo valida render, no funcionalidad.
- **Variantes del Tweaks**: el sistema de personalización en vivo cambia colores/typo según `localStorage`. El script captura siempre la versión por defecto a menos que pases la URL con `?tweaks=...`.
- **Imágenes pesadas**: si el carrusel infinito está cargando WebPs grandes, `NetworkIdle` puede tardar más de lo previsto y el `hydrate=800ms` quizá no sea suficiente. Override con `-HydrateMs 2000` si capturas con assets a medias.

## Decisiones clave documentadas (zonas grises del operador)

- **Playwright .NET, no JS**: standalone, evita ensuciar `web/package.json`. Mismo binario en los 4 repos del operador → una sola descarga de Chromium.
- **No integrado en .sln**: el `VisualCheck.csproj` es un repo-tool, no parte del producto. Vivir aparte facilita ignorarlo en build/test del producto.
- **Captura full-page**: el viewport "se hace alto" para abarcar toda la página. Útil para validar el primer fold + scroll. Tradeoff: imágenes grandes (~1-2 MB).
- **No screenshots de Modular por defecto**: el gate `0007` exige cookie. Setearla en Playwright es trivial pero hay que añadir flag y nadie lo pidió todavía.
- **Hidratación `NetworkIdle + 800 ms`**: React+Vite hidrata muy rápido. 800ms es margen seguro contra fonts cargando tarde. Override con `-HydrateMs` si las assets pesan.

## Protocolo para el agente IA

Cuando un cambio toque pintado (`web/src/**/*.jsx`, `web/src/**/*.css`, `web/index.html`):

1. **Build/lint** del frontend (`cd web && npm run build` — Vite hace lint implícito vía el plugin). Si hay errores de build, parar.
2. **`scripts\visual-check.ps1 <rutas-afectadas>`** — pasar las rutas concretas, no el set completo. Mapeo:
   - Cambios en `Landing.jsx` o estilos globales → `/`.
   - Cambios en `Expositor.jsx` → `/expositor`.
   - Cambios en `Contacto.jsx` → `/contacto`.
   - Cambios en Header / Footer / `site.js` → las 3 rutas.
3. **Leer los PNG** con la tool `Read` y juzgar visualmente:
   - ¿Layout roto?
   - ¿Overflow en móvil (`-Viewport 375x812`)?
   - ¿El cambio se ve como pretendías?
   - ¿Errores renderizados en la página?
4. Si hay regresiones obvias, **corregir y repetir** desde 1. No "lo arreglo en el próximo PR".
5. **Dejar constancia al operador** de qué rutas se capturaron y el resultado.
6. Solo entonces dar la tarea por terminada.

**Cuándo saltarse el visual-check**: cambios en `api/`, en `MODULAR/`, en config de Vite que no afecte render, documentación, scripts de deploy.

## Ficheros clave

| Fichero | Propósito |
|---|---|
| `scripts/visual-check.ps1` | Wrapper: levanta Vite si no está, captura, mata Vite al salir. |
| `scripts/visual-check/VisualCheck.csproj` | Proyecto Playwright .NET (standalone). |
| `scripts/visual-check/Program.cs` | Captura headless con `--no-login` (frontend público). |
| `scripts/.gitignore` | Ignora `screenshots/`, `bin/`, `obj/` y marcador de Chromium. |
| `scripts/visual-check/.playwright-installed` | Marcador "Chromium ya instalado" local. **No se commitea**. |
| `scripts/screenshots/<ts>/` | Output del run, una carpeta por timestamp. **No se commitea**. |

## Pendiente / no implementado

- **Capturas de Modular**: añadir flag `--gate-cookie modular_demo=ok` a `Program.cs` para poder pasar el gate `0007` y validar visualmente el Blazor Server.
- **Visual-flow** (interacciones, no solo render estático). EventSystem ya tiene una herramienta así; gurruchagaweb no la necesita hoy pero podría unificarse en el futuro.
- **Diffing automático contra baseline** (regression visual): hoy el agente juzga "¿se ve bien?" sin baseline. Si hay regresiones sutiles que se nos escapan, valorar `pixelmatch` o `Playwright snapshots`.

## Referencias cruzadas

- **Frontend que se valida**: [`02-frontend-web-vite.md`](02-frontend-web-vite.md).
- **Compartido (mismo mecanismo en otros 3 repos del operador)**: no hay doc compartido aún, cada repo lo describe en sí mismo. Si se vuelve transversal, mover a `../../UNLIMITED_AI_BRAIN/compartido/04-visual-check.md` (pendiente).
- **Histórico**: [`changelog/2026-05-16_visual-check.md`](changelog/2026-05-16_visual-check.md).
