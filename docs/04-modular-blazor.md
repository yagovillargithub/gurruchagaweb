# Modular Blazor Server — `MODULAR/`

> Línea nueva de muebles modulares (cocina/baño/placard) del taller. Subdominio independiente (`demomodular.unlimited-systems.net`), Blazor Server .NET 8 con doble proveedor EF Core, **gateado tras clave `0007`** mientras el cliente lo usa como estudio de mercado.
> Última actualización: 2026-05-18.

---

> ⚠️ **Nota Fase F (sistema global)**: `MODULAR/` es un repo git nested independiente dentro de `gurruchagaweb/` (tiene su propio `.git`). Cuando se ejecute la Fase F del sistema global se le creará memoria propia (`MODULAR/CLAUDE.md`, `MODULAR/HANDOVER.md`, `MODULAR/docs/`). Mientras eso no pase, **este documento es la referencia operativa** para Modular. Una vez Fase F termine, este doc debería quedarse solo con:
> - Sección "Cross-deploy con demogurru" (teaser desde Landing, mismo VPS, mismo Apache).
> - Puntero a `c:\GitHub\MODULAR\CLAUDE.md` para todo lo demás.

---

## Resumen

`MODULAR/ModularKitchen/` es un proyecto **Blazor Server (.NET 8)** que sirve un visor + market de muebles modulares. 3 páginas reales detrás del gate: `/` (visor interactivo, `Home.razor`), `/ventas` (catálogo con filtros) y `/producto/{Id}` (detalle). Corre en `/opt/demomodular/` como `demomodular.service` (systemd, `User=www-data`), escucha `127.0.0.1:5101`, y Apache lo proxia con `upgrade=websocket` para SignalR.

EF Core 8 con **doble proveedor**: SqlServer en dev local (operador tiene `DESKTOP-G20TCFL\SQLEXPRESS`), **SQLite en producción** (`/var/lib/demomodular/modular.db`). El sitio público está **gateado** tras una pantalla "en construcción" con clave `0007` — la home de demogurru lo enlaza con un teaser explícito ("Estamos desarrollando una línea nueva…") para que sirva de estudio de mercado.

## Estado actual

### Stack y rol

- **Blazor Server (.NET 8)** con `RazorComponents.AddInteractiveServerComponents()`.
- **SignalR (`/_blazor`)** es transporte obligado de Blazor Interactive Server → el vhost Apache lleva `upgrade=websocket`. Sin eso, los clicks no funcionan.
- **EF Core 8** con doble proveedor (SqlServer dev / SQLite prod). Misma schema, mismo `OnModelCreating` con `Database.IsSqlServer()` condicional.
- Sin Identity, sin Auth de ASP.NET — overkill para un demo y crearía fricción.

### Selección de proveedor de DB en runtime

```csharp
var dbProvider = builder.Configuration["DatabaseProvider"] ?? "SqlServer";
if (dbProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddDbContextFactory<AppDbContext>(o => o.UseSqlite(connStr));
else
    builder.Services.AddDbContextFactory<AppDbContext>(o => o.UseSqlServer(connStr));
```

- `appsettings.json` (committed) usa SqlServer y la cadena `DESKTOP-G20TCFL\SQLEXPRESS`.
- `appsettings.Production.json` (también committed, no hay secrets) sobrescribe con `DatabaseProvider=Sqlite` y la conexión SQLite.
- El servicio systemd corre con `ASPNETCORE_ENVIRONMENT=Production` → carga ambos.

`AppDbContext.OnModelCreating` aplica `HasColumnType("decimal(10,2)")` solo si `Database.IsSqlServer()` — SQLite no tiene tipos decimales nativos y EF emite warning si se le pasa.

### Gate de "en construcción" (clave `0007`)

Implementado como **middleware HTTP + dos endpoints minimal API** en `Program.cs`:

- **Cookie**: `modular_demo=ok`, HttpOnly, SameSite=Lax, MaxAge 30 días, Path=/, Secure auto en HTTPS.
- **Allowlist** (siempre pasa, sin cookie): `/construccion`, `/unlock`, `/_blazor`, `/_framework`, `/_content`, `/css`, `/js`, `/lib`, `/assets`, `/img`, `/favicon.ico`, `/robots.txt`.
- **Resto**: si no hay cookie válida, `Response.Redirect("/construccion")`.

```csharp
app.Use(async (ctx, next) => {
    var path = ctx.Request.Path.Value ?? "/";
    bool allowed = path.Equals("/construccion", OrdinalIgnoreCase) ||
                   path.Equals("/unlock", OrdinalIgnoreCase) ||
                   path.StartsWith("/_blazor", OrdinalIgnoreCase) || /* … */;
    if (allowed) { await next(); return; }
    if (ctx.Request.Cookies.TryGetValue("modular_demo", out var v) && v == "ok") {
        await next(); return;
    }
    ctx.Response.Redirect("/construccion");
});
```

- `MapGet("/construccion")` devuelve un HTML **embedded inline** (sin Razor) — fuente Manrope/Bodoni Moda/JetBrains Mono de Google Fonts, fondo navy con grid de líneas, card central con campo `clave`, accent dorado `#d0a86c`. Si la URL trae `?e=1` muestra "Clave incorrecta".
- `MapPost("/unlock")` valida `clave == "0007"`, setea la cookie y redirige a `/`. Si no, redirige a `/construccion?e=1`.

Ambos endpoints llevan `.DisableAntiforgery()` porque el form de la página de construcción es HTML puro (no Razor) y no hay token disponible. El riesgo CSRF aquí es nulo — el peor caso de un POST cross-site con `clave=0007` es… que se desbloquee la página de construcción, que es la intención.

### systemd unit

`/etc/systemd/system/demomodular.service` (origen: `MODULAR/deploy/demomodular.service`):

```ini
[Service]
User=www-data
WorkingDirectory=/opt/demomodular
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5101
Environment=DOTNET_ROOT=/usr/share/dotnet
ExecStart=/usr/bin/dotnet /opt/demomodular/ModularKitchen.dll
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/demomodular /opt/demomodular
```

`ReadWritePaths` es **crítico** — sin él, `ProtectSystem=strict` impide que SQLite escriba en `/var/lib/demomodular/`. Y `/opt/demomodular` está incluido porque ASP.NET puede querer escribir keys de DataProtection ahí (warning visible en logs si se quita).

### Vhost Apache

```apache
<VirtualHost *:443>
    ServerName demomodular.unlimited-systems.net
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass /.well-known/acme-challenge/ !
    ProxyPass / http://127.0.0.1:5101/ upgrade=websocket   ← SignalR
    ProxyPassReverse / http://127.0.0.1:5101/
    RequestHeader set X-Forwarded-Proto "https"
    ...
</VirtualHost>
```

`upgrade=websocket` activa `proxy_wstunnel` automáticamente para conexiones de Blazor Interactive Server. Si se quita, las páginas cargan pero los clicks no responden (ningún componente es interactivo). El módulo `proxy_wstunnel` ya está habilitado en este Apache para otros usos.

### Teaser desde demogurru

`web/src/data/site.js` exporta `MODULAR = { nombre, url, descriptor }`.

`web/src/pages/Landing.jsx` añade una `<section className="modular-teaser">` entre el "about" (con `bg-elev`) y la sección final del CTA. El elemento `<motion.a>` enlaza a `MODULAR.url` con `target="_blank" rel="noopener"`. Estilos en `web/src/styles/extras.css` bajo `/* Teaser de la línea nueva "Modular" */`. El bloque respeta `[data-motion="reduced"]` (apaga las transiciones).

**Decisión consciente**: NO añadir un item de nav "Modular" al header. El cliente quiere medir intención; un nav-item lo bagatelizaría. La card en mitad del scroll es lo bastante visible y tiene mismo nivel de jerarquía visual que las secciones del taller, no más.

## Decisiones clave documentadas (zonas grises del operador)

- **Blazor Server (no WASM)**: el visor de la cocina modular tiene mucha interacción puntual (drag, configurador). Server reduce bundle y mantiene la lógica server-side. Tradeoff: requiere SignalR (websocket), conexión persistente.
- **SQLite en prod, SqlServer en dev**: la BD de Modular es de demo. No se quiso meter otra database más en el MS SQL Server compartido del VPS. SQLite = un archivo = backup trivial. Dev sigue con SqlServer porque ya está montado.
- **Gate por middleware + cookie, no Identity**: estudio de mercado, no app real. Overkill montar Identity con Users + Roles + ConfirmEmail por una pantalla "en construcción".
- **Clave hardcodeada `"0007"`**: pasamos la clave por WhatsApp a posibles clientes. Trivial de cambiar (constante `DemoKey` en `Program.cs`). Si querés invalidar **todas las cookies activas** a la vez, además cambiá `GateValue = "ok"` por otro literal (`"v2"`) — las cookies existentes dejan de matchear.
- **`DisableAntiforgery()` en `/construccion` y `/unlock`**: el form es HTML puro, no hay token. CSRF aquí es null risk (la "vulnerabilidad" es desbloquear la página de construcción).
- **Teaser NO en nav**: si vive en el header, deja de ser señal de intención. La card en scroll mantiene el peso visual sin convertirlo en sección oficial.

## Cosas que NO hacer

- **No mover el SQLite a `/opt/demomodular/`** "por simplicidad". Cada `-Step publish` borra esa carpeta y la repuebla → perderías la BD. Por eso vive en `/var/lib/demomodular/` (estándar Linux para state).
- **No quitar `upgrade=websocket`** del vhost. Sin SignalR, Blazor Interactive Server no es interactivo y los clicks no hacen nada.
- **No cambiar `User=www-data`** en el systemd unit por algo más restrictivo sin actualizar `chown` de `/opt/demomodular` y `/var/lib/demomodular/`. También habría que asegurar que los certificados de DataProtection se persisten en algún lugar al que el nuevo usuario pueda escribir.
- **No cargar contenido sensible en Modular** mientras el gate sea solo `0007`. La clave es trivial — alguien que la consigue (la pasamos por WhatsApp) la puede compartir. Para datos serios, usar Identity de verdad.
- **No abrir 5101/tcp en UFW**. El servicio escucha solo en `127.0.0.1`. Apache es la única puerta.
- **No subir `appsettings.Development.json` al VPS**. El publish lo incluye (`dotnet publish` lo copia tal cual), pero como `ASPNETCORE_ENVIRONMENT=Production`, ASP.NET no lo carga. Si en el futuro alguien pone secrets en Development, *sí* importaría — moverlos a `Properties/launchSettings.json` o User Secrets.

## Trampas conocidas

- **Avisos de `tar: time stamp X is N seconds in the future`** al hacer scp del tarball: cosmético, viene del skew de reloj entre el portátil y el VPS. Los archivos se extraen bien.
- **`HEAD /construccion` devuelve 405**: `MapGet` solo acepta GET. Los navegadores hacen GET. Si un check externo necesita HEAD, cambiar a `MapMethods("/construccion", new[] { "GET", "HEAD" }, …)`.
- **Cliente borra la cookie y vuelve a ver "en construcción"**: es la intención. Si se quiere persistencia más allá de borrar cookies (recordar al cliente final indefinidamente), pasar a otro mecanismo (token en URL, login con email).
- **SQLite + Blazor Server + dos pestañas a la vez**: SQLite serializa escrituras. Para sólo lectura del catálogo + pocas escrituras de seed, no hay problema. Si en el futuro se mete una página que escriba mucho concurrente (checkout), revisar `Cache=Shared` (ya está en la connection string) y modo journal.

## Cambiar la clave o quitar el gate

- **Cambiar la clave**: editar `DemoKey = "0007"` en `MODULAR/ModularKitchen/Program.cs` y redeploy (`pwsh MODULAR/deploy/deploy.ps1 -Step publish`).
- **Invalidar cookies existentes**: cambiar `GateValue = "ok"` por otro literal.
- **Quitar el gate cuando la línea esté lista**: borrar el `app.Use(async (ctx, next) => …)` del middleware y los dos `MapGet("/construccion")` / `MapPost("/unlock")`. La cookie queda huérfana en los navegadores que la tenían (no daña). Conviene quitar también el `<section className="modular-teaser">` del Landing **o, mejor, cambiar el copy del teaser** para reflejar que ahora sí está abierto (el cliente probablemente quiera mantener la llamada visual, sólo cambiar el mensaje).

## Ficheros clave

| Qué | Dónde |
|---|---|
| Solución .NET | `MODULAR/MODULAR.sln` |
| Proyecto Blazor Server | `MODULAR/ModularKitchen/ModularKitchen.csproj` |
| Entry point + middleware gate + endpoints | `MODULAR/ModularKitchen/Program.cs` |
| Config dev (SqlServer) | `MODULAR/ModularKitchen/appsettings.json` |
| Config prod (SQLite) | `MODULAR/ModularKitchen/appsettings.Production.json` |
| DbContext + entidades + seed | `MODULAR/ModularKitchen/Data/{AppDbContext,Entities,SeedData}.cs` |
| Catálogo de cocinas | `MODULAR/ModularKitchen/Models/KitchenCatalog.cs` |
| Components (App, Routes, Layout, Pages) | `MODULAR/ModularKitchen/Components/` |
| systemd unit (committed) | `MODULAR/deploy/demomodular.service` |
| Apache vhost (committed) | `MODULAR/deploy/apache-demomodular.conf` |
| Script PowerShell de deploy | `MODULAR/deploy/deploy.ps1` |
| Teaser desde el Landing | `web/src/pages/Landing.jsx` (sección `modular-teaser`) + `web/src/data/site.js` (`MODULAR.url`) + `web/src/styles/extras.css` |

## Pendiente / no implementado

- **Memoria propia del repo `MODULAR/`** (Fase F del sistema global). Cuando se ejecute, mover el contenido de este doc al CLAUDE/HANDOVER/docs propio de `MODULAR/` y dejar aquí solo el cross-deploy + el teaser.
- Backup periódico de `/var/lib/demomodular/modular.db`.
- Cuando arranque la línea modular de verdad: cerrar el gate (o cambiar copy del teaser), revisar copy y SEO.

## Referencias cruzadas

- **Arquitectura general + layout VPS**: [`01-arquitectura.md`](01-arquitectura.md).
- **Teaser en el frontend Vite**: [`02-frontend-web-vite.md`](02-frontend-web-vite.md).
- **Deploy de Modular (`-Step publish`)**: [`05-despliegue.md`](05-despliegue.md).
- **Compartido (Apache, certbot, UFW, VPS)**: [`../../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md`](../../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md).
- **Histórico**: [`changelog/2026-05-08_modular-y-localizacion.md`](changelog/2026-05-08_modular-y-localizacion.md).
