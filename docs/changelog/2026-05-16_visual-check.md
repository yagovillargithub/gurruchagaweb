# 2026-05-16 — Integración del visual-check transversal

> Sesión corta de 2026-05-16. Añadido a gurruchagaweb el mecanismo común a los 4 repos del operador (EventSystem, UNLIMITED_Web, UNLIMITED_Services_Web, gurruchagaweb) para validar visualmente el frontend antes de cerrar tarea. Playwright .NET headless captura PNGs full-page que un agente IA puede leer con la tool Read.

---

## Cambios entregados

### 1. `scripts/visual-check/` — Playwright .NET standalone

Proyecto .NET 8 console (`VisualCheck.csproj`) con `Microsoft.Playwright`. **No entra en ninguna .sln** — es un repo-tool. Invocado con `--no-login` desde el wrapper (frontend público). Lanza Chromium headless con `IgnoreHTTPSErrors=true`, viewport configurable, espera `NetworkIdle + 800 ms` y captura full-page a `scripts/screenshots/<yyyyMMdd-HHmmss>/<ruta>.png`.

**Ficheros tocados**: `scripts/visual-check/VisualCheck.csproj`, `scripts/visual-check/Program.cs`, `scripts/.gitignore`.

### 2. `scripts/visual-check.ps1` — wrapper PowerShell

Pinguea `http://localhost:5173/`. Si no responde, hace `npm run dev` dentro de `web/` en background con `Start-Process`, espera hasta 60s, captura y al terminar mata el árbol con `taskkill /T /F` (`Stop-Process` no mata hijos del wrapper de npm). Flags: `-Viewport 375x812`, `-NoServerStart`, `-KeepServer`, `-HydrateMs`.

**Ficheros tocados**: `scripts/visual-check.ps1`.

---

## Decisiones tomadas en zonas grises

- **Playwright .NET, no JS**: standalone, evita meter Playwright como devDependency en `web/package.json` (ya tiene 5 deps + 2 devDeps; añadir Playwright lo engordaba sin valor de cliente). Mismo binario en los otros 3 repos del operador → **una sola descarga de Chromium** cacheada en `~/AppData/Local/ms-playwright`.
- **No integrado en build**: el `VisualCheck.csproj` es un repo-tool, no parte del producto. Vivir aparte facilita ignorarlo en CI/CD del producto.
- **Captura full-page por default**: el viewport se hace alto para abarcar toda la página. Útil para validar el primer fold + scroll. Tradeoff: PNGs ~1-2 MB.
- **No capturar Modular por default**: el gate `0007` exige cookie. Setearla con `ctx.AddCookiesAsync(...)` es trivial pero nadie lo pidió todavía. Si hace falta, añadir flag `--gate-cookie`.

---

## Ficheros tocados (resumen)

```
scripts/visual-check.ps1
scripts/visual-check/VisualCheck.csproj
scripts/visual-check/Program.cs
scripts/.gitignore
```

---

## Pendiente tras esta sesión

- Captura de Modular con cookie de gate pre-seteada.
- Visual-flow (interacciones, no solo render estático). EventSystem ya lo tiene; gurruchagaweb no lo necesita hoy.
- Diffing automático contra baseline (regresión visual). Hoy el agente juzga "¿se ve bien?" sin baseline.

---

## Referencias

- Doc de dominio cubierto: [`../06-protocolo-pruebas.md`](../06-protocolo-pruebas.md).
- Sesión anterior: [`2026-05-08_modular-y-localizacion.md`](2026-05-08_modular-y-localizacion.md).
