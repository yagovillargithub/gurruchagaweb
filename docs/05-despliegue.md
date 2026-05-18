# Despliegue — `deploy/` + `MODULAR/deploy/`

> Cómo desplegar los dos sitios (demogurru y demomodular), operación cotidiana en el VPS, qué scripts existen, trampas conocidas, y qué NO hacer. Requiere PowerShell 7 + clave SSH ya autorizada en el VPS (ver `UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md`).
> Última actualización: 2026-05-18.

---

## Resumen

Dos pipelines de despliegue independientes pero idempotentes, ambos en PowerShell con pasos selectivos (`-Step <name>`). Comparten VPS (`185.213.25.188`), Apache 2.4 y certbot, pero generan vhosts y systemd units distintos. **Nunca suben secretos** (los `.env` viven solo en VPS / local).

## Estado actual

### Despliegue demogurru — `deploy/deploy.ps1`

```powershell
cd c:\GitHub\gurruchagaweb

pwsh deploy/deploy.ps1 -Step frontend   # build Vite + sube dist/* a /var/www/demogurru/web/
pwsh deploy/deploy.ps1 -Step api        # sube server.js + package.json, npm install, systemd reload+restart
pwsh deploy/deploy.ps1 -Step apache     # sube vhost, a2ensite + a2enmod + reload Apache
pwsh deploy/deploy.ps1 -Step cert       # certbot --apache (idempotente, reemite si toca)
pwsh deploy/deploy.ps1 -Step status     # health checks: apache + systemd + /api/health
pwsh deploy/deploy.ps1 -Step all        # todo lo anterior en orden
```

El script **NUNCA sube el `.env`** del API. Si se rota la pass de Stalwart, editar manualmente `/opt/demogurru-api/.env` y `systemctl restart demogurru-api`. Ver [`03-api-contacto-node.md`](03-api-contacto-node.md) §`.env`.

#### Iteración típica (frontend)

1. Editás `web/src/...` o `web/public/assets/...`.
2. `pwsh deploy/deploy.ps1 -Step frontend`.
3. Ctrl-F5 en el navegador. Los assets son `*-immutable` (hash en nombre), el `index.html` es `must-revalidate`, así que el cambio se ve enseguida.

### Despliegue Modular — `MODULAR/deploy/deploy.ps1`

```powershell
cd c:\GitHub\gurruchagaweb

pwsh MODULAR/deploy/deploy.ps1 -Step publish   # dotnet publish + tar + scp + restart service
pwsh MODULAR/deploy/deploy.ps1 -Step service   # solo (re)instala el systemd unit
pwsh MODULAR/deploy/deploy.ps1 -Step apache    # sube vhost + a2ensite + reload
pwsh MODULAR/deploy/deploy.ps1 -Step cert      # certbot --apache (idempotente)
pwsh MODULAR/deploy/deploy.ps1 -Step status    # health check
pwsh MODULAR/deploy/deploy.ps1 -Step all       # service + apache + publish + cert + status
```

`-Step publish` es el día a día: compila para `linux-x64 framework-dependent`, lo empaqueta en tar.gz, lo sube y reinicia el servicio. **~10 segundos en total**. Después de cada deploy, el servicio re-seedea la BD si está vacía (`db.Database.EnsureCreated()` + `SeedData.SeedAsync(db)` en `Program.cs`). Si la BD ya tiene datos, el seed es idempotente por slug/label.

### Operación cotidiana

#### Health check rápido

```bash
ssh root@185.213.25.188 "
  systemctl is-active demogurru-api demomodular apache2
  curl -fsS http://127.0.0.1:3100/api/health
  curl -fsS -o /dev/null -w 'demomodular construccion=%{http_code}\n' http://127.0.0.1:5101/construccion
  curl -sI https://demogurru.unlimited-systems.net/ | head -1
  curl -sI https://demomodular.unlimited-systems.net/ | head -1
"
```

#### Logs

```bash
# demogurru (Express)
ssh root@185.213.25.188 "journalctl -u demogurru-api -f"
ssh root@185.213.25.188 "tail -f /var/log/apache2/demogurru-error.log"
ssh root@185.213.25.188 "tail -f /var/log/apache2/demogurru-access.log"

# demomodular (Blazor)
ssh root@185.213.25.188 "journalctl -u demomodular -f"
ssh root@185.213.25.188 "tail -f /var/log/apache2/demomodular-error.log"
ssh root@185.213.25.188 "tail -f /var/log/apache2/demomodular-access.log"
```

#### Reiniciar servicios

```bash
ssh root@185.213.25.188 "systemctl restart demogurru-api"
ssh root@185.213.25.188 "systemctl restart demomodular"   # Blazor
```

#### Ver la cola de Stalwart cuando el formulario "no envía"

El API devuelve `{ok:true}` solo si Stalwart aceptó MAIL FROM/RCPT TO/DATA con 250s. Si llega ese 200 OK pero el correo no llega a Gmail, el problema está aguas abajo de Stalwart (entrega externa). Ver [`../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md) §10-11.

## Decisiones clave documentadas (zonas grises del operador)

- **Scripts PowerShell, no Bash**: el operador trabaja en Windows. Los scripts PowerShell hacen `ssh` y `rsync` (vía WSL) contra el VPS Linux. Ejecutarlos desde Git Bash convierte rutas absolutas Windows en POSIX y rompe paths (`/socios` → `C:\Program Files\Git\socios`). **Ejecutar SIEMPRE desde PowerShell**.
- **Idempotencia**: cada `-Step` puede correr aislado y sin riesgo. `-Step cert` no reemite si el cert es válido. `-Step apache` no rompe si el vhost ya está enabled.
- **Vhosts committeados, no editados en VPS**: `deploy/apache-demogurru.conf` y `MODULAR/deploy/apache-demomodular.conf` son la fuente de verdad. El siguiente `-Step apache` sobrescribe cambios manuales del VPS. Si necesitás un tweak, editás el archivo committeado y redesplegás.
- **`-Step frontend` NO sube `node_modules`**: solo `dist/`. El bundle Vite es estático puro.
- **`-Step api` SÍ ejecuta `npm install` en el VPS**: el `package-lock.json` se sube y el VPS resuelve las dependencias contra su Node 22.
- **Certbot integrado en el flow**: `-Step cert` corre `certbot --apache`. Funciona idempotente. La primera vez crea el archivo `-le-ssl.conf`. Renueva automáticamente vía systemd timer del VPS (no requiere intervención).

## Cosas que NO hacer

- **No abrir 3100/tcp ni 5101/tcp en UFW**. Los servicios escuchan solo en `127.0.0.1`. Apache es la única puerta pública.
- **No subir `.env` a git ni con scp**. Ya está en `.gitignore`. La pass de `info@unlimited-systems.net` es la misma del admin Stalwart, exposición pública = compromiso del mail server entero.
- **No proxiar el subdominio por Cloudflare** (nube naranja). Si activás el proxy, Cloudflare termina TLS y la config de cert + redirect 80→443 dejan de tener sentido. **Mantener Solo DNS (gris)**.
- **No desplegar el frontend con `npm run dev`** en el VPS — solo bundle estático. Si llega el momento de SSR, valorar pasar a Next y reusar la infra de `unlimited-systems.net`.
- **No editar el vhost en el VPS sin actualizar `deploy/apache-demogurru.conf`** — el siguiente `-Step apache` lo sobrescribe.
- **No mover el SQLite de Modular a `/opt/demomodular/`** "por simplicidad". Cada `-Step publish` borra esa carpeta. La BD vive en `/var/lib/demomodular/` (estándar Linux para state).
- **No quitar `upgrade=websocket`** del vhost de demomodular. Sin SignalR, Blazor Interactive Server no es interactivo.
- **No subir `appsettings.Development.json`** del Modular al VPS. El publish lo incluye pero como `ASPNETCORE_ENVIRONMENT=Production`, ASP.NET no lo carga. Si en el futuro alguien pone secrets en Development, *sí* importaría.

## Trampas conocidas / por qué algo es como es

### El redirect HTTP→HTTPS estuvo roto al principio (demogurru)

El vhost `:80` tenía `RewriteEngine On` **dentro del `<Directory>`**, no a nivel vhost. Certbot añadió su `RewriteRule … [R=permanent]` a nivel vhost, pero como rewrite no estaba activo ahí, el rule se silenciaba. **Fix**: el vhost ahora tiene `RewriteEngine On` arriba + el redirect explícito al final del bloque, replicado en `deploy/apache-demogurru.conf` para que sobreviva re-deploys (certbot solo lo añade la primera vez).

### Stalwart aparece como `unhealthy` en `docker ps`

Cosmético. Healthcheck mal calibrado del compose, no afecta a la entrega. Ver [`../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md) §9.3 / §10.

### No abrí el listener 587 STARTTLS en Stalwart

El backend usa **465 TLS implícito** (`secure: true` en nodemailer). Stalwart de fábrica solo escucha 465, no 587. Si en el futuro un cliente externo necesita 587, crear el listener manualmente en la UI de Stalwart — ver [`../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md) §2.

### Las imágenes pesan mucho (3.8 MB el `logo-vercreer.png`)

Assets originales del prototipo. Vite copia tal cual. Idealmente: `imagemin` en build, pasarlas a WebP/AVIF, o servir con `<img loading="lazy" srcset>`. **Especialmente importante** ahora que esas mismas imágenes se adjuntan a los correos del formulario — Gmail penaliza por tamaño. Pendiente cuando llegue el material real.

### Avisos `tar: time stamp X is N seconds in the future` al deploy de Modular

Cosmético, viene del skew de reloj entre el portátil del operador y el VPS (zonas distintas + drift). Los archivos se extraen bien.

### `HEAD /construccion` devuelve 405

`MapGet` solo acepta GET. No es bug de producción (navegadores hacen GET). Si un check externo quiere usar HEAD, cambiar a `MapMethods("/construccion", new[] { "GET", "HEAD" }, …)`.

### "El cliente borra la cookie y vuelve a ver 'en construcción'"

Es exactamente la intención. Si querés persistencia más allá de borrar cookies, hay que pasar a otro mecanismo (token en URL, login con email). Hoy no merece la pena.

## Ficheros clave

| Qué | Dónde |
|---|---|
| Script PowerShell de deploy demogurru | `deploy/deploy.ps1` |
| Apache vhost demogurru (fuente de verdad) | `deploy/apache-demogurru.conf` |
| systemd unit API demogurru | `deploy/demogurru-api.service` |
| README operativo demogurru | `deploy/README.md` |
| Script PowerShell de deploy Modular | `MODULAR/deploy/deploy.ps1` |
| Apache vhost demomodular | `MODULAR/deploy/apache-demomodular.conf` |
| systemd unit Modular | `MODULAR/deploy/demomodular.service` |

## Pendiente / no implementado

- **Backup automático** del VPS: BBDD SQLite de Modular (`/var/lib/demomodular/modular.db`) + imágenes de proyectos (`/var/www/demogurru/web/assets/proyectos/`).
- Pipeline CI/CD (hoy todo deploy es manual desde el portátil del operador). Si arranca, valorar GitHub Actions con runner self-hosted o secret SSH.
- Monitorización (uptime + alerting). Hoy es a ojo del operador.

## Referencias cruzadas

- **Arquitectura y layout VPS**: [`01-arquitectura.md`](01-arquitectura.md).
- **Frontend (qué deploya `-Step frontend`)**: [`02-frontend-web-vite.md`](02-frontend-web-vite.md).
- **API (qué deploya `-Step api`)**: [`03-api-contacto-node.md`](03-api-contacto-node.md).
- **Modular (qué deploya `-Step publish` de Modular)**: [`04-modular-blazor.md`](04-modular-blazor.md).
- **Compartido (VPS, Apache, certbot, UFW, claves SSH)**: [`../../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md`](../../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md).
- **Compartido (Mail server)**: [`../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md).
