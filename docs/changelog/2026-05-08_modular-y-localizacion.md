# 2026-05-08 — Modular Blazor, localización copy, Tweaks v3

> Sesión maratón de 2026-05-08 en tres iteraciones: (1) carrusel arriba + lightbox refactor + flow "Quiero algo parecido" + Tweaks ampliado v2; (2) localización copy "Taller"/"Producción propia" + Tweaks v3 (slider continuo + ui-scale) + servicios reducidos a 4; (3) subdominio `demomodular.unlimited-systems.net` con Blazor Server + SQLite prod + gate `0007` + teaser desde demogurru.

---

## Cambios entregados

### 1. Carrusel del Landing arriba del todo + lightbox refactor (iteración 1, mañana)

- Carrusel movido arriba del todo en Landing (clase `.carousel-section.top`), antes del marquee y del hero. Decisión cliente: la web entra mostrando obra, no copy.
- Carrusel sin pausa en hover, con zoom-in por imagen + sombra elevada en lugar de detener animación.
- Carrusel **truly infinite** (`MIN_PER_ROW=14`) — `pad(items, 14, items)` rellena la fila antes del duplicado para que `translateX(-50%)` cierre perfecto en cualquier monitor.
- Logo del header → `logo-anagrama.png` (favicon también).
- Click en imagen del carrusel → lightbox grande con la foto.
- **Lightbox refactorizado** para aceptar `cta(item)` como render prop (Landing y Expositor renderizan distintos CTAs).
- **Tweaks panel ampliado**: paletas `azul2` + `verde`, tipografía `miso` (Antonio de Google Fonts), slider de velocidad 1-10, altura del carrusel (3 niveles chips), tipografía del marquee (4 opciones), preset `#3b435c` en el picker de acento. Storage migrado a `gurru:tweaks:v2`.
- **Marquee**: palabras en lowercase, sin punto final, sin separador-puntito, fuente "achatada" por default vía `transform: scaleY(0.78)`.
- **Flow "Quiero algo parecido"** (§7 del legacy → ahora [`../03-api-contacto-node.md`](../03-api-contacto-node.md)): Landing → Expositor con filtro → email con adjunto **o** WhatsApp con link público a la imagen.
- **`/api/contact` acepta `proyectoRef`**, valida path anti-traversal (regex + `startsWith(STATIC_ROOT)`), lee la imagen y la adjunta al correo (embebida vía `cid` + descargable).

**Ficheros tocados**: `web/src/pages/{Landing,Expositor,Contacto}.jsx`, `web/src/components/{Carousel,Lightbox,TaglineMarquee}.jsx`, `web/src/tweaks/{TweaksContext,TweaksPanel}.jsx`, `web/src/styles/{tokens,extras}.css`, `web/src/data/site.js`, `api/server.js`.

### 2. Localización copy + Tweaks v3 + servicios reducidos (iteración 2, tarde)

- **Copy localizado**: "Estudio" → "Taller" en hero, eyebrows, footer, expositor y contacto. "Taller propio" → "Producción propia". Año `desde: 2018`. CTA "armamos un anteproyecto sin compromiso" → "y hablamos".
- **Servicios reducidos a 4 pilares**: eliminados Container habitable y Estilismo/Decoración. "Locales y oficinas" → **"Amoblamiento integral"** con copy `"Para gastronomía, retail, consultorios…"` (puntos suspensivos intencionales). Service 03 "Montaje y dirección" con copy nuevo más específico. H2 "Lo que hacemos, integralmente" forzado a una línea con `whiteSpace: nowrap`.
- **Eyebrow del CTA final** pasa a `.eyebrow-lg` (más grande, en pill).
- **Facebook URL** nueva: `profile.php?id=61561938128763`.
- **Slider "Tamaño UI"** (header + logo + botones, escala 0.85..1.30) → CSS var `--ui-scale` aplicada en selectores específicos vía `calc()`. **No** toca hero ni `<h2>`.
- **Slider "Altura del carrusel"** (continuo 0.65..1.20) **sustituye los 3 chips** compacto/medio/alto. Tipo cambió de string a number → bump a `gurru:tweaks:v3`.
- **Marquee redimensionado**: tamaño contenido + padding chico → cabe como "banner sutil de cierre" en el primer viewport (decisión explícita del cliente).
- **Padding vertical** de la sección del carrusel-top reducido a `clamp(.75rem, 1.5vw, 1.25rem)` — antes era el doble. Esencial para que el marquee entre sobre el fold.

**Ficheros tocados**: `web/src/pages/Landing.jsx`, `web/src/data/site.js`, `web/src/tweaks/{TweaksContext,TweaksPanel}.jsx`, `web/src/styles/{app,extras}.css`.

### 3. Modular Blazor Server + gate `0007` + teaser (iteración 3)

- **Subdominio nuevo `demomodular.unlimited-systems.net`** publicado con cert Let's Encrypt (expira 2026-08-06). Cloudflare gris (Solo DNS).
- **Proyecto Blazor Server (.NET 8)** del visor + market deployado en `/opt/demomodular/` como `demomodular.service` (systemd, User=`www-data`, escucha `127.0.0.1:5101`). Apache reverse-proxy con `proxy_wstunnel` (`upgrade=websocket`) para SignalR.
- **DB doble proveedor EF Core**: SqlServer en dev local (`DESKTOP-G20TCFL\SQLEXPRESS`), **SQLite en producción** (`/var/lib/demomodular/modular.db`). `appsettings.Production.json` con `DatabaseProvider=Sqlite`. `OnModelCreating` aplica `decimal(10,2)` solo si `Database.IsSqlServer()`.
- **Gate "en construcción"** con clave `0007`: middleware HTTP en `Program.cs` + `MapGet("/construccion")` + `MapPost("/unlock")`. Cookie `modular_demo=ok`, HttpOnly, SameSite=Lax, 30 días. Allowlist: `/construccion`, `/unlock`, `/_blazor`, `/_framework`, `/_content`, `/css`, `/js`, `/lib`, `/assets`, `/img`, `/favicon.ico`, `/robots.txt`. Resto → redirect a `/construccion`. Ambos endpoints con `.DisableAntiforgery()` (form HTML puro, no Razor).
- **Teaser de Modular en la home de demogurru**: entre el "about" y el CTA final. `MODULAR.url` centralizado en `web/src/data/site.js`. Nuevo bloque `.modular-teaser` en `extras.css` con card horizontal + accent dorado en hover. Click → abre demomodular en pestaña nueva. **Decisión consciente**: NO añadir item de nav "Modular" — el cliente quiere medir intención, no bagatelizar.
- **systemd unit Modular** con `ReadWritePaths=/var/lib/demomodular /opt/demomodular` (crítico para SQLite + DataProtection bajo `ProtectSystem=strict`).
- **`MODULAR/deploy/deploy.ps1`** con `-Step publish|service|apache|cert|status|all`.

**Ficheros tocados**: `MODULAR/MODULAR.sln`, `MODULAR/ModularKitchen/**`, `MODULAR/deploy/**`, `web/src/data/site.js`, `web/src/pages/Landing.jsx`, `web/src/styles/extras.css`.

---

## Decisiones tomadas en zonas grises

- **Blazor Server (no WASM) para Modular**: el visor tiene mucha interacción puntual (drag, configurador). Server reduce bundle. Tradeoff aceptado: requiere SignalR persistente.
- **SQLite en prod Modular, SqlServer en dev**: la BD es de demo, no se quiso meter otra database más en el MS SQL Server compartido del VPS. SQLite = un archivo = backup trivial.
- **Gate por middleware + cookie, no Identity**: estudio de mercado, no app real. Overkill montar Identity por una pantalla "en construcción".
- **Clave `0007` hardcodeada**: la pasamos por WhatsApp a posibles clientes. Trivial cambiar la constante `DemoKey`. Si querés invalidar todas las cookies activas, además cambiá `GateValue = "ok"`.
- **`DisableAntiforgery()` en `/construccion` y `/unlock`**: el form es HTML puro, no hay token. CSRF aquí es null risk (la "vuln" es desbloquear la página de construcción).
- **Teaser NO en nav header**: si va al header, deja de ser señal de intención. La card en scroll mantiene peso visual sin volverlo sección oficial.
- **`uiScale` NO escala hero ni `<h2>`**: esos usan `clamp()` con escala responsive propia; multiplicar por `--ui-scale` los rompía en pantallas medianas.
- **Slider altura sustituye chips**: cliente quería control fino, no 3 niveles discretos.
- **Picker de acento NO afecta a `--accent-2`** (la variante profunda de `.btn-primary`): intencional para no romper contraste.
- **Carrusel del Landing va a `/expositor`, no `/contacto`**: decisión UX validada del cliente. No revertir.

---

## Ficheros tocados (resumen)

```
web/src/pages/{Landing,Expositor,Contacto}.jsx
web/src/components/{Carousel,Lightbox,TaglineMarquee}.jsx
web/src/tweaks/{TweaksContext,TweaksPanel}.jsx
web/src/data/site.js
web/src/styles/{tokens,app,extras}.css
api/server.js

MODULAR/MODULAR.sln
MODULAR/ModularKitchen/Program.cs
MODULAR/ModularKitchen/appsettings.json
MODULAR/ModularKitchen/appsettings.Production.json
MODULAR/ModularKitchen/Data/{AppDbContext,Entities,SeedData}.cs
MODULAR/ModularKitchen/Models/KitchenCatalog.cs
MODULAR/ModularKitchen/Components/**
MODULAR/ModularKitchen/wwwroot/**
MODULAR/deploy/{apache-demomodular.conf,demomodular.service,deploy.ps1}
```

---

## Pendiente tras esta sesión

- Fotos reales (bloqueado: cliente).
- Backup automático SQLite Modular.
- Cuando arranque la línea modular: cerrar el gate o cambiar copy del teaser.
- Email de autorespuesta al visitante.

---

## Referencias

- Docs de dominio cubiertos: [`../02-frontend-web-vite.md`](../02-frontend-web-vite.md), [`../03-api-contacto-node.md`](../03-api-contacto-node.md), [`../04-modular-blazor.md`](../04-modular-blazor.md), [`../05-despliegue.md`](../05-despliegue.md).
- Sesión anterior: [`2026-05-07_bootstrap-vite-y-api.md`](2026-05-07_bootstrap-vite-y-api.md).
- Siguiente: [`2026-05-16_visual-check.md`](2026-05-16_visual-check.md).
