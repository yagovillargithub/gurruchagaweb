# CLAUDE.md — gurruchagaweb

> Reglas innegociables, identidad del proyecto y mapa del repo. Este fichero se carga **automáticamente** en cada sesión de Claude Code. Cualquier cambio en el código debe respetar este documento.
> Detalle por dominio en [HANDOVER.md](HANDOVER.md) (índice maestro) y `docs/0X-*.md` (referencia por tema). La organización global del sistema de memoria vive en `C:\GitHub\UNLIMITED_AI_BRAIN\SISTEMA.md`.

---

<!-- FILOSOFIA:BEGIN -->
## Filosofía de trabajo

Trabajamos este código con **profesionalidad y cariño**. Eso significa:

- **Causa raíz, no síntoma**: cuando algo falla, diagnostica el porqué antes
  de parchear. Silenciar un test, saltarse una validación o bypasear una
  comprobación "para que pase" es deuda futura que pagaremos con intereses.
- **Consume los recursos que la calidad pida**, no los que la prisa permita.
  Lanza agentes en paralelo, captura visualmente antes de hipotetizar, lee
  archivos enteros si el contexto lo merece. Tokens, tiempo y herramientas
  están para usarse: el coste de hacerlo bien es siempre menor que el de
  rehacerlo.
- **Si dudas, pregunta**. Una pregunta clara al operador es más barata que
  una decisión equivocada que arrastra tres tareas.
- **Cuida lo que ya funciona**. Lee antes de tocar; preserva lo que está
  estable; los cambios destructivos requieren justificación, no son default.
- **Termina lo que empiezas**. Una tarea no está cerrada hasta haberla
  validado según el protocolo de pruebas del repo. "Build OK" sin validar
  visualmente o sin ejercer el flujo no es terminar — es esperar a que el
  operador encuentre el bug.
- **Echa imaginación**. Cuando el problema admite varias soluciones, elige
  la que más respete el código existente, la que más simplifica el sistema
  o la que abre la puerta a futuras mejoras sin cerrarte caminos. No la más
  rápida.
- **Avisa sobre la marcha, con mesura**. Si detectas mejoras adyacentes,
  riesgos no obvios, deuda visible o atajos prometedores mientras trabajas,
  menciónaselos al operador en lugar de guardártelos. Pero **sin saturar**:
  un aviso claro y bien dosificado vale más que tres notas dispersas. Filtra
  por relevancia y agrupa.

Estas siete actitudes sostienen todas las reglas operativas que siguen.
<!-- FILOSOFIA:END -->

> Fuente: `../UNLIMITED_AI_BRAIN/FILOSOFIA.md`. Si actualizas la filosofía global, propaga el cambio aquí.

---

## Identidad del proyecto

**Cliente / dueño**: **arancha GURRUCHAGA** — taller de mobiliario en Santa Rosa (La Pampa, Argentina). Marca pública: **AG Studio**. El sitio se refiere al negocio como *"Taller"*, no *"Estudio"* (decisión cliente, ver `docs/02-frontend-web-vite.md` §Decisiones de copy).

**Alcance**: dos sitios hermanos en el mismo repo:
- `demogurru.unlimited-systems.net` — landing principal del taller (Vite+React) + API Node de contacto (Express + nodemailer).
- `demomodular.unlimited-systems.net` — visor + market de la línea modular nueva (Blazor Server .NET 8 + SQLite), **gateado tras clave `0007`** mientras el cliente lo usa como estudio de mercado.

**⚠️ Restricción crítica**: el **`.env` del API** (`/opt/demogurru-api/.env`) lleva la pass de Stalwart `info@unlimited-systems.net`, **misma credencial que admin del mail server**. Exponerla = compromiso del mail server entero. No commitearla, no copiarla a logs, no mostrarla en outputs públicos.

**⚠️ Restricción crítica**: el **bundle del front y el API comparten filesystem** (`STATIC_ROOT=/var/www/demogurru/web`). El API lee imágenes de proyecto desde ahí para adjuntarlas al correo. Si se separan (CDN, otra máquina) hay que reescribir `loadReferenceAttachment()`.

## Stack

- **`web/`** — Vite 5 + React 18 + react-router-dom 6 + framer-motion + lucide-react. Sin TypeScript (decisión, mantener JSX simple). Build estático servido por Apache.
- **`api/`** — Node 22 + Express 4 + helmet + express-rate-limit + nodemailer (SMTP TLS implícito 465 contra Stalwart self-hosted). Escucha solo en `127.0.0.1:3100`.
- **`MODULAR/ModularKitchen/`** — Blazor Server (.NET 8) con `RazorComponents.AddInteractiveServerComponents()`, EF Core 8 con **doble proveedor** (SqlServer dev, SQLite prod), middleware gate `0007` + cookie `modular_demo=ok`. Repo git independiente nested (`MODULAR/.git`). Escucha `127.0.0.1:5101`.
- **VPS**: Contabo `185.213.25.188` (compartido con unlimited-systems.net, jamonparadise.com, vibrabuena.net, mail). Apache 2.4 reverse-proxy con `proxy_wstunnel` (SignalR de Modular), SSL Let's Encrypt.
- **DNS**: Cloudflare zona `unlimited-systems.net`, registros A `demogurru` y `demomodular` en **Solo DNS (gris)**. No proxiar nunca.

## Cómo arrancar la app

```powershell
# Frontend (web Vite)
cd c:\GitHub\gurruchagaweb\web
npm run dev                                  # http://localhost:5173 con proxy /api → 127.0.0.1:3100

# API de contacto (en otra terminal)
cd c:\GitHub\gurruchagaweb\api
npm run dev                                  # http://localhost:3100 (necesita .env local, no committed)

# Modular Blazor Server
cd c:\GitHub\gurruchagaweb\MODULAR\ModularKitchen
dotnet run                                   # https://localhost:7264 (gate 0007)
```

**Credenciales**:
- Modular gate dev/prod: clave `0007` → cookie `modular_demo=ok` (30 días).
- API: `.env` local no committeado (copiar de `api/.env.example` + rellenar `SMTP_PASS`).

## Reglas de operación con el operador (innegociables locales)

> La filosofía universal está arriba. Estas son **reglas específicas de este repo** que el operador ha fijado.

1. **No commitear automáticamente.** El operador decide cuándo. Ofrecer ejecutar el commit al terminar, no hacerlo solo.
2. **No subir el `.env`** del API a git ni con scp/rsync. Está en `.gitignore`. Si rota la pass de Stalwart, editar manualmente `/opt/demogurru-api/.env` y `systemctl restart demogurru-api`.
3. **No abrir 3100/tcp ni 5101/tcp en UFW**. API y Blazor escuchan solo en `127.0.0.1`. Apache es la única puerta pública.
4. **No proxiar los subdominios por Cloudflare** (nube naranja). Mantener **Solo DNS (gris)** — si activas el proxy, Cloudflare termina TLS y rompes la config de certbot + redirect 80→443.
5. **No editar vhost en el VPS** sin actualizar `deploy/apache-demogurru.conf` (o `MODULAR/deploy/apache-demomodular.conf`). El siguiente `-Step apache` sobrescribe los cambios manuales.
6. **No rephrasear copy del sitio sin consultar**. El cliente ha fijado *"Taller"* (no "Estudio"), *"producción propia"* (no "taller propio"), *"hablamos"* (no "anteproyecto sin compromiso"). Detalle en `docs/02-frontend-web-vite.md`.
7. **No relajar el regex de `loadReferenceAttachment()`** (whitelist `^/assets/proyectos/[a-z0-9][a-z0-9-]*\.(jpe?g|png|webp)$`). Es defensa en profundidad junto al `startsWith(STATIC_ROOT)` — no quitar una capa pensando que la otra basta.
8. **No romper el flow "Quiero algo parecido"** (§7 del legacy, ahora `docs/03-api-contacto-node.md`): carrusel → expositor con filtro → contacto. Carrusel **no debe** lanzar contacto directo (UX validado por cliente).
9. **No mover `STATIC_ROOT`** fuera del filesystem del API sin reescribir `loadReferenceAttachment()` para bajar la imagen por HTTPS.
10. **Tono**: directo, conciso, **español de España** al operador. El copy del sitio es español rioplatense (cliente argentina).
11. **Auto-mantenimiento del sistema de docs**. Tras cambios sustantivos: actualiza `docs/0X-*.md` del dominio afectado + crea `docs/changelog/YYYY-MM-DD_*.md` con qué/por qué/zonas grises. Si cambia regla operativa, actualiza este CLAUDE.md.

## Protocolo de pruebas obligatorio (RESUMEN)

Solo aplica al frontend Vite (`web/`). Modular y API no tienen visual-check propio.

```powershell
scripts\visual-check.ps1                     # capturas / + /expositor + /contacto
scripts\visual-check.ps1 -Viewport 375x812   # móvil
scripts\visual-check.ps1 /expositor          # rutas concretas
```

Detalle completo en [`docs/06-protocolo-pruebas.md`](docs/06-protocolo-pruebas.md). Cuándo saltárselo: cambios en `api/`, `MODULAR/`, configs sin impacto en render, deploy scripts. Tras tocar JSX/CSS, **leer los PNG** con la tool Read y juzgar visualmente antes de declarar la tarea cerrada.

## Convenciones de código

- **Frontend Vite**: JSX (no TS), módulos ESM, componentes en PascalCase, archivos `.jsx`. Datos editables centralizados en `web/src/data/site.js`. Tokens CSS en `web/src/styles/tokens.css`, layout en `app.css`, capas del operador en `extras.css` (no mezclar — ver decisión documentada).
- **API Express**: ESM (`"type":"module"`), validación con regex+rangos explícitos (no librería externa), honeypot `website` para bots, `path.resolve()` + `startsWith()` para anti-traversal.
- **Modular Blazor**: C# nullable + `LangVersion=latest`, EF Core con `OnModelCreating` que detecta provider (`Database.IsSqlServer()`), middleware HTTP minimal API (sin Identity).
- **Branch principal**: `main`. Commits en español, imperativo, ≤72 chars. Operador git: `ricardo.delgado`.
- **Comentarios** solo donde el porqué no sea obvio. No narrar el qué.
- **Imágenes** del expositor en `web/public/assets/proyectos/<id>.{jpg,png,webp}`. Id en kebab-case ASCII (`^[a-z0-9-]+$`).
- **`localStorage` keys** versionadas (`gurru:tweaks:v3`). Si cambia el tipo de un setting, bump de versión.

## Mapa del repo (cómo leer)

| Para entender / tocar... | Lee... |
|---|---|
| Visión general, layout VPS, topología, contactos | [`docs/01-arquitectura.md`](docs/01-arquitectura.md) |
| `web/` Vite+React, Tweaks panel, carrusel, marquee, decisiones copy | [`docs/02-frontend-web-vite.md`](docs/02-frontend-web-vite.md) |
| `api/` Express + nodemailer, flow "Quiero algo parecido", path-traversal | [`docs/03-api-contacto-node.md`](docs/03-api-contacto-node.md) |
| `MODULAR/` Blazor Server, gate `0007`, SQLite, teaser desde demogurru | [`docs/04-modular-blazor.md`](docs/04-modular-blazor.md) |
| Despliegue (`deploy.ps1`, vhosts, systemd, certbot, operación VPS) | [`docs/05-despliegue.md`](docs/05-despliegue.md) |
| Protocolo de pruebas (visual-check Playwright) | [`docs/06-protocolo-pruebas.md`](docs/06-protocolo-pruebas.md) |
| Historia cronológica (iteraciones 2026-05) | [`docs/changelog/`](docs/changelog/) |

## Referencias a UNLIMITED_AI_BRAIN

- **Infraestructura VPS, despliegue, Apache**: [`../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md`](../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md) — `C:\GitHub\UNLIMITED_AI_BRAIN\compartido\01-infraestructura-vps.md`
- **Mail server Stalwart self-hosted**: [`../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md) — `C:\GitHub\UNLIMITED_AI_BRAIN\compartido\02-mail-server-stalwart.md`
- **Imagen de marca / branding**: [`../UNLIMITED_AI_BRAIN/compartido/03-imagen-de-marca.md`](../UNLIMITED_AI_BRAIN/compartido/03-imagen-de-marca.md) — `C:\GitHub\UNLIMITED_AI_BRAIN\compartido\03-imagen-de-marca.md` (aplica solo si el cliente pide alineación con la imagen de marca de Yago, hoy AG Studio tiene branding propio).
- **Sistema global de memoria**: [`../UNLIMITED_AI_BRAIN/SISTEMA.md`](../UNLIMITED_AI_BRAIN/SISTEMA.md)
- **Filosofía** (fuente del bloque embebido arriba): [`../UNLIMITED_AI_BRAIN/FILOSOFIA.md`](../UNLIMITED_AI_BRAIN/FILOSOFIA.md)

## Bloqueos / decisiones pendientes del operador

- [ ] Fotos reales de proyectos: arancha debe pasar fotos para sustituir placeholders en `web/public/assets/proyectos/`. Crítico porque esas mismas imágenes se adjuntan a los correos del formulario (§5/§7 del legacy).
- [x] Optimizar imágenes pesadas — hecho 2026-07-23 (tarea #239): PNG usados → WebP, assets muertos borrados (incl. logo `3.7 MB`), attrs anti-CLS y lazy loading. Imágenes de página −93%. Ver `docs/changelog/2026-07-23_optimizacion-imagenes-webp.md`. Pipeline WebP/AVIF en build queda como mejora futura opcional.
- [ ] Email de autorespuesta al visitante que rellena el formulario.
- [ ] Rotar la pass de Stalwart (estaba en claro en este repo PÚBLICO hasta el 29-08-2026: hay que rotarla) (compartida con admin del mail server, ver `.env` del API).
- [ ] Sitemap.xml + robots.txt + Google Search Console cuando deje de ser demo.
- [ ] Migración a dominio definitivo si el cliente compra `gurruchaga.ar`.
- [ ] **Fase F del sistema global**: separar memoria propia de `MODULAR/` (repo nested independiente). Mientras tanto, `docs/04-modular-blazor.md` cubre el contenido aquí.

## Identidades, URLs y comandos rápidos

**URLs**:
- demogurru dev: <http://localhost:5173>
- demomodular dev: <https://localhost:7264>
- demogurru prod: <https://demogurru.unlimited-systems.net>
- demomodular prod: <https://demomodular.unlimited-systems.net> (gate `0007`)
- VPS Contabo: `185.213.25.188`

**Mail**: remitente `info@unlimited-systems.net` (Stalwart `mail.unlimited-systems.net:465 TLS`). Destinatario formulario: `gurru999@gmail.com`. Cliente WhatsApp: `5492954272523`.

**Git**: branch principal `main`. Operador: `yagogurru77@gmail.com`. Git user: `ricardo.delgado`.

**Comandos más usados**:

```powershell
# Build front (Vite)
cd web && npm run build

# Deploy demogurru
pwsh deploy/deploy.ps1 -Step frontend                          # web/dist → /var/www/demogurru/web/
pwsh deploy/deploy.ps1 -Step api                               # server.js + npm install + restart
pwsh deploy/deploy.ps1 -Step all                               # todo en orden

# Deploy Modular
pwsh MODULAR/deploy/deploy.ps1 -Step publish                   # dotnet publish + tar + scp + restart
pwsh MODULAR/deploy/deploy.ps1 -Step all                       # service + apache + publish + cert + status

# Health checks
ssh root@185.213.25.188 "systemctl is-active demogurru-api demomodular apache2"
ssh root@185.213.25.188 "curl -fsS http://127.0.0.1:3100/api/health"

# Logs producción
ssh root@185.213.25.188 "journalctl -u demogurru-api -f"
ssh root@185.213.25.188 "journalctl -u demomodular -f"

# Visual-check
scripts\visual-check.ps1 /
scripts\visual-check.ps1 -Viewport 375x812 /expositor
```

## Glosario rápido

- **AG Studio / Taller**: marca pública de arancha GURRUCHAGA. *"Taller"* es el descriptor de negocio (no "Estudio"). *"Producción propia"* sustituye al antiguo *"taller propio"*.
- **demogurru**: subdominio del sitio principal (Vite+React + API contacto).
- **demomodular**: subdominio de la línea modular (Blazor Server gateado por clave `0007`).
- **Tweaks**: sistema de personalización en vivo del front (FAB "✨ Personalizar" bottom-right). Settings persistidos en `localStorage` clave `gurru:tweaks:v3`.
- **proyectoRef**: payload opcional del POST `/api/contact` que adjunta la imagen del proyecto al correo (flow "Quiero algo parecido").
- **STATIC_ROOT**: `/var/www/demogurru/web` — el API lee imágenes de proyectos desde aquí.
- **Modular gate**: middleware HTTP en `Program.cs` que redirige todo a `/construccion` salvo allowlist + cookie `modular_demo=ok`. Clave hardcodeada `DemoKey = "0007"`.
- **MODULAR.url**: constante en `web/src/data/site.js` que el teaser de la home enlaza con `target="_blank"`.
