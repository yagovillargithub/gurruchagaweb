# HANDOVER — gurruchagaweb

> Índice maestro del proyecto. **Carga obligatoria al inicio de cualquier sesión nueva**. Mapa "para hacer X, lee Y" + estado actual + changelog cronológico + referencias externas.
> Diseñado para que un agente IA (Claude Opus 4.7 u otros) retome el desarrollo con la mínima fricción cargando solo lo necesario.
> Última actualización: 2026-05-18.

---

## Estado actual del proyecto (resumen ejecutivo)

**Cliente / dueño**: arancha GURRUCHAGA — taller de mobiliario en Santa Rosa (La Pampa, Argentina). Marca pública **AG Studio**.

**Stack**: dos sitios hermanos en un mismo repo. `web/` Vite+React + `api/` Express/Nodemailer (demogurru) · `MODULAR/ModularKitchen/` Blazor Server .NET 8 con SQLite prod (demomodular, gateado clave `0007`). VPS Contabo + Apache reverse-proxy + Let's Encrypt.

**Producción**:
- <https://demogurru.unlimited-systems.net/> (público, cert R13 expira 2026-08-05)
- <https://demomodular.unlimited-systems.net/> (gate `0007`, cert R13 expira 2026-08-06)

### Fases cerradas

| Fase | Módulo | Estado |
|---|---|---|
| Convertir prototipo HTML/JSX (CDN) a Vite+React | `web/` | ✔ Completa |
| API Express + nodemailer contra Stalwart | `api/` | ✔ Completa |
| Sistema de Tweaks (FAB + drawer + 11 settings live) | `web/src/tweaks/` | ✔ Completa, en `gurru:tweaks:v3` |
| Flow "Quiero algo parecido" (carrusel → expositor → contacto con adjunto) | `web/` + `api/` | ✔ Completa, defensa anti-traversal en dos capas |
| Localización de copy "Taller" / "Producción propia" / "hablamos" | `web/src/pages/` | ✔ Completa 2026-05-08 |
| Despliegue automatizado demogurru (`deploy/deploy.ps1`) | `deploy/` | ✔ Completa |
| Subdominio demomodular + Blazor Server + SQLite + gate `0007` + teaser | `MODULAR/` + `web/` | ✔ Completa 2026-05-08 |
| visual-check con Playwright .NET | `scripts/` | ✔ Completa 2026-05-16 |

### Lo que se está cocinando / próximos hitos

- Sustituir imágenes placeholder de `web/public/assets/proyectos/` por fotos reales (bloqueado: arancha debe pasarlas).
- Pipeline de optimización de imágenes en build (WebP/AVIF) — crítico porque las imágenes se adjuntan al correo y el `logo-vercreer.png` original pesa 3.8 MB.
- Email de **autorespuesta** al visitante que envía el formulario (hoy solo se manda aviso interno a `gurru999@gmail.com`).
- Open Graph + Twitter cards por página, sobre todo para URLs compartibles (`/expositor?cat=...`, `/contacto?ref=...`).
- Apertura del gate de Modular cuando la línea esté lista (cambiar copy del teaser, no quitarlo).

### Datos / decisiones pendientes del operador

- [ ] Fotos reales de proyectos (bloqueante crítico).
- [ ] ¿Mantener `gurru999@gmail.com` como destinatario o pasar a inbox propio del taller?
- [ ] ¿Comprar dominio definitivo (`gurruchaga.ar`, `agstudio.ar`)? Afecta `ALLOWED_ORIGINS`, `MAIL_FROM`, redirects.
- [ ] Rotar pass de `info@unlimited-systems.net` (SMTP_PASS = admin Stalwart, doble función).
- [ ] Cerrar el gate de Modular y revisar copy cuando arranque la línea.

---

## Tabla de contenidos de la documentación

| Doc | Cubre |
|---|---|
| [`docs/01-arquitectura.md`](docs/01-arquitectura.md) | Visión general, estructura del repo, layout VPS, topología de red, dominios y certs, autoría |
| [`docs/02-frontend-web-vite.md`](docs/02-frontend-web-vite.md) | Frontend Vite+React: stack, build, `site.js`, sistema de Tweaks, carrusel, marquee, lightbox, decisiones de copy |
| [`docs/03-api-contacto-node.md`](docs/03-api-contacto-node.md) | API Express+nodemailer: endpoints, validaciones, `.env`, flow "Quiero algo parecido", anti path-traversal, formato del correo |
| [`docs/04-modular-blazor.md`](docs/04-modular-blazor.md) | Modular Blazor Server: stack, doble proveedor EF Core, gate `0007` + cookie, teaser, trampas. **Pendiente Fase F: extraer a `MODULAR/` como repo independiente** |
| [`docs/05-despliegue.md`](docs/05-despliegue.md) | `deploy.ps1`, vhosts Apache, systemd, certbot, operación cotidiana, "cosas que NO hacer", trampas conocidas (HTTPS redirect, Stalwart unhealthy, etc.) |
| [`docs/06-protocolo-pruebas.md`](docs/06-protocolo-pruebas.md) | visual-check con Playwright .NET — invocación, cobertura, limitaciones, protocolo de agente IA |
| [`docs/changelog/`](docs/changelog/) | Historia cronológica (iteraciones 2026-05-07/08, integración visual-check 2026-05-16) |

---

## Por dónde empezar según tu tarea

### Si vas a tocar...

- **Frontend / UI / copy del taller** (Landing, Expositor, Contacto, header, footer, marquee, carrusel, Tweaks): [`docs/02-frontend-web-vite.md`](docs/02-frontend-web-vite.md). Si tocas pintado, leer también [`docs/06-protocolo-pruebas.md`](docs/06-protocolo-pruebas.md) y ejecutar `scripts\visual-check.ps1` antes de cerrar tarea.
- **Formulario de contacto / envío de email / flow "Quiero algo parecido"**: [`docs/03-api-contacto-node.md`](docs/03-api-contacto-node.md). Si tocas SMTP o pass: [`../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md).
- **Modular (Blazor Server, visor, market, gate `0007`, teaser, BD SQLite)**: [`docs/04-modular-blazor.md`](docs/04-modular-blazor.md). Cross-deploy en el mismo VPS, ver [`docs/05-despliegue.md`](docs/05-despliegue.md).
- **Desplegar (frontend / API / Modular / vhost / cert / health)**: [`docs/05-despliegue.md`](docs/05-despliegue.md) + [`../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md`](../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md).
- **Probar visualmente antes de cerrar tarea**: [`docs/06-protocolo-pruebas.md`](docs/06-protocolo-pruebas.md).
- **Reglas innegociables, identidad, restricciones críticas**: [`CLAUDE.md`](CLAUDE.md) (carga automática).

### Si vas a investigar un cambio histórico

Empezar por el changelog correspondiente (orden cronológico inverso):

- [`docs/changelog/2026-05-16_visual-check.md`](docs/changelog/2026-05-16_visual-check.md)
- [`docs/changelog/2026-05-08_modular-y-localizacion.md`](docs/changelog/2026-05-08_modular-y-localizacion.md)
- [`docs/changelog/2026-05-07_bootstrap-vite-y-api.md`](docs/changelog/2026-05-07_bootstrap-vite-y-api.md)

---

## Histórico (changelog cronológico)

| Fecha | Hito | Detalle |
|---|---|---|
| 2026-05-07 | Bootstrap | Conversión del prototipo HTML/JSX (`Front Generado con IA/`) a `web/` Vite+React + `api/` Express. [Ver](docs/changelog/2026-05-07_bootstrap-vite-y-api.md) |
| 2026-05-08 | Modular + localización | Subdominio `demomodular`, Blazor Server con SQLite prod + gate `0007`, teaser desde Landing. Localización copy "Taller"/"Producción propia". Tweaks v3 (height slider + ui-scale). [Ver](docs/changelog/2026-05-08_modular-y-localizacion.md) |
| 2026-05-16 | visual-check | Integración del visual-check transversal (Playwright .NET) común a EventSystem, UNLIMITED_Web, UNLIMITED_Services_Web y gurruchagaweb. [Ver](docs/changelog/2026-05-16_visual-check.md) |

---

## Sistema de memoria del proyecto

La organización de la documentación está descrita en `C:\GitHub\UNLIMITED_AI_BRAIN\SISTEMA.md` (sistema global):

- **CLAUDE.md** (raíz, ≤210 líneas, carga automática): filosofía universal embebida + reglas innegociables locales + identidad + mapa rápido.
- **HANDOVER.md** (este fichero, índice maestro): se carga al inicio de cada sesión.
- **docs/0X-*.md** (6 docs por dominio/subproducto): se cargan **bajo demanda** según la tarea.
- **docs/changelog/YYYY-MM-DD_*.md**: historia cronológica, solo se lee si hace falta arqueología.
- **`handover_gurruchagaweb.LEGACY.md`**: handover original (792 líneas) preservado durante ~1 mes para validación; borrar tras confirmar que la migración no ha perdido información.

> **Nota Fase F**: `MODULAR/` es un repo git independiente nested. Mientras Fase F no se ejecute, `docs/04-modular-blazor.md` cubre Modular desde aquí. Cuando Fase F arranque, ese doc debería moverse a `c:\GitHub\MODULAR\docs/` y aquí quedaría solo un puntero corto + la sección "teaser/cross-deploy" que sí pertenece a demogurru.

---

## Referencias externas

- **Infraestructura compartida (VPS Contabo, Apache, certbot, UFW)**: [`../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md`](../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md).
- **Mail server Stalwart self-hosted (SMTP_PASS, listeners, troubleshooting de entrega)**: [`../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md).
- **Imagen de marca / branding de Yago** (AG Studio tiene branding propio del cliente, esto solo aplica si en algún momento se mezclan recursos): [`../UNLIMITED_AI_BRAIN/compartido/03-imagen-de-marca.md`](../UNLIMITED_AI_BRAIN/compartido/03-imagen-de-marca.md).
- **Sistema global de memoria**: [`../UNLIMITED_AI_BRAIN/SISTEMA.md`](../UNLIMITED_AI_BRAIN/SISTEMA.md).
- **Repo relacionado (nested)**: `MODULAR/` — repo git independiente del proyecto Blazor Server. Pendiente Fase F para extraer memoria propia.

---

## Identidades, URLs y comandos rápidos

**URLs**:
- Dev local front: <http://localhost:5173>
- Dev local API: <http://localhost:3100>
- Dev local Modular: <https://localhost:7264>
- demogurru prod: <https://demogurru.unlimited-systems.net>
- demomodular prod: <https://demomodular.unlimited-systems.net> (gate `0007`)
- VPS Contabo IP: `185.213.25.188`

**Git**: branch principal `main`. Operador: `yagogurru77@gmail.com`. Git user: `ricardo.delgado`.

**Credenciales dev / contactos**:
- Modular gate clave: `0007` → cookie `modular_demo=ok`.
- Cliente WhatsApp: `5492954272523`.
- Destinatario formulario: `gurru999@gmail.com`.
- Remitente formulario: `info@unlimited-systems.net` (Stalwart 465 TLS).

**Comandos más usados**:

```powershell
# Build front
cd web && npm run build

# Deploy demogurru
pwsh deploy/deploy.ps1 -Step frontend
pwsh deploy/deploy.ps1 -Step api
pwsh deploy/deploy.ps1 -Step all

# Deploy Modular
pwsh MODULAR/deploy/deploy.ps1 -Step publish
pwsh MODULAR/deploy/deploy.ps1 -Step all

# Health check rápido
ssh root@185.213.25.188 "systemctl is-active demogurru-api demomodular apache2 && curl -fsS http://127.0.0.1:3100/api/health"

# Visual-check
scripts\visual-check.ps1 /
scripts\visual-check.ps1 -Viewport 375x812 /expositor
```
